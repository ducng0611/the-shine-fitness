const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Header Login button (Desktop)
code = code.replace(
  /<button\n\s*onClick=\{\(\) => openAuth\('login'\)\}\n\s*className="hidden sm:inline-flex items-center gap-1\.5 px-3 py-1\.5 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:text-brand-orange hover:bg-slate-100 dark:hover:bg-white\/10 transition-colors cursor-pointer border border-slate-200 dark:border-white\/10 whitespace-nowrap shrink-0"\n\s*>/,
  '<button\n                  onClick={() => openAuth(\'login\')}\n                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-brand-orange/10 text-brand-orange hover:bg-brand-orange/20 transition-colors cursor-pointer border border-brand-orange/20 whitespace-nowrap shrink-0"\n                >'
);

// Header Login button (Mobile)
code = code.replace(
  /<button\n\s*onClick=\{\(\) => \{ setMobileMenuOpen\(false\); openAuth\('login'\); \}\}\n\s*className="flex-1 py-3 px-4 rounded-xl border border-slate-300 dark:border-white\/15 text-slate-800 dark:text-white font-heading font-bold text-xs uppercase italic flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"\n\s*>/,
  '<button\n                  onClick={() => { setMobileMenuOpen(false); openAuth(\'login\'); }}\n                  className="flex-1 py-3 px-4 rounded-xl bg-brand-orange/10 border border-brand-orange/20 text-brand-orange font-heading font-bold text-xs uppercase italic flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"\n                >'
);

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx Login btn 2 adapted.');
