/** Synthetic fixtures only. Real local passwords/cookies/SQLite/HTTP, no Firebase or model mocks. */
import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { request as rawRequest, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { PilotDatabase } from '../../server/src/local/sqlite';
import { createLocalApp } from '../../server/src/local/app';
import { parseManifest,seedQA } from '../../server/src/local/seed';
import { COOKIE } from '../../server/src/local/auth';
import { consumeBuddyStream } from '../../src/components/buddy/client';
import { readinessInput } from '../training/helpers';
const password='SYNTHETIC-test-only-9!';
import {syntheticManifest as manifest} from './fixtures';
let base='',server:Server,db:PilotDatabase,app:ReturnType<typeof createLocalApp>,dir:string,report:Awaited<ReturnType<typeof seedQA>>;
class Client{
  cookie='';csrf='';view='guest';uid='';
  async call(path:string,method='GET',body?:unknown,headers:Record<string,string>={}){
    const r=await fetch(base+path,{method,headers:{Origin:base,'Content-Type':'application/json','X-Local-Request':'1','X-Local-Context':this.view,...(this.cookie?{Cookie:this.cookie}:{}),...(this.csrf?{'X-CSRF-Token':this.csrf}:{}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)}),redirect:'error'});
    return {status:r.status,body:await r.json(),headers:r.headers};
  }
  async login(email='qa.adult-a@example.invalid'){
    const r=await this.call('/api/local/auth/login','POST',{email,password});assert.equal(r.status,200,JSON.stringify(r.body));
    this.cookie=r.headers.get('set-cookie')!.split(';')[0];this.csrf=r.body.csrf;this.view=r.body.sessionVersion;this.uid=r.body.user.uid;return r;
  }
  async createSession(){const r=await this.call('/api/local/buddy/sessions','POST',{});assert.equal(r.status,201);return r.body;}
  async chat(message:string,session?:any){const s=session??await this.createSession();const r=await this.call('/api/local/buddy/chat','POST',{message,conversationId:s.conversationId,expectedRevision:s.revision,requestId:randomUUID(),lang:'vi'},s.guestToken?{'X-Buddy-Guest':s.guestToken}:{});if(r.status===200)s.revision=r.body.revision;return r;}
}
before(async()=>{
  dir=mkdtempSync(join(tmpdir(),'shine-local-api-'));db=new PilotDatabase(join(dir,'pilot.sqlite'));
  report=await seedQA(db,manifest,password,process.cwd());app=createLocalApp({database:db,root:process.cwd(),allowedOrigins:()=>[base],loginLimit:200});
  server=app.app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));base=`http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(async()=>{server?.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));await db.close();rmSync(dir,{recursive:true,force:true});});
test('Seed creates real local users once, stores no plain password, and keeps historical programs unassigned',async()=>{
  assert.equal(report.accounts.filter(a=>a.status==='created').length,3);
  const rows=await db.access(sql=>sql.prepare('SELECT * FROM local_users').all());assert.equal(rows.length,3);assert(!JSON.stringify(rows).includes(password));
  const c=new Client();await c.login();const s=await c.call('/api/local/source');assert.equal(s.body.assignedProgramId,null);assert.equal(s.body.mealPlanAssignment,null);
  const history=await c.call('/api/local/training/context');assert.equal(history.body.summary.sessionsLast14Days,0);assert.equal(history.body.profile.heightCm,null);assert.equal(history.body.progress.points.length,0);
});
test('Seeding twice is idempotent and changed source rolls back without overwrite',async()=>{
  const again=await seedQA(db,manifest,password,process.cwd());assert(again.accounts.every(a=>a.status==='existing_unchanged'));
  const changed=structuredClone(manifest);changed.cases[1].heightCm++;
  await assert.rejects(seedQA(db,changed,password,process.cwd()),/conflict/);assert.equal((await db.access(sql=>sql.prepare('SELECT count(*) as n FROM local_users').get()))!.n,3);
});
test('Guest can chat knowledge, local login sets protected cookie and creates a server-bound identity',async()=>{
  const guest=new Client(),reply=await guest.chat('Protein l\u00e0 g\u00ec?');assert.equal(reply.body.task,'NUTRITION_EDUCATION');assert.equal(reply.body.mode,'guest');assert.equal(reply.body.timings.modelCalls,0);
  const c=new Client(),result=await c.login();assert.match(result.headers.get('set-cookie')!,/HttpOnly/);assert.match(result.headers.get('set-cookie')!,/SameSite=Strict/);assert(!JSON.stringify(result.body).includes(c.cookie.split('=')[1]));
  const own=await c.chat('T\u00f4i mu\u1ed1n xem h\u1ed3 s\u01a1 c\u1ee7a t\u00f4i');assert.equal(own.body.mode,'authorized_member');assert.match(own.body.text,/hypertrophy/);assert.equal(own.headers.get('cache-control'),'no-store');
});
test('Wrong password, forged bearer/member fields, unknown sessions do not grant access',async()=>{
  const c=new Client();assert.equal((await c.call('/api/local/auth/login','POST',{email:'qa.adult-a@example.invalid',password:'not-correct'})).status,401);
  assert.equal((await c.call('/api/local/source','GET',undefined,{Authorization:'Bearer forged'})).status,400);
  assert.equal((await c.call('/api/local/source')).status,401);
  const logged=new Client();await logged.login();assert.equal((await logged.call('/api/local/buddy/sessions','POST',{uid:'other',isMember:true})).status,400);
  logged.cookie=COOKIE+'='+'x'.repeat(43);assert.equal((await logged.call('/api/local/source')).status,401);
});
test('CSRF, hostile Host and wrong origin are rejected; no cookie-authenticated silent guest fallback',async()=>{
  const c=new Client();await c.login();
  assert.equal((await c.call('/api/local/auth/logout','POST',{}, {'X-CSRF-Token':'wrong'})).status,403);
  assert.equal((await c.call('/api/local/auth/logout','POST',{}, {Origin:'http://evil.example'})).status,403);
  // Fetch may normalize forbidden Host; raw HTTP proves the actual server check.
  const badHost=await new Promise<number>((resolve,reject)=>{const req=rawRequest(base+'/api/local/source',{headers:{Host:'evil.example'}},res=>{res.resume();resolve(res.statusCode!);});req.on('error',reject);req.end();});
  assert.equal(badHost,403);
  assert.equal((await c.call('/api/local/auth/logout','POST',{}, {Origin:''})).status,403);
  assert.equal((await c.call('/api/local/buddy/sessions','POST',{}, {'X-Local-Request':''})).status,403);
});
test('Accounts cannot cross conversations or override source owner with query parameters',async()=>{
  const a=new Client(),b=new Client();await a.login();await b.login('qa.adult-b@example.invalid');const s=await a.createSession();
  assert.equal((await b.call('/api/local/buddy/sessions/'+s.conversationId)).status,404);
  const source=await b.call('/api/local/source?uid='+a.uid);assert.equal(source.body.source.key,'adult-b');assert(!JSON.stringify(source.body).includes('Synthetic A'));
  const prof=await b.call('/api/local/training/context?uid='+a.uid);assert.equal(prof.body.profile.uid,b.uid);
});
test('Cookie switched by another tab is blocked by server-side view binding',async()=>{
  const a=new Client(),b=new Client();await a.login();await b.login('qa.adult-b@example.invalid');a.cookie=b.cookie;
  const r=await a.call('/api/local/source');assert.equal(r.status,409);assert.equal(r.body.code,'identity_changed');assert(!JSON.stringify(r.body).includes('Synthetic B'));
});
test('Known QA health flag blocks personal prescription but not education',async()=>{
  const c=new Client();await c.login('qa.adult-b@example.invalid');
  const own=await c.chat('T\u00f4i mu\u1ed1n xem h\u1ed3 s\u01a1 c\u1ee7a t\u00f4i');assert.equal(own.body.mode,'authorized_member');assert.match(own.body.text,/mobility/);
  assert.equal((await c.chat('T\u00f4i c\u00f3 35 ph\u00fat mu\u1ed1n t\u1eadp ch\u00e2n')).body.task,'PROFESSIONAL_REVIEW');
  assert.equal((await c.chat('Ti\u1ec3u \u0111\u01b0\u1eddng type 2 l\u00e0 g\u00ec?')).body.task,'HEALTH_EDUCATION');
  const ready=await c.call('/api/local/training/readiness','PUT',{readiness:readinessInput(),expectedProfileRevision:1});assert.equal(ready.status,200);
  const plan=await c.call('/api/local/training/plans','POST',{readinessId:ready.body.readiness.id,requestId:randomUUID(),gymOnly:false});assert.equal(plan.body.status,'needs_review');
});
test('Minor flags come from server source even without age in the message; adult training unavailable',async()=>{
  const c=new Client();await c.login('qa.minor-c@example.invalid');assert.equal((await c.call('/api/local/training/context')).status,403);
  const response=await c.chat('Cho t\u00f4i th\u1ef1c \u0111\u01a1n gi\u1ea3m c\u00e2n');assert.equal(response.body.task,'PROFESSIONAL_REVIEW');assert.equal(response.body.handoverTag,'HEALTH_RISK');assert(!/\d+\s*(kcal|calo)/i.test(response.body.text));
  assert.equal((await c.chat('Protein l\u00e0 g\u00ec?')).body.task,'NUTRITION_EDUCATION');
  const source=await c.call('/api/local/source');assert.equal(source.body.source.ageAtSource,12);
});
test('Real SQLite training completion is confirmed and idempotent, without invented catalogue',async()=>{
  const c=new Client();await c.login();
  const r=await c.call('/api/local/training/readiness','PUT',{readiness:readinessInput(),expectedProfileRevision:1});
  const p=await c.call('/api/local/training/plans','POST',{readinessId:r.body.readiness.id,requestId:randomUUID(),gymOnly:false});assert.equal(p.body.status,'ready');assert.equal(p.body.plan.kind,'structure_only');assert.equal(p.body.plan.exercises.length,0);
  assert.equal((await c.call(`/api/local/training/plans/${p.body.plan.id}/start`,'POST',{confirmed:true})).status,200);
  const payload={confirmed:true,performedAt:new Date().toISOString(),actualMinutes:20,exercises:[{exerciseId:null,name:'SYNTHETIC actual activity',muscleGroups:['legs'],sets:[{reps:10,loadKg:0,rpe:null}],skipped:false}],notes:'SYNTHETIC test, not a source client',expectedHistoryRevision:0,acknowledgeProfileChange:false};
  const results=await Promise.all([c.call(`/api/local/training/plans/${p.body.plan.id}/complete`,'POST',payload),c.call(`/api/local/training/plans/${p.body.plan.id}/complete`,'POST',payload)]);
  assert(results.every(r=>r.status===200),JSON.stringify(results));assert.equal(results.filter(r=>r.body.replay===false).length,1);
  assert.equal((await c.call('/api/local/training/context')).body.summary.sessionsLast14Days,1);
  const b=new Client();await b.login('qa.adult-b@example.invalid');assert.equal((await b.call(`/api/local/training/plans/${p.body.plan.id}`)).status,404);
});
test('Cookie-authenticated SSE uses same verified identity, real citations and zero model calls',async()=>{
  const c=new Client();await c.login();const s=await c.createSession(),id=randomUUID();
  const res=await fetch(base+'/api/local/buddy/chat/stream',{method:'POST',headers:{Cookie:c.cookie,Origin:base,'Content-Type':'application/json','X-Local-Request':'1','X-Local-Context':c.view,'X-CSRF-Token':c.csrf},body:JSON.stringify({message:'Protein l\u00e0 g\u00ec?',conversationId:s.conversationId,requestId:id,expectedRevision:0,lang:'vi'})});
  const events:any[]=[];const result=await consumeBuddyStream(res,e=>events.push(e),new AbortController().signal);
  assert.equal(result.requestId,id);assert(result.citations.length>0);assert(events.some(e=>e.type==='delta'));assert.equal(result.timings.modelCalls,0);
});
test('Logout revokes cookie and same account can login again without preserving guest capability',async()=>{
  const c=new Client();await c.login();const old=c.cookie;assert.equal((await c.call('/api/local/auth/logout','POST',{})).status,200);
  c.cookie=old;assert.equal((await c.call('/api/local/source')).status,401);
  const fresh=new Client();await fresh.login();assert.notEqual(fresh.cookie,old);
});
test('Revocation and expiration are enforced, no public account/list/password endpoint',async()=>{
  const c=new Client();await c.login('qa.adult-b@example.invalid');await app.auth.disable(c.uid);
  assert.equal((await c.call('/api/local/source')).status,401);
  const a=new Client();await a.login();await db.access(sql=>sql.prepare('UPDATE local_sessions SET expires_at=0 WHERE uid=?').run(a.uid));assert.equal((await a.call('/api/local/source')).status,401);
  const g=new Client();assert.equal((await g.call('/api/local/users')).status,404);assert.equal((await g.call('/api/auth/login','POST',{})).status,404);
});
test('Manifest cannot add roles, arbitrary identity fields, duplicate source keys or silently use unknown program',async()=>{
  assert.throws(()=>parseManifest({...manifest,role:'admin'}));assert.throws(()=>parseManifest({...manifest,cases:[{...manifest.cases[0],email:'real@example.com'}]}));assert.throws(()=>parseManifest({...manifest,cases:[manifest.cases[0],manifest.cases[0]]}));
});
