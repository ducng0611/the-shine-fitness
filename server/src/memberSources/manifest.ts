/** QA source-case manifest rules, shared by the SQLite Local Pilot and the Firestore import. */
import { TRAINING_GOALS } from '../../../shared/training';

export interface QACase { key:string; label:string; ageAtSource:number; heightCm:number; weightKg:number; goal:string; requiresReview:boolean; programId:string; sourceStatus:'source_reference_only'; sourceNotes:string[] }
export interface QAManifest { schemaVersion:1; qaOnly:true; batch:string; sourcePolicy:string; cases:QACase[] }
function finite(v:unknown,min:number,max:number):v is number{return typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;}
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
