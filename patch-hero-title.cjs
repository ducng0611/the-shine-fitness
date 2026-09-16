const fs = require('fs');
let code = fs.readFileSync('src/translations.ts', 'utf8');

// Thay đổi tiêu đề
code = code.replace(
  /title1: 'NÂNG TẦM SỨC KHỎE',/,
  'title1: \'NÂNG TẦM SỨC KHỎE - \','
);

code = code.replace(
  /title1: 'ELEVATE YOUR HEALTH',/,
  'title1: \'ELEVATE YOUR HEALTH - \','
);

fs.writeFileSync('src/translations.ts', code);
console.log('Hero title adapted.');
