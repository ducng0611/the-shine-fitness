const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Change max-w-6xl to max-w-7xl in this section
code = code.replace(
  /<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">\n\s*<div className="relative rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-orange-500\/10 via-amber-500\/5 to-transparent border-2 border-brand-orange\/40 shadow-xl overflow-hidden">/,
  '<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">\n          <div className="relative rounded-3xl p-6 sm:p-10 lg:p-12 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent border-2 border-brand-orange/40 shadow-xl overflow-hidden">'
);

code = code.replace(
  /<h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-black text-slate-900 dark:text-white uppercase italic leading-tight">/,
  '<h2 className="text-2xl sm:text-3xl lg:text-[2.1rem] xl:text-4xl font-heading font-black text-slate-900 dark:text-white uppercase italic leading-tight">'
);

code = code.replace(
  /<p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">/,
  '<p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">'
);

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx updated CTA section.');
