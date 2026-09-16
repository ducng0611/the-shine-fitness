const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Update button container and text layout
code = code.replace(
  /<div className="shrink-0 flex flex-col sm:flex-row items-center gap-3">/,
  '<div className="shrink-0 flex flex-col items-center sm:items-end gap-3 mt-4 lg:mt-0">'
);

code = code.replace(
  /className="w-full sm:w-auto px-8 py-4 bg-brand-orange hover:bg-orange-600 text-white font-heading font-bold text-base sm:text-lg uppercase italic rounded-2xl shadow-lg transition-transform hover:scale-105 cursor-pointer flex items-center justify-center gap-2"/,
  'className="w-full sm:w-[320px] px-8 py-5 bg-brand-orange hover:bg-orange-600 text-white font-heading font-bold text-lg sm:text-xl uppercase italic rounded-2xl shadow-xl transition-all hover:scale-105 hover:shadow-orange-500/25 cursor-pointer flex items-center justify-center gap-3"'
);

code = code.replace(
  /<a\n\s*href="tel:0946293593"\n\s*className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-brand-orange transition-colors"\n\s*>\n\s*\{t\.heroOffer\.orCall\}\n\s*<\/a>/,
  '<a\n                  href="tel:0946293593"\n                  className="text-sm sm:text-base font-bold text-slate-500 dark:text-slate-400 hover:text-brand-orange transition-colors mt-1"\n                >\n                  {t.heroOffer.orCall}\n                </a>'
);

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx updated CTA button.');
