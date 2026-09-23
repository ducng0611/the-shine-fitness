import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {buildPostureCorrectionAddition,POSTURE_PROGRAM_ID} from '../shared/postureCorrectionProgram';
import {mergeTrainingPrograms,validateTrainingPrograms} from '../shared/trainingPrograms';
export function preparePostureCorrection(root=process.cwd()){
 const library=JSON.parse(fs.readFileSync(path.join(root,'data/companion/training_programs.json'),'utf8'));
 const source=JSON.parse(fs.readFileSync(path.join(root,'data/training-pathways/posture-correction/source-sessions.json'),'utf8'));
 const addition=buildPostureCorrectionAddition(source,library);
 const merged=mergeTrainingPrograms(library,addition);
 for(const old of library.programs.filter((p:any)=>p.id!==POSTURE_PROGRAM_ID))
  assert.deepEqual(merged.programs.find((p:any)=>p.id===old.id),old,'Không thay dữ liệu chương trình cũ.');
 return {library,source,addition,merged,summary:validateTrainingPrograms(merged)};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const r=preparePostureCorrection(),i=process.argv.indexOf('--out');
 if(i>=0){
  const output=process.argv[i+1];if(!output)throw new Error('Cần đường dẫn file mới.');
  fs.writeFileSync(output,JSON.stringify(r.merged,null,2)+'\n',{encoding:'utf8',flag:'wx'});
  console.log('Đã tạo tệp để đối chiếu. Không ghi đè, không gọi mô hình và không ghi Firestore.');
 }else{
  assert.deepEqual(r.library,r.merged,'Nguồn chưa ghép, dùng --out để chuẩn bị tệp mới.');
  console.log(JSON.stringify({...r.summary,version:r.library.version,embeddingCalls:0,databaseWrites:0}));
 }
}
