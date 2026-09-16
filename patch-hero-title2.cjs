const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /\{t\.hero\.title1\} <br \/>/,
  '{t.hero.title1}'
);

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx Hero title adapted.');
