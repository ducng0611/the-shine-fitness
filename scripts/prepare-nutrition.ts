import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { buildNutritionLibrary, validateNutritionLibrary, type NutritionSourceBundle, type NutritionMapping } from '../shared/nutritionKnowledge';
const root=process.cwd();
const read=(p:string)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const source=read('data/nutrition/source-documents.json') as NutritionSourceBundle;
const mapping=read('data/nutrition/template-mapping.json') as NutritionMapping;
const destination=path.join(root,'data/nutrition/meal-plan-library.json');
const library=buildNutritionLibrary(source,mapping);
if(process.argv.includes('--write')) {
  fs.mkdirSync(path.dirname(destination),{recursive:true});
  fs.writeFileSync(destination,JSON.stringify(library,null,2)+'\n');
} else if(!fs.existsSync(destination)) {
  throw new Error('Chưa có thư viện. Chạy --write để tạo bản nguồn nháp, không ghi cơ sở dữ liệu.');
}
const report={...validateNutritionLibrary(JSON.parse(fs.readFileSync(destination,'utf8')),source,mapping),
  sourceSha256:createHash('sha256').update(fs.readFileSync(path.join(root,'data/nutrition/source-documents.json'))).digest('hex'),
  mappingSha256:createHash('sha256').update(fs.readFileSync(path.join(root,'data/nutrition/template-mapping.json'))).digest('hex'),
  generatedLibrarySha256:createHash('sha256').update(fs.readFileSync(destination)).digest('hex'),
  unresolvedCitationTokens:[...new Set(source.sources.flatMap(s=>s.paragraphs.flatMap(p=>p.unresolvedCitationMarkers)))],
  externalNutritionLookups:0,embeddingCalls:0,databaseWrites:0,
  note:'Kiểm tra dữ liệu nguồn, không xác nhận độ đúng y khoa hoặc thực đơn cá nhân.'};
if(process.argv.includes('--report')) {
  fs.mkdirSync(path.join(root,'test-results/nutrition'),{recursive:true});
  fs.writeFileSync(path.join(root,'test-results/nutrition/validation.json'),JSON.stringify(report,null,2)+'\n');
}
console.log(JSON.stringify(report,null,2));