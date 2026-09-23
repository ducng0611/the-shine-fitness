import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {buildPostureCorrectionAddition,validatePostureCorrectionProgram,parsePostureVolume,parsePostureLoad,parsePostureTempo,parsePostureRest,postureRows,POSTURE_PROGRAM_ID} from '../shared/postureCorrectionProgram';
import {mergeTrainingPrograms,validateTrainingPrograms} from '../shared/trainingPrograms';
import {parseFrontmatter,chunkDocument,programRagAllowed} from '../shared/ragDocument';
import {detectProgramSafety,normalizeSafetyText,HEALTH_RISK_KEYWORDS} from '../shared/programSafety';
import {detectAcutePostureWarning} from '../shared/postureSafety';
import {detectHandoverTrigger} from '../server/src/handoverRules';
import {fallbackKeywordClassifier} from '../server/src/intentClassifier';
const read=(path:string)=>JSON.parse(fs.readFileSync(path,'utf8'));
const lib=read('data/companion/training_programs.json');
const source=read('data/training-pathways/posture-correction/source-sessions.json');
const fp=read('tests/fixtures/posture-correction-baseline.json');
const p=lib.programs.find((p:any)=>p.id===POSTURE_PROGRAM_ID);
const rows=postureRows(p);
const row=(name:string)=>rows.find(r=>r.sourceExerciseName===name)!;
const hash=(x:unknown)=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const md=fs.readFileSync('data/knowledge/11_program_posture_correction.md','utf8');

test('Thư viện v5 giữ năm chương trình, mọi ID và tham chiếu hợp lệ',()=>{
 assert.equal(lib.version,5);
 assert.deepEqual(validateTrainingPrograms(lib),{programCount:5,exerciseCount:127,equipmentReferenceCount:48,referenceCount:216});
 assert.equal(rows.length,29);
});
test('Bốn chương trình trước và 104 metadata bài không bị sửa',()=>{
 assert.equal(Object.keys(fp.programHashes).length,4);assert.equal(Object.keys(fp.exerciseMetadataHashes).length,104);
 for(const [id,h] of Object.entries(fp.programHashes))assert.equal(hash(lib.programs.find((p:any)=>p.id===id)),h,id);
 for(const [id,h] of Object.entries(fp.exerciseMetadataHashes)){
  const {programUsage,...meta}=lib.exercises.find((e:any)=>e.id===id);
  assert.equal(hash(meta),h,id);
  assert.equal(hash(programUsage.filter((u:any)=>u.programId in fp.programHashes)),fp.usageHashes[id],id);
 }
 for(const [id,h] of Object.entries(fp.equipmentHashes))assert.equal(hash(lib.equipmentReferences.find((e:any)=>e.id===id)),h,id);
});
test('Bảo toàn 29 dòng, sáu cột và thứ tự khối gốc',()=>{
 assert.equal(hash(source),fp.sourceHash);
 for(const s of source.sessions){
  const t=p.referenceSessions.find((t:any)=>t.sourceId===s.sourceId);
  assert.deepEqual(Object.keys(t.blocks),s.blocks.map((b:any)=>b.key));
  for(const b of s.blocks)assert.deepEqual(t.blocks[b.key].map((r:any)=>[r.sourceExerciseName,r.sourceVolume,r.sourceLoad,r.sourceRest,r.sourceNote,r.sourceTempo]),b.rows);
 }
});
test('Chỉ có ba buổi chưa xác minh, không có ngày hoặc kết quả giả',()=>{
 assert.deepEqual(p.referenceSessions.map((s:any)=>s.sessionNumber),[1,2,3]);
 assert(p.referenceSessions.every((s:any)=>s.sourceDate===null&&s.completionConfirmed===false&&s.eligibleForPlanner===false));
 assert(p.progressTracking.every((m:any)=>m.baseline===null&&m.outcome===null));
 assert.equal(p.targetProfile.diagnosedUpperCrossedSyndrome,null);
 assert.equal(p.targetProfile.diagnosedLowerCrossedSyndrome,null);
});
test('Nhãn thời gian khối không phải thời lượng thực tế hoặc ngân sách đã đủ',()=>{
 assert.deepEqual(p.referenceSessions.map((s:any)=>s.allocatedMinutes),[55,55,45]);
 assert(p.referenceSessions.every((s:any)=>s.timeBudgetValidated===false&&s.estimatedActualMinutes===null));
 assert(p.referenceSessions.every((s:any)=>s.blockTimings.every((b:any)=>b.measuredMinutes===null)));
});
test('Nhịp và giữ đỉnh được tách khỏi số lần và thời gian toàn hiệp',()=>{
 assert.equal(row('Chin Tucks').holdAtPeakSeconds,3);
 assert.equal(row('Clamshell with Mini-band').holdAtPeakSeconds,1);
 assert.equal(row('Glute Bridge with Band').holdAtPeakSeconds,2);
 assert.deepEqual(row('Cat-Cow kết hợp thở cơ hoành (Diaphragmatic Breathing)').tempo.phaseSeconds,[3,1,3]);
 assert.deepEqual(row('Romanian Deadlift với Dumbbell').tempo.phaseSeconds,[3,0,1]);
 assert.equal(row('Chin Tucks').volume.holdSeconds,null);
 assert.equal(row('Romanian Deadlift với Dumbbell').tempo.phaseNames,null);
});
test('Tải cáp ghi rõ kg không bị áp quy ước mức máy của nguồn khác',()=>{
 assert.equal(row('Seated Cable Row').load.raw,'15 kg');
 assert.equal(row('Seated Cable Row').load.unit,'kg');
 assert.equal(row('Half-Kneeling Cable Pallof Press').load.value,7.5);
 assert.equal(row('Standing Cable Face Pull with External Rotation').load.value,10);
 const metabolic=lib.programs.find((p:any)=>p.id==='prog_fatloss_metabolic_pt255');
 const machine=metabolic.referenceSessions[1].blocks.RESISTANCE.find((r:any)=>r.sourceExerciseName==='Lat Pulldown');
 assert.equal(machine.load.unit,null);
});
test('Hai tạ đơn giữ số dụng cụ và cách ghi, không tự cộng thành tổng tải',()=>{
 for(const name of ['Romanian Deadlift với Dumbbell',"Dumbbell Farmer's Walk"]){
  const r=row(name);assert.equal(r.load.implementCount,2);assert.equal(r.load.unit,'kg');assert.equal(r.load.totalLoadKg,null);
  assert.equal(r.load.measurementScope,'per_implement_reading_requires_confirmation');
 }
 assert.equal(row('Romanian Deadlift với Dumbbell').load.value,6);
 assert.equal(row("Dumbbell Farmer's Walk").load.value,8);
});
test('Farmer Walk tính mét, thở tính phút, không biến thành giữ hơi',()=>{
 const walk=row("Dumbbell Farmer's Walk").volume;
 assert.equal(walk.distanceMeters,30);assert.equal(walk.sets,3);assert.equal(walk.holdSeconds,null);
 const breathing=row('Thở cơ hoành tư thế 90/90 gác chân lên ghế').volume;
 assert.equal(breathing.durationSeconds,300);assert.equal(breathing.holdSeconds,null);assert.equal(breathing.repetitions,null);
});
test('Y-T-W và các vùng lăn cùng một dòng không nhân volume',()=>{
 assert.equal(row('Prone Y-T-W Raises').volume.repetitions,10);
 assert.equal(row('Prone Y-T-W Raises').load.kind,'no_external_weight_as_supplied');
 assert.equal(row('Foam rolling dải chậu chày (IT Band) và cơ đùi trước (Quadriceps)').volume.sets,2);
 assert.equal(row('Foam rolling toàn bộ lưng và bắp chân (Gastrocnemius/Soleus)').volume.holdSeconds,45);
});
test('Mỗi bên chỉ tồn tại khi nguồn ghi, tải/nghỉ trống vẫn null',()=>{
 assert.equal(row('Levator Scapulae Stretch').volume.perSide,true);
 assert.equal(row('Doorway Chest Stretch').volume.perSide,false);
 assert.equal(row('Doorway Chest Stretch').restSeconds,null);
 assert.equal(row('Doorway Chest Stretch').load.value,null);
 assert.equal(row('Chin Tucks').load.raw,null);
});
test('Treadmill độ dốc 0 không thành tốc độ 0 hoặc phần trăm tự suy',()=>{
 const t=row('Đi bộ thả lỏng TM');
 assert.equal(t.volume.durationSeconds,300);
 assert.deepEqual(t.treadmill,{inclineRaw:'0',inclineValue:0,inclineUnit:null,speedValue:null,speedUnit:null});
});
test('Đúng tám ID yêu cầu và 15 định nghĩa bổ sung để không bỏ hoạt động',()=>{
 const requested=['ex_chin_tuck','ex_banded_wall_slide','ex_prone_ytw_raise','ex_standing_cable_face_pull','ex_clamshell_band','ex_glute_bridge_band','ex_farmers_walk','ex_quadruped_tspine_rotation'];
 const added=lib.exercises.filter((e:any)=>!(e.id in fp.exerciseMetadataHashes));
 assert.equal(added.length,23);
 for(const id of requested)assert(added.some((e:any)=>e.id===id),id);
 for(const e of added){assert.equal(e.verified,false);assert.equal(e.sourceInstructionsVerified,false);assert.deepEqual(e.trainerCues,[]);}
});
test('Tái dùng sáu ID phù hợp nhưng biến thể mới không gộp tùy tiện',()=>{
 const reused=[...new Set(rows.map(r=>r.exerciseId).filter(id=>id in fp.exerciseMetadataHashes))];
 assert.equal(reused.length,6);
 assert.equal(row('Bird-Dog').exerciseId,'ex_bird_dog');
 assert.equal(row('Romanian Deadlift với Dumbbell').exerciseId,'ex_db_romanian_deadlift');
 assert.equal(row('Seated Cable Row').exerciseId,'ex_cable_row');
 assert.notEqual(row('Standing Cable Face Pull with External Rotation').exerciseId,'ex_face_pull');
 assert.notEqual(row('Deadbug với bóng tập').exerciseId,'ex_dead_bug');
 assert.notEqual(row('Glute Bridge with Band').exerciseId,'ex_glute_bridge');
});
test('Nguồn bài mới chỉ có hướng dẫn đã ghi, không tạo đích cơ hoặc giấy duyệt',()=>{
 const mappings=new Map(source.exerciseMappings.map((m:any)=>[m.exerciseId,m]));
 for(const e of lib.exercises.filter((e:any)=>!(e.id in fp.exerciseMetadataHashes))){
  const m:any=mappings.get(e.id);
  assert.deepEqual(e.instructions,m.sourceInstructions.map((x:string)=>`Ghi nhận nguồn, chưa duyệt kỹ thuật: ${x}`));
  assert.deepEqual(e.targetMuscles,[]);assert.equal(e.difficulty,'unassessed');
  assert.equal(e.contraindicationsStatus,'review_notes_not_diagnosis');
 }
});
test('Thiết bị mới chỉ là tham chiếu chưa xác minh, không tự tạo assets phòng tập',()=>{
 const added=lib.equipmentReferences.filter((e:any)=>!(e.id in fp.equipmentHashes));
 assert.equal(added.length,6);
 assert(added.every((e:any)=>e.verified===false));
});
test('Ghép lại cùng nguồn idempotent, thay chương trình cùng ID báo conflict',()=>{
 const addition=buildPostureCorrectionAddition(source,lib);
 assert.deepEqual(mergeTrainingPrograms(lib,addition),lib);
 const changed=structuredClone(addition);changed.programs[0].name+=' khác';
 assert.throws(()=>mergeTrainingPrograms(lib,changed),/Xung đột/);
});
test('Khung NASM và ba giai đoạn không tự thành chẩn đoán hoặc 36 giáo án',()=>{
 assert.deepEqual(p.methodFramework.stages.map((s:any)=>s.id),['INHIBIT','LENGTHEN','ACTIVATE','INTEGRATE']);
 assert.equal(p.methodFramework.modelIsDiagnosis,false);
 assert.deepEqual(p.phases.map((s:any)=>s.sessionRange),['1-12','13-24','25-36']);
 assert(p.phases.every((s:any)=>s.eligibleForPlanner===false));
 assert.equal(p.targetProfile.recommendedFrequencyPerWeek,null);
});
test('Metadata, chunk, ngôn ngữ và chặn RAG lịch sử đúng hợp đồng',()=>{
 const {metadata,body}=parseFrontmatter(md),chunks=chunkDocument(body);
 assert.equal(metadata.id,'kb-program-posture-correction-001');
 assert.equal(metadata.category,'PROGRAM');assert.equal(metadata.review_status,'needs_review');
 assert(chunks.length>20&&chunks.every(c=>c.length>=200&&c.length<=1500));
 assert(!/\u2014|\p{Extended_Pictographic}/u.test(md));
 assert.equal(programRagAllowed(metadata),false);
 assert.equal(programRagAllowed({...metadata,review_status:'verified',content_scope:'public_overview'}),false);
});
test('Bản công khai không đưa số đo riêng hoặc nghề nghiệp kèm tuổi vào hồ sơ',()=>{
 for(const text of [md,JSON.stringify(source),JSON.stringify(p)]){
  assert(!/174\s*cm|68\s*kg|22\.5|29 tuổi|29\s*tuổi/.test(text));
  assert(!/mailto:|@gmail\.com|số hợp đồng|chữ ký của/i.test(text));
 }
});
test('Tài liệu không công bố đã đo cải thiện hoặc đã duyệt y khoa',()=>{
 assert.equal(p.sourceClinicalClaimsVerified,false);assert.equal(p.scientificBasis.painCauseEstablished,false);
 assert(md.includes('chưa')&&md.includes('nguồn'));
 assert.equal(p.aiRecommendable,false);
});
for(const phrase of ['thoát vị đĩa đệm','tê bì chân tay','đau thần kinh tọa','trượt đốt sống','vẹo cột sống','viêm cột sống dính khớp','đau lan xuống chân','đau mỏi thắt lưng','tê ngón chân','đau cổ']){
 for(const text of [phrase,normalizeSafetyText(phrase)])test(`Chuyển giao đúng từ khóa: ${text}`,()=>{
  const d=detectProgramSafety(text);
  assert.equal(d?.tag,'HEALTH_RISK');assert(d!.replyText.includes('đánh giá'));
  assert(!/\b3 x 12\b|15 kg|Foam rolling/.test(d!.replyText));
  assert(HEALTH_RISK_KEYWORDS.includes(text));
 });
}
for(const text of ['Tôi được chẩn đoán L4-L5','C5-C6 nên tập gì','Tôi bị tê bì bàn tay và đau cổ','spondylolisthesis exercise','sciatica'])test(`Bệnh lý/tê bì không nhận bài từ thư viện: ${text}`,()=>{
 assert.equal(detectProgramSafety(text)?.tag,'HEALTH_RISK');
});
for(const text of ['Tôi đau lưng và bí tiểu','Tê vùng yên ngựa','Đau thần kinh tọa kèm mất kiểm soát đại tiện','Hai chân của tôi: yếu cả hai chân ngày càng nặng hơn','Back pain and urinary retention'])test(`Dấu hiệu nguy cấp không chờ hàng đợi tư vấn: ${text}`,()=>{
 const d=detectProgramSafety(text);assert.equal(d?.tag,'HEALTH_RISK');
 assert(/cấp cứu ngay/.test(d!.replyText));assert(d!.replyText.includes('chưa gọi'));
});
test('Cảnh báo cấp tính chỉ xét lời hiện tại, không từ câu bot hoặc lịch sử',()=>{
 assert.equal(detectAcutePostureWarning(normalizeSafetyText('Tôi không tê vùng yên ngựa')),false);
 assert.equal(detectProgramSafety('Tôi muốn xem lịch',{bad:true} as any),null);
 const d=detectProgramSafety('Tôi muốn xem lịch',[{role:'model',text:'Tê vùng yên ngựa'}]);
 assert.equal(d,null);
 const prior=detectProgramSafety('Bây giờ cho tôi xem giá',[{role:'user',text:'Tôi đau lưng và bí tiểu'}]);
 assert.equal(prior?.tag,'HEALTH_RISK');assert(!prior!.replyText.includes('cấp cứu ngay'));
});
test('Lời tự khai bệnh trước đó vẫn cần chuyển giao, không lấy chẩn đoán từ bot',()=>{
 const d=detectProgramSafety('Tôi nên tập gì?',[{role:'user',text:'Tôi bị trượt đốt sống'}]);
 assert.equal(d?.tag,'HEALTH_RISK');
 assert.equal(detectProgramSafety('Tôi muốn tập',[{role:'model',text:'Bạn bị trượt đốt sống'}]),null);
});
for(const text of ['chỉnh sửa tư thế','chinh sua tu the','cổ rùa','rụt vai','ngồi nhiều','tư thế','desk worker mobility'])test(`Nhu cầu tư thế không có triệu chứng không tự thành bệnh: ${text}`,()=>{
 assert.equal(detectProgramSafety(text),null);
 const r=fallbackKeywordClassifier(text);assert.equal(r.intent,'PROGRAM');
 assert(r.slots.goal?.includes('Tư thế'));
});
for(const text of ['Giá gói chỉnh sửa tư thế','gói tập cho dân văn phòng bao nhiêu tiền','giá giáo án tư thế'])test(`PRICE vẫn trước PROGRAM: ${text}`,()=>{
 assert.equal(fallbackKeywordClassifier(text).intent,'PRICE');
});
test('Không nhầm lộ trình người lớn với chiều cao thiếu niên hoặc tăng cân',()=>{
 assert(fallbackKeywordClassifier('cổ rùa').slots.goal?.includes('Tư thế'));
 assert(fallbackKeywordClassifier('tăng chiều cao').slots.goal?.toLowerCase().includes('chiều cao'));
 assert.notEqual(fallbackKeywordClassifier('tăng cân').slots.goal,fallbackKeywordClassifier('cổ rùa').slots.goal);
 const d=detectProgramSafety('Em 12 tuổi bị cổ rùa');
 assert.equal(d?.tag,'HEALTH_RISK');assert.equal(d?.audience,'minor');
});
const mutations:Record<string,(p:any)=>void>={
 'mở planner':p=>p.eligibleForPlanner=true,
 'mở RAG':p=>p.ragRetrievalAllowed=true,
 'xác minh nguồn':p=>p.verified=true,
 'cấp bài tự động':p=>p.aiRecommendable=true,
 'xác nhận chẩn đoán':p=>p.targetProfile.diagnosedUpperCrossedSyndrome=true,
 'nghề nghiệp xác nhận bệnh':p=>p.scientificBasis.painCauseEstablished=true,
 'biến lịch nguồn thành khuyến nghị':p=>p.targetProfile.recommendedFrequencyPerWeek=3,
 'xác nhận NASM là chẩn đoán':p=>p.methodFramework.modelIsDiagnosis=true,
 'đặt kết quả cải thiện':p=>p.progressTracking[0].outcome='hết đau',
 'điền ngày buổi':p=>p.referenceSessions[0].sourceDate='2026-09-22',
 'lưu buổi thành hoàn thành':p=>p.referenceSessions[0].completionConfirmed=true,
 'thêm buổi nguồn':p=>p.referenceSessions.push(structuredClone(p.referenceSessions[0])),
 'đổi khóa buổi':p=>p.referenceSessions[0].sessionKey='initial:2',
 'xác nhận đủ thời gian':p=>p.referenceSessions[0].timeBudgetValidated=true,
 'điền thời gian thực tế':p=>p.referenceSessions[0].estimatedActualMinutes=55,
 'sửa tổng thời lượng':p=>p.referenceSessions[0].allocatedMinutes=60,
 'thêm nghỉ':p=>p.referenceSessions[0].blocks.WARM_UP_SMR[0].restSeconds=60,
 'bỏ dòng nguồn':p=>p.referenceSessions[0].blocks.WARM_UP_SMR.pop(),
 'đổi mỗi bên':p=>p.referenceSessions[0].blocks.WARM_UP_SMR[1].volume.perSide=false,
 'tự thêm kg':p=>p.referenceSessions[0].blocks.WARM_UP_SMR[0].load.unit='kg',
 'nhân YTW thành 30 lần':p=>p.referenceSessions[0].blocks.MOBILITY_ACTIVATE[2].volume.repetitions=30,
 'giữ đỉnh thành toàn hiệp':p=>p.referenceSessions[0].blocks.MOBILITY_ACTIVATE[1].volume.holdSeconds=3,
 'tổng hai tạ':p=>p.referenceSessions[1].blocks.CORRECTIVE_STRENGTH_INTEGRATION[1].load.totalLoadKg=12,
 'quãng đường thành giây':p=>p.referenceSessions[2].blocks.CORRECTIVE_RESISTANCE_FUNCTIONAL[2].volume.holdSeconds=30,
 'gán tên pha tempo':p=>p.referenceSessions[1].blocks.CORRECTIVE_STRENGTH_INTEGRATION[1].tempo.phaseNames=['hạ','dừng','nâng'],
 'gán tốc độ treadmill':p=>p.referenceSessions[0].blocks.COOL_DOWN[2].treadmill.speedValue=4,
 'gán phần trăm độ dốc':p=>p.referenceSessions[0].blocks.COOL_DOWN[2].treadmill.inclineUnit='%',
};
for(const [name,mutate] of Object.entries(mutations))test(`Validator chặn sai lệch: ${name}`,()=>{
 const x=structuredClone(p);mutate(x);assert.throws(()=>validatePostureCorrectionProgram(x));
});
test('Bài và thiết bị không định nghĩa hoặc ID trùng đều bị chặn',()=>{
 const a=structuredClone(lib);a.exercises.push(a.exercises[0]);assert.throws(()=>validateTrainingPrograms(a));
 const b=structuredClone(lib);b.programs.find((x:any)=>x.id===POSTURE_PROGRAM_ID).referenceSessions[0].blocks.WARM_UP_SMR[0].exerciseId='ex_no_such_exercise';assert.throws(()=>validateTrainingPrograms(b));
});
test('Các parser không tự diễn giải dữ liệu ngoài hợp đồng',()=>{
 assert.throws(()=>parsePostureLoad('15'));
 assert.throws(()=>parsePostureVolume('khoảng 20'));
 assert.throws(()=>parsePostureRest('60'));
 assert.throws(()=>parsePostureTempo('chậm'));
});
for(const text of [
 'Em bị tiểu đường type 2, muốn giảm mỡ thì tập gì?',
 'Anh bị cao huyết áp có tập tạ được không?',
 'Nên uống thuốc tiểu đường trước hay sau khi tập?',
 'Đường huyết bao nhiêu thì không nên tập?',
 'Bên mình có nhận khách bị bệnh nền không?'
])test(`Hồi quy chuyển hóa giữ HEALTH_RISK: ${text}`,()=>{
 const d=detectProgramSafety(text);assert.equal(d?.tag,'HEALTH_RISK');
 assert(!/3 x 12|Decline|Bench Press|35 mg/.test(d!.replyText));
});
