
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {buildWeightGainAddition} from '../shared/weightGainProgram';
import {mergeTrainingPrograms,validateTrainingPrograms} from '../shared/trainingPrograms';
export function prepareWeightGain(root=process.cwd()) {
  const library=JSON.parse(fs.readFileSync(path.join(root,'data/companion/training_programs.json'),'utf8'));
  const source=JSON.parse(fs.readFileSync(path.join(root,'data/training-pathways/weight-gain/source-sessions.json'),'utf8'));
  const addition=buildWeightGainAddition(source,library);
  const merged=mergeTrainingPrograms(library,addition);
  const before=library.programs.find((p:any)=>p.id==='prog_fitness_flexibility_pt30');
  const after=merged.programs.find((p:any)=>p.id==='prog_fitness_flexibility_pt30');
  assert.deepEqual(after,before,'Không được sửa chương trình thể lực.');
  return {library,addition,merged,summary:validateTrainingPrograms(merged)};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const result=prepareWeightGain();
  const out=process.argv.indexOf('--out');
  if(out>=0){
    const file=process.argv[out+1];if(!file)throw Error('Cần đường dẫn tệp đầu ra mới.');
    fs.writeFileSync(file,JSON.stringify(result.merged,null,2)+'\n',{encoding:'utf8',flag:'wx'});
    console.log('Đã tạo tệp mới để review. Không ghi đè thư viện hoặc ghi Firestore.');
  } else {
    assert.deepEqual(result.merged,result.library,'Thư viện chưa chứa đúng phần bổ sung; dùng --out với tệp mới để review.');
    console.log(JSON.stringify({...result.summary,version:result.library.version,embeddingCalls:0,databaseWrites:0}));
  }
}
