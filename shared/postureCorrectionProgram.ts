/** Nguồn tư thế dân văn phòng: chỉ số hóa, không chẩn đoán hoặc kê bài phục hồi. */
type Obj = Record<string, any>;
export const POSTURE_PROGRAM_ID = 'prog_posture_correction_pt36';
export const POSTURE_SOURCE_IDS = ['posture_s01', 'posture_s02', 'posture_s03'] as const;
const expectedBlocks = [
 ['WARM_UP_SMR','MOBILITY_ACTIVATE','CORRECTIVE_STRENGTH_INTEGRATION','COOL_DOWN'],
 ['WARM_UP_SMR','MOBILITY_ACTIVATE','CORRECTIVE_STRENGTH_INTEGRATION','COOL_DOWN'],
 ['WARM_UP_SMR','CORRECTIVE_RESISTANCE_FUNCTIONAL','COOL_DOWN']
];
const expectedCounts = [[2,3,3,3],[2,3,3,2],[2,4,2]];
const expectedMinutes = [[10,15,20,10],[10,15,20,10],[10,25,10]];
function check(value: unknown, message: string): asserts value {
 if (!value) throw new Error(`Nguồn tư thế: ${message}`);
}
const equal = (a: unknown,b: unknown) => JSON.stringify(a)===JSON.stringify(b);
export function postureRows(p: Obj): Obj[] {
 return p.referenceSessions.flatMap((s: Obj)=>Object.values(s.blocks).flat() as Obj[]);
}
export function parsePostureVolume(raw: string): Obj {
 check(typeof raw==='string','Thiếu định lượng nguyên văn.');
 const base={raw,sets:null,repetitions:null,holdSeconds:null,distanceMeters:null,durationSeconds:null,
  perSide:/mỗi bên|\/bên/.test(raw),interpretationVerified:false};
 let m=/^(\d+) x (\d+)s(?: mỗi bên|\/bên)?$/.exec(raw);
 if(m)return {...base,kind:'hold',sets:Number(m[1]),holdSeconds:Number(m[2])};
 m=/^(\d+) x (\d+) reps(?:\/bên)?$/.exec(raw);
 if(m)return {...base,kind:'repetitions',sets:Number(m[1]),repetitions:Number(m[2])};
 m=/^(\d+) x (\d+) mét$/.exec(raw);
 if(m)return {...base,kind:'distance',sets:Number(m[1]),distanceMeters:Number(m[2])};
 m=/^(\d+)(?: phút|p)$/.exec(raw);
 if(m)return {...base,kind:'duration',durationSeconds:Number(m[1])*60};
 throw new Error('Nguồn tư thế: định lượng không được tự diễn giải.');
}
export function parsePostureLoad(raw: string|null): Obj {
 const base={raw,value:null,unit:null,implementCount:null,implementType:null,totalLoadKg:null,measurementScope:null,interpretationVerified:false};
 if(raw===null)return {...base,kind:'not_recorded'};
 if(raw==='không tạ')return {...base,kind:'no_external_weight_as_supplied'};
 const m=/^(?:(2 DB|KB) )?(\d+(?:\.\d+)?) kg$/.exec(raw);
 check(m,'Chỉ giữ đơn vị tải ghi rõ trong nguồn tư thế.');
 return {...base,kind:'mass_unit_explicit_in_source',value:Number(m[2]),unit:'kg',
  implementCount:m[1]==='2 DB'?2:m[1]==='KB'?1:null,implementType:m[1]?m[1]==='2 DB'?'dumbbell':'kettlebell':null,
  measurementScope:m[1]==='2 DB'?'per_implement_reading_requires_confirmation':'as_written_scope_unconfirmed'};
}
export function parsePostureRest(raw: string|null): number|null {
 if(raw===null)return null;
 const m=/^(\d+)s$/.exec(raw);check(m,'Đơn vị nghỉ không hợp lệ.');return Number(m[1]);
}
export function parsePostureTempo(raw: string|null): Obj {
 if(raw===null)return {raw:null,phaseSeconds:null,phaseNames:null};
 check(/^\d+-\d+-\d+$/.test(raw),'Nhịp phải giữ ba số nguồn.');
 return {raw,phaseSeconds:raw.split('-').map(Number),phaseNames:null};
}
function repetitionHold(note:string|null): number|null {
 if(!note)return null;
 const m=/giữ (?:đỉnh )?(\d+)s|giữ co thắt mông (\d+)s/i.exec(note);
 return m?Number(m[1]??m[2]):null;
}
function parseRow(tuple: unknown[], index:number, sourceId:string, block:string, mapping:Obj):Obj {
 check(Array.isArray(tuple)&&tuple.length===6,'Mỗi dòng cần đủ sáu cột nguồn.');
 const [name,volume,load,rest,note,tempo]=tuple as [string,string,string|null,string|null,string|null,string|null];
 check(typeof name==='string'&&(note===null||typeof note==='string'),'Tên và ghi chú nguồn không hợp lệ.');
 return {
  sourceRowId:`${sourceId}_${block.toLowerCase()}_r${index+1}`,sourceId,sourceBlock:block,order:index+1,
  sourceExerciseName:name,sourceVolume:volume,sourceLoad:load,sourceRest:rest,sourceNote:note,sourceTempo:tempo,
  exerciseId:mapping.exerciseId,nameVi:mapping.nameVi,mappingStatus:mapping.mappingStatus,
  volume:parsePostureVolume(volume),load:parsePostureLoad(load),restSeconds:parsePostureRest(rest),
  tempo:parsePostureTempo(tempo),holdAtPeakSeconds:repetitionHold(note),
  treadmill:name==='Đi bộ thả lỏng TM'?{inclineRaw:'0',inclineValue:0,inclineUnit:null,speedValue:null,speedUnit:null}:null,
  contextReviewNotes:structuredClone(mapping.reviewNotes),instructionsVerified:false,
  reviewStatus:'needs_review',verified:false,eligibleForPlanner:false
 };
}
/** Hàm thuần; chỉ tạo phần bổ sung cho thư viện, không sửa dữ liệu gốc. */
export function buildPostureCorrectionAddition(source:Obj, existing:Obj):Obj {
 check(source?.sourceId==='posture_correction_user_handover_v1','Sai nguồn.');
 check(equal(source.sessions?.map((s:Obj)=>s.sourceId),POSTURE_SOURCE_IDS),'Cần đúng ba nguồn 01-03.');
 const p=structuredClone(source.program);
 check(p.id===POSTURE_PROGRAM_ID,'Sai ID chương trình.');
 const mappings=new Map<string,Obj>();
 for(const m of source.exerciseMappings) {
  check(!mappings.has(m.sourceName),'Trùng tên ánh xạ.');mappings.set(m.sourceName,m);
 }
 const definitions=new Map<string,Obj>();
 p.referenceSessions=source.sessions.map((s:Obj,si:number)=>{
  check(s.sessionNumber===si+1&&s.sourceDate===null,'Không suy ngày hoặc đổi số buổi.');
  check(equal(s.blocks.map((b:Obj)=>b.key),expectedBlocks[si]),'Không thay nhóm hoặc thêm bước NASM vào bảng nguồn.');
  const blocks:Obj={};
  const blockTimings=s.blocks.map((b:Obj,bi:number)=>{
   check(b.allocatedMinutes===expectedMinutes[si][bi]&&b.rows.length===expectedCounts[si][bi],'Sai số dòng hoặc thời lượng khối.');
   blocks[b.key]=b.rows.map((tuple:unknown[],ri:number)=>{
    const mapping=mappings.get(String(tuple[0]));check(mapping,'Thiếu định nghĩa ánh xạ.');
    const row=parseRow(tuple,ri,s.sourceId,b.key,mapping);
    if(!definitions.has(mapping.exerciseId)) {
     const old=existing.exercises.find((e:Obj)=>e.id===mapping.exerciseId);
     definitions.set(mapping.exerciseId,old?{...structuredClone(old),programUsage:[]}:{
      id:mapping.exerciseId,name:`${mapping.nameVi} (${mapping.sourceName})`,nameEn:mapping.sourceName,
      aliases:[mapping.sourceName],category:mapping.category,
      targetMuscles:[],primaryMuscle:'Chưa được đánh giá',secondaryMuscles:[],
      requiredEquipmentIds:structuredClone(mapping.equipmentReferenceIds),difficulty:'unassessed',movementPattern:mapping.movementPattern,
      instructions:mapping.sourceInstructions.map((x:string)=>`Ghi nhận nguồn, chưa duyệt kỹ thuật: ${x}`),
      trainerCues:[],contraindications:structuredClone(mapping.reviewNotes),contraindicationsStatus:'review_notes_not_diagnosis',
      sourceInstructionsVerified:false,programUsage:[],reviewStatus:'needs_review',verified:false,revision:1
     });
    }
    definitions.get(mapping.exerciseId)!.programUsage.push({
     programId:p.id,sourceId:s.sourceId,sourceRowId:row.sourceRowId,sessionNumber:s.sessionNumber,block:b.key,
     sourceExerciseName:row.sourceExerciseName,sourceVolume:row.sourceVolume,sourceLoad:row.sourceLoad,sourceRest:row.sourceRest,
     sourceNote:row.sourceNote,sourceTempo:row.sourceTempo,loadUnit:row.load.unit,restSeconds:row.restSeconds,
     mappingStatus:row.mappingStatus,contextReviewNotes:row.contextReviewNotes,prescription:false
    });
    return row;
   });
   return {block:b.key,label:b.label,allocatedMinutes:b.allocatedMinutes,measuredMinutes:null};
  });
  return {sourceId:s.sourceId,sessionNumber:s.sessionNumber,sessionKey:`initial:${s.sessionNumber}`,packageCycle:'initial',
   sourceDate:null,title:s.title,phaseId:'phase_posture_01',recordKind:'user_supplied_plan',
   completionConfirmed:false,verified:false,eligibleForPlanner:false,reviewStatus:'needs_review',
   blocks,blockTimings,allocatedMinutes:blockTimings.reduce((sum:number,b:Obj)=>sum+b.allocatedMinutes,0),
   estimatedActualMinutes:null,timeBudgetValidated:false,
   timingNote:'Tổng nhãn khối, không phải thời gian đã tập hoặc ngân sách đã kiểm tra. Không tự rút ngắn nghỉ để ép khớp.'};
 });
 const allRefs=[...existing.equipmentReferences,...source.equipmentAdditions];
 const refs=[...new Set([...definitions.values()].flatMap(e=>e.requiredEquipmentIds))].map(id=>{
  const ref=allRefs.find((e:Obj)=>e.id===id);check(ref,`Thiếu tham chiếu thiết bị ${id}.`);return structuredClone(ref);
 });
 validatePostureCorrectionProgram(p);
 return {schemaVersion:1,version:1,status:'needs_review',programs:[p],exercises:[...definitions.values()],equipmentReferences:refs};
}
export function validatePostureCorrectionProgram(p:Obj):void {
 if(p.id!==POSTURE_PROGRAM_ID)return;
 check(p.reviewStatus==='needs_review'&&p.verified===false&&p.eligibleForPlanner===false&&p.ragRetrievalAllowed===false&&p.aiRecommendable===false,'Không kích hoạt nguồn chưa duyệt.');
 check(p.goal==='POSTURE_MOBILITY'&&p.sourceClinicalClaimsVerified===false,'Không nâng nguồn thành kết luận chuyên môn.');
 check(p.targetProfile?.minimumAge===18&&p.targetProfile.containsMinors===false&&p.targetProfile.clinicalEligibilityEstablished===false,'Không tự xác nhận đối tượng đủ điều kiện.');
 check(p.targetProfile.diagnosedUpperCrossedSyndrome===null&&p.targetProfile.diagnosedLowerCrossedSyndrome===null,'Không tự chẩn đoán từ tư thế hoặc nghề nghiệp.');
 check(p.targetProfile.recommendedFrequencyPerWeek===null&&p.targetProfile.sourceFrequencyPerWeek===3&&p.targetProfile.totalSessions===36,'Không đổi tần suất nguồn thành khuyến nghị.');
 check(p.methodFramework?.modelIsDiagnosis===false&&p.methodFramework.sourceFrameworkIsReviewedPrescription===false,'Khung phương pháp không phải chẩn đoán.');
 check(equal(p.methodFramework.stages.map((s:Obj)=>s.id),['INHIBIT','LENGTHEN','ACTIVATE','INTEGRATE']),'Giữ trình tự mô hình NASM.');
 check(p.scientificBasis?.automaticClinicalInferenceAllowed===false&&p.scientificBasis.painCauseEstablished===false,'Không suy nguyên nhân đau.');
 check(p.aiAssistantGuardrails?.handoverTag==='HEALTH_RISK'&&p.aiAssistantGuardrails.urgentSymptomsOverrideRoutineHandover===true&&p.aiAssistantGuardrails.clinicalDiagnosisAllowed===false,'Thiếu ranh giới chuyển giao.');
 check(p.phases.length===3&&equal(p.phases.map((x:Obj)=>x.sessionRange),['1-12','13-24','25-36'])&&p.phases.every((x:Obj)=>x.eligibleForPlanner===false),'Không tự tạo giáo án giai đoạn sau.');
 check(equal(p.referenceSessions?.map((s:Obj)=>s.sourceId),POSTURE_SOURCE_IDS),'Chỉ đúng ba buổi nguồn.');
 const rowIds=new Set<string>();
 p.referenceSessions.forEach((s:Obj,si:number)=>{
  check(s.sessionNumber===si+1&&s.sessionKey===`initial:${si+1}`&&s.packageCycle==='initial'&&s.sourceDate===null,'Sai khóa hoặc thêm ngày.');
  check(s.phaseId==='phase_posture_01'&&s.completionConfirmed===false&&s.verified===false&&s.eligibleForPlanner===false,'Không lưu như buổi đã tập.');
  check(s.timeBudgetValidated===false&&s.estimatedActualMinutes===null,'Chưa có thời gian thực tế.');
  check(equal(Object.keys(s.blocks),expectedBlocks[si]),'Khối buổi phải giữ nguồn.');
  check(equal(s.blockTimings.map((b:Obj)=>b.block),expectedBlocks[si]),'Thứ tự thời gian không khớp.');
  check(equal(s.blockTimings.map((b:Obj)=>b.allocatedMinutes),expectedMinutes[si])&&s.blockTimings.every((b:Obj)=>b.measuredMinutes===null),'Không sửa thời lượng nguồn.');
  check(s.allocatedMinutes===[55,55,45][si],'Tổng thời gian chỉ là tổng nhãn.');
  Object.entries(s.blocks).forEach(([block,items],bi)=>{
   check(Array.isArray(items)&&items.length===expectedCounts[si][bi],'Sai số dòng từng khối.');
   (items as Obj[]).forEach((r,ri)=>{
    check(r.sourceRowId===`${s.sourceId}_${block.toLowerCase()}_r${ri+1}`&&!rowIds.has(r.sourceRowId),'ID dòng sai hoặc trùng.');
    rowIds.add(r.sourceRowId);
    check(r.order===ri+1&&r.sourceId===s.sourceId&&r.sourceBlock===block,'Sai thứ tự hoặc vị trí nguồn.');
    check(r.reviewStatus==='needs_review'&&r.verified===false&&r.eligibleForPlanner===false&&r.instructionsVerified===false,'Không xác minh dòng tự động.');
    check(equal(r.volume,parsePostureVolume(r.sourceVolume)),'Sai định lượng, đơn vị hoặc mỗi bên.');
    check(equal(r.load,parsePostureLoad(r.sourceLoad)),'Không gộp tạ, đổi tải hoặc suy đơn vị.');
    check(r.restSeconds===parsePostureRest(r.sourceRest),'Không điền nghỉ từ dòng trước.');
    check(equal(r.tempo,parsePostureTempo(r.sourceTempo)),'Không tự diễn giải pha nhịp.');
    check(r.holdAtPeakSeconds===repetitionHold(r.sourceNote),'Giữ đỉnh là theo lượt, không phải giữ toàn hiệp.');
    const tm=r.sourceExerciseName==='Đi bộ thả lỏng TM'?{inclineRaw:'0',inclineValue:0,inclineUnit:null,speedValue:null,speedUnit:null}:null;
    check(equal(r.treadmill,tm),'Không đặt tốc độ hoặc đơn vị độ dốc chưa có.');
   });
  });
 });
 check(p.progressTracking.every((m:Obj)=>m.baseline===null&&m.outcome===null),'Chưa có kết quả để điền tiến bộ.');
}
