/** Local-only end-to-end acceptance. No mock auth, no fabricated logs or model benchmarks. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
const args=process.argv.slice(2),value=k=>args[args.indexOf(k)+1];
if(!args.includes('--local')||!args.includes('--accounts')||!args.includes('--out'))throw new Error('Required --local --accounts PRIVATE_FILE --out PRIVATE_REPORT [--origin http://127.0.0.1:4176]');
const base=args.includes('--origin')?value('--origin'):'http://127.0.0.1:4176',url=new URL(base);
if(url.protocol!=='http:'||!['127.0.0.1','localhost'].includes(url.hostname)||url.pathname!=='/'||url.search||url.hash||url.username)throw new Error('Only explicit local loopback origin accepted');
const password=process.env.SHINE_LOCAL_QA_PASSWORD;if(!password)throw new Error('Set the QA password privately in the environment');
const accounts=JSON.parse(await readFile(value('--accounts'),'utf8')).accounts;
if(!Array.isArray(accounts)||accounts.length<2)throw new Error('Need a created account report, not a planned list');
const results=[],start=Date.now();let modelCalls=0,sessionCount=0;
class Client{
  cookie='';csrf='';view='guest';conversations=[];
  async request(path,method='GET',body,extra={}){
    const res=await fetch(base+path,{method,redirect:'error',signal:AbortSignal.timeout(20000),headers:{Origin:base,'Content-Type':'application/json','X-Local-Request':'1','X-Local-Context':this.view,...(this.cookie?{Cookie:this.cookie}:{}),...(this.csrf?{'X-CSRF-Token':this.csrf}:{}),...extra},...(body===undefined?{}:{body:JSON.stringify(body)})});
    return {status:res.status,body:await res.json(),headers:res.headers};
  }
  async login(email){const r=await this.request('/api/local/auth/login','POST',{email,password});assert.equal(r.status,200);this.cookie=r.headers.get('set-cookie').split(';')[0];this.csrf=r.body.csrf;this.view=r.body.sessionVersion;return r.body;}
  async session(){const r=await this.request('/api/local/buddy/sessions','POST',{});assert.equal(r.status,201);this.conversations.push(r.body);sessionCount++;return r.body;}
  async chat(message,s){s??=await this.session();const r=await this.request('/api/local/buddy/chat','POST',{message,lang:'vi',conversationId:s.conversationId,requestId:randomUUID(),expectedRevision:s.revision},s.guestToken?{'X-Buddy-Guest':s.guestToken}:{});assert.equal(r.status,200);s.revision=r.body.revision;modelCalls+=r.body.timings.modelCalls;return r.body;}
  async cleanup(){for(const s of this.conversations)await this.request('/api/local/buddy/sessions/'+s.conversationId,'DELETE',{},s.guestToken?{'X-Buddy-Guest':s.guestToken}:{});if(this.cookie)await this.request('/api/local/auth/logout','POST',{});}
}
async function check(name,fn){const started=performance.now();try{await fn();results.push({name,passed:true,elapsedMs:Math.round((performance.now()-started)*100)/100});}catch(error){results.push({name,passed:false,errorCode:error.code??error.name,message:String(error.message).slice(0,200)});}}
const live=[];
try{
  const guest=new Client();live.push(guest);
  await check('Guest education without login',async()=>{const r=await guest.chat('Protein l\u00e0 g\u00ec?');assert.equal(r.task,'NUTRITION_EDUCATION');assert.equal(r.mode,'guest');assert(r.citations.length>0);});
  for(const account of accounts){
    const c=new Client();live.push(c);let info,source;
    await check(account.label+': real local login',async()=>{info=await c.login(account.email);assert.equal(info.user.uid,account.uid);assert.equal(info.user.authProvider,'local');});
    if(!info)continue;
    await check(account.label+': exact source owner and no assigned sample meal',async()=>{const r=await c.request('/api/local/source');assert.equal(r.status,200);source=r.body;assert.equal(source.source.label,account.label);assert.equal(source.assignedProgramId,null);assert.equal(source.mealPlanAssignment,null);assert.equal(source.readOnly,true);});
    await check(account.label+': knowledge with source',async()=>{const r=await c.chat('Whey l\u00e0 g\u00ec?');assert.equal(r.task,'NUTRITION_EDUCATION');assert(r.citations.length>0);});
    await check(account.label+': health concept is not a diagnosis',async()=>{const r=await c.chat('Ti\u1ec3u \u0111\u01b0\u1eddng type 2 l\u00e0 g\u00ec?');assert.equal(r.task,'HEALTH_EDUCATION');assert.equal(r.saved,false);});
    await check(account.label+': source profile and correct adult/minor boundary',async()=>{const r=await c.chat('T\u00f4i mu\u1ed1n xem h\u1ed3 s\u01a1 c\u1ee7a t\u00f4i');if(info.user.minorAtSource){assert.notEqual(r.mode,'authorized_member');}else{assert.equal(r.mode,'authorized_member');assert(r.text.includes(source.source.goal));}});
    await check(account.label+': historical plans are not completed workouts',async()=>{const r=await c.request('/api/local/training/context');if(info.user.minorAtSource){assert.equal(r.status,403);}else{assert.equal(r.status,200);assert.equal(r.body.summary.sessionsLast14Days,0);assert.equal(r.body.historyRevision,0);assert.equal(r.body.progress.points.length,0);}});
    await check(account.label+': safety uses source without requesting false adult age',async()=>{const r=await c.chat('T\u00f4i c\u00f3 35 ph\u00fat mu\u1ed1n t\u1eadp ch\u00e2n');if(info.user.reviewRequired||info.user.minorAtSource){assert.equal(r.task,'PROFESSIONAL_REVIEW');assert.equal(r.handoverTag,'HEALTH_RISK');}assert.equal(r.saved,false);});
    await check(account.label+': food statement does not falsely save a meal',async()=>{const r=await c.chat('T\u00f4i \u0111\u00e3 \u0103n xong b\u1eefa tr\u01b0a');assert.equal(r.saved,false);assert(!/\d+\s*(kcal|calo)/i.test(r.text));});
  }
  if(live.length>2){const a=live[1],b=live[2],s=await a.session();await check('Cross-account conversation access denied',async()=>{assert.equal((await b.request('/api/local/buddy/sessions/'+s.conversationId)).status,404);});
    await check('CSRF required on logged-in write',async()=>{assert.equal((await a.request('/api/local/buddy/sessions','POST',{}, {'X-CSRF-Token':'wrong'})).status,403);});
    await check('Forged Firebase bearer rejected in local mode',async()=>{assert.equal((await a.request('/api/local/source','GET',undefined,{Authorization:'Bearer forged'})).status,400);});
    await check('Posted UID cannot replace server identity',async()=>{assert.equal((await a.request('/api/local/buddy/sessions','POST',{uid:accounts[1].uid})).status,400);});
  }
}finally{for(const c of live)await c.cleanup().catch(()=>{});}
const report={mode:'real_local_http_sqlite_password_auth',mockAuthentication:false,firebaseCalls:0,modelCalls,modelQualityEvaluated:false,accountsTested:accounts.length,sessionsCreated:sessionCount,startedAt:new Date(start).toISOString(),endedAt:new Date().toISOString(),passed:results.filter(r=>r.passed).length,failed:results.filter(r=>!r.passed).length,results,
  limitations:['Loopback, not publicly deployed','Source measurements are historical, no actual workouts fabricated','No member-assigned meal planner/PT-note reasoning implemented','No live Gemini calls or model-latency benchmark']};
await mkdir(dirname(resolve(value('--out'))),{recursive:true,mode:0o700});await writeFile(value('--out'),JSON.stringify(report,null,2)+'\n',{mode:0o600});
console.log(JSON.stringify({accountsTested:report.accountsTested,sessionsCreated:sessionCount,passed:report.passed,failed:report.failed,firebaseCalls:0,modelCalls}));
if(report.failed)process.exitCode=1;
