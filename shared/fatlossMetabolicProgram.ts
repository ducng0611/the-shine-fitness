/** Số hóa nguồn bệnh lý: không phải bộ kê giáo án hoặc đánh giá y tế. */
type Obj = Record<string, any>;
export const METABOLIC_PROGRAM_ID = 'prog_fatloss_metabolic_pt255';
export const METABOLIC_SOURCE_KEYS = ['metabolic_a3','metabolic_a4','metabolic_a5','metabolic_a6','metabolic_a7','metabolic_a8'] as const;
function check(value: unknown, message: string): asserts value {
  if (!value) throw new Error(`Nguồn chuyển hóa: ${message}`);
}
function equal(a: unknown,b: unknown): boolean { return JSON.stringify(a)===JSON.stringify(b); }
export function metabolicRows(p: Obj): Obj[] {
  return p.referenceSessions.flatMap((s: Obj) => s.sessionType==='CARDIO_CIRCUIT' ? s.blocks.CARDIO_CIRCUIT.stations : s.blocks.RESISTANCE);
}
export function parseMetabolicVolume(raw: string|null): Obj {
  if(raw===null)return {raw:null,sets:null,repetitions:null,holdSeconds:null};
  const m=/^(\d+) x (\d+)$/.exec(raw);
  check(m,'Volume phải giữ đúng số hiệp x số lần, không tự điền ô trống.');
  return {raw,sets:Number(m[1]),repetitions:Number(m[2]),holdSeconds:null};
}
export function parseMetabolicLoad(raw: string|null, interpretation: string|null): Obj {
  const base={raw,value:null,unit:null,measurementScope:null,primaryRecordedValue:null,annotationRecordedValue:null};
  if(raw===null)return {...base,kind:'not_recorded',certainty:'not_recorded'};
  if(raw==='bw')return {...base,kind:'bodyweight',certainty:'as_transcribed'};
  if(raw==='10 (ghi chú 7.5)')return {...base,kind:'annotated_mass_unresolved',primaryRecordedValue:10,annotationRecordedValue:7.5,
    unit:interpretation==='kg'?'kg':null,measurementScope:'per_side_per_implement_or_total_unconfirmed',
    certainty:'needs_review',note:'Chưa biết ghi chú là sửa tải hay diễn biến trong buổi; không chọn một số để kê tập.'};
  check(typeof raw==='string'&&/^\d+(?:\.\d+)?$/.test(raw),'Ký hiệu tải không đúng bản chép.');
  return {...base,value:Number(raw),unit:interpretation==='kg'?'kg':null,
    kind:interpretation==='kg'?'external_mass_as_supplied':interpretation==='machine'?'machine_marker_as_supplied':'numeric_unit_unconfirmed',
    certainty:'as_transcribed',measurementScope:interpretation==='kg'?'per_side_per_implement_or_total_unconfirmed':null};
}
function groupsFor(rows: Obj[]): Obj[] {
  return ['a','b','c','d'].map(group=>{
    const members=rows.filter(r=>r.supersetGroup===group);
    return {group,memberRowIds:members.map(r=>r.sourceRowId),status:members.length===2?'pair_as_reported':'single_record_only',
      volumeAsRecorded:members.map(r=>({sourceRowId:r.sourceRowId,raw:r.volume.raw})),
      sharedVolumeConfirmed:false,restPosition:members.length===2?'after_pair_as_reported':'not_recorded',
      restAfterGroupSeconds:null,interpretationSource:'A2 và các ô tương ứng trong bảng nguồn',
      note:members.length===2?'Giữ volume từng bài nếu có; không kế thừa ô trống.':'Chỉ có d1, không tự tạo d2 hoặc diễn giải thành cặp đầy đủ.'};
  });
}
/** Hàm thuần, không ghi tệp, database hoặc gọi nhà cung cấp. */
export function buildMetabolicAddition(source: Obj, existing: Obj): Obj {
  check(source?.sourceId==='fatloss_metabolic_user_transcription_v1','Sai nguồn.');
  check(equal(source.sessions?.map((s:Obj)=>s.sourceId),METABOLIC_SOURCE_KEYS),'Cần đúng sáu tài liệu nguồn theo thứ tự.');
  const p=structuredClone(source.program);
  check(p.id===METABOLIC_PROGRAM_ID,'Sai mã chương trình.');
  const mappings=new Map<string,Obj>();
  for(const m of source.exerciseMappings) {
    check(!mappings.has(m.sourceName),'Trùng tên ánh xạ.');mappings.set(m.sourceName,m);
  }
  const definitions=new Map<string,Obj>();
  p.referenceSessions=source.sessions.map((s:Obj,si:number)=>{
    check(s.rows.length===(si===5?6:7),'Không thêm hoặc bỏ dòng nguồn.');
    const circuit=si===5;
    const rows=s.rows.map((tuple:unknown[],index:number)=>{
      check(Array.isArray(tuple)&&tuple.length===4,'Mỗi dòng phải giữ đủ bốn cột gốc.');
      const [label,name,volume,load]=tuple as [string,string,string|null,string|null];
      const m=mappings.get(name);check(m,`Chưa có ánh xạ cho ${name}`);
      check(circuit?/^[1-6]$/.test(label):/^[a-d][12]$/.test(label),'Nhãn dòng không hợp lệ.');
      const row:Obj={
        sourceRowId:`${s.sourceId}_r${index+1}`,sourceId:s.sourceId,sourceSection:s.sourceSection,
        sourceLabel:label,sourceExerciseName:name,nameVi:m.nameVi,exerciseId:m.exerciseId,
        volume:parseMetabolicVolume(volume),load:parseMetabolicLoad(load,m.numericLoadInterpretation),
        numericLoadInterpretation:m.numericLoadInterpretation,
        restRaw:null,restSeconds:null,durationSeconds:null,
        supersetGroup:circuit?null:label[0],supersetOrder:circuit?null:Number(label[1]),order:index+1,
        mappingStatus:m.mappingStatus,contextContraindications:structuredClone(m.contraindicationReviewNotes),
        clinicalNotesVerified:false,reviewStatus:'needs_review',verified:false,eligibleForPlanner:false
      };
      if(!definitions.has(m.exerciseId)){
        const old=existing.exercises.find((e:Obj)=>e.id===m.exerciseId);
        definitions.set(m.exerciseId,old?{...structuredClone(old),programUsage:[]}:{
          id:m.exerciseId,name:`${m.nameVi} (${name})`,nameEn:name,aliases:[name],category:m.category,
          targetMuscles:[],primaryMuscle:'Chưa được xác minh',secondaryMuscles:[],
          requiredEquipmentIds:m.equipmentReferenceIds,difficulty:'unassessed',movementPattern:null,
          instructions:[],trainerCues:[],contraindications:structuredClone(m.contraindicationReviewNotes),
          contraindicationsStatus:'context_review_not_diagnosis',
          reviewNotes:'Lưu ý chuyển hóa do nguồn đề nghị để thẩm định; không xác nhận bài an toàn hay chống chỉ định tuyệt đối. Chưa có hướng dẫn kỹ thuật được duyệt.',
          programUsage:[],reviewStatus:'needs_review',verified:false,revision:1,createdAt:p.createdAt,updatedAt:p.updatedAt
        });
      }
      definitions.get(m.exerciseId)!.programUsage.push({
        programId:p.id,sourceId:s.sourceId,sessionNumber:s.sessionNumber,sourceRowId:row.sourceRowId,
        block:circuit?'CARDIO_CIRCUIT':'RESISTANCE',sourceExerciseName:name,sourceVolume:volume,sourceLoad:load,
        loadUnit:row.load.unit,restSeconds:null,supersetGroup:row.supersetGroup,supersetOrder:row.supersetOrder,
        mappingStatus:m.mappingStatus,contextContraindications:structuredClone(m.contraindicationReviewNotes),
        clinicalNotesVerified:false,prescription:false
      });
      return row;
    });
    return {sourceId:s.sourceId,sourceSection:s.sourceSection,sessionNumber:s.sessionNumber,
      sessionNumberRaw:s.sessionNumberRaw,sessionNumberCandidates:structuredClone(s.sessionNumberCandidates),
      sessionKey:s.sessionNumber===null?`unresolved:${s.sourceId}`:`initial:${s.sessionNumber}`,
      numberReviewStatus:s.sessionNumber===null?'needs_review':'as_transcribed',
      numberReviewNote:s.numberReviewNote??null,yearReview:s.yearReview??null,
      packageCycle:'initial',splitAsSupplied:s.split,sessionType:circuit?'CARDIO_CIRCUIT':'SUPERSET_REFERENCE',
      recordKind:'historical_plan',completionConfirmed:false,verified:false,eligibleForPlanner:false,
      sourceNote:'Bản chép do người dùng cung cấp; chưa đối chiếu ảnh, không xác nhận đã thực hiện.',
      blocks:circuit?{RESISTANCE:[],CARDIO_CIRCUIT:{rounds:3,stations:rows,secondsPerStation:null,
        restBetweenStationsSeconds:null,restBetweenRoundsSeconds:null,totalDurationSeconds:null,
        loadPolicyAsReported:'Toàn bộ là bài trọng lượng cơ thể theo mô tả A8, không tự điền vào ô Load từng trạm.'}}
        :{RESISTANCE:rows,CARDIO_CIRCUIT:null},
      supersets:circuit?[]:groupsFor(rows)};
  });
  const refs=[...existing.equipmentReferences,...source.equipmentAdditions];
  const equipmentReferences=[...new Set([...definitions.values()].flatMap(e=>e.requiredEquipmentIds))].map(id=>{
    const e=refs.find((e:Obj)=>e.id===id);check(e,`Thiếu tham chiếu thiết bị ${id}`);return structuredClone(e);
  });
  validateMetabolicProgram(p);
  return {schemaVersion:1,version:1,status:'needs_review',programs:[p],exercises:[...definitions.values()],equipmentReferences};
}
export function validateMetabolicProgram(p: Obj): void {
  if(p.id!==METABOLIC_PROGRAM_ID)return;
  check(p.aiRecommendable===false&&p.verified===false&&p.eligibleForPlanner===false&&p.ragRetrievalAllowed===false&&p.reviewStatus==='needs_review','Nguồn y khoa chưa duyệt không được kích hoạt.');
  check(p.goal==='FAT_LOSS_MEDICAL'&&p.requiresMedicalClearance===true&&p.medicalClearanceVerified===false,'Không tự xác nhận đủ điều kiện vận động.');
  check(p.targetProfile?.containsMinors===false&&p.targetProfile.clinicalEligibilityEstablished===false&&p.targetProfile.recommendedFrequencyPerWeek===null,'Không biến phạm vi nguồn thành chỉ định cá nhân.');
  check(p.medicalSafetyProtocol?.automaticApplicationAllowed===false,'Không tự áp dụng quy tắc y khoa.');
  check(p.medicalSafetyProtocol?.intakeEvidence?.medications==='not_recorded','Ô thuốc trống không phải không dùng thuốc.');
  const hypo=p.medicalSafetyProtocol?.hypoglycemiaProtocol;
  check(hypo?.delayedRiskHours===null&&hypo.delayedRiskSourceHours===24&&hypo.delayedRiskIsMaximum===false,'Không dùng 24 giờ làm giới hạn bảo đảm hết nguy cơ.');
  check(hypo?.clinicalThresholdsProvided===false&&hypo.medicationAdjustmentAllowed===false,'Không kê ngưỡng hoặc thuốc.');
  check(p.aiAssistantGuardrails?.handoverTag==='HEALTH_RISK'&&p.aiAssistantGuardrails.urgentSymptomsOverrideRoutineHandover===true,'Thiếu chuyển giao hoặc ưu tiên dấu hiệu cấp cứu.');
  check(p.scientificPrinciples?.automaticCalculationAllowed===false&&p.scientificPrinciples.targetWeightGainOrLossKgPerWeek===null&&p.scientificPrinciples.medicalThresholds===null,'Không đặt mục tiêu hoặc ngưỡng cá nhân.');
  check(p.splitPatternIsRecommendation===false,'Lịch nguồn không phải lịch khuyến nghị.');
  check(equal(p.referenceSessions?.map((s:Obj)=>s.sourceId),METABOLIC_SOURCE_KEYS),'Sai sáu nguồn.');
  const ids=new Set<string>();
  p.referenceSessions.forEach((s:Obj,si:number)=>{
    const expectedNumber=si<4?24+si:null,circuit=si===5;
    check(s.sessionNumber===expectedNumber,'Không tự sửa số buổi mờ hoặc đổi số chắc.');
    check(equal(s.sessionNumberCandidates,si===4?[19,29]:si===5?[20,30]:[]),'Không chọn một ứng viên làm số đã xác minh.');
    check(s.sessionKey===(si<4?`initial:${24+si}`:`unresolved:${s.sourceId}`),'Sai khóa nguồn ổn định.');
    check(s.numberReviewStatus===(si<4?'as_transcribed':'needs_review'),'Sai trạng thái số buổi.');
    check(s.completionConfirmed===false&&s.verified===false&&s.eligibleForPlanner===false,'Nguồn không phải nhật ký hoàn thành.');
    check(equal(Object.keys(s.blocks),['RESISTANCE','CARDIO_CIRCUIT']),'Không thêm khối hoặc suy ra khởi động.');
    const rows=circuit?s.blocks.CARDIO_CIRCUIT?.stations:s.blocks.RESISTANCE;
    check(Array.isArray(rows)&&rows.length===(circuit?6:7),'Sai số dòng.');
    check(s.sessionType===(circuit?'CARDIO_CIRCUIT':'SUPERSET_REFERENCE'),'Sai dạng buổi.');
    if(si===4)check(s.yearReview?.sourceWrittenYear===2025&&s.yearReview.proposedYear===2026&&s.yearReview.resolvedYear===null&&s.yearReview.status==='needs_review','Không tự sửa năm nguồn.');
    const labels=circuit?['1','2','3','4','5','6']:['a1','a2','b1','b2','c1','c2','d1'];
    rows.forEach((r:Obj,ri:number)=>{
      check(r.sourceRowId===`${s.sourceId}_r${ri+1}`&&!ids.has(r.sourceRowId),'Sai hoặc trùng ID dòng.');
      ids.add(r.sourceRowId);
      check(r.sourceLabel===labels[ri]&&r.order===ri+1,'Sai thứ tự dòng.');
      check(r.verified===false&&r.eligibleForPlanner===false&&r.reviewStatus==='needs_review'&&r.clinicalNotesVerified===false,'Không xác minh dòng tự động.');
      check(equal(r.volume,parseMetabolicVolume(r.volume.raw)),'Không kế thừa hoặc thay volume.');
      check(equal(r.load,parseMetabolicLoad(r.load.raw,r.numericLoadInterpretation)),'Không tự sửa tải hoặc đơn vị.');
      check(r.restRaw===null&&r.restSeconds===null&&r.durationSeconds===null,'Nguồn không có thời gian nghỉ hoặc thời lượng từng dòng.');
      check(r.supersetGroup===(circuit?null:labels[ri][0])&&r.supersetOrder===(circuit?null:Number(labels[ri][1])),'Sai vị trí cặp.');
      check(Array.isArray(r.contextContraindications)&&r.contextContraindications.length>0,'Thiếu lưu ý thẩm định theo bối cảnh.');
    });
    if(circuit){
      const c=s.blocks.CARDIO_CIRCUIT;
      check(c.rounds===3&&c.secondsPerStation===null&&c.totalDurationSeconds===null&&c.restBetweenStationsSeconds===null&&c.restBetweenRoundsSeconds===null,'Không tự thêm định lượng circuit.');
      check(s.blocks.RESISTANCE.length===0&&s.supersets.length===0,'Circuit là buổi riêng, không phải cặp liên hoàn.');
    }else check(s.blocks.CARDIO_CIRCUIT===null&&equal(s.supersets,groupsFor(rows)),'Không sửa volume hoặc nghỉ cấp cặp, không thêm d2.');
  });
  const all=metabolicRows(p);
  const unresolved=all.find(r=>r.sourceId==='metabolic_a7'&&r.sourceLabel==='c2');
  check(unresolved?.exerciseId==='ex_metabolic_unknown_machine_a7_c2'&&unresolved.mappingStatus==='unresolved_source_name','Không đoán tên máy mờ.');
  const station=all.find(r=>r.sourceId==='metabolic_a8'&&r.sourceLabel==='2');
  check(station?.exerciseId==='ex_metabolic_unknown_circuit_a8_2'&&station.mappingStatus==='unresolved_source_name','Không đoán trạm mờ.');
}
/** Chặn riêng số buổi null: chỉ hai nguồn chưa rõ của chương trình đã được kiểm tra mới được chấp nhận. */
export function unresolvedMetabolicSession(p: Obj,s: Obj): boolean {
  return p.id===METABOLIC_PROGRAM_ID && s.sessionNumber===null &&
    ['metabolic_a7','metabolic_a8'].includes(s.sourceId) && s.numberReviewStatus==='needs_review' &&
    s.sessionKey===`unresolved:${s.sourceId}`;
}
