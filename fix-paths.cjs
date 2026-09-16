const fs = require('fs');
let indexCode = fs.readFileSync('server/src/index.ts', 'utf8');
indexCode = indexCode.replace(/\.\/src\/data\/bilingualReviews/g, '../../src/data/bilingualReviews');
fs.writeFileSync('server/src/index.ts', indexCode);

let excelCode = fs.readFileSync('server/src/excelDataService.ts', 'utf8');
excelCode = excelCode.replace(/\.\.\/src\/types/g, '../../src/types');
fs.writeFileSync('server/src/excelDataService.ts', excelCode);

console.log('Fixed relative paths to src/');
