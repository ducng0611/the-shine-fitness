/** Measures the actual HTTP/source-card path, not Gemini latency or production performance. */
import express from 'express';
import fs from 'node:fs';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import type { AddressInfo } from 'node:net';
import { createBuddyRouter } from '../../server/src/buddy/router';
import { BuddyKnowledge } from '../../server/src/buddy/knowledge';
const app=express();
app.use('/buddy',createBuddyRouter({enabled:()=>true,memberContextEnabled:()=>false,adminEmails:()=>[],rateLimit:10000,
  verifyToken:async()=>{throw Error('No authenticated calls in this benchmark');},entitled:async()=>false,
  readContext:async()=>{throw Error('No private reads in this benchmark');},knowledge:new BuddyKnowledge(process.cwd(),()=>Date.parse('2026-09-23T00:00:00Z'))}));
const server=app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));
const base=`http://127.0.0.1:${(server.address() as AddressInfo).port}/buddy`;
const samples:{sessionAndReplyMs:number;chatFirstContentMs:number;chatTotalMs:number;serverMs:number;modelCalls:number;cacheHit:boolean}[]=[];
try {
  for(let i=0;i<45;i++) {
    const start=performance.now();const s=await fetch(base+'/sessions',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}).then(r=>r.json()) as any;
    const chatStart=performance.now();
    const response=await fetch(base+'/chat/stream',{method:'POST',headers:{'Content-Type':'application/json','X-Buddy-Guest':s.guestToken},body:JSON.stringify({message:'Protein là gì?',requestId:randomUUID(),conversationId:s.conversationId,expectedRevision:0,lang:'vi'})});
    if(!response.ok)throw Error('HTTP benchmark request failed');
    const reader=response.body!.getReader(),decoder=new TextDecoder();let text='',first:number|null=null,reply:any;
    while(true){const part=await reader.read();text+=decoder.decode(part.value,{stream:!part.done});if(first===null&&text.includes('"type":"delta"'))first=performance.now()-chatStart;if(part.done)break;}
    for(const frame of text.trim().split('\n\n')){const e=JSON.parse(frame.slice(6));if(e.type==='done')reply=e.reply;}
    if(!reply||reply.timings.modelCalls!==0)throw Error('Benchmark must complete without a model call');
    if(i>=5)samples.push({sessionAndReplyMs:performance.now()-start,chatFirstContentMs:first!,chatTotalMs:performance.now()-chatStart,serverMs:reply.timings.totalMs,modelCalls:reply.timings.modelCalls,cacheHit:reply.timings.cacheHit});
  }
  const stats=(key:keyof typeof samples[number])=>{const values=samples.map(s=>Number(s[key])).sort((a,b)=>a-b);return {p50:values[Math.ceil(values.length*.5)-1],p95:values[Math.ceil(values.length*.95)-1],min:values[0],max:values.at(-1)};};
  const report={measuredAt:new Date().toISOString(),environment:{platform:process.platform,node:process.version,cpu:os.cpus()[0]?.model},sampleCount:samples.length,warmups:5,concurrency:1,network:'127.0.0.1 loopback',path:'guest source-card SSE, no paid or synthetic model',milliseconds:{sessionAndReply:stats('sessionAndReplyMs'),chatFirstContent:stats('chatFirstContentMs'),chatTotal:stats('chatTotalMs'),server:stats('serverMs')},modelCalls:0,cacheHits:samples.filter(s=>s.cacheHit).length,productionModelTTFT:'NOT_MEASURED',oldEndpointLatency:'NOT_MEASURED',oldArtificialMinimumMs:600,warning:'Không suy ra tốc độ Gemini, Firebase thật, mạng người dùng hoặc cold start từ số đo loopback.'};
  fs.mkdirSync('test-results/buddy',{recursive:true});fs.writeFileSync('test-results/buddy/benchmark.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
} finally {server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));}
