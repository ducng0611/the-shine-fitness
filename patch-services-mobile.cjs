const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Update Skeleton card padding
code = code.replace(
  /className="bg-white dark:bg-\[#1a1a1a\] p-8 rounded-3xl border border-slate-200 dark:border-white\/10 shadow-sm flex flex-col justify-between animate-pulse h-full"/g,
  'className="bg-white dark:bg-[#1a1a1a] p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between animate-pulse h-full"'
);

// Update Real card padding
code = code.replace(
  /className="bg-white dark:bg-\[#1a1a1a\] p-8 rounded-3xl border border-slate-200 dark:border-white\/10 hover:border-brand-orange\/60 dark:hover:border-brand-orange\/50 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col justify-between group"/g,
  'className="bg-white dark:bg-[#1a1a1a] p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-white/10 hover:border-brand-orange/60 dark:hover:border-brand-orange/50 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col justify-between group"'
);

// Update grid gap if needed (currently gap-6 sm:gap-8). Let's make it gap-5 sm:gap-8
code = code.replace(
  /<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">/,
  '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">'
);

// Update icon container margin mb-6 -> mb-5 sm:mb-6
code = code.replace(
  /<div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-700\/50 mb-6" \/>/g,
  '<div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-700/50 mb-5 sm:mb-6" />'
);

code = code.replace(
  /<div className="w-14 h-14 rounded-2xl bg-orange-500\/10 dark:bg-orange-500\/15 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">/g,
  '<div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-orange-500/10 dark:bg-orange-500/15 flex items-center justify-center mb-5 sm:mb-6 group-hover:scale-110 transition-transform duration-300">'
);

// Update paragraph margin mb-6 -> mb-5 sm:mb-6
code = code.replace(
  /<p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">/g,
  '<p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-5 sm:mb-6">'
);

// Update skeleton text blocks margins to match mobile adjustments
code = code.replace(
  /<div className="w-5\/6 h-4 bg-slate-200 dark:bg-slate-700\/50 rounded-md mb-6" \/>/g,
  '<div className="w-5/6 h-4 bg-slate-200 dark:bg-slate-700/50 rounded-md mb-5 sm:mb-6" />'
);

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx Services mobile padding adapted.');
