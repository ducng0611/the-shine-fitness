/** Source ingestion for the explicitly selected local QA database. Not a planner. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { PilotDatabase, writeDocument } from './sqlite';
import { normalizeSafetyText } from '../../../shared/programSafety';
import type { BuddyCitation, BuddyLanguage } from '../../../shared/buddyChat';
import { ownSourceQuery, type SourceQuery } from '../../../shared/buddySourceQuery';

type Obj = Record<string, any>;
export interface SourceField { raw: string | null; status: 'recorded'|'not_recorded'|'not_disclosed'|'reported_none'; sourceRef: string }
export interface PrivateEnrichment { schemaVersion: 1; cases: { key: string; programId: string; fields: Partial<Record<'medicalHistory'|'medications'|'medicalClearance'|'ptNotes'|'trainingGoal', SourceField>> }[] }
export interface SourceAnswer { text: string; citations: BuddyCitation[]; missingFields: string[] }
const hash = (v: unknown) => createHash('sha256').update(JSON.stringify(v)).digest('hex');
const id = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(v);
const emptyField = (): SourceField => ({ raw: null, status: 'not_recorded', sourceRef: 'Chưa có trường nguồn được nhập' });
const plain = (v: unknown) => String(v ?? '').replace(/[\x00-\x1f<>]/g, ' ').replace(/([\\`*_[\]{}()#!|])/g, '\\$1').slice(0,1600);
const array = (v: unknown): Obj[] => Array.isArray(v) ? v : [];
function row(db: any, path: string): Obj | null { const r=db.prepare('SELECT body FROM local_documents WHERE path=?').get(path); return r ? JSON.parse(String(r.body)) : null; }
function checkedList(value: unknown, label: string): Obj[] {
  if(!Array.isArray(value) || value.length > 1000) throw new Error(`Invalid source list: ${label}`);
  const seen=new Set<string>();
  for(const r of value) { if(!r || !id(r.id) || seen.has(r.id)) throw new Error(`Missing or duplicate source ID: ${label}`); seen.add(r.id); }
  return value;
}
export function validateEnrichment(value: unknown): PrivateEnrichment {
  const x=value as PrivateEnrichment;
  if(!x || Object.keys(x).some(k=>!['schemaVersion','cases'].includes(k)) || x.schemaVersion!==1 || !Array.isArray(x.cases) || x.cases.length>100) throw new Error('Invalid private enrichment');
  const seen=new Set<string>();
  for(const c of x.cases) {
    if(!c || !id(c.key)||!id(c.programId)||seen.has(c.key)||!c.fields||typeof c.fields!=='object'||Array.isArray(c.fields)) throw new Error('Invalid case enrichment');
    seen.add(c.key);
    if(Object.keys(c).some(k=>!['key','programId','fields'].includes(k))) throw new Error('Unexpected case field');
    for(const [k,f] of Object.entries(c.fields)) {
      if(!['medicalHistory','medications','medicalClearance','ptNotes','trainingGoal'].includes(k)||!f||Object.keys(f).some(p=>!['raw','status','sourceRef'].includes(p))) throw new Error('Unexpected fact field');
      if(!['recorded','not_recorded','not_disclosed','reported_none'].includes(f.status)||typeof f.sourceRef!=='string'||!f.sourceRef.trim()||f.sourceRef.length>300||!(f.raw===null||typeof f.raw==='string'&&f.raw.length<=1600)) throw new Error('Invalid fact provenance');
      if((f.status==='recorded'||f.status==='reported_none')&&!f.raw?.trim()) throw new Error('Recorded fact needs original wording');
      if((f.status==='not_recorded'||f.status==='not_disclosed')&&f.raw!==null) throw new Error('Missing fact cannot contain an inferred value');
    }
  }
  return x;
}
/** All files are fixed allowlisted paths; no directory crawling, private-file embedding or remote calls. */
export function loadSourceBundle(root: string) {
  const specs = [
    ['programs','data/companion/training_programs.json','programs'],
    ['exercises','data/companion/training_programs.json','exercises'],
    ['meals','data/nutrition/meal-plan-library.json','templates'],
    ['assets','data/companion/the-shine-gym-assets.draft.json','equipment']
  ] as const;
  const files=new Map<string,Obj>(); const lists: Record<string,Obj[]>={}; const fileHashes: Record<string,string>={};
  for(const [key,path,property] of specs) {
    if(!files.has(path)) { const raw=readFileSync(join(root,path),'utf8'); if(raw.length>4_000_000)throw new Error('Source file too large'); files.set(path,JSON.parse(raw)); fileHashes[path]=hash(raw); }
    const doc=files.get(path)!;
    lists[key]=checkedList(doc[property],key);
  }
  const exerciseIds=new Set(lists.exercises.map(e=>e.id));
  const check=(v: any): void=> { if(Array.isArray(v)) { v.forEach(check);return; } if(!v||typeof v!=='object')return; if(v.exerciseId!==undefined&&v.exerciseId!==null&&!exerciseIds.has(v.exerciseId))throw new Error('Dangling exercise reference');Object.values(v).forEach(check); };
  lists.programs.forEach(check);
  return {lists,fileHashes,sourceFiles:Object.fromEntries(specs.map(([key,path])=>[key,path]))};
}
/** Idempotent, transactional import. Existing identities, safety, consent, assignments and logs are never modified. */
export async function importSourceMemory(db: PilotDatabase, root: string, enrichment?: PrivateEnrichment, expectedRevision=0, now=Date.now()) {
  if(!Number.isSafeInteger(expectedRevision)||expectedRevision<0)throw new Error('Invalid expected revision');
  const bundle=loadSourceBundle(root), supplied=enrichment?validateEnrichment(enrichment):null;
  return db.transaction(sql=> {
    const previous=row(sql,'member_source_imports/current');
    const users=sql.prepare('SELECT uid,source_json,source_hash FROM local_users WHERE disabled=0 ORDER BY uid').all();
    const cases=users.map(u=>({uid:String(u.uid),source:JSON.parse(String(u.source_json)),sourceHash:String(u.source_hash)}));
    if(supplied?.cases.some(c=>!cases.some(u=>u.source.key===c.key&&u.source.programId===c.programId)))throw new Error('Enrichment does not match an existing source owner and program');
    const programs=new Set(bundle.lists.programs.map(p=>p.id));
    for(const c of cases) if(!id(c.uid)||!programs.has(c.source.programId))throw new Error('Account has no matching source program');
    const updates=cases.map(c=>{
      const prior=row(sql,`member_source_memory/${c.uid}`);
      if(prior&&(prior.uid!==c.uid||prior.accountSourceHash!==c.sourceHash||prior.sourceProgramId!==c.source.programId))throw new Error('Account source changed; reconciliation required');
      if(prior?.assignedProgramId||prior?.mealPlanAssignment)throw new Error('Existing assignment requires separate reconciliation');
      const input=supplied?.cases.find(e=>e.key===c.source.key);
      // An omitted enrichment preserves the previous values instead of silently clearing them.
      const fields=input?{...prior?.fields,...input.fields}:(prior?.fields??{});
      return {...c,fields};
    });
    const contentHash=hash({fileHashes:bundle.fileHashes,members:updates.map(c=>({uid:c.uid,sourceHash:c.sourceHash,fields:c.fields}))});
    if(previous?.contentHash===contentHash)return {status:'unchanged',revision:previous.revision,counts:previous.counts};
    if((previous?.revision??0)!==expectedRevision)throw new Error('Import revision conflict; inspect before replacing source snapshots');
    const revision=expectedRevision+1, importedAt=new Date(now).toISOString();
    const counts={members:updates.length,...Object.fromEntries(Object.entries(bundle.lists).map(([k,v])=>[k,v.length]))};
    for(const [kind,items] of Object.entries(bundle.lists)) for(const item of items) {
      writeDocument(sql,`member_source_${kind}/${item.id}`,{source:item,sourceFile:bundle.sourceFiles[kind],sourceHash:hash(item),importRevision:revision,importedAt,usage:'reference_only',eligibleForPlanner:false});
    }
    for(const c of updates) writeDocument(sql,`member_source_memory/${c.uid}`,{
      schemaVersion:1,uid:c.uid,accountSourceHash:c.sourceHash,sourceProfile:c.source,fields:c.fields,sourceProgramId:c.source.programId,
      sourceAssociation:'operator_linked_reference_not_assignment',assignedProgramId:null,mealPlanAssignment:null,
      importRevision:revision,importedAt,qaOnly:true,eligibleForPlanner:false
    });
    const receipt={revision,contentHash,fileHashes:bundle.fileHashes,counts,importedAt,sourceIds:Object.fromEntries(Object.entries(bundle.lists).map(([k,v])=>[k,v.map(x=>x.id)])),trainingWrites:0,assignmentWrites:0};
    writeDocument(sql,'member_source_imports/current',receipt);
    writeDocument(sql,`member_source_imports/revision_${revision}`,receipt);
    return {status:'imported',revision,counts};
  });
}

const NOTE='Đây là bản chép nguồn gắn với tài khoản QA, không phải chẩn đoán mới, kế hoạch được giao hay xác nhận đã tập. Nguồn chờ duyệt không được dùng để tự chọn bài, tải hoặc thực đơn hôm nay.';
function fieldText(label: string, f: SourceField | undefined) {
  const value=f??emptyField();
  const missing=value.status==='not_disclosed'?'Không khai báo trong nguồn; không đồng nghĩa không có.':'Chưa ghi/nhận thông tin trong nguồn.';
  return `${label}: ${value.raw!==null?plain(value.raw):missing}${value.status==='reported_none'?' (do khách ghi tại thời điểm nguồn, chưa phải xác minh y khoa).':''}`;
}
function sessionLabel(s:Obj) {return `${s.packageCycle??'initial'}:${s.sessionNumber??s.sessionNumberRaw??s.sourceSection??'chưa rõ'}`;}
function sessionRows(s:Obj) {
  const out:{block:string;r:Obj}[]=[];
  for(const [block,items] of Object.entries(s.blocks??{})) {
    const group=Array.isArray(items)?items:[items];
    for(const r of group as Obj[]) { if(!r)continue; if(Array.isArray(r.stations))r.stations.forEach((station:Obj)=>out.push({block,r:station}));else out.push({block,r}); }
  }
  return out;
}
function displaySession(s:Obj) {
  const lines=[`Buổi nguồn ${sessionLabel(s)}${s.numberReviewNote?`: ${plain(s.numberReviewNote)}`:''}.`];
  const circuit=s.blocks?.CARDIO_CIRCUIT;
  if(circuit)lines.push(`CARDIO_CIRCUIT: ${circuit.rounds??'ch\u01b0a ghi'} v\u00f2ng; ${circuit.secondsPerStation??'ch\u01b0a ghi'} gi\u00e2y m\u1ed7i tr\u1ea1m. Kh\u00f4ng t\u1ef1 \u0111i\u1ec1n th\u1eddi gian c\u00f2n thi\u1ebfu.`);
  for(const {block,r} of sessionRows(s)) {
    const volume=typeof r.volume==='object'?r.volume?.raw:r.volume;
    const load=typeof r.load==='object'?r.load?.raw:r.load;
    lines.push(`- [${plain(block)}] ${plain(r.sourceLabel??'')} ${plain(r.sourceExerciseName??r.nameVi??r.name??r.exerciseId??'Chưa đọc rõ')}: volume ${plain(volume??r.sourceVolume??'không ghi')}; load gốc ${plain(load??r.sourceLoad??'không ghi')}; rest ${plain(r.restRaw??r.sourceRest??(r.restSeconds!=null?`${r.restSeconds} giây`:'không ghi'))}.${r.mappingStatus?.includes('review')||r.load?.certainty==='uncertain'?' Cần đối chiếu nguồn.':''}`);
  }
  return lines.join('\n');
}
/** Owner-only, bounded, deterministic extraction; no private material reaches an LLM or public cache. */
export class MemberSourceReader {
  constructor(private db:PilotDatabase) {}
  snapshot(uid:string) {
    if(!id(uid))throw new Error('Invalid owner');
    return this.db.access(sql=>{
      const user=sql.prepare('SELECT uid,disabled,source_hash,source_json FROM local_users WHERE uid=?').get(uid);
      if(!user||user.disabled!==0)return null;
      const memory=row(sql,`member_source_memory/${uid}`),receipt=row(sql,'member_source_imports/current');
      if(!memory||!receipt)return null;
      if(hash(memory.sourceProfile)!==hash(JSON.parse(String(user.source_json))))throw new Error('Source profile integrity mismatch');
      validateEnrichment({schemaVersion:1,cases:[{key:memory.sourceProfile.key,programId:memory.sourceProgramId,fields:memory.fields}]});
      if(memory.uid!==uid||memory.accountSourceHash!==user.source_hash||memory.importRevision!==receipt.revision)throw new Error('Source snapshot is stale or belongs to another owner');
      const envelope=row(sql,`member_source_programs/${memory.sourceProgramId}`);
      if(!envelope||envelope.importRevision!==receipt.revision||!receipt.sourceIds.programs.includes(memory.sourceProgramId))throw new Error('Source program is unavailable');
      if(envelope.sourceHash!==hash(envelope.source))throw new Error('Source content hash mismatch');
      const assets=(receipt.sourceIds.assets as string[]).map(assetId=>{
        const item=row(sql,`member_source_assets/${assetId}`);
        if(!item||item.importRevision!==receipt.revision||item.sourceHash!==hash(item.source))throw new Error('Asset source snapshot integrity mismatch');
        return item.source;
      });
      return {memory,program:envelope.source,receipt,assets};
    });
  }
  async reviewContext(uid:string,lang:BuddyLanguage):Promise<SourceAnswer|null> {
    const snap=await this.snapshot(uid);if(!snap)return null;
    const source=snap.memory.sourceProfile,fields=snap.memory.fields??{};
    const missingFields=['medicalClearance','medications'].filter(k=>fields[k]?.raw==null);
    const detail=source.ageAtSource<18
      ? `H\u1ed3 s\u01a1 ngu\u1ed3n thu\u1ed9c nh\u00f3m d\u01b0\u1edbi 18 tu\u1ed5i. Kh\u00f4ng d\u00f9ng k\u1ebf ho\u1ea1ch ng\u01b0\u1eddi l\u1edbn hay m\u1ee5c ti\u00eau \u0103n ki\u00eang cho tr\u01b0\u1eddng h\u1ee3p n\u00e0y.`
      : fieldText('L\u01b0u \u00fd t\u1ea1i ngu\u1ed3n',fields.medicalHistory)+'\n'+fieldText('Thu\u1ed1c ghi trong ngu\u1ed3n',fields.medications);
    const text=`C\u0103n c\u1ee9 theo ngu\u1ed3n g\u1eafn v\u1edbi t\u00e0i kho\u1ea3n c\u1ee7a b\u1ea1n:\n${detail}\n${fieldText('X\u00e1c nh\u1eadn ph\u1ea1m vi v\u1eadn \u0111\u1ed9ng',fields.medicalClearance)}\nCh\u01b0a c\u00f3 k\u1ebf ho\u1ea1ch \u0111\u01b0\u1ee3c g\u00e1n v\u00e0 duy\u1ec7t ri\u00eang. \u0110\u00e2y l\u00e0 d\u1eef ki\u1ec7n ngu\u1ed3n, kh\u00f4ng ph\u1ea3i ch\u1ea9n \u0111o\u00e1n.`;
    return {text:(lang==='en'?'Recorded source context, original wording:\n':'')+text,missingFields,citations:[{id:`own-source:revision-${snap.receipt.revision}`,title:'B\u1ea3n ngu\u1ed3n g\u1eafn v\u1edbi t\u00e0i kho\u1ea3n \u0111ang \u0111\u0103ng nh\u1eadp',scope:'own_record'}]};
  }
  async answer(uid:string,message:string,lang:BuddyLanguage,topic:string|null=null):Promise<SourceAnswer|null> {
    const query=ownSourceQuery(message,topic);if(!query)return null;
    const snap=await this.snapshot(uid);
    if(!snap)return {text:'Chưa nhập nguồn của tài khoản này vào cơ sở dữ liệu. Không dùng hồ sơ mẫu khác để thay thế.',citations:[],missingFields:['source_import_required']};
    const {memory:m,program:p,receipt}=snap, source=m.sourceProfile,fields=m.fields??{};
    const citations:BuddyCitation[]=[{id:`own-source:revision-${receipt.revision}`,title:'Bản nguồn gắn với tài khoản đang đăng nhập',scope:'own_record'}];
    const missingFields:string[]=[];
    const fieldsOut=(keys:('medicalHistory'|'medications'|'medicalClearance'|'ptNotes'|'trainingGoal')[])=>keys.map(k=>{
      if(!fields[k]||fields[k].raw===null)missingFields.push(k);
      return fieldText({medicalHistory:'Bệnh lý/lưu ý sức khỏe theo nguồn',medications:'Thuốc đang dùng theo nguồn',medicalClearance:'Xác nhận phạm vi vận động',ptNotes:'Ghi chú PT riêng theo nguồn',trainingGoal:'Mục tiêu tự khai trong nguồn'}[k],fields[k]);
    }).join('\n');
    let text='';
    if(query==='health')text=fieldsOut(['medicalHistory']);
    if(query==='medications')text=fieldsOut(['medications']);
    if(query==='clearance')text=fieldsOut(['medicalClearance']);
    if(query==='notes')text=fieldsOut(['ptNotes'])+'\nGhi chú mô tả đã nhập:\n'+array(source.sourceNotes).map(plain).join('\n');
    if(query==='profile')text=`Hồ sơ nguồn của bạn: ${plain(source.label)}. Tuổi tại nguồn: ${source.ageAtSource}; chiều cao ${source.heightCm} cm; cân nặng ${source.weightKg} kg. Không phải số đo mới. Ánh xạ mục tiêu trong phần mềm: ${source.goal}.\n${fieldsOut(['trainingGoal'])}\n${fieldsOut(['medicalHistory','medications'])}\nLộ trình tham chiếu: ${plain(p.name)}. Chưa có kế hoạch được giao.`;
    if(query==='equipment') {
      text=`Danh m\u1ee5c \u0111\u00e3 nh\u1eadp c\u00f3 ${snap.assets.length} b\u1ea3n ghi t\u00e0i s\u1ea3n: ${snap.assets.map(a=>plain(a.name)).join(', ')}. \u0110\u00e2y l\u00e0 d\u1eef li\u1ec7u thu th\u1eadp, ch\u01b0a ph\u1ea3i x\u00e1c nh\u1eadn v\u1ecb tr\u00ed, ho\u1ea1t \u0111\u1ed9ng ho\u1eb7c m\u00e1y \u0111ang tr\u1ed1ng. M\u1ee5c ch\u01b0a c\u00f3 trong danh s\u00e1ch kh\u00f4ng \u0111\u1ee7 \u0111\u1ec3 k\u1ebft lu\u1eadn ph\u00f2ng kh\u00f4ng s\u1edf h\u1eefu. C\u1ea7n nh\u00e2n s\u1ef1 x\u00e1c nh\u1eadn tr\u01b0\u1edbc khi ch\u1ec9 \u0111\u01b0\u1eddng ho\u1eb7c \u0111\u01b0a m\u00e1y v\u00e0o k\u1ebf ho\u1ea1ch.`;
      missingFields.push('verified_equipment_location','current_equipment_status');
    }
    if(query==='meal') {
      text=`Meal plan cá nhân chưa được gán và chưa có bản duyệt riêng cho tài khoản này. DB đã nhập ${receipt.counts.meals} mẫu dinh dưỡng để tra cứu nguồn; đó không phải thực đơn của bạn. Không chọn một mẫu chỉ vì trùng mục tiêu. Ghi chú PT về ăn uống riêng: chưa được cung cấp.`;
      missingFields.push('assigned_meal_plan','individual_nutrition_review');
    }
    if(query==='program') {
      const sessions=array(p.referenceSessions);
      text=`Lộ trình nguồn của bạn: ${plain(p.name)} (${plain(p.id)}). Trạng thái: ${plain(p.reviewStatus)}. Có ${sessions.length} tài liệu buổi: ${sessions.map(sessionLabel).join(', ')}. Đây là liên kết nguồn, chưa phải lộ trình đang được giao. Các buổi không có trong nguồn không được tự tạo.\n`;
      const n=normalizeSafetyText(message), nums=[...n.matchAll(/\b(?:buoi|session)\s*(\d{1,3})\b/g)].map(x=>Number(x[1]));
      const pair=n.match(/\b(?:buoi|sessions?)\s*(\d{1,3})\s*(?:va|voi|and|&)\s*(\d{1,3})\b/);if(pair)nums.push(Number(pair[1]),Number(pair[2]));
      const numbers=[...new Set(nums)];
      if(numbers.length>2)text+='Chỉ đối chiếu tối đa hai buổi một lần để không cắt mất bảng nguồn.';
      else if(numbers.length) {
        for(const number of numbers) {
          const matches=sessions.filter(s=>s.sessionNumber===number);
          if(matches.length!==1) {text+=`\nBuổi ${number}: chưa xác định duy nhất trong nguồn (có thể thiếu hoặc khác gói). Cần xác nhận số buổi và gói; không tự sửa số mờ.\n`;missingFields.push('session_reference');continue;}
          text+='\n'+displaySession(matches[0])+'\n';
        }
        if(numbers.length===2)text+='\nĐây là đối chiếu dữ liệu gốc, không kết luận tiến bộ, an toàn hoặc tăng tải khi bài/máy/đơn vị khác nhau.';
      }else text+='Bạn có thể yêu cầu đọc lại một buổi cụ thể trong nguồn. Không dùng bảng đó làm hướng dẫn tập hôm nay.';
    }
    if(lang==='en')text='Source-record view (original Vietnamese wording preserved):\n'+text;
    return {text:text+'\n\n'+NOTE,citations,missingFields};
  }
}
