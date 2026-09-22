import { validateWeightGainProgram } from './weightGainProgram';
/** Thư viện nguồn tham chiếu; module này không tạo giáo án hoặc ghi dữ liệu hội viên. */
export type DataObject = Record<string, any>;
function record(value:unknown, name:string):DataObject {
  if(!value || typeof value!=='object' || Array.isArray(value)) throw new Error(`${name}: phải là object.`);
  return value as DataObject;
}
function entities(value:unknown,name:string):DataObject[] {
  if(!Array.isArray(value)) throw new Error(`${name}: phải là mảng.`);
  const rows=value.map(x=>record(x,name)), ids=new Set<string>();
  for(const r of rows) {
    if(typeof r.id!=='string' || !/^[a-z][a-z0-9_]*$/.test(r.id) || ids.has(r.id)) throw new Error(`${name}: ID thiếu, trùng hoặc không hợp lệ.`);
    ids.add(r.id);
  }
  return rows;
}
export function referenceRows(value:unknown):DataObject[] {
  if(Array.isArray(value))return value.flatMap(referenceRows);
  if(!value || typeof value!=='object')return [];
  const obj=value as DataObject;
  return [...('exerciseId' in obj?[obj]:[]),...Object.values(obj).flatMap(referenceRows)];
}
const SOURCE_ID='prog_fitness_flexibility_pt30';
export function validateTrainingPrograms(value:unknown) {
  const root=record(value,'Thư viện');
  if(!Number.isInteger(root.version)||root.version<1)throw new Error('Version phải là số nguyên dương.');
  const programs=entities(root.programs,'programs'),exercises=entities(root.exercises,'exercises'),equipment=entities(root.equipmentReferences,'equipmentReferences');
  const exerciseIds=new Set(exercises.map(e=>e.id)),programIds=new Set(programs.map(e=>e.id)),equipmentIds=new Set(equipment.map(e=>e.id));
  for(const p of programs) {
    validateWeightGainProgram(p);
    if(!Array.isArray(p.referenceSessions))throw new Error('Thiếu mảng buổi tham chiếu.');
    const sessionIds=new Set<number>();
    for(const s of p.referenceSessions) {
      if(!Number.isInteger(s.sessionNumber)||s.sessionNumber<1||sessionIds.has(s.sessionNumber))throw new Error('Số buổi trùng hoặc không hợp lệ.');
      sessionIds.add(s.sessionNumber);
      for(const row of referenceRows(s))if(!exerciseIds.has(row.exerciseId))throw new Error(`Bài chưa có định nghĩa: ${row.exerciseId}.`);
    }
    if(p.id===SOURCE_ID) {
      if(p.targetProfile?.containsMinors!==true||p.verified!==false||p.eligibleForPlanner!==false||p.reviewStatus!=='needs_review')
        throw new Error('Nguồn vị thành niên không được tự xác minh hoặc đưa vào planner.');
      if(p.minorSafetyProtocol?.appliesToAgeUnder!==18 || p.aiAssistantGuardrails?.handoverTag!=='HEALTH_RISK')
        throw new Error('Thiếu quy tắc vị thành niên.');
      if(p.referenceSessions.length!==5 || [...sessionIds].sort().join(',')!=='1,2,3,4,5')throw new Error('Nguồn chỉ có đúng buổi 1-5.');
      for(const s of p.referenceSessions) {
        if(s.completionConfirmed!==false||s.eligibleForPlanner!==false)throw new Error('Buổi tham chiếu không phải nhật ký hoàn thành.');
        for(const row of referenceRows(s)) {
          const v=record(row.volume,'Volume'),l=record(row.load,'Load');
          if(v.raw===null && [v.sets,v.repetitions,v.holdSeconds].some(x=>x!==null))throw new Error('Không điền định lượng vào ô trống.');
          if(v.repetitions!==null&&v.holdSeconds!==null)throw new Error('Không gộp số lần và thời gian giữ.');
          if(l.unit!==null)throw new Error('Không tự thêm kg hoặc đơn vị tải.');
          if(l.raw===null && (l.value!==null||l.kind!=='not_recorded'))throw new Error('Không kế thừa tải từ dòng trước.');
          if(l.raw==='bw'&&(l.value!==null||l.kind!=='bodyweight'))throw new Error('Không quy đổi bw thành kg.');
          if(l.raw!==null&&l.raw!=='bw'&&(l.kind!=='machine_marker_as_supplied'||Number(l.raw)!==l.value))throw new Error('Thay đổi ký hiệu tải nguồn.');
          if(row.restRaw===null&&row.restSeconds!==null)throw new Error('Không điền thời gian nghỉ thiếu.');
          if(row.treadmillSpeed && row.treadmillSpeed.unit!==null)throw new Error('Tốc độ 4.0 chưa có đơn vị.');
        }
      }
      const circuit=p.referenceSessions.find((s:DataObject)=>s.sessionNumber===5);
      const c=circuit.blocks.CARDIO_CIRCUIT;
      if(circuit.sessionType!=='CARDIO_CIRCUIT'||c.rounds!==3||c.secondsPerStation!==60||c.stations.length!==5||c.derivedWorkSeconds!==900)
        throw new Error('Cấu trúc circuit không khớp nguồn.');
      const alternatives=p.referenceSessions[0].blocks.COOL_DOWN[0];
      if(alternatives.selection!=='ONE_OF'||alternatives.alternatives.length!==2)throw new Error('Phải giữ lựa chọn hoặc, không cộng hai phần.');
    }
  }
  for(const e of exercises) {
    if(!Array.isArray(e.requiredEquipmentIds))throw new Error('Thiếu tham chiếu thiết bị.');
    for(const id of e.requiredEquipmentIds)if(!equipmentIds.has(id))throw new Error(`Thiết bị tham chiếu chưa khai báo: ${id}.`);
    for(const use of e.programUsage??[])if(!programIds.has(use.programId))throw new Error(`Lộ trình chưa định nghĩa: ${use.programId}.`);
  }
  return {programCount:programs.length,exerciseCount:exercises.length,equipmentReferenceCount:equipment.length,
    referenceCount:programs.reduce((n,p)=>n+referenceRows(p.referenceSessions).length,0)};
}
/** Ghép không phá dữ liệu cũ: cùng program ID khác nội dung là conflict; bài cũ chỉ bổ sung programUsage. */
export function mergeTrainingPrograms(previous:DataObject|null,incoming:DataObject):DataObject {
  if(previous===null){const result=structuredClone(incoming);result.version=1;validateTrainingPrograms(result);return result;}
  const result=structuredClone(previous);let changed=false;
  for(const key of ['programs','equipmentReferences','exercises']){
    const old=entities(result[key],key), additions=entities(incoming[key],key);
    for(const value of additions){
      const found=old.find(e=>e.id===value.id);
      if(!found){old.push(structuredClone(value));changed=true;continue;}
      if(key==='programs'&&JSON.stringify(found)!==JSON.stringify(value))throw new Error(`Xung đột lộ trình ${value.id}; không ghi đè.`);
      if(key==='exercises'){
        const uses=found.programUsage??[];
        for(const use of value.programUsage??[]){
          if(!uses.some((u:unknown)=>JSON.stringify(u)===JSON.stringify(use))){uses.push(structuredClone(use));changed=true;}
        }
        if(uses.length)found.programUsage=uses;
      }
      // Metadata thiết bị/bài đã có do người dùng quản lý được giữ nguyên.
    }
    result[key]=old;
  }
  result.version=changed?previous.version+1:previous.version;
  validateTrainingPrograms(result);return result;
}
