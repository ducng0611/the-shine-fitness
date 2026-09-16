const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Header Login button (Desktop)
code = code.replace(
  /<button\n\s*onClick=\{openAuthModal\}\n\s*className="hidden lg:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 hover:bg-slate-200 dark:bg-white\/5 dark:hover:bg-white\/10 text-slate-700 dark:text-slate-300 transition-colors"\n\s*>/,
  '<button\n                  onClick={openAuthModal}\n                  className="hidden lg:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-brand-orange/10 hover:bg-brand-orange/20 text-brand-orange transition-colors"\n                >'
);

// Header Login button (Mobile)
code = code.replace(
  /<button\n\s*onClick=\{openAuthModal\}\n\s*className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 dark:bg-white\/5 text-slate-800 dark:text-white font-bold hover:bg-slate-200 dark:hover:bg-white\/10 transition-colors"\n\s*>/,
  '<button\n                  onClick={openAuthModal}\n                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-orange/10 text-brand-orange font-bold hover:bg-brand-orange/20 transition-colors"\n                >'
);

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx Login btn adapted.');
