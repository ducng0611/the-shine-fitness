import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {buildHeightPostureAddition} from '../shared/heightPostureProgram';
import {mergeTrainingPrograms,validateTrainingPrograms} from '../shared/trainingPrograms';
export function prepareHeightPosture(root=process.cwd()) {
  const library=JSON.parse(fs.readFileSync(path.join(root,'data/companion/training_programs.json'),'utf8'));
  const source=JSON.parse(fs.readFileSync(path.join(root,'data/training-pathways/height-posture/source-sessions.json'),'utf8'));
  const addition=buildHeightPostureAddition(source,library);
  const merged=mergeTrainingPrograms(library,addition);
  for(const old of library.programs.filter((p:any)=>p.id!=='prog_height_posture_pt25'))
    assert.deepEqual(merged.programs.find((p:any)=>p.id===old.id),old,'Không sửa chương trình cũ.');
  return {library,source,addition,merged,summary:validateTrainingPrograms(merged)};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const r=prepareHeightPosture(),i=process.argv.indexOf('--out');
  if(i>=0) {
    const out=process.argv[i+1];if(!out)throw new Error('Cần đường dẫn tệp đầu ra mới.');
    fs.writeFileSync(out,JSON.stringify(r.merged,null,2)+'\n',{encoding:'utf8',flag:'wx'});
    console.log('Đã tạo tệp mới để review. Không ghi đè, không ghi Firestore.');
  } else {
    assert.deepEqual(r.library,r.merged,'Thư viện chưa ghép đúng; dùng --out với một tệp mới để kiểm tra.');
    console.log(JSON.stringify({...r.summary,version:r.library.version,embeddingCalls:0,databaseWrites:0}));
  }
}
