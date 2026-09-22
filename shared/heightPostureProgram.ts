/**
 * Nguồn chiều cao/tư thế: số hóa, không chẩn đoán, không tạo giáo án hoặc ghi hội viên.
 * Giữ khóa kép chu kỳ gói + số buổi và vị trí nhóm trên biểu mẫu.
 */
type Obj = Record<string, any>;
export const HEIGHT_POSTURE_PROGRAM_ID = 'prog_height_posture_pt25';
export const HEIGHT_GROUPS = ['WARM_UP','GAME','PLYOMETRICS','DECOMPRESSION','RESISTANCE','STRETCH','COOL_DOWN'] as const;
export const HEIGHT_SESSION_KEYS = ['initial:21','initial:22','initial:23','initial:24','renewal_1:4','renewal_1:5'];
const EXPECTED_ROW_COUNTS = [7,7,9,7,9,9];
function requireThat(value: unknown, message: string): asserts value {
  if (!value) throw new Error(`Lộ trình chiều cao và tư thế: ${message}`);
}
export function heightSessionKey(session: Obj): string {
  return `${session.packageCycle}:${session.sessionNumber}`;
}
/** Chỉ chuẩn hóa ký hiệu thực sự có trong nguồn, không kế thừa từ hàng trước. */
export function parseHeightVolume(raw: string | null, exerciseId: string): Obj {
  const out: Obj = {raw,kind:'not_recorded',sets:null,setsRange:null,repetitions:null,holdSeconds:null,
    holdAfterRepetitionSeconds:null,sidePolicy:'not_recorded',durationSeconds:null,durationRangeSeconds:null,
    durationPerSetSeconds:null,totalPlannedDurationSeconds:null,rounds:null,additionalSeconds:null,unresolvedValue:null};
  if(raw === null) return out;
  requireThat(typeof raw === 'string' && raw.length > 0,'Volume không hợp lệ.');
  if(exerciseId === 'ex_lung_meridian') {
    requireThat(raw==='2 x 20','Ký hiệu Lung Meridian thay đổi, cần đối chiếu nguồn.');
    return {...out,kind:'ambiguous_unit',sets:2,unresolvedValue:20};
  }
  if(raw==='6 lượt + 30 giây') return {...out,kind:'mixed_game_notation',rounds:6,additionalSeconds:30};
  if(raw==='3 đến 4 phút') return {...out,kind:'duration_range',durationRangeSeconds:{min:180,max:240}};
  if(raw==='2 x 4 phút') return {...out,kind:'timed_sets',sets:2,durationPerSetSeconds:240,totalPlannedDurationSeconds:480};
  const range=/^(\d+)-(\d+) x (\d+)$/.exec(raw);
  if(range) return {...out,kind:'repetitions_set_range',setsRange:{min:+range[1],max:+range[2]},repetitions:+range[3]};
  const reps=/^(\d+) x (\d+)(?: \(giữ (\d+) giây\))?$/.exec(raw);
  if(reps) return {...out,kind:'repetitions',sets:+reps[1],repetitions:+reps[2],holdAfterRepetitionSeconds:reps[3]?+reps[3]:null};
  const timed=/^(?:(\d+) x )?(\d+)s( mỗi bên)?$/.exec(raw);
  if(timed) return {...out,kind:'hold',sets:timed[1]?+timed[1]:null,holdSeconds:+timed[2],
    sidePolicy:timed[3]?'each_side_as_reported':'not_recorded'};
  throw new Error('Ký hiệu định lượng chưa được hỗ trợ; không tự đoán.');
}
export function parseHeightLoad(raw: string | null): Obj {
  if(raw===null) return {raw:null,value:null,unit:null,kind:'not_recorded'};
  if(raw==='bw') return {raw,value:null,unit:null,kind:'bodyweight'};
  requireThat(/^\d+(?:\.\d+)?$/.test(raw),'Ký hiệu tải không hợp lệ.');
  return {raw,value:Number(raw),unit:null,kind:'numeric_unit_unconfirmed'};
}
function uncertaintyFor(key:string, exerciseId:string):Obj[] {
  if(key==='initial:23' && exerciseId==='ex_sticky_jump')
    return [{field:'jumpDistance',value:null,unit:null,reviewStatus:'needs_review',note:'Khoảng cách nhảy chưa đọc chắc; cần huấn luyện viên xác nhận.'}];
  if(key==='renewal_1:4' && exerciseId==='ex_wizards_path_game')
    return [{field:'gameRounds',value:null,unit:null,reviewStatus:'needs_review',note:'Số lượt trò chơi chưa đọc chắc; cần huấn luyện viên xác nhận.'}];
  if(exerciseId==='ex_lung_meridian')
    return [{field:'volumeUnitAndVariant',value:null,unit:null,reviewStatus:'needs_review',note:'Chưa xác định 20 là số lần hay thời gian và chưa có mô tả biến thể.'}];
  return [];
}
export function heightRows(program:Obj):Obj[] {
  return program.referenceSessions.flatMap((s:Obj)=>HEIGHT_GROUPS.flatMap(g=>s.blocks[g]));
}
export function buildHeightPostureAddition(source:Obj, existing:Obj):Obj {
  requireThat(source.sourceId==='height_posture_user_transcription_v1','Sai nguồn.');
  requireThat(Array.isArray(source.sessions)&&source.sessions.length===6,'Phải có đúng sáu buổi.');
  const program=structuredClone(source.program),definitions=new Map<string,Obj>();
  const mappings=new Map<string,Obj>(source.exerciseMappings.map((m:Obj)=>[m.sourceName,m]));
  requireThat(mappings.size===source.exerciseMappings.length,'Trùng tên ánh xạ nguồn.');
  program.referenceSessions=source.sessions.map((s:Obj)=>{
    const key=heightSessionKey(s),blocks:Record<string,Obj[]>=Object.fromEntries(HEIGHT_GROUPS.map(g=>[g,[]]));
    const present:string[]=[];
    s.rows.forEach((tuple:unknown[],index:number)=>{
      requireThat(Array.isArray(tuple)&&tuple.length===5,'Mỗi dòng cần đủ năm cột.');
      const [group,rawName,rawVolume,rawLoad,rawRest]=tuple as [string,string,string|null,string|null,string|null];
      requireThat((HEIGHT_GROUPS as readonly string[]).includes(group),'Nhóm nguồn không được hỗ trợ.');
      requireThat(typeof rawName==='string','Tên bài không hợp lệ.');
      const normalizedName=rawName.replace(/^\d+\.\s*/,'');
      const m=mappings.get(normalizedName);requireThat(m,`Thiếu ánh xạ: ${normalizedName}`);
      if(!present.includes(group))present.push(group);
      const row:Obj={
        sourceRowId:`hp_${s.packageCycle}_s${s.sessionNumber}_r${index+1}`,
        sourceSection:s.sourceSection,sourceOrder:index+1,
        sourceTable:group==='WARM_UP'?'WARM_UP':group==='COOL_DOWN'?'COOL_DOWN':'RESISTANCE_EXERCISE',
        sourceGroup:group,exerciseId:m.exerciseId,sourceExerciseName:rawName,nameVi:m.nameVi,
        volume:parseHeightVolume(rawVolume,m.exerciseId),load:parseHeightLoad(rawLoad),
        restRaw:rawRest,restSeconds:rawRest===null?null:Number(rawRest),
        interpretationBasis:'Bản chép và quy ước A2 của chính lộ trình này.',
        uncertainties:uncertaintyFor(key,m.exerciseId),
        gamePointsNote:m.exerciseId==='ex_tower_defense_game'?{raw:'5 điểm',ruleValue:5,achievedScore:null}:null,
        tempo:m.sourceName.includes('(tempo)')?{asRecorded:true,phaseSeconds:null}:null,
        classificationBasis:'Vị trí nguồn, không xác minh tác dụng sinh lý hoặc trị liệu.',
        mappingStatus:'name_reference_needs_review',reviewStatus:'needs_review',verified:false,eligibleForPlanner:false
      };
      blocks[group].push(row);
      if(!definitions.has(m.exerciseId)) {
        const old=(existing.exercises??[]).find((e:Obj)=>e.id===m.exerciseId);
        definitions.set(m.exerciseId,old?{...structuredClone(old),programUsage:[]}:{
          id:m.exerciseId,name:`${m.nameVi} (${normalizedName})`,nameEn:normalizedName,
          aliases:[normalizedName],category:m.category,targetMuscles:[],
          primaryMuscle:'Chưa được huấn luyện viên xác minh',secondaryMuscles:[],
          requiredEquipmentIds:m.equipmentReferenceIds,
          difficulty:'unassessed',movementPattern:m.exerciseId==='ex_box_breathing'?'breathing':null,
          instructions:[],trainerCues:[],contraindications:[],
          reviewNotes:'Tên/nhóm theo nguồn, chưa có hướng dẫn kỹ thuật hay chống chỉ định được duyệt. Nhóm Giải nén cột sống không xác nhận tác dụng giải nén.',
          definitionScope:m.category==='Trò chơi vận động'?'game_reference':'exercise_reference',
          programUsage:[],reviewStatus:'needs_review',verified:false,revision:1,
          createdAt:program.createdAt,updatedAt:program.updatedAt
        });
      }
      definitions.get(m.exerciseId)!.programUsage.push({
        programId:program.id,packageCycle:s.packageCycle,sessionNumber:s.sessionNumber,
        block:group,sourceRowId:row.sourceRowId,sourceExerciseName:rawName,
        sourceVolume:rawVolume,sourceLoad:rawLoad,loadUnit:null,restSeconds:row.restSeconds,
        sidePolicy:row.volume.sidePolicy,prescription:false
      });
    });
    return {packageCycle:s.packageCycle,sessionNumber:s.sessionNumber,sessionKey:key,
      sourceSection:s.sourceSection,sessionType:'YOUTH_MOVEMENT_HISTORICAL_REFERENCE',
      recordKind:'historical_plan',completionConfirmed:false,eligibleForPlanner:false,
      reviewStatus:'needs_review',verified:false,sourceGroupPresence:present,
      groupPlacementVerified:false,sourceNote:'Nguồn do người dùng chép; chưa đối chiếu tài liệu gốc hoặc xác nhận buổi đã hoàn thành.',blocks};
  });
  for(const ex of definitions.values()) {
    if(!(existing.exercises??[]).some((e:Obj)=>e.id===ex.id) && ex.category==='Linh hoạt') {
      const observations=[...new Set(ex.programUsage.map((u:Obj)=>u.sourceVolume).filter((x:any)=>x!==null))];
      ex.instructions=observations.map(v=>`Ghi nhận nguồn: ${v}. Xem programUsage để biết đúng buổi; đây không phải chỉ dẫn thực hiện đã duyệt.`);
    }
  }
  const refs=[...(existing.equipmentReferences??[]),...source.equipmentAdditions];
  const required=[...new Set([...definitions.values()].flatMap(e=>e.requiredEquipmentIds))];
  const equipmentReferences=required.map(id=>{
    const ref=refs.find((x:Obj)=>x.id===id);requireThat(ref,`Thiếu tham chiếu thiết bị ${id}`);
    return structuredClone(ref);
  });
  validateHeightPostureProgram(program);
  return {schemaVersion:1,version:1,status:'needs_review',programs:[program],exercises:[...definitions.values()],equipmentReferences};
}
export function validateHeightPostureProgram(p:Obj):void {
  if(p.id!==HEIGHT_POSTURE_PROGRAM_ID)return;
  requireThat(p.reviewStatus==='needs_review'&&p.verified===false&&p.eligibleForPlanner===false&&p.ragRetrievalAllowed===false,'Không được tự kích hoạt nguồn.');
  requireThat(p.goal==='HEIGHT_POSTURE'&&p.framing?.noWeightLossPrescription===true&&p.framing?.medicalIndicationEstablished===false,'Không chuyển thành giáo án giảm cân hoặc chỉ định y khoa.');
  requireThat(p.targetProfile?.containsMinors===true&&p.targetProfile.automatedMinorPlanningAllowed===false,'Không mở planner cho trẻ.');
  requireThat(p.targetProfile.recommendedFrequencyPerWeek===null,'Lịch nguồn chưa phải khuyến nghị.');
  requireThat(p.minorSafetyProtocol?.appliesToAgeUnder===18&&p.minorSafetyProtocol.guardianConsentVerified===false&&p.minorSafetyProtocol.medicalClearanceVerified===false,'Không suy ra đồng ý hoặc khám sàng lọc.');
  requireThat(p.scientificBasis?.noHeightGuarantee===true&&p.scientificBasis.automaticApplicationAllowed===false&&p.scientificBasis.clinicalBmiClassification===null,'Không bảo đảm chiều cao hoặc phân loại BMI.');
  requireThat(p.aiAssistantGuardrails?.handoverTag==='HEALTH_RISK','Thiếu chuyển giao.');
  requireThat(p.privateTrackingPolicy?.dailySourceValuesIncluded===false&&p.privateTrackingPolicy.publicIndividualObservationsIncluded===false&&p.privateTrackingPolicy.passiveSleepInferenceAllowed===false,'Không công khai dữ liệu theo dõi riêng hoặc suy giấc ngủ.');
  requireThat(Array.isArray(p.referenceSessions)&&JSON.stringify(p.referenceSessions.map(heightSessionKey))===JSON.stringify(HEIGHT_SESSION_KEYS),'Sai sáu khóa chu kỳ và buổi nguồn.');
  const ids=new Set<string>();
  p.referenceSessions.forEach((s:Obj,si:number)=>{
    requireThat(s.sessionKey===heightSessionKey(s),'Sai khóa kép của buổi.');
    requireThat(s.completionConfirmed===false&&s.eligibleForPlanner===false&&s.verified===false,'Không ghi thành lịch sử hoàn thành.');
    requireThat(JSON.stringify(Object.keys(s.blocks))===JSON.stringify(HEIGHT_GROUPS),'Không đổi thứ tự hoặc loại nhóm.');
    const rows=HEIGHT_GROUPS.flatMap(g=>s.blocks[g]);
    requireThat(rows.length===EXPECTED_ROW_COUNTS[si],'Không thêm hoặc bỏ dòng nguồn.');
    const present=HEIGHT_GROUPS.filter(g=>s.blocks[g].length>0);
    requireThat(JSON.stringify(present)===JSON.stringify(s.sourceGroupPresence),'Sai trạng thái nhóm có ghi trong nguồn.');
    rows.forEach((row:Obj,index:number)=>{
      requireThat(row.sourceRowId===`hp_${s.packageCycle}_s${s.sessionNumber}_r${index+1}`&&!ids.has(row.sourceRowId),'Dòng nguồn trùng hoặc sai thứ tự.');
      ids.add(row.sourceRowId);
      requireThat(row.sourceOrder===index+1&&s.blocks[row.sourceGroup]?.includes(row),'Sai vị trí nhóm nguồn.');
      requireThat(row.sourceTable===(row.sourceGroup==='WARM_UP'?'WARM_UP':row.sourceGroup==='COOL_DOWN'?'COOL_DOWN':'RESISTANCE_EXERCISE'),'Không chuyển dòng sang bảng khác.');
      requireThat(row.verified===false&&row.eligibleForPlanner===false&&row.reviewStatus==='needs_review','Không xác minh tự động từng dòng.');
      requireThat(JSON.stringify(row.volume)===JSON.stringify(parseHeightVolume(row.volume.raw,row.exerciseId)),'Volume bị điền thêm hoặc chuẩn hóa sai.');
      requireThat(JSON.stringify(row.load)===JSON.stringify(parseHeightLoad(row.load.raw)),'Không thêm kg, quy đổi bw hoặc lấp tải trống.');
      requireThat(row.restRaw===null?row.restSeconds===null:/^\d+$/.test(row.restRaw)&&row.restSeconds===Number(row.restRaw),'Không kế thừa hoặc đổi thời gian nghỉ.');
      requireThat(JSON.stringify(row.uncertainties)===JSON.stringify(uncertaintyFor(s.sessionKey,row.exerciseId)),'Không giải quyết giả điểm chưa rõ.');
      if(row.exerciseId==='ex_tower_defense_game')requireThat(row.gamePointsNote?.achievedScore===null&&row.gamePointsNote.ruleValue===5,'Điểm luật không phải điểm đạt.');
      if(row.tempo)requireThat(row.tempo.phaseSeconds===null,'Không tạo nhịp tempo chưa ghi.');
    });
  });
  const get=(key:string,name:string)=>heightRows({referenceSessions:p.referenceSessions.filter((s:Obj)=>s.sessionKey===key)}).find(r=>r.sourceExerciseName===name);
  requireThat(get('renewal_1:5','2. Dead Hang + Core')?.sourceGroup==='PLYOMETRICS','Không chuyển Dead Hang khỏi nhóm nguồn.');
  requireThat(get('renewal_1:5','3. Box Breathing')?.sourceGroup==='STRETCH','Không chuyển thở cuối bảng sang COOL DOWN.');
  requireThat(get('initial:23','Bird Dog')?.volume.raw===null,'Bird Dog chưa ghi volume.');
}
