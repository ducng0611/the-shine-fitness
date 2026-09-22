import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {parseFrontmatter,chunkDocument,programRagAllowed} from '../shared/ragDocument';
import {validateTrainingPrograms,mergeTrainingPrograms} from '../shared/trainingPrograms';
import {buildHeightPostureAddition,validateHeightPostureProgram,heightRows,parseHeightVolume,HEIGHT_SESSION_KEYS} from '../shared/heightPostureProgram';
import {detectProgramSafety,normalizeSafetyText,HEALTH_RISK_KEYWORDS} from '../shared/programSafety';
import {fallbackKeywordClassifier,classify} from '../server/src/intentClassifier';
import {detectHandoverTrigger} from '../server/src/handoverRules';
import {parseTrainingIntent} from '../server/src/companion/training/intent';
const load=(p:string)=>JSON.parse(fs.readFileSync(p,'utf8'));
const lib=load('data/companion/training_programs.json');
const source=load('data/training-pathways/height-posture/source-sessions.json');
const baseline=load('tests/fixtures/height-posture-baseline.json');
const p=lib.programs.find((x:any)=>x.id==='prog_height_posture_pt25');
const hash=(v:any)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const rows=heightRows(p);
const session=(key:string)=>p.referenceSessions.find((s:any)=>s.sessionKey===key);
const row=(key:string,name:string)=>heightRows({referenceSessions:[session(key)]}).find(r=>r.sourceExerciseName===name)!;

test('Thư viện phiên bản 3 giữ đủ ba chương trình và tham chiếu hợp lệ',()=>{
 assert.deepEqual(validateTrainingPrograms(lib),{programCount:3,exerciseCount:78,equipmentReferenceCount:27,referenceCount:146});
 assert.equal(lib.version,3);
 assert.deepEqual(p.referenceSessions.map((s:any)=>s.sessionKey),HEIGHT_SESSION_KEYS);
});
test('Hai chương trình cũ giữ nguyên mọi trường và dữ liệu bài cũ không bị ghi đè',()=>{
 for(const [id,h] of Object.entries(baseline.programHashes))assert.equal(hash(lib.programs.find((p:any)=>p.id===id)),h,id);
 for(const [id,h] of Object.entries(baseline.exerciseMetadataHashes)) {
  const {programUsage,...metadata}=lib.exercises.find((e:any)=>e.id===id);
  assert.equal(hash(metadata),h,id);
  assert.equal(hash(programUsage.filter((u:any)=>u.programId!==p.id)),baseline.existingUsageHashes[id],id);
 }
 for(const [id,h] of Object.entries(baseline.equipmentHashes))assert.equal(hash(lib.equipmentReferences.find((e:any)=>e.id===id)),h,id);
});
test('Bảo toàn đúng 48 dòng năm cột và vị trí biểu mẫu',()=>{
 assert.equal(hash(source.sessions),baseline.sourceHash);
 assert.equal(rows.length,48);
 for(const src of source.sessions) {
  const s=session(`${src.packageCycle}:${src.sessionNumber}`);
  const tuples=Object.entries(s.blocks).flatMap(([g,rr])=>(rr as any[]).map(r=>[g,r.sourceExerciseName,r.volume.raw,r.load.raw,r.restRaw]));
  assert.deepEqual(tuples,src.rows);
 }
});
test('Gói gia hạn có khóa riêng, không trở thành buổi 29 hoặc gói ban đầu',()=>{
 assert.equal(session('renewal_1:4').sessionNumber,4);
 assert.equal(session('renewal_1:5').sessionNumber,5);
 assert.equal(p.referenceSessions.some((s:any)=>s.sessionNumber===29),false);
 const g={version:1,programs:[{id:'test_cycle',referenceSessions:[{packageCycle:'initial',sessionNumber:4},{packageCycle:'renewal_1',sessionNumber:4}]}],exercises:[],equipmentReferences:[]};
 assert.doesNotThrow(()=>validateTrainingPrograms(g));
 g.programs[0].referenceSessions[1].packageCycle='initial';
 assert.throws(()=>validateTrainingPrograms(g));
});
test('Số hiệp dạng khoảng, giữ tiếp đất và đơn vị mỗi bên không bị làm phẳng',()=>{
 const jump=row('initial:21','Jump Squat').volume;
 assert.equal(jump.sets,null);assert.deepEqual(jump.setsRange,{min:3,max:4});assert.equal(jump.repetitions,10);
 const sticky=row('initial:23','1. Sticky Jump').volume;
 assert.equal(sticky.repetitions,6);assert.equal(sticky.holdSeconds,null);assert.equal(sticky.holdAfterRepetitionSeconds,3);
 const stretch=row('initial:21','1. Neck Side Stretch').volume;
 assert.equal(stretch.sets,null);assert.equal(stretch.holdSeconds,30);assert.equal(stretch.sidePolicy,'each_side_as_reported');
 assert.equal(row('initial:22','2. Butterfly Stretch').volume.sidePolicy,'not_recorded');
});
test('Lung Meridian không tự đổi 20 thành giây hoặc số lần; tên biến thể chưa duyệt',()=>{
 const v=row('initial:23','2. Lung Meridian').volume;
 assert.equal(v.sets,2);assert.equal(v.unresolvedValue,20);assert.equal(v.repetitions,null);assert.equal(v.holdSeconds,null);
 assert.equal(v.kind,'ambiguous_unit');
 assert.equal(row('renewal_1:5','2. Lung Meridian').uncertainties.length,1);
});
test('Tải số trần ở nguồn này không kế thừa kg của lộ trình tăng cân',()=>{
 for(const r of rows) {
  assert.equal(r.load.unit,null);
  if(r.load.raw==='bw')assert.equal(r.load.value,null);
  if(r.load.raw===null)assert.equal(r.load.value,null);
 }
 assert.equal(row('initial:24','Lat Pulldown').load.value,12);
 assert.equal(row('initial:23','Goblet Squat (tempo)').load.value,8);
 assert.equal(row('initial:23','Goblet Squat (tempo)').tempo.phaseSeconds,null);
});
test('Ô trống không thành số không hoặc bản sao dòng trước',()=>{
 assert.equal(row('initial:23','Bird Dog').volume.sets,null);
 assert.equal(row('renewal_1:5','Lat Pulldown').restSeconds,null);
 assert.equal(row('renewal_1:5','Glute Bridge').restSeconds,null);
 assert.equal(session('initial:21').blocks.WARM_UP.length,0);
 assert.equal(session('initial:24').blocks.COOL_DOWN.length,0);
});
test('Không đổi nhóm Dead Hang hoặc Box Breathing để giáo án trông hợp lý hơn',()=>{
 assert.equal(row('renewal_1:5','2. Dead Hang + Core').sourceGroup,'PLYOMETRICS');
 assert.equal(row('renewal_1:5','3. Box Breathing').sourceGroup,'STRETCH');
 assert.equal(row('renewal_1:5','3. Box Breathing').sourceTable,'RESISTANCE_EXERCISE');
 assert.equal(row('initial:23','Box Breathing').sourceGroup,'COOL_DOWN');
});
test('Thở hộp theo phút không thành giữ hơi bốn phút hoặc nhịp bốn giây',()=>{
 assert.deepEqual(row('initial:23','Box Breathing').volume.durationRangeSeconds,{min:180,max:240});
 assert.equal(row('initial:23','Box Breathing').volume.durationSeconds,null);
 const v=row('renewal_1:5','3. Box Breathing').volume;
 assert.equal(v.durationPerSetSeconds,240);assert.equal(v.totalPlannedDurationSeconds,480);assert.equal(v.holdSeconds,null);
 assert.equal(lib.exercises.find((e:any)=>e.id==='ex_box_breathing').movementPattern,'breathing');
});
test('Sáu lượt cộng 30 giây không bị nhân; điểm luật không là điểm đạt',()=>{
 const r=row('renewal_1:5','Tower Defense (trò chơi vận động, 5 điểm)');
 assert.equal(r.volume.rounds,6);assert.equal(r.volume.additionalSeconds,30);
 assert.equal(r.volume.totalPlannedDurationSeconds,null);
 assert.equal(r.gamePointsNote.ruleValue,5);assert.equal(r.gamePointsNote.achievedScore,null);
});
test('Chỗ chưa đọc rõ còn trống kèm yêu cầu huấn luyện viên xác nhận',()=>{
 assert.equal(row('initial:23','1. Sticky Jump').uncertainties[0].value,null);
 assert.equal(row('renewal_1:4',"Wizard's Path (trò chơi vận động, có tính điểm)").uncertainties[0].value,null);
});
test('Mâu thuẫn lịch, đo lường và phân loại còn trạng thái chờ xem xét',()=>{
 for(const id of ['hp_schedule','hp_days_recovery','hp_sticky_metric','hp_groups','hp_growth'])
  assert.equal(p.sourceIssues.find((i:any)=>i.id===id).status,'needs_review');
 assert.equal(p.targetProfile.recommendedFrequencyPerWeek,null);
});
test('Giữ nhận diện hiện có, không tạo lại Lat Pulldown hoặc Dynamic Warm Up',()=>{
 for(const id of ['ex_bird_dog','ex_dead_bug','ex_lat_pulldown','ex_dynamic_warmup'])
  assert.equal(lib.exercises.filter((e:any)=>e.id===id).length,1);
 assert.equal(lib.exercises.filter((e:any)=>!(e.id in baseline.exerciseMetadataHashes)).length,27);
 assert.equal(row('initial:23','Goblet Squat (tempo)').exerciseId,row('initial:21','Goblet Squat').exerciseId);
});
test('Tham chiếu dụng cụ không tạo máy hoặc xác nhận phù hợp trẻ',()=>{
 const added=lib.equipmentReferences.filter((e:any)=>!(e.id in baseline.equipmentHashes));
 assert.equal(added.length,5);
 for(const e of added){assert.equal(e.verified,false);assert.equal(e.isPhysicalAsset,false);assert.deepEqual(e.candidateAssetIds,[]);}
});
test('Định nghĩa mới không bịa cơ đích hoặc chống chỉ định khi thiếu dữ liệu',()=>{
 for(const e of lib.exercises.filter((e:any)=>!(e.id in baseline.exerciseMetadataHashes))){
  assert.equal(e.verified,false);assert.equal(e.reviewStatus,'needs_review');
  assert.equal(e.difficulty,'unassessed');assert.deepEqual(e.trainerCues,[]);assert.deepEqual(e.contraindications,[]);
  assert.deepEqual(e.targetMuscles,[]);
  if(e.category==='Linh hoạt')assert(e.instructions.every((x:string)=>x.startsWith('Ghi nhận nguồn:')));
 }
});
test('Ghép lại không nhân đôi usage hoặc tăng version',()=>{
 const result=mergeTrainingPrograms(lib,buildHeightPostureAddition(source,lib));
 assert.deepEqual(result,lib);assert.equal(result.version,3);
});
test('Nguồn chưa duyệt, không tự phân loại BMI, không cấp quyền cho trẻ',()=>{
 validateHeightPostureProgram(p);
 assert.equal(p.scientificBasis.clinicalBmiClassification,null);
 assert.equal(p.minorSafetyProtocol.medicalClearanceVerified,false);
 assert.equal(p.minorSafetyProtocol.guardianConsentVerified,false);
 assert.equal(p.framing.noWeightLossPrescription,true);
});
test('Markdown có metadata hợp lệ và từng chunk 200-1500 ký tự',()=>{
 const md=fs.readFileSync('data/knowledge/09_program_height_posture.md','utf8');
 const {metadata,body}=parseFrontmatter(md);
 const sizes=chunkDocument(body).map(c=>c.length);
 assert.equal(metadata.category,'PROGRAM');assert.equal(metadata.review_status,'needs_review');
 assert.equal(metadata.content_scope,'historical_reference');assert(metadata.expiry_date>new Date().toISOString().slice(0,10));
 assert.equal(programRagAllowed(metadata),false);
 assert(sizes.every(n=>n>=200&&n<=1500));assert(!md.includes('\u2014'));
 assert(!/\p{Extended_Pictographic}/u.test(md));
 assert.equal(md.split('Giảm cân, giảm mỡ (tăng chiều cao)').length-1,1);
});
test('Các tệp mới không chứa hồ sơ đo cá nhân hoặc dữ liệu năng lượng bị loại',()=>{
 const md=fs.readFileSync('data/knowledge/09_program_height_posture.md','utf8');
 const files=[JSON.stringify(source),JSON.stringify(p),md,fs.readFileSync('data/training-pathways/height-posture/scientific-claims.review.json','utf8')];
 for(const text of files){
  assert(!new RegExp(String(155*10)).test(text));
  assert(!/\b43[.,]1\b|\b19[.,]1\b|23\/12\/2025|27\/08\/2026/.test(text));
  assert(!/"(?:calorieEstimate|mealPhotos|birthDate|fullName|phone|address)"\s*:/.test(text));
 }
});
const riskTerms=['giảm cân cho bé','bé thừa cân','con béo','bé mập','ăn kiêng','nhịn ăn','đếm calo','bao nhiêu calo','cao thêm','tăng chiều cao cho bé','thuốc tăng chiều cao','canxi cho bé','dậy thì sớm','sụn tăng trưởng'];
for(const term of riskTerms) for(const message of [term,normalizeSafetyText(term)])
 test(`Chuyển giao có/không dấu: ${message}`,()=>{
  assert(HEALTH_RISK_KEYWORDS.includes(message));
  assert.equal(detectHandoverTrigger(message).tag,'HEALTH_RISK');
  assert.equal(parseTrainingIntent(message).intent,'safety');
 });
for(const message of ['Em học lớp 7 muốn giảm mỡ','Con tôi cần bao nhiêu calo','Bé mập nên ăn kiêng thế nào','Em 12 tuổi muốn nhịn ăn'])
 test(`Trẻ không nhận gợi ý ăn uống: ${message}`,()=>{
  const r=detectProgramSafety(message)!;assert.equal(r.tag,'HEALTH_RISK');
  assert.match(r.replyText,/bác sĩ nhi khoa/);assert.match(r.replyText,/dinh dưỡng nhi/);
  assert(!/\d+\s*(?:kcal|g\/kg|kg|bữa)/.test(r.replyText));
 });
test('Tuổi ở lời trước vẫn chặn, thông tin do bot nói không xác nhận tuổi',()=>{
 const a=detectProgramSafety('cho lịch treo xà',[{role:'user',text:'Em 12 tuổi'}])!;
 assert.equal(a.tag,'HEALTH_RISK');
 assert.equal(detectProgramSafety('tôi muốn cải thiện tư thế',[{role:'assistant',text:'Trẻ 12 tuổi cần hướng dẫn'}]),null);
});
for(const message of ['Tập bao lâu thì cao thêm?','tang chieu cao','Con tôi tập để cao thêm','grow taller'])
 test(`Không cam kết chiều cao: ${message}`,()=>{
  const r=detectProgramSafety(message)!;
  assert.equal(r.tag,'HEALTH_RISK');assert.match(r.replyText,/không cam kết cao thêm/);
 });
for(const text of ['tăng chiều cao','tang chieu cao','cải thiện tư thế','cai thien tu the','gù lưng','tư thế','plyometric','plyometrics','treo xà'])
 test(`Intent PROGRAM: ${text}`,()=>assert.equal(fallbackKeywordClassifier(text).intent,'PROGRAM'));
for(const text of ['Giá gói tăng chiều cao','goi tu the bao nhieu tien','giá giáo án tư thế'])
 test(`PRICE vẫn ưu tiên: ${text}`,()=>assert.equal(fallbackKeywordClassifier(text).intent,'PRICE'));
test('Mục tiêu chủ đề không trở thành chẩn đoán hoặc gộp tăng cân với chiều cao',()=>{
 assert.match(fallbackKeywordClassifier('tăng chiều cao').slots.goal!,/cần đánh giá/);
 assert.equal(fallbackKeywordClassifier('tăng cân và cải thiện tư thế').slots.goal,null);
 assert.equal(fallbackKeywordClassifier('không muốn tăng chiều cao').slots.goal,null);
 assert.equal(fallbackKeywordClassifier('tăng cơ').slots.goal,'Tăng cơ');
});
test('Intent theo quy tắc không gọi provider khi đã nhận diện',async()=>{
 let calls=0;const ai={models:{generateContent:async()=>{calls++;throw Error('Không gọi mô hình');}}};
 assert.equal((await classify('Tư vấn giáo án tư thế',[],ai as any)).intent,'PROGRAM');assert.equal(calls,0);
});
const mutations:[string,(p:any)=>void][]=[
 ['mở planner',x=>x.eligibleForPlanner=true],
 ['mở RAG',x=>x.ragRetrievalAllowed=true],
 ['xác minh nguồn',x=>x.verified=true],
 ['đổi mục tiêu giảm cân',x=>x.goal='FAT_LOSS'],
 ['phân loại BMI',x=>x.scientificBasis.clinicalBmiClassification='normal'],
 ['cam kết cao thêm',x=>x.scientificBasis.noHeightGuarantee=false],
 ['tự cấp giáo án cho trẻ',x=>x.targetProfile.automatedMinorPlanningAllowed=true],
 ['suy ra đồng ý người giám hộ',x=>x.minorSafetyProtocol.guardianConsentVerified=true],
 ['lịch cuối tuần thành khuyến nghị',x=>x.targetProfile.recommendedFrequencyPerWeek=2],
 ['suy giấc ngủ từ tin nhắn',x=>x.privateTrackingPolicy.passiveSleepInferenceAllowed=true],
 ['đổi số buổi gia hạn',x=>x.referenceSessions[4].sessionNumber=29],
 ['đổi chu kỳ',x=>x.referenceSessions[4].packageCycle='initial'],
 ['bỏ dòng',x=>x.referenceSessions[0].blocks.STRETCH.pop()],
 ['lấp ô trống',x=>x.referenceSessions[2].blocks.RESISTANCE[1].volume.sets=3],
 ['đổi số hiệp dạng khoảng',x=>x.referenceSessions[0].blocks.PLYOMETRICS[0].volume.sets=4],
 ['tạo đơn vị tải',x=>x.referenceSessions[2].blocks.RESISTANCE[0].load.unit='kg'],
 ['giải quyết giả chữ mờ',x=>x.referenceSessions[2].blocks.PLYOMETRICS[0].uncertainties=[]],
 ['đổi đơn vị Lung Meridian',x=>x.referenceSessions[2].blocks.STRETCH[1].volume.holdSeconds=20],
 ['nhân thời lượng game',x=>x.referenceSessions[5].blocks.GAME[0].volume.totalPlannedDurationSeconds=180],
 ['ghi thành tích điểm',x=>x.referenceSessions[5].blocks.GAME[0].gamePointsNote.achievedScore=5],
 ['sửa bảng nguồn',x=>x.referenceSessions[5].blocks.STRETCH[2].sourceTable='COOL_DOWN'],
 ['giả định tempo',x=>x.referenceSessions[2].blocks.RESISTANCE[0].tempo.phaseSeconds=[3,1,1]],
 ['ghi thành buổi hoàn thành',x=>x.referenceSessions[0].completionConfirmed=true]
];
for(const [name,mutate] of mutations)test(`Chặn sửa sai: ${name}`,()=>{
 const copy=structuredClone(p);mutate(copy);assert.throws(()=>validateHeightPostureProgram(copy));
});
test('ID trùng và tham chiếu không tồn tại bị chặn',()=>{
 const copy=structuredClone(lib);copy.exercises.push(copy.exercises[0]);assert.throws(()=>validateTrainingPrograms(copy));
 const ref=structuredClone(lib);ref.programs[2].referenceSessions[0].blocks.PLYOMETRICS[0].exerciseId='ex_missing';assert.throws(()=>validateTrainingPrograms(ref));
});
