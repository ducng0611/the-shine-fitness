import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {buildMetabolicAddition} from '../shared/fatlossMetabolicProgram';
import {mergeTrainingPrograms,validateTrainingPrograms} from '../shared/trainingPrograms';
export function prepareMetabolic(root=process.cwd()){
 const library=JSON.parse(fs.readFileSync(path.join(root,'data/companion/training_programs.json'),'utf8'));
 const source=JSON.parse(fs.readFileSync(path.join(root,'data/training-pathways/fatloss-metabolic/source-sessions.json'),'utf8'));
 const addition=buildMetabolicAddition(source,library);
 const merged=mergeTrainingPrograms(library,addition);
 for(const old of library.programs.filter((p:any)=>p.id!=='prog_fatloss_metabolic_pt255'))
   assert.deepEqual(merged.programs.find((p:any)=>p.id===old.id),old,'Không được ghi đè lộ trình cũ.');
 return {library,source,addition,merged,summary:validateTrainingPrograms(merged)};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const r=prepareMetabolic(),i=process.argv.indexOf('--out');
 if(i>=0){
  const out=process.argv[i+1];if(!out)throw Error('Cần đường dẫn đầu ra mới.');
  fs.writeFileSync(out,JSON.stringify(r.merged,null,2)+'\n',{encoding:'utf8',flag:'wx'});
  console.log('Đã tạo tệp mới để kiểm tra. Không ghi đè và không ghi database.');
 }else{
  assert.deepEqual(r.merged,r.library,'Nguồn chưa được ghép; dùng --out với tệp mới để review.');
  console.log(JSON.stringify({...r.summary,version:r.library.version,embeddingCalls:0,databaseWrites:0}));
 }
}
