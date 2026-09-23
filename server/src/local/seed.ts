import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { PilotDatabase, writeDocument } from './sqlite';
import { hashPassword } from './auth';
import { TRAINING_GOALS } from '../../../shared/training';

export interface QACase { key:string; label:string; ageAtSource:number; heightCm:number; weightKg:number; goal:string; requiresReview:boolean; programId:string; sourceStatus:'source_reference_only'; sourceNotes:string[] }
export interface QAManifest { schemaVersion:1; qaOnly:true; batch:string; sourcePolicy:string; cases:QACase[] }
function finite(v:unknown,min:number,max:number):v is number{return typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;}
const hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function parseManifest(raw:unknown):QAManifest {
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('Manifest must be an object');
  const r=raw as Record<string,unknown>;
  if(Object.keys(r).some(k=>!['schemaVersion','qaOnly','batch','sourcePolicy','cases'].includes(k))||r.schemaVersion!==1||r.qaOnly!==true||typeof r.batch!=='string'||!/^[-a-z0-9]{1,48}$/.test(r.batch)||typeof r.sourcePolicy!=='string'||!Array.isArray(r.cases)||!r.cases.length||r.cases.length>20)throw new Error('Invalid QA manifest');
  const keys=new Set();
  for(const c of r.cases){
    if(!c||typeof c!=='object'||Array.isArray(c)||Object.keys(c).some(k=>!['key','label','ageAtSource','heightCm','weightKg','goal','requiresReview','programId','sourceStatus','sourceNotes'].includes(k)))throw new Error('Unexpected personal field');
    if(typeof c.key!=='string'||!/^[-a-z0-9]{1,36}$/.test(c.key)||keys.has(c.key))throw new Error('Invalid or repeated case key');keys.add(c.key);
    if(typeof c.label!=='string'||!c.label.startsWith('QA ')||c.label.length>80||!finite(c.ageAtSource,5,100)||!Number.isInteger(c.ageAtSource)||!finite(c.heightCm,80,240)||!finite(c.weightKg,15,350)||!(TRAINING_GOALS as readonly string[]).includes(c.goal)||typeof c.requiresReview!=='boolean'||typeof c.programId!=='string'||!/^prog_[a-z0-9_]{1,80}$/.test(c.programId)||c.sourceStatus!=='source_reference_only'||!Array.isArray(c.sourceNotes)||c.sourceNotes.length>12||c.sourceNotes.some((s:unknown)=>typeof s!=='string'||s.length>1000))throw new Error('Invalid source fields');
  }
  return structuredClone(raw) as QAManifest;
}
export const caseIdentity=(manifest:QAManifest,c:QACase)=>({uid:`localqa_${hash([manifest.batch,c.key]).slice(0,24)}`,email:`qa.${c.key}@example.invalid`});
export async function seedQA(db:PilotDatabase,manifest:QAManifest,password:string,repoRoot:string,now=Date.now()) {
  const valid=parseManifest(manifest);
  const library=JSON.parse(readFileSync(join(repoRoot,'data/companion/training_programs.json'),'utf8'));
  const known=new Set(library.programs.map((p:{id:string})=>p.id));
  for(const c of valid.cases)if(!known.has(c.programId))throw new Error(`Unknown program reference: ${c.programId}`);
  // Hash outside the database lock. Individual salts; the supplied password is never written.
  const encoded:string[]=[];
  for(const _ of valid.cases)encoded.push(await hashPassword(password));
  return db.transaction(sql=>{
    const output=[];
    for(const [i,c] of valid.cases.entries()){
      const identity=caseIdentity(valid,c),sourceHash=hash([valid.batch,c]),existing=sql.prepare('SELECT * FROM local_users WHERE uid=? OR email=?').all(identity.uid,identity.email);
      if(existing.length){
        if(existing.length!==1||existing[0].uid!==identity.uid||existing[0].email!==identity.email||existing[0].source_hash!==sourceHash||existing[0].disabled!==0)throw new Error('QA account conflict. No reset or overwrite was performed.');
        output.push({...identity,label:c.label,status:'existing_unchanged'});continue;
      }
      const source={...c,batch:valid.batch,qaOnly:true,provenance:valid.sourcePolicy,assignedProgramId:null,mealPlanAssignment:null,confirmedHistoricalSessions:0,
        notice:'B\u1ea3n sao QA theo ngu\u1ed3n. S\u1ed1 \u0111o v\u00e0 tu\u1ed5i t\u1ea1i ngu\u1ed3n, kh\u00f4ng ph\u1ea3i s\u1ed1 \u0111o hi\u1ec7n t\u1ea1i. Kh\u00f4ng x\u00e1c nh\u1eadn s\u1ef1 \u0111\u1ed3ng \u00fd c\u1ee7a kh\u00e1ch th\u1eadt.'};
      const timestamp=new Date(now).toISOString(),minor=c.ageAtSource<18;
      const prior=sql.prepare('SELECT path FROM local_documents WHERE path=? OR path=?').all(`training_members/${identity.uid}`,`training_access/${identity.uid}`);
      if(prior.length)throw new Error('Existing document collision. Nothing overwritten.');
      sql.prepare('INSERT INTO local_users(uid,email,password_hash,display_name,source_json,source_hash,minor,needs_review,created_at) VALUES(?,?,?,?,?,?,?,?,?)').run(identity.uid,identity.email,encoded[i],c.label,JSON.stringify(source),sourceHash,minor?1:0,c.requiresReview?1:0,timestamp);
      const profile=minor?null:{uid:identity.uid,nickname:c.label,age:c.ageAtSource,adultConfirmed:true,consent:true,goal:c.goal,experience:'beginner',preferredMinutes:35,timezone:'Asia/Ho_Chi_Minh',heightCm:null,weightKg:null,preferences:[],avoidedExerciseIds:[],healthReviewNeeded:c.requiresReview,includeLegacyHistory:false,style:'gentle',revision:1,consentVersion:'training-v1',createdAt:timestamp,updatedAt:timestamp,
        qaOnly:true,consentBasis:'QA operator authorization, not patient consent',ageBasis:'source_snapshot',defaultsBasis:'QA settings, not reported trainer instructions'};
      writeDocument(sql,`training_members/${identity.uid}`,{state:'active',profile,profileRevision:profile?1:0,historyRevision:0,readiness:null,qaOnly:true});
      writeDocument(sql,`training_members/${identity.uid}/qa_sources/intake`,source);
      writeDocument(sql,`training_access/${identity.uid}`,{enabled:!minor,qaOnly:true,expiresAt:new Date(now+7*86400_000).toISOString()});
      output.push({...identity,label:c.label,status:'created'});
    }
    return {authProvider:'local',storage:'sqlite',qaOnly:true,createdAt:new Date(now).toISOString(),accounts:output,cloudWrites:0};
  });
}
