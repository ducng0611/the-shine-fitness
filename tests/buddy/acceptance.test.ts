import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { randomUUID } from 'node:crypto';
import { contextText, createBuddyRouter } from '../../server/src/buddy/router';
import { educationCardMatches } from '../../server/src/buddy/knowledge';
import { resolveBuddyClientIdentity } from '../../shared/buddyIdentity';
import type { TrainingContextResponse } from '../../shared/training';

test('Vietnamese accented profile request is not answered with a history count',()=>{
 const c={profile:{uid:'a',goal:'hypertrophy',experience:'beginner',preferredMinutes:35}} as TrainingContextResponse;
 const text=contextText(c,'Tôi muốn xem hồ sơ của tôi','vi',Date.now());assert(text.includes('hypertrophy'));assert(!text.includes('0 buổi'));
});
test('stale Firebase session with absent display account cannot open private UI',()=>assert.equal(resolveBuddyClientIdentity('a',undefined,false,false,'absent').state,'mismatch'));
test('unverifiable displayed account cannot select a stale Firebase account',()=>assert.equal(resolveBuddyClientIdentity('a',undefined,false,false,'present').state,'mismatch'));
test('display-only legacy login does not grant Firebase authentication',()=>assert.equal(resolveBuddyClientIdentity(null,'a',false,false,'present').state,'guest'));
test('fast cards answer concept requests but not unrelated topic-specific questions',()=>{
 assert(educationCardMatches('protein','Protein là gì?'));
 assert(educationCardMatches('whey','Whey khác thực phẩm giàu đạm thế nào?'));
 assert(educationCardMatches('energy_terms','TDEE khác BMR thế nào?'));
 assert(!educationCardMatches('protein','Protein có gây bệnh thận không?'));
 assert(!educationCardMatches('diabetes_concept','Tiểu đường type 2 có những biến chứng gì?'));
 assert(!educationCardMatches('creatine_concept','Creatine liều bao nhiêu?'));
});
test('before/after nutrition continuation can use a relevant general principle, not numeric targets',()=>{
 assert(educationCardMatches('meal_after','Vậy sau tập thì sao?'));
 assert(!educationCardMatches('meal_after','Sau tập cần bao nhiêu kcal?'));
});
test('a later unsafe health/nutrition model chunk cannot leak an earlier unchecked sentence',async()=>{
 const app=express();app.use('/buddy',createBuddyRouter({enabled:()=>true,memberContextEnabled:()=>false,adminEmails:()=>[],rateLimit:1000,
  verifyToken:async()=>{throw Error('No auth in test');},entitled:async()=>false,readContext:async()=>{throw Error('No private data');},
  provider:{hasFallback:false,async *stream(input){input.onCall();yield 'Đây là câu đầu chưa kiểm chứng. ';yield 'Take insulin 5 mg now.';}}}));
 const server=app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));
 const base=`http://127.0.0.1:${(server.address() as AddressInfo).port}/buddy`;
 try{
  const session=await fetch(base+'/sessions',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}).then(r=>r.json()) as any;
  const response=await fetch(base+'/chat/stream',{method:'POST',headers:{'Content-Type':'application/json','X-Buddy-Guest':session.guestToken},body:JSON.stringify({message:'Vitamin D là gì?',conversationId:session.conversationId,requestId:randomUUID(),expectedRevision:0,lang:'vi'})});
  const text=await response.text();assert(text.includes('unsafe_model_output'));assert(!text.includes('"type":"delta"'));assert(!text.includes('chưa kiểm chứng'));assert(!text.includes('Take insulin'));
 }finally{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));}
});
