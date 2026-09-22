/** Synthetic source data only. Never connects to a real Firebase project. */
import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type {Server} from 'node:http';
import type {AddressInfo} from 'node:net';
import {randomUUID} from 'node:crypto';
import {initializeApp,deleteApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore} from 'firebase-admin/firestore';
import {FirestoreTrainingStore} from '../../server/src/companion/training/store';
import {createPathwayRouter} from '../../server/src/companion/pathways/router';
import {fixture} from './fixtures';
for(const key of ['FIREBASE_AUTH_EMULATOR_HOST','FIRESTORE_EMULATOR_HOST'])if(!/^127\.0\.0\.1:\d+$/.test(process.env[key]??''))throw new Error('Loopback emulators required.');
const projectId='demo-shine-training',app=initializeApp({projectId},'pathways-'+randomUUID()),auth=getAuth(app),db=getFirestore(app);
let server:Server,base:string,a:{uid:string;token:string;email:string},b:{uid:string;token:string;email:string};
async function user(){const email=`synthetic-${randomUUID()}@example.invalid`,password='synthetic-password-123!';const u=await auth.createUser({email,password,emailVerified:true});const r=await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=test`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true})});return{uid:u.uid,email,token:(await r.json() as any).idToken};}
async function call(path:string,method='GET',body?:unknown,token=a.token){const r=await fetch(base+path,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});return{status:r.status,data:await r.json() as any};}
before(async()=>{a=await user();b=await user();const e=express();e.use('/pathways',createPathwayRouter({store:new FirestoreTrainingStore(db),enabled:()=>true,adminEmails:()=>[a.email,b.email],verifyToken:t=>auth.verifyIdToken(t,true)}));server=e.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));base=`http://127.0.0.1:${(server.address()as AddressInfo).port}/pathways`;});
after(async()=>{server?.closeAllConnections();if(server)await new Promise<void>(r=>server.close(()=>r()));await db.terminate();await deleteApp(app);});
test('emulator: preview creates no private document',async()=>{assert.equal((await call('/preview','POST',{bundle:fixture()})).status,200);assert.equal((await db.collection(`pathway_intake_owners/${a.uid}/cases`).get()).size,0);});
test('emulator: concurrent retries produce one private source case',async()=>{const body={bundle:fixture(),expectedRevision:0,privacyConfirmed:true};const out=await Promise.all([call('/cases/case-a','PUT',body),call('/cases/case-a','PUT',body)]);assert(out.every(r=>r.status===200));assert.equal(out.filter(r=>r.data.replay===false).length,1);assert.equal((await db.collection(`pathway_intake_owners/${a.uid}/cases`).get()).size,1);});
test('emulator: another verified admin cannot read the case',async()=>{assert.equal((await call('/cases/case-a','GET',undefined,b.token)).status,404);assert.equal((await call('/cases','GET',undefined,b.token)).data.cases.length,0);});
test('emulator: direct Firestore access denied even for source owner',async()=>{const r=await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/v1/projects/${projectId}/databases/(default)/documents/pathway_intake_owners/${a.uid}/cases/case-a`,{headers:{Authorization:`Bearer ${a.token}`}});assert.equal(r.status,403);});
test('emulator: source association issue blocks transcription approval',async()=>{assert.equal((await call('/cases/case-a/review','POST',{expectedRevision:1,transcriptionConfirmed:true,notAPrescriptionConfirmed:true})).status,409);});
test('emulator: delete removes original and edited source, never revives on retry',async()=>{assert.equal((await call('/cases/case-a','DELETE',{expectedRevision:1,confirmed:true})).status,200);const data=(await db.doc(`pathway_intake_owners/${a.uid}/cases/case-a`).get()).data();assert.equal(data?.deleted,true);assert(!data?.bundle&&!data?.originalBundle);assert.equal((await call('/cases/case-a','PUT',{bundle:fixture(),expectedRevision:0,privacyConfirmed:true})).status,409);});
test('emulator: revoked/disabled account cannot access the private queue',async()=>{await auth.updateUser(a.uid,{disabled:true});assert.equal((await call('/cases')).status,401);});
