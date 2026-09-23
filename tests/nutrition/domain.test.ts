import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {buildNutritionLibrary,validateNutritionLibrary,sourceParagraph,quantityMentions} from '../../shared/nutritionKnowledge';
import {nutritionChatDecision,detectNutritionSafety,evaluateNutritionReadiness,isNutritionRequest} from '../../shared/nutritionRouting';
import {parseFrontmatter,chunkDocument,programRagAllowed} from '../../shared/ragDocument';
import {detectHandoverTrigger} from '../../server/src/handoverRules';
import {fallbackKeywordClassifier} from '../../server/src/intentClassifier';
const read=(p:string)=>JSON.parse(fs.readFileSync(p,'utf8'));
const src=read('data/nutrition/source-documents.json'),mapping=read('data/nutrition/template-mapping.json'),library=read('data/nutrition/meal-plan-library.json');
const fingerprint=read('tests/nutrition/source-fingerprint.json');
const clone=<T>(x:T):T=>JSON.parse(JSON.stringify(x));
const adult={ageBand:'adult',goal:'weight_gain',timing:'before_workout',allergyStatus:'none_reported',clinicalReview:'not_reported',contextConfirmed:true} as const;
const hash=(path:string)=>createHash('sha256').update(fs.readFileSync(path)).digest('hex');

test('Hai nguồn, sáu mẫu, 28 bữa và 70 dòng món được bảo toàn',()=>{
 assert.deepEqual(validateNutritionLibrary(library,src,mapping),{sourceCount:2,paragraphCount:214,templateCount:6,mealCount:28,foodLineCount:70,eligibleTemplateCount:0,modelTrainingRuns:0});
});
test('Nguồn và ánh xạ có dấu kiểm độc lập, không âm thầm sửa nội dung',()=>{
 for(const [p,sha] of Object.entries(fingerprint.files))assert.equal(hash(p),sha,p);
});
test('Bản sinh lại có cùng dữ liệu, không tăng version hoặc nhân dòng',()=>assert.deepEqual(buildNutritionLibrary(src,mapping),library));
test('Mọi dòng món trỏ đúng nguyên văn và marker chưa giải quyết',()=>{
 for(const t of library.templates)for(const m of t.meals)for(const r of [...m.items,...m.additionalItems]){
  const p=sourceParagraph(src,r.sourceRef.sourceId,r.sourceRef.paragraph);assert.equal(r.raw,p.text);assert.deepEqual(r.citationMarkers,p.unresolvedCitationMarkers);
 }
});
test('Bản nguồn tách định danh và lịch cá nhân nhưng giữ vị trí đoạn',()=>{
 const g=src.sources[0];assert.equal(g.paragraphs[34].redaction,'direct_identifier');assert(g.paragraphs[34].text.includes('[Đã loại'));
 assert.equal(g.paragraphs[75].redaction,'individual_schedule');assert.equal(g.paragraphs.length,83);
});
test('Năng lượng được ghi là số tác giả công bố, không là phép tính hay mục tiêu mới',()=>{
 assert.deepEqual(library.templates.map((t:any)=>[t.sourceEnergy.minKcal,t.sourceEnergy.maxKcal]),[[2300,2300],[2700,2700],[1450,1450],[2200,2200],[2000,2400],[1600,1800]]);
 for(const t of library.templates){assert.equal(t.sourceEnergy.personalTarget,false);assert.equal(t.computedDailyKcal,null);assert.equal(t.tdee,null);assert.equal(t.eligibleForPlanner,false);}
});
test('BMR chưa có không tự điền, BMR không trở thành mức ăn tối thiểu',()=>{
 assert.deepEqual(library.templates.map((t:any)=>t.sourceBMR?.valueAsWritten??null),[1850,1750,1250,null,null,null]);
 assert(library.templates.filter((t:any)=>t.sourceBMR).every((t:any)=>t.sourceBMR.usedAsMinimumIntake===false));
});
test('Quy tắc cân sống/chín chỉ gắn hai mẫu có nguồn',()=>{
 assert.deepEqual(library.templates.map((t:any)=>t.weighingConvention!==null),[true,true,false,false,false,false]);
 assert(library.templates[2].meals.flatMap((m:any)=>m.items).every((r:any)=>r.cookedWeightBasis==='not_stated'));
});
test('Không quy đổi chén, bát, nắm hoặc muỗng thành gram',()=>{
 const q=quantityMentions('1.5 chén cơm + 1 nắm hạt + 250ml sữa + 1/2 quả bơ');
 assert.equal(q.length,4);assert(q.some(r=>r.raw==='1.5 chén'));assert(q.every(r=>!('grams' in r)));
});
test('Phân số không phải phép chọn món hoặc',()=>{
 const line=library.templates[0].meals[0].additionalItems[0];assert(line.raw.includes('3/4'));assert.equal(line.hasInlineAlternative,false);
});
test('Bữa sáng chọn một phương án, đồ uống ngoài phương án vẫn riêng',()=>{
 const a=library.templates[0].meals[0];assert.equal(a.optionIds.length,3);assert.equal(a.additionalItems.length,1);
 const f=library.templates[2].meals[0];assert.equal(f.optionIds.length,2);assert.equal(f.additionalItems.length,1);
});
test('Lựa chọn whey hoặc táo không bị xóa hay biến thành cả hai',()=>{
 const x=library.templates[2].meals[2].items[0];assert(x.raw.includes('Whey'));assert(x.raw.includes('hoặc'));assert.equal(x.hasInlineAlternative,true);assert.equal(x.containsSupplementOrRehydrationProduct,true);
});
test('Thời điểm trước/sau tập không suy ra lịch cá nhân',()=>{
 assert.equal(library.templates[1].meals[2].timing.offsetMinutes,-60);
 assert.equal(library.templates[2].meals[2].timing.offsetMinutes,-45);
 assert.equal(library.templates[3].meals[2].timing.offsetMinutes,null);
 assert.equal(library.templates[3].meals[3].timing.anchor,'workout_end');
 assert.equal(library.templates[0].meals[4].timing.anchor,'sleep');
});
test('Nam/nữ không xác nhận trưởng thành hoặc nối với hồ sơ cũ',()=>{
 assert(library.templates.slice(0,4).every((t:any)=>t.population==='not_stated'));
 assert(library.templates.every((t:any)=>t.memberIds.length===0&&t.sourceInstructionsActive===false));
});
test('Mẫu tăng chiều cao và bệnh lý có phạm vi riêng, không được tự gợi ý',()=>{
 assert.equal(library.templates[4].population,'includes_minors');assert.equal(library.templates[5].population,'medical');
 assert(library.templates.every((t:any)=>!t.aiRecommendable&&!t.verified&&!t.ragRetrievalAllowed));
});
test('Không có kcal/macros theo món hoặc trạng thái đã ăn được sáng tác',()=>{
 for(const t of library.templates)for(const m of t.meals){assert.equal(m.computedKcal,null);assert.equal(m.consumed,false);for(const r of [...m.items,...m.additionalItems]){assert.equal(r.computedKcal,null);assert.equal(r.computedMacros,null);assert.equal(r.allergenSafety,'not_verified');}}
});
for(const [name,mutate] of [
 ['tự duyệt',(x:any)=>x.templates[0].verified=true],['mở planner',(x:any)=>x.templates[0].eligibleForPlanner=true],['mở RAG',(x:any)=>x.templates[0].ragRetrievalAllowed=true],
 ['tính kcal',(x:any)=>x.templates[0].computedDailyKcal=2300],['gán TDEE',(x:any)=>x.templates[0].tdee=2800],['gán hội viên',(x:any)=>x.templates[0].memberIds=['member-a']],
 ['bỏ lựa chọn',(x:any)=>x.templates[0].meals[0].items.pop()],['tự kế thừa cân sống',(x:any)=>x.templates[2].weighingConvention=x.templates[0].weighingConvention],
 ['sửa nguyên văn',(x:any)=>x.templates[0].meals[0].items[0].raw='đã sửa'],['coi đã ăn',(x:any)=>x.templates[0].meals[0].consumed=true],
 ['thêm trùng ID',(x:any)=>x.templates.push(x.templates[0])]
] as const)test(`Validator chặn ${name}`,()=>{const x=clone(library);mutate(x);assert.throws(()=>validateNutritionLibrary(x,src,mapping));});
test('Ngữ cảnh thiếu không được thay bằng số liệu khách mẫu',()=>{
 const d=evaluateNutritionReadiness({...adult,ageBand:'unknown',allergyStatus:'unknown',contextConfirmed:false});assert.equal(d.status,'needs_input');assert(d.missingFields.includes('ageBand'));assert.equal(d.kcalTarget,null);
});
for(const input of [{ageBand:'minor'},{goal:'height_growth'},{goal:'medical_nutrition'},{clinicalReview:'required'},{allergyStatus:'reported'}])test(`Cổng chuyên môn ${JSON.stringify(input)}`,()=>assert.equal(evaluateNutritionReadiness({...adult,...input} as any).status,'needs_professional_review'));
test('Đủ ngữ cảnh nhưng chưa có mẫu đã duyệt vẫn không cấp thực đơn',()=>assert.equal(evaluateNutritionReadiness(adult).status,'insufficient_reviewed_nutrition_data'));
test('Mô phỏng không nhận UID hoặc trường ngoài hợp đồng',()=>assert.throws(()=>evaluateNutritionReadiness({...adult,uid:'other'} as any)));
for(const q of ['Ăn gì trước tập?','an gi sau tap','Meal plan tăng cơ','Tôi muốn lên thực đơn','protein','TDEE'])test(`Phân loại dinh dưỡng: ${q}`,()=>{assert(isNutritionRequest(q));assert.equal(fallbackKeywordClassifier(q).intent,'NUTRITION');assert(nutritionChatDecision(q));});
for(const q of ['Giá gói meal plan','gia dinh duong bao nhieu tien'])test(`Giá giữ ưu tiên: ${q}`,()=>{assert.equal(fallbackKeywordClassifier(q).intent,'PRICE');assert.equal(nutritionChatDecision(q),null);});
for(const q of ['Tôi bị tiểu đường muốn ăn trước tập','Em 12 tuổi cần meal plan','Con tôi muốn ăn để cao hơn','Uống Oresol trong lúc tập','Tôi dị ứng tôm','Tôi không dung nạp lactose','whey nên uống bao nhiêu'])test(`Chuyển giao dinh dưỡng: ${q}`,()=>{assert.equal(detectHandoverTrigger(q).tag,'HEALTH_RISK');});
test('Nguồn bệnh hoặc tuổi từ lời bot không trở thành hồ sơ người hỏi',()=>{
 assert.equal(nutritionChatDecision('Ăn gì trước tập?',[{role:'assistant',text:'Bạn 12 tuổi bị tiểu đường'}])?.handover,false);
 assert.equal(nutritionChatDecision('Ăn gì trước tập?',[{role:'user',text:'Tôi bị tiểu đường'}])?.handoverTag,'HEALTH_RISK');
});
test('Dấu hiệu có thể cấp cứu không chờ hàng đợi và không lấy từ lịch sử bot',()=>{
 assert(detectNutritionSafety('Tôi bị sưng lưỡi')?.replyText.includes('cấp cứu'));
 assert(detectNutritionSafety('Ăn xong bị sưng môi và khó thở')?.replyText.includes('không chờ'));
 assert.equal(detectNutritionSafety('Tôi không bị sưng lưỡi'),null);
 assert.equal(detectNutritionSafety('Ăn gì?',[{role:'assistant',text:'sưng lưỡi'}]),null);
});
test('Báo đã ăn không tự lưu hoặc tính kcal từ mẫu',()=>{const d=nutritionChatDecision('Tôi đã ăn cơm và cá');assert.equal(d?.nutritionStatus,'meal_log_not_enabled');assert.equal(d?.saved,false);assert.equal(d?.computedKcal,null);});
test('File knowledge đúng metadata, chunk 200-1500 và không index dù đổi nhãn',()=>{
 const {metadata,body}=parseFrontmatter(fs.readFileSync('data/knowledge/12_nutrition_meal_plan_sources.md','utf8'));
 const chunks=chunkDocument(body);assert(chunks.length>20);assert(chunks.every(c=>c.length>=200&&c.length<=1500));assert.equal(programRagAllowed(metadata),false);assert.equal(programRagAllowed({...metadata,review_status:'verified',content_scope:'public_overview'}),false);
});
test('Cổng dinh dưỡng trong /api/chat đứng trước classify/cache, sau HEALTH_RISK',()=>{
 const source=fs.readFileSync('server/src/index.ts','utf8');const route=source.slice(source.indexOf('app.post("/api/chat"'));
 assert(route.indexOf('detectHandoverTrigger')<route.indexOf('nutritionChatDecision'));assert(route.indexOf('nutritionChatDecision')<route.indexOf('classification = await classify'));
 assert(source.includes('adminAuth.verifyIdToken(token, true)'));
});
test('Giữ năm chương trình tập và file index nguyên vẹn',()=>{
 for(const p of ['data/companion/training_programs.json','data/knowledge/index.json'])assert.equal(hash(p),fingerprint.preservedFiles[p]);
});