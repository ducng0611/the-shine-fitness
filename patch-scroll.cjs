const fs = require('fs');
let code = fs.readFileSync('src/components/ScrollToTop.tsx', 'utf8');

// Update dark mode class mapping
code = code.replace(
  /className="p-3 bg-slate-800\/80 backdrop-blur-md hover:bg-brand-orange text-white rounded-full shadow-lg border border-white\/10 hover:border-brand-orange\/50 transition-all focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 focus:ring-offset-slate-900 cursor-pointer group"/,
  'className="p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md hover:bg-brand-orange dark:hover:bg-brand-orange text-slate-800 dark:text-white hover:text-white dark:hover:text-white rounded-full shadow-lg border border-slate-200 dark:border-white/10 hover:border-brand-orange/50 transition-all focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 focus:ring-offset-slate-900 cursor-pointer group"'
);

fs.writeFileSync('src/components/ScrollToTop.tsx', code);
console.log('Scroll to top adapted.');
