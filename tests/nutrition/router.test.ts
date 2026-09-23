import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import fs from 'node:fs';
import type {AddressInfo} from 'node:net';
import {createNutritionRouter,type NutritionRouterOptions} from '../../server/src/nutrition/router';
const read=(p:string)=>JSON.parse(fs.readFileSync(p,'utf8'));
const load=()=>({source:read('data/nutrition/source-documents.json'),mapping:read('data/nutrition/template-mapping.json'),library:read('data/nutrition/meal-plan-library.json')});
const context={ageBand:'adult',goal:'weight_gain',timing:'before_workout',allergyStatus:'none_reported',clinicalReview:'not_reported',contextConfirmed:true};
async function withApi(fn:(call:(p:string,method?:string,body?:unknown,token?:string|null)=>Promise<{status:number;body:any;cache:string|null}>)=>Promise<void>,extra:Partial<NutritionRouterOptions>={}) {
 const app=express();app.use('/nutrition',createNutritionRouter({verifyToken:async token=>{if(token==='bad')throw Error('secret');return {uid:token,email:token==='admin'?'review@example.invalid':`${token}@example.invalid`,email_verified:token!=='unverified'};},adminEmails:()=>['review@example.invalid'],enabled:()=>true,load,...extra}));
 const server=app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));
 const base=`http://127.0.0.1:${(server.address() as AddressInfo).port}/nutrition`;
 const call=async(p:string,method='GET',body?:unknown,token:string|null='admin')=>{const r=await fetch(base+p,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});return {status:r.status,body:await r.json(),cache:r.headers.get('cache-control')};};
 try{await fn(call);}finally{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));}
}
test('API nguồn dinh dưỡng yêu cầu token hợp lệ và admin email đã xác minh',()=>withApi(async call=>{
 assert.equal((await call('/library','GET',undefined,null)).status,401);assert.equal((await call('/library','GET',undefined,'bad')).status,401);
 assert.equal((await call('/library','GET',undefined,'member')).status,403);assert.equal((await call('/library','GET',undefined,'unverified')).status,403);
}));
test('Feature flag mặc định cấu hình tắt ngăn đọc nguồn qua API',()=>withApi(async call=>assert.equal((await call('/library')).status,503),{enabled:()=>false}));
test('Admin đọc thư viện đã kiểm tra và không cache nguồn',()=>withApi(async call=>{
 const r=await call('/library');assert.equal(r.status,200);assert.equal(r.cache,'no-store');assert.equal(r.body.summary.templateCount,6);assert.equal(r.body.scope,'source_review_only');
}));
test('Preview đủ ngữ cảnh không cấp mẫu chưa duyệt hoặc ghi hồ sơ',()=>withApi(async call=>{
 const r=await call('/preview','POST',{context});assert.equal(r.status,200);assert.equal(r.body.decision.status,'insufficient_reviewed_nutrition_data');assert.equal(r.body.decision.mealPlan,null);assert.equal(r.body.saved,false);assert.equal(r.body.modelCalled,false);
}));
test('Preview trẻ và bệnh lý luôn cần chuyên môn',()=>withApi(async call=>{
 for(const patch of [{ageBand:'minor'},{clinicalReview:'required'},{allergyStatus:'reported'}]){const r=await call('/preview','POST',{context:{...context,...patch}});assert.equal(r.status,200);assert.equal(r.body.decision.status,'needs_professional_review');}
}));
test('API từ chối UID giả, thiếu trường, trường thừa và enum sai',()=>withApi(async call=>{
 for(const body of [{context,uid:'member-b'},{context:{...context,uid:'member-b'}},{context:{goal:'weight_gain'}},{context:{...context,ageBand:'over_18'}},[],null])assert.equal((await call('/preview','POST',body)).status,400);
}));
test('Không có route ghi nhật ký, duyệt nguồn hay tự bật template',()=>withApi(async call=>{
 for(const [p,method] of [['/approve','POST'],['/library','PUT'],['/library','DELETE'],['/meal-log','POST']])assert.equal((await call(p,method,{verified:true})).status,405);
}));
test('Nguồn bị sửa không được trả như dữ liệu hợp lệ',()=>withApi(async call=>assert.equal((await call('/library')).status,503),{load:()=>{const x=load();x.library.templates[0].verified=true;return x;}}));
test('Lỗi đọc không lộ đường dẫn/nội dung nguồn và không nói đã lưu',()=>withApi(async call=>{
 const r=await call('/library');assert.equal(r.status,503);assert.equal(r.body.code,'nutrition_source_unavailable');assert(!JSON.stringify(r.body).includes('sensitive-example'));
},{load:()=>{throw Error('/sensitive-example/private-member.json');}}));
test('Payload quá lớn bị chặn trước khi mô phỏng',()=>withApi(async call=>assert.equal((await call('/preview','POST',{context,padding:'x'.repeat(20000)})).status,413)));