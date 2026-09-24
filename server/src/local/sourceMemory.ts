/** Source ingestion for the explicitly selected local QA database. Not a planner. */
import { PilotDatabase, writeDocument } from './sqlite';
import { hash, id, validateEnrichment, loadSourceBundle, reviewContextFromSnapshot, answerFromSnapshot,
  type Obj, type PrivateEnrichment, type SourceAnswer } from '../memberSources/source';
import type { BuddyLanguage } from '../../../shared/buddyChat';
import { ownSourceQuery } from '../../../shared/buddySourceQuery';
export * from '../memberSources/source';

function row(db: any, path: string): Obj | null { const r=db.prepare('SELECT body FROM local_documents WHERE path=?').get(path); return r ? JSON.parse(String(r.body)) : null; }
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
    const snap=await this.snapshot(uid);return snap?reviewContextFromSnapshot(snap,lang):null;
  }
  async answer(uid:string,message:string,lang:BuddyLanguage,topic:string|null=null):Promise<SourceAnswer|null> {
    if(!ownSourceQuery(message,topic))return null;
    return answerFromSnapshot(await this.snapshot(uid),message,lang,topic);
  }
}

