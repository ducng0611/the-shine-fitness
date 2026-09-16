const fs = require('fs');
let code = fs.readFileSync('src/translations.ts', 'utf8');

// Rút gọn text để chỉ còn 2 dòng
code = code.replace(
  /Nâng Tầm Sức Khỏe\\nTỏa Sáng Cùng THE SHINE/,
  'Nâng Tầm Sức Khỏe - Tỏa Sáng Cùng THE SHINE'
);

code = code.replace(
  /Elevate Your Health\\nShine With THE SHINE/,
  'Elevate Your Health - Shine With THE SHINE'
);

fs.writeFileSync('src/translations.ts', code);
console.log('Translations adapted.');
