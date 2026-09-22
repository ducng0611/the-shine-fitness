
/** Số hóa nguồn do người dùng cung cấp, không tạo chỉ định hoặc ghi hồ sơ hội viên. */
type Obj = Record<string, any>;
export const WEIGHT_GAIN_PROGRAM_ID = 'prog_weight_gain_pt50';
const GROUPS = ['WARM_UP','CORE_TRAIN','BALANCE','RESISTANCE','COOL_DOWN'];
const NUMBERS = [1,2,3,12,13];
export function weightGainRows(program:Obj):Obj[] {
  return program.referenceSessions.flatMap((s:Obj)=>Object.values(s.blocks).flat() as Obj[]);
}
function assert(condition:unknown,message:string):asserts condition {
  if(!condition) throw new Error(`Lộ trình tăng cân: ${message}`);
}
function parseVolume(raw:string|null):Obj {
  if(raw===null)return {raw:null,sets:null,repetitions:null,holdSeconds:null};
  const m=/^(\d+) x (\d+)(s)?$/.exec(raw);
  assert(m,'Volume không đúng quy ước nguồn.');
  return {raw,sets:Number(m[1]),repetitions:m[3]?null:Number(m[2]),holdSeconds:m[3]?Number(m[2]):null};
}
function parseLoad(raw:string|null,kind:string|null):Obj {
  if(raw===null)return {raw:null,kind:'not_recorded',value:null,unit:null,candidateValue:null,certainty:'not_recorded'};
  if(raw==='bw')return {raw,kind:'bodyweight',value:null,unit:null,candidateValue:null,certainty:'as_transcribed'};
  if(raw.includes('chữ mờ'))return {raw,kind:'uncertain_machine_marker',value:null,unit:null,candidateValue:26,certainty:'uncertain',reviewStatus:'needs_review'};
  assert(Number.isFinite(Number(raw))&&Number(raw)>=0,'Mức tải nguồn không hợp lệ.');
  return {raw,kind:kind==='kg'?'external_mass':kind==='machine'?'machine_marker_as_supplied':'numeric_unit_unconfirmed',
    value:Number(raw),unit:kind==='kg'?'kg':null,candidateValue:null,certainty:'as_transcribed',
    measurementScope:kind==='kg'?'per_implement_or_total_unconfirmed':null};
}
/** Tạo phần bổ sung; khi đã có ID, chỉ chuẩn bị usage mới, không thay metadata cũ. */
export function buildWeightGainAddition(source:Obj, existing:Obj):Obj {
  assert(source?.sourceId==='weight_gain_user_transcription_v1','Sai nguồn.');
  assert(Array.isArray(source.sessions)&&source.sessions.length===5,'Cần đúng năm buổi nguồn.');
  const program=structuredClone(source.program), now=program.updatedAt;
  const mappings=new Map<string,Obj>(source.exerciseMappings.map((m:Obj)=>[m.sourceName,m]));
  const definitions=new Map<string,Obj>();
  program.referenceSessions=source.sessions.map((s:Obj)=>{
    const blocks:Record<string,Obj[]>=Object.fromEntries(GROUPS.map(k=>[k,[]]));
    s.rows.forEach((tuple:any[],index:number)=>{
      assert(tuple.length===5,'Mỗi dòng phải giữ đủ năm cột gốc.');
      const [block,rawName,rawVolume,rawLoad,rawRest]=tuple;
      assert(GROUPS.includes(block),'Khối không có trong quy ước.');
      const name=rawName.replace(/^(?:[a-d][12]|[a-e]|\d+)\.\s*/,'');
      const mapping=mappings.get(name);assert(mapping,`Chưa có ánh xạ tên bài: ${name}`);
      const marker=s.sessionNumber>=12&&block==='RESISTANCE'?/^([a-d])([12])\.\s/.exec(rawName):null;
      const minutes=/(\d+) phút/.exec(rawName), speed=/tốc độ ([\d.]+)/.exec(rawName);
      const row:Obj={
        sourceRowId:`wg_s${s.sessionNumber}_r${index+1}`,sourceSection:s.sourceSection,
        exerciseId:mapping.exerciseId,sourceExerciseName:rawName,nameVi:mapping.nameVi,
        volume:parseVolume(rawVolume),load:parseLoad(rawLoad,mapping.numericLoadInterpretation),
        restRaw:rawRest,restSeconds:rawRest===null?null:Number(rawRest),
        durationSeconds:minutes?Number(minutes[1])*60:null,
        treadmillSpeed:speed?{raw:speed[1],value:Number(speed[1]),unit:null}:null,
        sourceStatus:'user_transcription',reviewStatus:'needs_review',verified:false,
        eligibleForPlanner:false,mappingStatus:name==='Side Kick'?'proposed_alias_needs_review':'name_reference',
        supersetGroup:marker?marker[1]:null,supersetOrder:marker?Number(marker[2]):null,
        sourceLabel:marker?marker[0].trim().replace('.',''):null,
        note:name==='Side Kick'?'Tái sử dụng ID Side Band Kick theo đề nghị, chưa xác nhận cùng biến thể hoặc có dây.':null
      };
      blocks[block].push(row);
      if(!definitions.has(mapping.exerciseId)) {
        const previous=(existing.exercises??[]).find((e:Obj)=>e.id===mapping.exerciseId);
        definitions.set(mapping.exerciseId,previous?{...structuredClone(previous),programUsage:[]}:{
          id:mapping.exerciseId,name:`${mapping.nameVi} (${name})`,nameEn:name,aliases:[name],
          category:mapping.category,targetMuscles:[],primaryMuscle:'Chưa được huấn luyện viên xác minh',secondaryMuscles:[],
          requiredEquipmentIds:mapping.equipmentReferenceIds,difficulty:'unassessed',movementPattern:null,
          instructions:[],trainerCues:[],contraindications:[],
          reviewNotes:'Nguồn chỉ có tên bài và định lượng từng dòng. Chưa có hướng dẫn kỹ thuật hoặc chống chỉ định được HLV duyệt; mảng rỗng không có nghĩa an toàn.',
          programUsage:[],reviewStatus:'needs_review',verified:false,revision:1,createdAt:now,updatedAt:now
        });
      }
      definitions.get(mapping.exerciseId)!.programUsage.push({
        programId:program.id,sessionNumber:s.sessionNumber,block,sourceRowId:row.sourceRowId,sourceExerciseName:rawName,
        sourceVolume:rawVolume,sourceLoad:rawLoad,loadUnit:row.load.unit,restSeconds:row.restSeconds,durationSeconds:row.durationSeconds,
        supersetGroup:row.supersetGroup,supersetOrder:row.supersetOrder,
        mappingStatus:row.mappingStatus,proposedAlias:name==='Side Kick'?'side kick':null,prescription:false
      });
    });
    const supersets:Obj[]=[];
    for(const group of ['a','b','c','d']) {
      const members=blocks.RESISTANCE.filter(r=>r.supersetGroup===group);
      if(!members.length)continue;
      const anchor=members.find(r=>r.supersetOrder===1);
      assert(anchor,'Thiếu bài đầu cặp.');
      supersets.push({
        group,memberRowIds:members.map(r=>r.sourceRowId),
        status:members.length===2?'pair_as_reported':'incomplete_source_group',
        volumeAnchorRowId:anchor.sourceRowId,volumeRawAsRecorded:anchor.volume.raw,
        restAfterGroupSeconds:anchor.restSeconds,restAnchorRowId:anchor.sourceRowId,
        restPosition:'after_group',interpretationSource:'A2, quy ước do người dùng cung cấp',
        secondExerciseVolumeConfirmed:false,
        note:members.length===2?'Nghỉ sau cặp theo A2. Không tự điền volume/rest trống ở bài thứ hai.':'Nguồn chỉ ghi d1, chưa có d2 hoặc định lượng; không tạo bài bổ sung.'
      });
    }
    return {sessionNumber:s.sessionNumber,phaseId:s.phaseId,sourceSection:s.sourceSection,
      sessionType:s.sessionNumber>=12?'FULL_BODY_SUPERSET_REFERENCE':'MIXED',
      fullBodyHeading:s.fullBodyHeading,recordKind:'historical_plan',completionConfirmed:false,eligibleForPlanner:false,
      sourceNote:'Bản chép tự chứa do người dùng cung cấp; chưa đối chiếu ảnh gốc, chưa xác nhận kết quả thực hiện.',
      blocks,supersets};
  });
  const required=new Set([...definitions.values()].flatMap(e=>e.requiredEquipmentIds));
  const allEquipment=[...(existing.equipmentReferences??[]),...source.equipmentAdditions];
  const equipmentReferences=[...required].map(id=>{
    const entry=allEquipment.find((e:Obj)=>e.id===id);assert(entry,`Thiếu nhu cầu thiết bị ${id}`);return structuredClone(entry);
  });
  const result={schemaVersion:1,version:1,status:'needs_review',programs:[program],exercises:[...definitions.values()],equipmentReferences};
  validateWeightGainProgram(program);
  return result;
}
/** Kiểm tra không phụ thuộc mô hình, áp cho cả công cụ ghép và thư viện đã lưu. */
export function validateWeightGainProgram(p:Obj):void {
  if(p.id!==WEIGHT_GAIN_PROGRAM_ID)return;
  assert(p.verified===false&&p.reviewStatus==='needs_review'&&p.eligibleForPlanner===false&&p.ragRetrievalAllowed===false,'Nguồn chưa duyệt không được kích hoạt.');
  assert(p.targetProfile?.containsMinors===false&&p.targetProfile.minimumAgeForAutomatedAssessment===18,'Không mở planner cho trẻ.');
  assert(p.aiAssistantGuardrails?.handoverTag==='HEALTH_RISK','Thiếu chuyển giao an toàn.');
  assert(JSON.stringify(p.referenceSessions.map((s:Obj)=>s.sessionNumber))===JSON.stringify(NUMBERS),'Chỉ có buổi 1,2,3,12,13; không tự lấp lịch.');
  assert(p.scientificPrinciples?.automaticCalculationAllowed===false,'Không tự tính mục tiêu cá nhân.');
  for(const key of ['calorieSurplusKcalPerDay','targetWeightGainKgPerWeek','proteinGramPerKgBodyweight','hypertrophyRepRange','reserveInReps'])
    assert(p.scientificPrinciples[key]===null,`Không nâng đề xuất ${key} thành quy tắc đã duyệt.`);
  const phaseIds=new Set(p.phases.map((x:Obj)=>x.id)), seen=new Set<string>();
  for(const s of p.referenceSessions) {
    assert(phaseIds.has(s.phaseId),'Tham chiếu giai đoạn không tồn tại.');
    assert(s.phaseId===(s.sessionNumber<12?'phase_wg_01_foundation':'phase_wg_02_transition'),'Sai nhãn chuyển tiếp buổi 12.');
    assert(s.completionConfirmed===false&&s.eligibleForPlanner===false,'Buổi lịch sử không phải nhật ký thực tế.');
    assert(JSON.stringify(Object.keys(s.blocks))===JSON.stringify(GROUPS),'Khối bị thêm/bớt hoặc đổi thứ tự.');
    const rows=Object.values(s.blocks).flat() as Obj[];
    for(const row of rows){
      assert(!seen.has(row.sourceRowId),'Trùng dòng nguồn.');seen.add(row.sourceRowId);
      assert(row.verified===false&&row.eligibleForPlanner===false&&row.reviewStatus==='needs_review','Không xác minh tự động từng dòng.');
      const v=row.volume,l=row.load;
      assert(JSON.stringify(v)===JSON.stringify(parseVolume(v.raw)),'Volume bị kế thừa hoặc thay đổi so với ô nguồn.');
      if(l.raw===null)assert(l.value===null&&l.unit===null&&l.kind==='not_recorded'&&l.candidateValue===null,'Ô tải trống phải để trống.');
      else if(l.raw==='bw')assert(l.value===null&&l.unit===null&&l.kind==='bodyweight'&&l.candidateValue===null,'Không đổi bw sang kg.');
      else if(l.certainty==='uncertain')assert(l.kind==='uncertain_machine_marker'&&l.raw==='26 (chữ mờ, cần HLV xác nhận)'&&l.value===null&&l.unit===null&&l.candidateValue===26&&l.reviewStatus==='needs_review','Không làm chắc con số mờ.');
      else {
        assert(Number.isFinite(Number(l.raw))&&l.value===Number(l.raw)&&l.candidateValue===null,'Mức tải đã thay đổi.');
        assert(l.kind==='external_mass'?l.unit==='kg'&&l.measurementScope==='per_implement_or_total_unconfirmed':
          (l.kind==='machine_marker_as_supplied'||l.kind==='numeric_unit_unconfirmed')&&l.unit===null,'Sai đơn vị tải.');
        if(['ex_cable_row','ex_leg_extension','ex_lat_pulldown','ex_face_pull','ex_rope_tricep_extension','ex_straight_arm_pushdown'].includes(row.exerciseId))
          assert(l.kind==='machine_marker_as_supplied'&&l.unit===null,'Tải máy không phải kg.');
        if(['ex_hip_thrust','ex_rear_delt_fly','ex_standing_overhead_shoulder_press'].includes(row.exerciseId))
          assert(l.kind==='numeric_unit_unconfirmed'&&l.unit===null,'Chưa có căn cứ xác định dụng cụ hoặc kg.');
      }
      assert(row.restRaw===null?row.restSeconds===null:row.restSeconds===Number(row.restRaw),'Không kế thừa hoặc thay thời gian nghỉ.');
      if(row.treadmillSpeed)assert(row.treadmillSpeed.unit===null&&row.treadmillSpeed.raw==='4.5'&&row.treadmillSpeed.value===4.5,'Không tự thêm đơn vị tốc độ.');
      const match=s.sessionNumber>=12?/^([a-d])([12])\.\s/.exec(row.sourceExerciseName):null;
      assert(row.supersetGroup===(match?match[1]:null)&&row.supersetOrder===(match?Number(match[2]):null),'Cặp không khớp nhãn nguồn.');
      if(row.supersetOrder===2)assert(v.raw===null&&row.restRaw===null,'Không điền ô bài thứ hai trong cặp.');
    }
    const expectedGroups=s.sessionNumber>=12?['a','b','c','d']:[];
    assert(JSON.stringify(s.supersets.map((g:Obj)=>g.group))===JSON.stringify(expectedGroups),'Sai danh sách cặp.');
    for(const g of s.supersets) {
      const members=s.blocks.RESISTANCE.filter((r:Obj)=>r.supersetGroup===g.group);
      assert(JSON.stringify(g.memberRowIds)===JSON.stringify(members.map((r:Obj)=>r.sourceRowId)),'Cặp tham chiếu sai bài.');
      assert(g.restPosition==='after_group'&&g.secondExerciseVolumeConfirmed===false,'Không nghỉ giữa cặp hoặc suy volume bài hai.');
      assert(g.volumeAnchorRowId===members[0].sourceRowId&&g.restAnchorRowId===members[0].sourceRowId&&
        g.restAfterGroupSeconds===members[0].restSeconds&&g.volumeRawAsRecorded===members[0].volume.raw,'Sai anchor cặp.');
      const incomplete=s.sessionNumber===12&&g.group==='d';
      assert(g.status===(incomplete?'incomplete_source_group':'pair_as_reported')&&members.length===(incomplete?1:2),'Không tạo d2 còn thiếu.');
    }
  }
  assert(seen.size===51,'Số dòng nguồn phải là 51.');
  const ambiguous=p.referenceSessions[3].blocks.RESISTANCE[1];
  assert(ambiguous.exerciseId==='ex_hip_abduction'&&ambiguous.load.certainty==='uncertain','Phải giữ nghi vấn Hip Abduction.');
  assert(p.referenceSessions[3].blocks.RESISTANCE[0].mappingStatus==='proposed_alias_needs_review','Side Kick chưa được khẳng định là bài có dây.');
  assert(p.referenceSessions[4].blocks.WARM_UP[0].durationSeconds===null,'Không tự đặt thời lượng khởi động buổi 13.');
}
