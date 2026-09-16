const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Fix the buttons flex wrap
code = code.replace(
  /<div className=\"flex flex-wrap gap-4 pt-2\">/g,
  '<div className="flex flex-col sm:flex-row gap-3 pt-2">'
);
code = code.replace(
  /className=\"px-8 py-4 bg-brand-orange hover:bg-orange-600 text-white font-heading font-bold text-base uppercase italic rounded-2xl shadow-lg transition-colors cursor-pointer flex items-center gap-2\"/g,
  'className="w-full sm:w-auto px-6 py-4 justify-center bg-brand-orange hover:bg-orange-600 text-white font-heading font-bold text-base uppercase italic rounded-2xl shadow-lg transition-colors cursor-pointer flex items-center gap-2"'
);
code = code.replace(
  /className=\"px-6 py-4 bg-white dark:bg-white\/5 hover:bg-slate-100 dark:hover:bg-white\/10 text-slate-800 dark:text-white border border-slate-300 dark:border-white\/10 font-heading font-bold text-sm uppercase italic rounded-2xl transition-colors cursor-pointer flex items-center gap-2\"/g,
  'className="w-full sm:w-auto px-6 py-4 justify-center bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-white border border-slate-300 dark:border-white/10 font-heading font-bold text-sm uppercase italic rounded-2xl transition-colors cursor-pointer flex items-center gap-2"'
);

// Fix the hours formatting in translations.ts later, but we can also add a small responsive adjustment to the text here
code = code.replace(
  /<div className=\"text-sm sm:text-base font-semibold text-slate-900 dark:text-white mt-0.5\">/g,
  '<div className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white mt-0.5 leading-snug md:leading-normal">'
);

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx patched for responsive contact buttons');
