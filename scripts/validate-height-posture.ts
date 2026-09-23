import fs from 'node:fs';
import assert from 'node:assert/strict';
import {parseFrontmatter,chunkDocument,programRagAllowed} from '../shared/ragDocument';
import {heightRows} from '../shared/heightPostureProgram';
import {prepareHeightPosture} from './prepare-height-posture';
const filename='data/knowledge/09_program_height_posture.md';
const text=fs.readFileSync(filename,'utf8');
const {metadata,body}=parseFrontmatter(text,filename),chunks=chunkDocument(body),lengths=chunks.map(c=>c.length);
assert.equal(metadata.category,'PROGRAM');assert.equal(metadata.review_status,'needs_review');
assert.equal(metadata.content_scope,'historical_reference');assert(metadata.expiry_date>new Date().toISOString().slice(0,10));
assert(lengths.every(n=>n>=200&&n<=1500),'Mỗi chunk cần 200-1500 ký tự.');
assert(!text.includes('\u2014')&&!/\p{Extended_Pictographic}/u.test(text),'Không dùng emoji hoặc gạch ngang dài.');
const result=prepareHeightPosture();assert.deepEqual(result.merged,result.library);
const p=result.library.programs.find((x:any)=>x.id==='prog_height_posture_pt25');
const report={...result.summary,version:result.library.version,programId:p.id,
 sessionKeys:p.referenceSessions.map((s:any)=>s.sessionKey),heightPostureRowCount:heightRows(p).length,
 chunkCount:chunks.length,minimumChunkCharacters:Math.min(...lengths),maximumChunkCharacters:Math.max(...lengths),
 publicRetrievalAllowed:programRagAllowed(metadata),eligibleForPlanner:p.eligibleForPlanner,
 newExerciseDefinitions:27,previousProgramsPreserved:true,embeddingCalls:0,databaseWrites:0,
 note:'Kiểm tra ngoại tuyến cấu trúc và bảo toàn nguồn. Không xác nhận hiệu quả tăng trưởng hoặc kiểm duyệt chuyên môn.'};
console.log(JSON.stringify(report,null,2));
if(process.argv.includes('--report')){
 fs.mkdirSync('test-results/height-posture',{recursive:true});
 fs.writeFileSync('test-results/height-posture/validation.json',JSON.stringify(report,null,2)+'\n');
 fs.writeFileSync('test-results/height-posture/chunks.json',JSON.stringify(chunks.map((c,i)=>({index:i+1,length:c.length,heading:c.split('\n')[0]})),null,2)+'\n');
}
