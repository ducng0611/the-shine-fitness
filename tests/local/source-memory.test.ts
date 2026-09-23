import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync,cpSync,mkdirSync,rmSync,readFileSync,writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PilotDatabase } from '../../server/src/local/sqlite';
import { seedQA } from '../../server/src/local/seed';
import { importSourceMemory,MemberSourceReader,validateEnrichment } from '../../server/src/local/sourceMemory';
import { createLocalApp } from '../../server/src/local/app';
import { syntheticManifest } from './fixtures';
import { routeBuddy,newBuddyMemory } from '../../shared/buddyPolicy';
const root=process.cwd(),password='SYNTHETIC-test-only-9!';
async function fixture(fn:(db:PilotDatabase,uids:string[])=>Promise<void>) {
 const dir=mkdtempSync(join(tmpdir(),'shine-memory-')),db=new PilotDatabase(join(dir,'pilot.sqlite'));
 try {const seeded=await seedQA(db,syntheticManifest,password,root);await fn(db,seeded.accounts.map(a=>a.uid));}finally{await db.close();rmSync(dir,{recursive:true,force:true});}
}
const facts={schemaVersion:1 as const,cases:[{key:'adult-a',programId:'prog_weight_gain_pt50',fields:{medicalHistory:{raw:'SYNTHETIC health note A',status:'recorded' as const,sourceRef:'Synthetic-only source'},medications:{raw:null,status:'not_recorded' as const,sourceRef:'Synthetic-only empty field'}}}]};
test('Import persists five source programs, six meal templates, 25 assets, 127 exercises without altering accounts/logs',()=>fixture(async db=>{
 const before=await db.access(sql=>JSON.stringify(sql.prepare("SELECT * FROM local_users").all()));
 const result=await importSourceMemory(db,root,facts);assert.equal(result.status,'imported');assert.deepEqual(result.counts,{members:3,programs:5,exercises:127,meals:6,assets:25});
 assert.equal(await db.access(sql=>JSON.stringify(sql.prepare('SELECT * FROM local_users').all())),before);
 assert.equal((await db.access(sql=>sql.prepare("SELECT count(*) n FROM local_documents WHERE path LIKE '%/sessions/%' OR path LIKE '%/measurements/%'").get()))!.n,0);
}));
test('Idempotent import preserves facts without re-supplying the private enrichment',()=>fixture(async(db,uids)=>{
 await importSourceMemory(db,root,facts);const again=await importSourceMemory(db,root);assert.equal(again.status,'unchanged');
 const reader=new MemberSourceReader(db),a=await reader.answer(uids[0],'Trong ho so cua toi ghi benh ly nao?','vi');assert.match(a!.text,/SYNTHETIC health note A/);assert.equal(a!.citations[0].scope,'own_record');
 const b=await reader.answer(uids[1],'Trong ho so cua toi ghi benh ly nao?','vi');assert(!b!.text.includes('SYNTHETIC health note A'));
}));
test('Read medication field remains missing and is not interpreted as no medication',()=>fixture(async(db,uids)=>{
 await importSourceMemory(db,root,facts);const a=await new MemberSourceReader(db).answer(uids[0],'Ho so cua toi co ghi thuoc dang dung khong?','vi');assert(a!.missingFields.includes('medications'));assert(!a!.text.includes('SYNTHETIC health note A'));assert(!a!.text.includes('khong dung thuoc'));
}));
test('Changed facts require optimistic import revision; wrong-owner enrichment cannot write anything',()=>fixture(async db=>{
 await importSourceMemory(db,root,facts);const change=structuredClone(facts);change.cases[0].fields.medicalHistory.raw='SYNTHETIC revised source';
 await assert.rejects(importSourceMemory(db,root,change),/revision conflict/);assert.equal((await importSourceMemory(db,root,change,1)).revision,2);
 const wrong=structuredClone(facts);wrong.cases[0].programId='prog_height_posture_pt25';await assert.rejects(importSourceMemory(db,root,wrong,2),/does not match/);
}));
test('Malformed enrichment cannot set role, permission, review or fictional value on missing facts',()=>{
 assert.throws(()=>validateEnrichment({...facts,cases:[{...facts.cases[0],role:'admin'}]}));
 const bad=structuredClone(facts);bad.cases[0].fields.medications.raw='fiction' as never;assert.throws(()=>validateEnrichment(bad),/Missing fact/);
});
test('Archive import is not approval: no gym catalog writes, no assignment created, exact source content retained',()=>fixture(async(db,uids)=>{
 await importSourceMemory(db,root);const snap=await new MemberSourceReader(db).snapshot(uids[0]);
 assert.equal(snap!.memory.assignedProgramId,null);assert.equal(snap!.memory.mealPlanAssignment,null);
 assert.deepEqual(snap!.program,JSON.parse(readFileSync('data/companion/training_programs.json','utf8')).programs.find((p:any)=>p.id==='prog_weight_gain_pt50'));
 assert.equal((await db.access(sql=>sql.prepare("SELECT count(*) n FROM local_documents WHERE collection LIKE 'gym_%'").get()))!.n,0);
}));
test('Meal request reports no assignment rather than selecting by goal or exposing calorie templates',()=>fixture(async(db,uids)=>{
 await importSourceMemory(db,root);const r=await new MemberSourceReader(db).answer(uids[0],'Meal plan PT giao cho toi la gi?','vi');assert(r!.missingFields.includes('assigned_meal_plan'));assert(!/2300|2700|1450|1600/.test(r!.text));
}));
test('Program sources are owner-scoped, preserve session identity and can be compared without calling them completed',()=>fixture(async(db,uids)=>{
 await importSourceMemory(db,root);const r=await new MemberSourceReader(db).answer(uids[0],'So sanh buoi 1 va 3 trong giao an nguon cua toi','vi');assert.match(r!.text,/initial:1/);assert.match(r!.text,/initial:3/);assert.match(r!.text,/Cable Row/);
 const other=await new MemberSourceReader(db).answer(uids[1],'So sanh buoi 1 va 3 trong giao an nguon cua toi','vi');assert(!other!.text.includes('Kettlebell Romanian Deadlift'));
}));
test('Missing and ambiguous session numbers are not silently corrected',()=>fixture(async(db,uids)=>{
 await importSourceMemory(db,root);const r=await new MemberSourceReader(db).answer(uids[0],'Doc lai buoi 29 trong giao an nguon cua toi','vi');assert(r!.missingFields.includes('session_reference'));
}));
test('Disabled source owner cannot be read and deleted import does not fall back to another person',()=>fixture(async(db,uids)=>{
 const reader=new MemberSourceReader(db);assert.equal((await reader.answer(uids[0],'Ho so cua toi','vi'))!.missingFields[0],'source_import_required');
 await importSourceMemory(db,root);await db.access(sql=>sql.prepare('UPDATE local_users SET disabled=1 WHERE uid=?').run(uids[0]));assert.equal(await reader.snapshot(uids[0]),null);
}));
test('Malformed or dangling source library rejects before writes',()=>fixture(async db=>{
 const dir=mkdtempSync(join(tmpdir(),'shine-bad-library-'));try{for(const file of ['data/companion/training_programs.json','data/nutrition/meal-plan-library.json','data/companion/the-shine-gym-assets.draft.json']){mkdirSync(join(dir,file,'..'),{recursive:true});cpSync(file,join(dir,file));}
 const file=join(dir,'data/companion/training_programs.json'),data=JSON.parse(readFileSync(file,'utf8'));data.exercises.push(data.exercises[0]);writeFileSync(file,JSON.stringify(data));await assert.rejects(importSourceMemory(db,dir),/duplicate/);
 assert.equal((await db.access(sql=>sql.prepare("SELECT count(*) n FROM local_documents WHERE collection='member_source_programs'").get()))!.n,0);
 }finally{rmSync(dir,{recursive:true,force:true});}
}));
for(const message of ['Ho so cua toi co ghi thuoc dang dung khong?','Trong ho so cua toi ghi benh ly nao?','Meal plan PT giao cho toi la gi?','So sanh buoi 24 va 27 trong giao an nguon cua toi'])test('Documentary reading is not a prescription: '+message,()=>assert.equal(routeBuddy(message,{...newBuddyMemory(),healthConcern:true}).task,'MEMBER_CONTEXT_QA'));
for(const message of ['Toi co nen tap Hanging Leg Raises theo giao an cu khong?','Vay tap chan 35 phut duoc khong?','Co the lam Leg Press 3 hiep luc nay khong?','Chon cho minh mot bai thay Hanging Leg Raises nhe.','Xem ho so, hom nay toi tap gi?','Dua vao ho so cua toi hay chinh lieu insulin'])test('Personal medical requests cannot become source reading: '+message,()=>assert.equal(routeBuddy(message,{...newBuddyMemory(),healthConcern:true}).task,'PROFESSIONAL_REVIEW'));
test('Real HTTP login reads imported medication status, profile and its own program; cross-session and unsigned reads blocked',()=>fixture(async(db,uids)=>{
 await importSourceMemory(db,root,facts);let base='';const app=createLocalApp({database:db,root,allowedOrigins:()=>[base]});const server=app.app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));base=`http://127.0.0.1:${(server.address() as any).port}`;
 const request=async(path:string,body:any,headers:any={})=>{const r=await fetch(base+path,{method:'POST',headers:{Origin:base,'Content-Type':'application/json','X-Local-Request':'1','X-Local-Context':'guest',...headers},body:JSON.stringify(body)});return {r,body:await r.json()};};
 try{const login=await request('/api/local/auth/login',{email:'qa.adult-a@example.invalid',password});assert.equal(login.r.status,200);
 const headers={Cookie:login.r.headers.get('set-cookie')!.split(';')[0],'X-CSRF-Token':login.body.csrf,'X-Local-Context':login.body.sessionVersion};
 const session=(await request('/api/local/buddy/sessions',{},headers)).body;
 const reply=await request('/api/local/buddy/chat',{conversationId:session.conversationId,requestId:randomUUID(),expectedRevision:0,lang:'vi',message:'Ho so cua toi co ghi thuoc dang dung khong?'},headers);
 assert.equal(reply.r.status,200);assert.equal(reply.body.task,'MEMBER_CONTEXT_QA');assert(reply.body.missingFields.includes('medications'));assert(reply.body.citations.every((c:any)=>c.scope==='own_record'));assert.equal(reply.body.timings.cacheHit,false);assert.equal(reply.body.timings.modelCalls,0);
 const forged=await request('/api/local/buddy/chat',{conversationId:session.conversationId,requestId:randomUUID(),expectedRevision:1,lang:'vi',message:'Ho so cua toi',uid:uids[1]},headers);assert.equal(forged.r.status,400);
 const noAuth=await request('/api/local/buddy/chat',{conversationId:session.conversationId,requestId:randomUUID(),expectedRevision:1,lang:'vi',message:'Ho so cua toi'});assert.equal(noAuth.r.status,404);
 }finally{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));}
}));

for(const message of [
 'Cho toi thuc hien Decline Kettlebell Press 5 x 12 voi tai 20 nhu buoi 27.',
 'Hay lay meal plan benh ly mau va cho toi an 1600-1800 calo moi ngay.',
 'Dua theo ho so hay len thuc don cho toi.',
 'Trong ho so co ghi thuoc, toi uong truoc hay sau tap?',
 'Xem giao an cua toi roi chon mot bai hom nay.'
])test('Read-plus-new-action never exposes a source prescription: '+message,()=>{
 assert.equal(routeBuddy(message,{...newBuddyMemory(),healthConcern:true}).task,'PROFESSIONAL_REVIEW');
});
test('Source follow-up keeps the field topic and releases it after a general concept',()=>{
 const first=routeBuddy('Trong ho so cua toi ghi benh ly nao?',newBuddyMemory());
 const next=routeBuddy('Con thuoc dang dung thi sao?',first.memory);
 assert.equal(next.task,'MEMBER_CONTEXT_QA');assert.equal(next.topic,'own_source:medications');
 assert.equal(routeBuddy('Con thuoc, toi nen uong bao nhieu?',first.memory).task,'PROFESSIONAL_REVIEW');
 assert.notEqual(routeBuddy('Protein la gi?',first.memory).memory.lastTopic,'own_source:health');
});
test('Negated disease does not override the requested protein definition',()=>{
 assert.equal(routeBuddy('Toi khong bi tieu duong, protein la gi?').task,'NUTRITION_EDUCATION');
});
import { BuddyKnowledge } from '../../server/src/buddy/knowledge';
for(const [message,topic] of [['Superset la gi?','superset'],['Lat Pulldown la gi?','lat_pulldown'],['Decline Kettlebell Press la gi?','decline_press'],['RPE la gi?','rpe']])test('New source-checked glossary does not open archives: '+message,()=>{
 const route=routeBuddy(message);assert.equal(route.task,'FITNESS_EDUCATION');assert.equal(route.topic,topic);
 const result=new BuddyKnowledge(root).education(topic,message,'vi');assert(result);assert.equal(result.citations[0].scope,'education');assert(result.citations[0].url?.startsWith('https://'));
 assert.equal(new BuddyKnowledge(root).education(topic,'Co nen tap bai nay cho toi hom nay?','vi'),null);
});
test('No-condition source remains self-reported, not a verified healthy status',()=>fixture(async(db,uids)=>{
 const data={schemaVersion:1 as const,cases:[{key:'adult-a',programId:'prog_weight_gain_pt50',fields:{medicalHistory:{raw:'0',status:'reported_none' as const,sourceRef:'Synthetic self-report, not clearance'}}}]};
 await importSourceMemory(db,root,data);
 const r=await new MemberSourceReader(db).answer(uids[0],'Trong ho so cua toi ghi benh ly nao?','vi');
 assert.match(r!.text,/0/);assert(r!.text.includes('ch\u01b0a ph\u1ea3i x\u00e1c minh y khoa'));
}));
test('Tampered source snapshot is rejected instead of silently using another profile',()=>fixture(async(db,uids)=>{
 await importSourceMemory(db,root,facts);await db.access(sql=>{const path=`member_source_memory/${uids[0]}`;const r=sql.prepare('SELECT body FROM local_documents WHERE path=?').get(path)!;const doc=JSON.parse(String(r.body));doc.sourceProfile.key='not-this-owner';sql.prepare('UPDATE local_documents SET body=? WHERE path=?').run(JSON.stringify(doc),path);});
 await assert.rejects(new MemberSourceReader(db).snapshot(uids[0]),/integrity mismatch/);
}));
test('Professional response context uses source facts and missing fields without approving a plan',()=>fixture(async(db,uids)=>{
 await importSourceMemory(db,root,facts);const r=await new MemberSourceReader(db).reviewContext(uids[0],'vi');assert.match(r!.text,/SYNTHETIC health note A/);assert(r!.missingFields.includes('medications'));assert(r!.missingFields.includes('medicalClearance'));
 assert(r!.citations.every(c=>c.scope==='own_record'));
}));

test('Medical service question is not answered by an unrelated facilities chunk',()=>{
 assert.equal(new BuddyKnowledge(root).business('Ben minh co nhan khach bi benh nen khong?','vi'),null);
});
test('A quoted unspecified diabetes concept gets a general definition, not a type-2 diagnosis',()=>{
 const message='Trong sach ghi "Toi bi tieu duong"; day la benh gi?';
 const route=routeBuddy(message);assert.equal(route.task,'HEALTH_EDUCATION');assert.equal(route.memory.healthConcern,false);
 const answer=new BuddyKnowledge(root).education(route.topic,message,'vi');assert(answer);assert.equal(answer.citations[0].id,'education:diabetes_general');
 assert.equal(new BuddyKnowledge(root).education(route.topic,'Toi co benh, nen uong thuoc nao?','vi'),null);
});
