import fs from 'node:fs';
import { mergeTrainingPrograms } from '../shared/trainingPrograms';
// Không tự ghi đè: đưa bản ghép vào tệp đầu ra mới để review trước khi thay thế thư viện.
const [oldPath,incomingPath,outPath]=process.argv.slice(2);
if(!oldPath||!incomingPath||!outPath)throw new Error('Cách dùng: tsx scripts/merge-training-programs.ts <bản-cũ.json> <bản-thêm.json> <đầu-ra-mới.json>');
if(fs.existsSync(outPath))throw new Error('Tệp đầu ra đã tồn tại; không ghi đè.');
const result=mergeTrainingPrograms(JSON.parse(fs.readFileSync(oldPath,'utf8')),JSON.parse(fs.readFileSync(incomingPath,'utf8')));
fs.writeFileSync(outPath,JSON.stringify(result,null,2)+'\n',{encoding:'utf8',flag:'wx'});
console.log('Đã tạo bản ghép để kiểm tra; không cập nhật database hoặc xác minh nội dung.');
