const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /<\/button>\n\s*<\/div>\n\s*\);\n\s*\}\)\}\n\s*<\/div>/,
  '</button>\n                </div>\n              );\n            }))}\n          </div>'
);

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx patched for syntax');
