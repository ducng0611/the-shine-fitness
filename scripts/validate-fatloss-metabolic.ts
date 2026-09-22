import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {parseFrontmatter,chunkDocument,programRagAllowed} from '../shared/ragDocument';
import {metabolicRows,METABOLIC_PROGRAM_ID} from '../shared/fatlossMetabolicProgram';
import {prepareMetabolic} from './prepare-fatloss-metabolic';
const hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const {library,source,merged,summary}=prepareMetabolic();
assert.deepEqual(merged,library);
const p=library.programs.find((p:any)=>p.id===METABOLIC_PROGRAM_ID);
const baseline=JSON.parse(fs.readFileSync('tests/fixtures/fatloss-metabolic-baseline.json','utf8'));
assert.equal(hash(source.sessions),baseline.sourceSessionsSha256,'Nguồn thay đổi cần review riêng.');
for(const [id,h] of Object.entries(baseline.programHashes))assert.equal(hash(library.programs.find((p:any)=>p.id===id)),h);
for(const [id,h] of Object.entries(baseline.exerciseMetadataHashes)){
 const {programUsage,...meta}=library.exercises.find((e:any)=>e.id===id);
 assert.equal(hash(meta),h);
 assert.equal(hash(programUsage.filter((u:any)=>u.programId in baseline.programHashes)),baseline.usageHashes[id]);
}
for(const [id,h] of Object.entries(baseline.equipmentHashes))assert.equal(hash(library.equipmentReferences.find((e:any)=>e.id===id)),h);
for(const s of source.sessions){
 const target=p.referenceSessions.find((x:any)=>x.sourceId===s.sourceId);
 const rows=metabolicRows({referenceSessions:[target]});
 assert.deepEqual(rows.map((r:any)=>[r.sourceLabel,r.sourceExerciseName,r.volume.raw,r.load.raw]),s.rows);
}
const text=fs.readFileSync('data/knowledge/10_program_fatloss_metabolic.md','utf8');
const {metadata,body}=parseFrontmatter(text),chunks=chunkDocument(body),sizes=chunks.map(x=>x.length);
assert.equal(metadata.category,'PROGRAM');assert.equal(metadata.review_status,'needs_review');
assert.equal(metadata.content_scope,'historical_reference');assert(metadata.expiry_date>new Date().toISOString().slice(0,10));
assert(sizes.every(n=>n>=200&&n<=1500));assert(!/\u2014|\p{Extended_Pictographic}/u.test(text));
assert.equal(programRagAllowed(metadata),false);
assert.equal(programRagAllowed({...metadata,review_status:'verified',content_scope:'public_overview'}),false);
const report={...summary,version:library.version,programId:p.id,sourceDocuments:p.referenceSessions.length,
 sourceRows:metabolicRows(p).length,sessionNumbers:p.referenceSessions.map((s:any)=>s.sessionNumber),
 sessionKeys:p.referenceSessions.map((s:any)=>s.sessionKey),
 completeSupersetPairs:p.referenceSessions.flatMap((s:any)=>s.supersets).filter((g:any)=>g.status==='pair_as_reported').length,
 singleD1Records:p.referenceSessions.flatMap((s:any)=>s.supersets).filter((g:any)=>g.status==='single_record_only').length,
 circuitStations:p.referenceSessions[5].blocks.CARDIO_CIRCUIT.stations.length,
 chunkCount:chunks.length,minimumChunkCharacters:Math.min(...sizes),maximumChunkCharacters:Math.max(...sizes),
 newExerciseDefinitions:library.exercises.filter((e:any)=>!(e.id in baseline.exerciseMetadataHashes)&&e.programUsage.some((u:any)=>u.programId===METABOLIC_PROGRAM_ID)).length,
 previousProgramsPreserved:true,publicRetrievalAllowed:false,eligibleForPlanner:false,aiRecommendable:false,
 embeddingCalls:0,databaseWrites:0,note:'Kiểm tra dữ liệu và mã, không chứng nhận y khoa hoặc hiệu quả điều trị.'};
console.log(JSON.stringify(report,null,2));
if(process.argv.includes('--report')){
 fs.mkdirSync('test-results/fatloss-metabolic',{recursive:true});
 fs.writeFileSync('test-results/fatloss-metabolic/validation.json',JSON.stringify(report,null,2)+'\n');
 fs.writeFileSync('test-results/fatloss-metabolic/chunks.json',JSON.stringify(chunks.map((c,i)=>({index:i+1,length:c.length,heading:c.split('\n')[0]})),null,2)+'\n');
}
