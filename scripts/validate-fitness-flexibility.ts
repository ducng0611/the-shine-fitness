import fs from 'node:fs';
import { parseFrontmatter,chunkDocument,programRagAllowed } from '../shared/ragDocument';
import { validateTrainingPrograms } from '../shared/trainingPrograms';
const md=fs.readFileSync('data/knowledge/08_program_fitness_flexibility.md','utf8');
const parsed=parseFrontmatter(md),chunks=chunkDocument(parsed.body);
const sizes=chunks.map(c=>c.length);
if(sizes.some(n=>n<200||n>1500))throw new Error('Chunk nằm ngoài 200-1500 ký tự.');
if(parsed.metadata.expiry_date<=new Date().toISOString().slice(0,10))throw new Error('Tài liệu đã hết hạn.');
if(md.includes('\u2014'))throw new Error('Không dùng gạch ngang dài.');
const library=JSON.parse(fs.readFileSync('data/companion/training_programs.json','utf8'));
const summary=validateTrainingPrograms(library);
const report={...summary,chunkCount:chunks.length,minimumChunkCharacters:Math.min(...sizes),maximumChunkCharacters:Math.max(...sizes),
  publicRetrievalAllowed:programRagAllowed(parsed.metadata),embeddingCalls:0,databaseWrites:0,
  note:'Kiểm tra ngoại tuyến cấu trúc, không phải đánh giá vector hoặc kiểm duyệt chuyên môn.'};
console.log(JSON.stringify(report,null,2));
if(process.argv.includes('--report')){
  fs.mkdirSync('test-results/fitness-flexibility',{recursive:true});
  fs.writeFileSync('test-results/fitness-flexibility/validation.json',JSON.stringify(report,null,2)+'\n');
}
