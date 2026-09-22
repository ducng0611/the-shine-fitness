
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {parseFrontmatter,chunkDocument,programRagAllowed} from '../shared/ragDocument';
import {validateTrainingPrograms} from '../shared/trainingPrograms';
import {prepareWeightGain} from './prepare-weight-gain';
const filename='data/knowledge/07_program_weight_gain.md';
const content=fs.readFileSync(filename,'utf8');
const {metadata,body}=parseFrontmatter(content,filename);
assert.equal(metadata.category,'PROGRAM');
assert.equal(metadata.review_status,'needs_review');
assert.equal(metadata.content_scope,'historical_reference');
assert(metadata.expiry_date>new Date().toISOString().slice(0,10));
assert(!content.includes('\u2014'),'Không dùng gạch ngang dài.');
const chunks=chunkDocument(body),sizes=chunks.map(c=>c.length);
assert(sizes.every(n=>n>=200&&n<=1500),'Chunk phải nằm trong 200-1500 ký tự.');
const {library,merged}=prepareWeightGain();
assert.deepEqual(merged,library,'Thư viện không khớp nguồn hoặc ghép chưa hoàn tất.');
const summary=validateTrainingPrograms(library);
const program=library.programs.find((p:any)=>p.id==='prog_weight_gain_pt50');
const report={...summary,version:library.version,programId:program.id,
  weightGainSessionNumbers:program.referenceSessions.map((s:any)=>s.sessionNumber),
  weightGainRowCount:program.referenceSessions.reduce((n:number,s:any)=>n+Object.values(s.blocks).flat().length,0),
  completeSupersetPairs:program.referenceSessions.flatMap((s:any)=>s.supersets).filter((g:any)=>g.status==='pair_as_reported').length,
  incompleteSupersetGroups:program.referenceSessions.flatMap((s:any)=>s.supersets).filter((g:any)=>g.status==='incomplete_source_group').length,
  chunkCount:chunks.length,minimumChunkCharacters:Math.min(...sizes),maximumChunkCharacters:Math.max(...sizes),
  publicRetrievalAllowed:programRagAllowed(metadata),embeddingCalls:0,databaseWrites:0,
  note:'Kiểm tra cấu trúc ngoại tuyến, không xác nhận nội dung y khoa hoặc dữ liệu thực tế đã hoàn thành.'};
console.log(JSON.stringify(report,null,2));
if(process.argv.includes('--report')){
  fs.mkdirSync('test-results/weight-gain',{recursive:true});
  fs.writeFileSync('test-results/weight-gain/validation.json',JSON.stringify(report,null,2)+'\n');
  fs.writeFileSync('test-results/weight-gain/chunks.json',JSON.stringify(chunks.map((c,i)=>({index:i+1,length:c.length,heading:c.split('\n')[0]})),null,2)+'\n');
}
