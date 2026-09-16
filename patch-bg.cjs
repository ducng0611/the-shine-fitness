const fs = require('fs');
let code = fs.readFileSync('src/components/GymFloorPlan.tsx', 'utf8');

// Section bg
code = code.replace(
  /<section className="py-24 bg-\[#0a0a0a\] relative overflow-hidden">/,
  '<section id="floor-plan" className="py-24 bg-slate-50 dark:bg-[#0a0a0a] relative overflow-hidden transition-colors duration-200">'
);

// Title text
code = code.replace(
  /<h2 className="text-4xl md:text-6xl font-heading font-black text-white uppercase tracking-tight mb-4">/,
  '<h2 className="text-4xl md:text-6xl font-heading font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">'
);

// Subtitle text
code = code.replace(
  /<p className="text-slate-300 max-w-2xl mx-auto text-xl">/,
  '<p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto text-xl">'
);

// Inactive floor 1
code = code.replace(
  /'text-slate-400 hover:text-white hover:bg-white\/5'/,
  '\'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5\''
);

// Grid cols for dynamic division
code = code.replace(
  /<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">/,
  '<div className={`grid grid-cols-2 gap-4 mt-6 ${currentZones.length === 3 ? \'sm:grid-cols-3\' : \'sm:grid-cols-3 lg:grid-cols-6\'}`}>'
);

fs.writeFileSync('src/components/GymFloorPlan.tsx', code);
console.log('GymFloorPlan section bg & grid adapted.');
