import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { randomUUID } from 'node:crypto';
import { createBuddyRouter, type BuddyRouterOptions } from '../../server/src/buddy/router';

async function harness(fn:(x:{ask:(text:string,token?:string|null,stream?:boolean)=>Promise<{status:number;raw:string;body:any}>;calls:string[];base:string})=>Promise<void>,options:Partial<BuddyRouterOptions>={}){
 const app=express(),calls:string[]=[];
 app.use('/buddy',createBuddyRouter({enabled:()=>true,memberContextEnabled:()=>true,adminEmails:()=>[],rateLimit:1000,
  verifyToken:async token=>({uid:token,email_verified:token!=='unverified'}),entitled:async uid=>uid==='a',
  readContext:async()=>{throw Error('Safety messages should not read the full training context');},
  onOwnSafetyReport:async uid=>{calls.push(uid);return true;},...options}));
 const server=app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));
 const base=`http://127.0.0.1:${(server.address() as AddressInfo).port}/buddy`;
 const ask=async(text:string,token:string|null='a',stream=false)=>{
  const headers:Record<string,string>={'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})};
  const s=await fetch(base+'/sessions',{method:'POST',headers,body:'{}'}).then(r=>r.json()) as any;
  if(s.guestToken)headers['X-Buddy-Guest']=s.guestToken;
  const res=await fetch(base+(stream?'/chat/stream':'/chat'),{method:'POST',headers,body:JSON.stringify({message:text,conversationId:s.conversationId,requestId:randomUUID(),expectedRevision:0,lang:'vi'})});
  const raw=await res.text();let body:any;try{body=JSON.parse(raw);}catch{body=raw;}return {status:res.status,raw,body};
 };
 try{await fn({ask,calls,base});}finally{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));}
}
test('HTTP authenticated own report invokes only that UID and states limited readiness change',()=>harness(async({ask,calls})=>{
 const r=await ask('Tôi đau vai khi tập');assert.equal(r.status,200);assert.deepEqual(calls,['a']);assert.equal(r.body.saved,false);
 assert(r.body.reasonCodes.includes('previous_readiness_invalidated'));assert(r.body.text.includes('vô hiệu hóa'));assert.equal(r.body.handoverStatus,'suggested');
}));
test('HTTP guest, unadmitted and unverified accounts cannot trigger member state changes',()=>harness(async({ask,calls})=>{
 for(const token of [null,'not-admitted','unverified']){const r=await ask('Tôi đang đau ngực',token);assert.equal(r.status,200);assert.equal(r.body.task,'URGENT_SAFETY');assert(!r.body.reasonCodes.includes('previous_readiness_invalidated'));}
 assert.deepEqual(calls,[]);
}));
test('HTTP concept, negation and asking about another person do not change own readiness',()=>harness(async({ask,calls})=>{
 for(const message of ['Tiểu đường type 2 là gì?','Tôi không bị tiểu đường','Con tôi đang đau vai','Bố tôi bị tiểu đường']){const r=await ask(message);assert.equal(r.status,200);}
 assert.deepEqual(calls,[]);
}));
test('HTTP disabled private-context scope cannot invalidate readiness',()=>harness(async({ask,calls})=>{
 assert.equal((await ask('Tôi đang đau ngực')).body.task,'URGENT_SAFETY');assert.deepEqual(calls,[]);
},{memberContextEnabled:()=>false}));
test('HTTP missing previous readiness does not claim an invalidation',()=>harness(async({ask})=>{
 const r=await ask('Tôi đang đau ngực');assert.equal(r.status,200);assert(!r.body.reasonCodes.includes('previous_readiness_invalidated'));assert(!r.body.text.includes('đã được vô hiệu hóa'));
},{onOwnSafetyReport:async()=>false}));
test('HTTP storage error after urgent guidance is not a successful final response',()=>harness(async({ask})=>{
 const r=await ask('Tôi đang đau ngực','a',true);
 const events=r.raw.trim().split('\n\n').map((line:string)=>JSON.parse(line.slice(6)));
 assert.equal(events[0].type,'meta');assert.equal(events[1].type,'delta');assert(events[1].text.includes('cấp cứu'));
 assert.equal(events.at(-1).type,'error');assert(!events.some((e:any)=>e.type==='done'));assert(!r.raw.includes('SECRET_STORAGE_PATH'));assert(!r.raw.includes('đã được vô hiệu hóa'));
},{onOwnSafetyReport:async()=>{throw Error('SECRET_STORAGE_PATH');}}));
