import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { PilotDatabase, writeDocument } from './sqlite';
import { hashPassword } from './auth';
import { parseManifest, type QACase, type QAManifest } from '../memberSources/manifest';
export * from '../memberSources/manifest';

const hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
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
