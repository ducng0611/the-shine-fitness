
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {buildWeightGainAddition,validateWeightGainProgram,weightGainRows} from '../shared/weightGainProgram';
import {mergeTrainingPrograms,validateTrainingPrograms,referenceRows} from '../shared/trainingPrograms';
import {parseFrontmatter,chunkDocument,programRagAllowed} from '../shared/ragDocument';
import {detectProgramSafety,HEALTH_RISK_KEYWORDS,normalizeSafetyText} from '../shared/programSafety';
import {detectHandoverTrigger} from '../server/src/handoverRules';
import {fallbackKeywordClassifier,classify} from '../server/src/intentClassifier';
import {parseTrainingIntent} from '../server/src/companion/training/intent';
const lib=JSON.parse(fs.readFileSync('data/companion/training_programs.json','utf8'));
const source=JSON.parse(fs.readFileSync('data/training-pathways/weight-gain/source-sessions.json','utf8'));
const claims=JSON.parse(fs.readFileSync('data/training-pathways/weight-gain/scientific-claims.review.json','utf8'));
const fingerprints=JSON.parse(fs.readFileSync('tests/fixtures/weight-gain-baseline.json','utf8'));
const markdown=fs.readFileSync('data/knowledge/07_program_weight_gain.md','utf8');
const p=lib.programs.find((x:any)=>x.id==='prog_weight_gain_pt50');
const flex=lib.programs.find((x:any)=>x.id==='prog_fitness_flexibility_pt30');
const hash=(x:unknown)=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const copy=()=>structuredClone(p);
const row=(n:number,name:string)=>weightGainRows(p).find((r:any)=>r.sourceSection===`A${n===12?6:n===13?7:n+2}`&&r.sourceExerciseName===name)!;

for(const word of ['thuốc tăng cân','chán ăn','sụt cân','rối loạn ăn uống','bệnh tiêu hóa','nội tiết','đĩa đệm','thoát vị',
  'sữa tăng cân','mass gainer','whey','creatine','thực phẩm chức năng','tiểu đường','bệnh thận','tuyến giáp']) {
  for(const term of new Set([word,normalizeSafetyText(word)]))test(`Chuyển giao an toàn: ${term}`,()=>{
    assert(HEALTH_RISK_KEYWORDS.includes(term));
    assert.equal(detectHandoverTrigger(`Tôi muốn tăng cân, có ${term}`).tag,'HEALTH_RISK');
    assert.equal(parseTrainingIntent(`Tôi muốn tăng cân, có ${term}`).intent,'safety');
  });
}
for(const text of ['Sụt cân không rõ nguyên nhân','Tôi chán ăn kéo dài','unexplained weight loss','loss of appetite','weight gain pills'])
 test(`Không đưa kế hoạch tự động cho tín hiệu: ${text}`,()=>assert.equal(detectProgramSafety(text)?.tag,'HEALTH_RISK'));
test('Lịch sử sức khỏe người dùng vẫn có hiệu lực, không lấy triệu chứng từ lời bot',()=>{
 assert.equal(detectHandoverTrigger('Giá gói tăng cân',[{role:'user',text:'Tôi sụt cân không rõ nguyên nhân'}]).tag,'HEALTH_RISK');
 assert.equal(detectProgramSafety('Tôi muốn tăng cân',[{role:'assistant',text:'Ví dụ sụt cân'}]),null);
});
test('Giữ nguyên giới hạn người dưới 18 và phụ huynh',()=>{
 assert.equal(detectProgramSafety('Em 16 tuổi muốn tăng cân')?.audience,'minor');
 assert.equal(detectProgramSafety('Con tôi muốn tăng cân')?.audience,'parent');
 assert.equal(detectProgramSafety('Tôi 21 tuổi muốn tăng cân'),null);
});
for(const text of ['tăng cân','tang can','tăng cơ','tang co','người gầy','nguoi gay','khó tăng cân','kho tang can','lộ trình','giáo án','tập bao lâu','lean bulk'])
 test(`Phân loại PROGRAM: ${text}`,()=>assert.equal(fallbackKeywordClassifier(text).intent,'PROGRAM'));
for(const text of ['Giá gói tăng cân','goi tang co bao nhieu tien','Giá giáo án tăng cân'])
 test(`Giữ ưu tiên PRICE: ${text}`,()=>assert.equal(fallbackKeywordClassifier(text).intent,'PRICE'));
test('Mục tiêu không bị gán nhầm giữa tăng cân, tăng cơ và thể lực',()=>{
 assert.equal(fallbackKeywordClassifier('tăng cân').slots.goal,'Tăng cân');
 assert.equal(fallbackKeywordClassifier('tăng cơ').slots.goal,'Tăng cơ');
 assert.equal(fallbackKeywordClassifier('tăng thể lực').slots.goal,'Tăng thể lực và linh hoạt');
 assert.equal(fallbackKeywordClassifier('tăng cân và linh hoạt').slots.goal,null);
 assert.equal(fallbackKeywordClassifier('không muốn tăng cân').slots.goal,null);
});
test('Giáo án không phải giá và intent không gọi model khi đã có quy tắc',async()=>{
 let calls=0;const ai={models:{generateContent:async()=>{calls++;throw Error('Không được gọi');}}};
 assert.equal((await classify('Tư vấn giáo án tăng cân',[],ai as any)).intent,'PROGRAM');assert.equal(calls,0);
});

test('Hai chương trình cũ còn nguyên trong thư viện mở rộng và mọi tham chiếu hợp lệ',()=>{
 validateTrainingPrograms(lib);
 const originalPrograms=lib.programs.filter((x:any)=>['prog_weight_gain_pt50','prog_fitness_flexibility_pt30'].includes(x.id));
 const originalExercises=lib.exercises.filter((x:any)=>x.programUsage.some((u:any)=>originalPrograms.some((p:any)=>p.id===u.programId)))
  .map((x:any)=>({...x,programUsage:x.programUsage.filter((u:any)=>originalPrograms.some((p:any)=>p.id===u.programId))}));
 const oldIds=new Set(originalExercises.flatMap((x:any)=>x.requiredEquipmentIds));
 const result=validateTrainingPrograms({...lib,programs:originalPrograms,exercises:originalExercises,equipmentReferences:lib.equipmentReferences.filter((x:any)=>oldIds.has(x.id))});
 assert.deepEqual(result,{programCount:2,exerciseCount:51,equipmentReferenceCount:22,referenceCount:98});
 assert(lib.version>=2);assert.equal(p.referenceSessions.length,5);
 assert.deepEqual(p.referenceSessions.map((s:any)=>s.sessionNumber),[1,2,3,12,13]);
});
test('Không sửa bất kỳ nội dung chương trình thể lực cũ',()=>{
 assert.equal(hash(flex),fingerprints.programSha256);
 for(const entry of fingerprints.exercises) {
   const ex=lib.exercises.find((x:any)=>x.id===entry.id), {programUsage,...metadata}=ex;
   assert.equal(hash(metadata),entry.metadataSha256,entry.id);
   assert.equal(hash(programUsage.filter((u:any)=>u.programId===flex.id)),entry.originalUsageSha256,entry.id);
 }
 for(const [id,expected] of Object.entries(fingerprints.equipmentSha256))
   assert.equal(hash(lib.equipmentReferences.find((e:any)=>e.id===id)),expected,id);
});
test('Bản chép đủ đúng 51 dòng, giữ năm cột nguồn với dấu kiểm độc lập',()=>{
 assert.equal(hash(source.sessions.map((s:any)=>[s.sessionNumber,s.rows])),fingerprints.sourceRowsSha256);
 assert.equal(weightGainRows(p).length,51);
 assert.deepEqual(p.referenceSessions.map((s:any)=>Object.values(s.blocks).flat().length),[10,11,10,10,10]);
});
test('Mỗi ô và thứ tự chuyển đổi khớp nguồn, không bỏ ô trống',()=>{
 for(const src of source.sessions) {
   const session=p.referenceSessions.find((s:any)=>s.sessionNumber===src.sessionNumber);
   const actual=Object.entries(session.blocks).flatMap(([block,rows])=>(rows as any[]).map(r=>[block,r.sourceExerciseName,r.volume.raw,r.load.raw,r.restRaw]));
   assert.deepEqual(actual,src.rows);
 }
});
test('Không tự biến đơn vị máy thành kg hoặc bw thành khối lượng người',()=>{
 assert.equal(row(3,'c. Cable Row').load.value,15);
 assert.equal(row(12,'b1. Cable Row').load.value,12.5);
 assert.equal(row(12,'b1. Cable Row').load.unit,null);
 assert.equal(row(13,'c1. Lat Pulldown').load.kind,'machine_marker_as_supplied');
 assert.equal(row(1,'Plank').load.value,null);
 assert.equal(row(1,'Plank').load.kind,'bodyweight');
});
test('Tải tạ đơn/ấm chỉ có kg khi nguồn xác định loại dụng cụ',()=>{
 assert.equal(row(3,'a. Kettlebell Romanian Deadlift').load.unit,'kg');
 assert.equal(row(13,'a1. Dumbbell Sumo Deadlift').load.value,17.5);
 assert.equal(row(13,'a1. Dumbbell Sumo Deadlift').load.unit,'kg');
 assert.equal(row(2,'4. Rear Delt Fly').load.unit,null);
 assert.equal(row(12,'c1. Hip Thrust').load.unit,null);
 assert.equal(row(13,'b1. Standing OH Shoulder Press').load.unit,null);
});
test('Số mờ Hip Abduction chỉ là ứng viên, không phải tải đã chắc',()=>{
 const r=row(12,'a2. Hip Abduction');
 assert.equal(r.load.raw,'26 (chữ mờ, cần HLV xác nhận)');
 assert.equal(r.load.candidateValue,26);assert.equal(r.load.value,null);
 assert.equal(r.load.certainty,'uncertain');assert.equal(r.load.reviewStatus,'needs_review');
});
test('Bảy cặp đầy đủ và một d1 chưa đủ; nghỉ sau cặp, không nhân đôi thời gian nghỉ',()=>{
 const ss=p.referenceSessions.flatMap((s:any)=>s.supersets);
 assert.equal(ss.filter((g:any)=>g.status==='pair_as_reported').length,7);
 assert.equal(ss.filter((g:any)=>g.status==='incomplete_source_group').length,1);
 const b=p.referenceSessions[3].supersets.find((g:any)=>g.group==='b');
 assert.equal(b.restAfterGroupSeconds,80);assert.equal(b.restPosition,'after_group');
 assert.equal(row(12,'b2. Straight Arm Pushdown').restSeconds,null);
 assert.equal(row(12,'b2. Straight Arm Pushdown').volume.sets,null);
});
test('Nhãn a,b,c buổi 3 không trở thành cặp liên hoàn',()=>{
 assert.equal(p.referenceSessions[2].supersets.length,0);
 assert(p.referenceSessions[2].blocks.RESISTANCE.every((r:any)=>r.supersetGroup===null));
});
test('Buổi 12 vẫn là 12 trong phần chuyển tiếp và không tự thêm ngày hoặc buổi',()=>{
 assert.equal(p.referenceSessions[3].phaseId,'phase_wg_02_transition');
 assert.equal(p.referenceSessions[3].sessionNumber,12);
 assert.equal(p.phases.find((x:any)=>x.id==='phase_wg_02_transition').sessionRange,'13-26');
 assert(p.referenceSessions.every((s:any)=>!('date' in s)));
});
test('Không kế thừa thời gian khởi động hoặc đơn vị tốc độ treadmill',()=>{
 assert.equal(p.referenceSessions[4].blocks.WARM_UP[0].durationSeconds,null);
 assert.equal(p.referenceSessions[0].blocks.COOL_DOWN[0].durationSeconds,600);
 assert.equal(p.referenceSessions[2].blocks.COOL_DOWN[0].durationSeconds,900);
 assert.equal(p.referenceSessions[2].blocks.COOL_DOWN[0].treadmillSpeed.unit,null);
});
test('ID trùng không được tạo; Side Kick chỉ là liên kết đề xuất và DB/KB khác nhau',()=>{
 assert.equal(new Set(lib.exercises.map((e:any)=>e.id)).size,lib.exercises.length);
 assert.equal(row(12,'a1. Side Kick').exerciseId,'ex_side_band_kick');
 assert.equal(row(12,'a1. Side Kick').mappingStatus,'proposed_alias_needs_review');
 assert(!lib.exercises.find((e:any)=>e.id==='ex_side_band_kick').aliases.includes('side kick'));
 assert.notEqual(row(3,'a. Kettlebell Romanian Deadlift').exerciseId,row(13,'b2. DB Romanian Deadlift').exerciseId);
 assert.equal(row(12,'c2. Standing OH SD').exerciseId,'ex_standing_overhead_shoulder_press');
 assert(!lib.exercises.some((e:any)=>e.id==='ex_standing_overhead_press'));
});
test('Các định nghĩa mới của nguồn tăng cân không tự tạo hướng dẫn chuyên môn',()=>{
 const ids=new Set(fingerprints.exercises.map((e:any)=>e.id));
 const added=lib.exercises.filter((e:any)=>!ids.has(e.id)&&e.programUsage.some((u:any)=>u.programId===p.id));
 // Kiểm tra đúng 20 bài được bổ sung bởi nguồn tăng cân, không áp ngược
 // yêu cầu instructions rỗng lên phần ghi nhận nguyên văn của nguồn khác.
 assert.equal(added.length,20);
 for(const e of added) {
  assert.equal(e.verified,false);assert.equal(e.reviewStatus,'needs_review');
  assert.deepEqual(e.instructions,[]);assert.deepEqual(e.trainerCues,[]);assert.deepEqual(e.contraindications,[]);
 }
});
test('Ghép lại cùng nguồn không tăng version, không nhân đôi usage',()=>{
 const addition=buildWeightGainAddition(source,lib);
 const merged=mergeTrainingPrograms(lib,addition);
 assert.deepEqual(merged,lib);assert.equal(merged.version,lib.version);
});
test('Tổng quan chưa duyệt không được index hoặc coi là giáo án có quyền áp dụng',()=>{
 const parsed=parseFrontmatter(markdown);
 assert.equal(programRagAllowed(parsed.metadata),false);
 assert.equal(p.eligibleForPlanner,false);assert.equal(p.ragRetrievalAllowed,false);
 assert(weightGainRows(p).every(r=>!r.eligibleForPlanner&&!r.verified));
});
test('Markdown đủ metadata, chunk 200-1500, không emoji hoặc gạch ngang dài',()=>{
 const {metadata,body}=parseFrontmatter(markdown),chunks=chunkDocument(body);
 assert.equal(metadata.id,'kb-program-weightgain-001');assert.equal(metadata.category,'PROGRAM');
 assert(metadata.expiry_date>new Date().toISOString().slice(0,10));
 assert.equal(chunks.length,45);assert(chunks.every(c=>c.length>=200&&c.length<=1500));
 assert(!markdown.includes('\u2014'));assert(!/\p{Extended_Pictographic}/u.test(markdown));
});
test('Tham số yêu cầu không được biến thành hướng dẫn cá nhân hoặc số liệu nguồn',()=>{
 assert.equal(claims.mayDriveRecommendations,false);assert.equal(claims.claims.length,14);
 assert(claims.claims.every((x:any)=>x.applicationStatus==='not_approved'));
 assert.equal(p.scientificPrinciples.calorieSurplusKcalPerDay,null);
 assert.equal(p.scientificPrinciples.proteinGramPerKgBodyweight,null);
 assert.equal(p.targetProfile.bmiRange,null);
 assert.equal(p.targetProfile.estimatedDurationWeeks,null);
 assert(p.sourceIssues.some((x:any)=>x.id==='wg_cable_row_comparison'));
});
test('Chương trình không chứa chỉ số kết quả hoặc hồ sơ cá nhân',()=>{
 const keys=(v:any):string[]=>Array.isArray(v)?v.flatMap(keys):v&&typeof v==='object'?Object.entries(v).flatMap(([k,x])=>[k,...keys(x)]):[];
 const forbidden=['fullName','phone','email','birthDate','birthYear','address','signature','heightCm','weightKg','bodyMeasurements','date','recordDate'];
 for(const k of forbidden)assert(!keys(p).includes(k),k);
 assert(p.referenceSessions.every((s:any)=>s.completionConfirmed===false));
});

const badCases:[string,(x:any)=>void][]=[
 ['tự xác minh chương trình',x=>{x.verified=true;}],
 ['mở planner',x=>{x.eligibleForPlanner=true;}],
 ['mở RAG',x=>{x.ragRetrievalAllowed=true;}],
 ['đổi tuổi tối thiểu',x=>{x.targetProfile.minimumAgeForAutomatedAssessment=12;}],
 ['tự đặt kcal',x=>{x.scientificPrinciples.calorieSurplusKcalPerDay='250-500';}],
 ['ghi thành buổi hoàn thành',x=>{x.referenceSessions[0].completionConfirmed=true;}],
 ['thêm buổi 4',x=>{x.referenceSessions[3].sessionNumber=4;}],
 ['sai phase',x=>{x.referenceSessions[3].phaseId='phase_wg_01_foundation';}],
 ['kế thừa volume',x=>{x.referenceSessions[0].blocks.RESISTANCE[1].volume.sets=2;}],
 ['quy đổi bw',x=>{x.referenceSessions[0].blocks.CORE_TRAIN[1].load.value=45;}],
 ['làm chắc chữ mờ',x=>{x.referenceSessions[3].blocks.RESISTANCE[1].load.value=26;}],
 ['đổi máy thành kg',x=>{const l=x.referenceSessions[3].blocks.RESISTANCE[2].load;l.unit='kg';l.kind='external_mass';l.measurementScope='per_implement_or_total_unconfirmed';}],
 ['kế thừa rest của bài hai',x=>{x.referenceSessions[3].blocks.RESISTANCE[3].restSeconds=80;}],
 ['nghỉ giữa cặp',x=>{x.referenceSessions[3].supersets[0].restPosition='between_exercises';}],
 ['xác nhận volume bài hai',x=>{x.referenceSessions[3].supersets[0].secondExerciseVolumeConfirmed=true;}],
 ['thêm bài vào d1 chưa đủ',x=>{x.referenceSessions[3].supersets[3].status='pair_as_reported';}],
 ['xóa cặp',x=>{x.referenceSessions[4].supersets.pop();}],
 ['sai thứ tự bài trong cặp',x=>{x.referenceSessions[4].supersets[0].memberRowIds.reverse();}],
 ['thêm thời gian khởi động',x=>{x.referenceSessions[4].blocks.WARM_UP[0].durationSeconds=600;}],
 ['thêm đơn vị tốc độ',x=>{x.referenceSessions[2].blocks.COOL_DOWN[0].treadmillSpeed.unit='km/h';}],
 ['khẳng định Side Kick là bài có dây',x=>{x.referenceSessions[3].blocks.RESISTANCE[0].mappingStatus='verified';}]
];
for(const [name,mutate] of badCases)test(`Chặn thay đổi sai: ${name}`,()=>{
 const bad=copy();mutate(bad);assert.throws(()=>validateWeightGainProgram(bad));
 const full=structuredClone(lib);full.programs[1]=bad;assert.throws(()=>validateTrainingPrograms(full));
});
test('ID bài, thiết bị hoặc chương trình không tồn tại bị từ chối',()=>{
 const a=structuredClone(lib);a.programs[1].referenceSessions[0].blocks.WARM_UP[0].exerciseId='ex_missing';assert.throws(()=>validateTrainingPrograms(a));
 const b=structuredClone(lib);b.exercises[b.exercises.length-1].requiredEquipmentIds=['eq_missing'];assert.throws(()=>validateTrainingPrograms(b));
 const c=structuredClone(lib);c.exercises.push(c.exercises[0]);assert.throws(()=>validateTrainingPrograms(c));
});
