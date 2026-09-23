import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {parseFrontmatter,chunkDocument,programRagAllowed} from '../shared/ragDocument';
import {postureRows,POSTURE_PROGRAM_ID} from '../shared/postureCorrectionProgram';
import {preparePostureCorrection} from './prepare-posture-correction';
const hash=(x:unknown)=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const {library,source,merged,summary}=preparePostureCorrection();
assert.deepEqual(merged,library);
const fp=JSON.parse(fs.readFileSync('tests/fixtures/posture-correction-baseline.json','utf8'));
assert.equal(hash(source),fp.sourceHash,'Nguồn thay đổi phải được đối chiếu lại.');
const p=library.programs.find((p:any)=>p.id===POSTURE_PROGRAM_ID);
for(const [id,h] of Object.entries(fp.programHashes))assert.equal(hash(library.programs.find((p:any)=>p.id===id)),h,id);
for(const [id,h] of Object.entries(fp.exerciseMetadataHashes)){
 const {programUsage,...meta}=library.exercises.find((e:any)=>e.id===id);
 assert.equal(hash(meta),h,id);
 assert.equal(hash(programUsage.filter((u:any)=>u.programId in fp.programHashes)),fp.usageHashes[id],id);
}
for(const [id,h] of Object.entries(fp.equipmentHashes))assert.equal(hash(library.equipmentReferences.find((e:any)=>e.id===id)),h,id);
for(const s of source.sessions){
 const target=p.referenceSessions.find((t:any)=>t.sourceId===s.sourceId);
 for(const b of s.blocks){
  const tuples=target.blocks[b.key].map((r:any)=>[r.sourceExerciseName,r.sourceVolume,r.sourceLoad,r.sourceRest,r.sourceNote,r.sourceTempo]);
  assert.deepEqual(tuples,b.rows,'Không giữ nguyên sáu cột nguồn.');
 }
}
const md=fs.readFileSync('data/knowledge/11_program_posture_correction.md','utf8');
const {metadata,body}=parseFrontmatter(md),chunks=chunkDocument(body),sizes=chunks.map(c=>c.length);
assert.equal(metadata.category,'PROGRAM');assert.equal(metadata.review_status,'needs_review');assert.equal(metadata.content_scope,'historical_reference');
assert(metadata.expiry_date>new Date().toISOString().slice(0,10));assert(sizes.every(n=>n>=200&&n<=1500));
assert(!/\u2014|\p{Extended_Pictographic}/u.test(md));
assert.equal(programRagAllowed(metadata),false);
assert.equal(programRagAllowed({...metadata,review_status:'verified',content_scope:'public_overview'}),false);
const report={...summary,version:library.version,programId:p.id,sourceSessions:p.referenceSessions.length,
 sourceRows:postureRows(p).length,sessionNumbers:p.referenceSessions.map((s:any)=>s.sessionNumber),
 allocatedMinutes:p.referenceSessions.map((s:any)=>s.allocatedMinutes),actualDurationsVerified:false,
 chunkCount:chunks.length,minimumChunkCharacters:Math.min(...sizes),maximumChunkCharacters:Math.max(...sizes),
 newExerciseDefinitions:library.exercises.filter((e:any)=>!(e.id in fp.exerciseMetadataHashes)&&e.programUsage.some((u:any)=>u.programId===POSTURE_PROGRAM_ID)).length,
 previousProgramsPreserved:true,eligibleForPlanner:false,publicRetrievalAllowed:false,
 embeddingCalls:0,databaseWrites:0,note:'Kiểm tra cấu trúc và bảo toàn nguồn, không xác nhận chẩn đoán hoặc hiệu quả điều trị.'};
console.log(JSON.stringify(report,null,2));
if(process.argv.includes('--report')){
 fs.mkdirSync('test-results/posture-correction',{recursive:true});
 fs.writeFileSync('test-results/posture-correction/validation.json',JSON.stringify(report,null,2)+'\n');
 fs.writeFileSync('test-results/posture-correction/chunks.json',JSON.stringify(chunks.map((c,i)=>({index:i+1,length:c.length,heading:c.split('\n')[0]})),null,2)+'\n');
}
