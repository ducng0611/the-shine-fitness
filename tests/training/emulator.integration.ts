/** Real Firebase Auth + Firestore emulator tests. NEVER connects to a real project. */
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { createTrainingRouter } from '../../server/src/companion/training/router';
import { FirestoreTrainingStore } from '../../server/src/companion/training/store';
import { profileInput, readinessInput, catalogue } from './helpers';
const projectId='demo-shine-training';
for(const key of ['FIREBASE_AUTH_EMULATOR_HOST','FIRESTORE_EMULATOR_HOST']) {
  if (!/^127\.0\.0\.1:\d+$/.test(process.env[key] ?? '')) throw new Error(`${key} must point to a loopback emulator. Tests do not run against production.`);
}
const app=initializeApp({projectId},`training-test-${randomUUID()}`),auth=getAuth(app),db=getFirestore(app);
let server:Server,base:string,a:{uid:string;token:string},b:{uid:string;token:string},planId:string;
const authBase=`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1`;
const firestoreBase=`http://${process.env.FIRESTORE_EMULATOR_HOST}/v1/projects/${projectId}/databases/(default)/documents`;
async function makeUser(label:string){const email=`${label}-${randomUUID()}@example.invalid`,password='SYNTHETIC-emulator-password-123!';const user=await auth.createUser({email,password,emailVerified:true});const response=await fetch(`${authBase}/accounts:signInWithPassword?key=synthetic-test-key`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true})});const data=await response.json() as {idToken:string};assert.equal(response.status,200);return {uid:user.uid,token:data.idToken};}
async function call(path:string,method='GET',body?:unknown,token=a.token){const response=await fetch(base+path,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});return {status:response.status,body:await response.json() as any};}
async function rest(path:string,method='GET',fields?:unknown,token=a.token){return fetch(`${firestoreBase}/${path}`,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(fields===undefined?{}:{body:JSON.stringify({fields})})});}
before(async()=>{
  a=await makeUser('a'); b=await makeUser('b');
  const expressApp=express();expressApp.use(express.json());expressApp.use('/training',createTrainingRouter({store:new FirestoreTrainingStore(db),verifyToken:token=>auth.verifyIdToken(token,true),enabled:()=>true,pilotUids:()=>[a.uid,b.uid],adminEmails:()=>[],rateLimit:1000}));
  server=expressApp.listen(0,'127.0.0.1');await new Promise<void>(resolve=>server.once('listening',resolve));base=`http://127.0.0.1:${(server.address() as AddressInfo).port}/training`;
}, {timeout:30000});
after(async()=>{if(server){server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}await db.terminate();await deleteApp(app);});
test('emulator: genuine verified Firebase tokens admitted; invalid token rejected',async()=>{
  assert.equal((await call('/context')).status,200);assert.equal((await call('/context','GET',undefined,'not-a-token')).status,401);
});
test('emulator: profile stored by UID and another account sees no private profile',async()=>{
  assert.equal((await call('/profile','PUT',{profile:profileInput({nickname:'SYNTHETIC A',weightKg:70}),expectedRevision:0})).status,200);
  assert.equal((await call('/profile','PUT',{profile:profileInput({nickname:'SYNTHETIC B'}),expectedRevision:0},b.token)).status,200);
  const other=await call('/context?uid='+a.uid,'GET',undefined,b.token);assert.equal(other.body.profile.nickname,'SYNTHETIC B');assert.deepEqual(other.body.openPlans,[]);
});
test('emulator: mass-assignment cannot move profile ownership',async()=>{const r=await call('/profile','PUT',{profile:{...profileInput(),uid:b.uid},expectedRevision:1});assert.equal(r.status,400);assert.equal((await db.doc(`training_members/${a.uid}`).get()).get('profile.uid'),a.uid);});
test('emulator: actual Firestore transactions create a plan and idempotent completion',{timeout:30000},async()=>{
  const ready=await call('/readiness','PUT',{readiness:readinessInput(),expectedProfileRevision:1});assert.equal(ready.status,200);
  const result=await call('/plans','POST',{readinessId:ready.body.readiness.id,requestId:randomUUID(),gymOnly:false});assert.equal(result.status,200);assert.equal(result.body.status,'ready');planId=result.body.plan.id;
  assert.equal((await call(`/plans/${planId}/start`,'POST',{confirmed:true})).status,200);
  const payload={confirmed:true,performedAt:new Date().toISOString(),actualMinutes:25,exercises:[{exerciseId:null,name:'Synthetic actual activity',muscleGroups:['legs'],sets:[{reps:10,loadKg:0,rpe:null}],skipped:false}],notes:'Synthetic emulator record',expectedHistoryRevision:0,acknowledgeProfileChange:false};
  const results=await Promise.all(Array.from({length:5},()=>call(`/plans/${planId}/complete`,'POST',payload)));assert(results.every(r=>r.status===200),JSON.stringify(results));assert.equal(results.filter(r=>r.body.replay===false).length,1);
  assert.equal((await db.collection(`training_members/${a.uid}/sessions`).get()).size,1);assert.equal((await db.doc(`training_members/${a.uid}`).get()).get('historyRevision'),1);
  assert.equal((await call(`/plans/${planId}/complete`,'POST',{...payload,actualMinutes:30})).status,409);
});
test('emulator: foreign plan and confirmed history are inaccessible',async()=>{assert.equal((await call(`/plans/${planId}`,'GET',undefined,b.token)).status,404);assert.equal((await call('/context','GET',undefined,b.token)).body.summary.sessionsLast14Days,0);});
test('emulator rules: even owner cannot read/write authoritative private data directly',async()=>{
  assert.equal((await rest(`training_members/${a.uid}`)).status,403);
  assert.equal((await rest(`training_members/${a.uid}/sessions/forged`,'PATCH',{uid:{stringValue:a.uid}})).status,403);
  assert.equal((await rest(`training_access/${a.uid}`,'PATCH',{enabled:{booleanValue:true}})).status,403);
});
test('emulator rules: conflicting owner fields and ownership transfers are rejected',async()=>{
  const path=`workout_logs/test-${randomUUID()}`;
  assert.equal((await rest(path,'PATCH',{uid:{stringValue:a.uid},userId:{stringValue:b.uid}})).status,403);
  assert.equal((await rest(path,'PATCH',{uid:{stringValue:a.uid},userId:{stringValue:a.uid},date:{stringValue:new Date().toISOString().slice(0,10)}})).status,200);
  assert.equal((await rest(path,'PATCH',{uid:{stringValue:b.uid},userId:{stringValue:a.uid}})).status,403);
  assert.equal((await rest(path,'GET',undefined,b.token)).status,403);
});
test('emulator: recorded pain blocks planner through the real HTTP API',async()=>{
  const r=await call('/readiness','PUT',{readiness:readinessInput({currentPain:true}),expectedProfileRevision:1});assert.equal(r.status,200);
  const result=await call('/plans','POST',{readinessId:r.body.readiness.id,requestId:randomUUID(),gymOnly:false});assert.equal(result.body.status,'needs_review');
});
test('emulator: safety chat atomically invalidates own readiness and blocks starting the old plan',async()=>{
  const otherBefore=(await db.doc(`training_members/${a.uid}`).get()).data();
  const ready=await call('/readiness','PUT',{readiness:readinessInput(),expectedProfileRevision:1},b.token);
  assert.equal(ready.status,200);
  const result=await call('/plans','POST',{readinessId:ready.body.readiness.id,requestId:randomUUID(),gymOnly:false},b.token);
  assert.equal(result.body.status,'ready');
  const report=await call('/chat','POST',{message:'Toi bi dau lung'},b.token);
  assert.equal(report.status,200);assert.equal(report.body.readinessInvalidated,true);assert.equal(report.body.saved,false);
  assert.equal((await db.doc(`training_members/${b.uid}`).get()).get('readiness'),null);
  assert.equal((await call(`/plans/${result.body.plan.id}/start`,'POST',{confirmed:true},b.token)).status,409);
  assert.equal((await db.collection(`training_members/${b.uid}/sessions`).get()).size,0);
  assert.deepEqual((await db.doc(`training_members/${a.uid}`).get()).data(),otherBefore);
});
test('emulator: reviewed catalogue is used and changed machine is rechecked at start',async()=>{
  const cat=catalogue();for(const [collection,rows] of [['gym_zones',cat.zones],['gym_equipment',cat.equipment],['gym_exercises',cat.exercises]] as const) for(const row of rows) await db.collection(collection).doc(String(row.id)).set(row);
  const ready=await call('/readiness','PUT',{readiness:readinessInput(),expectedProfileRevision:1});
  const result=await call('/plans','POST',{readinessId:ready.body.readiness.id,requestId:randomUUID(),gymOnly:true});assert.equal(result.body.status,'ready',JSON.stringify(result.body));assert.equal(result.body.plan.mode,'gym_grounded');
  await db.doc('gym_equipment/test-station-a').update({operationalStatus:'under_maintenance'});
  assert.equal((await call(`/plans/${result.body.plan.id}/start`,'POST',{confirmed:true})).status,409);
});
test('emulator: export contains only own data and privacy deletion leaves other user intact',async()=>{
  const exported=await call('/export');assert.equal(exported.status,200);assert.equal(exported.body.sessions.length,1);assert(!JSON.stringify(exported.body).includes('SYNTHETIC B'));
  assert.equal((await call('/data','DELETE',{confirmed:true})).status,200);assert.equal((await db.collection(`training_members/${a.uid}/sessions`).get()).size,0);assert.equal((await db.collection(`training_members/${a.uid}/measurements`).get()).size,0);assert.equal((await call('/context','GET',undefined,b.token)).body.profile.nickname,'SYNTHETIC B');
});
test('emulator: disabled Firebase identity is rejected by revoke-aware token verification',async()=>{await auth.updateUser(b.uid,{disabled:true});assert.equal((await call('/context','GET',undefined,b.token)).status,401);});
