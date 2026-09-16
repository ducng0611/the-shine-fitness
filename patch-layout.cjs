const fs = require('fs');
let code = fs.readFileSync('src/components/GymFloorPlan.tsx', 'utf8');

// Update grid items alignment to stretch
code = code.replace(
  /className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start"/,
  'className="flex flex-col xl:flex-row gap-6 lg:gap-8 items-stretch"'
);

// Update left panel
code = code.replace(
  /<div className="flex-1 w-full relative group">/,
  '<div className="flex-1 w-full flex flex-col relative group">'
);

// Update aspect ratio for image
code = code.replace(
  /className="w-full aspect-\[4\/3\] sm:aspect-video lg:aspect-square xl:aspect-\[4\/3\] bg-slate-900 rounded-3xl border-2 border-white\/10 overflow-hidden shadow-2xl relative"/,
  'className="w-full aspect-[4/3] md:aspect-video bg-slate-900 rounded-3xl border-2 border-white/10 overflow-hidden shadow-2xl relative"'
);

// Right side wrapper height
code = code.replace(
  /<div className="w-full lg:w-\[420px\] shrink-0">/,
  '<div className="w-full xl:w-[450px] shrink-0 flex">'
);

// Right side card exact classes
code = code.replace(
  /className="bg-slate-900\/80 backdrop-blur-xl border border-white\/10 rounded-3xl p-8 sticky top-24 shadow-2xl"/,
  'className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl w-full flex flex-col"'
);

// Inside Right card motion.div height
code = code.replace(
  /<motion\.div\n\s*key=\{activeZone\}\n\s*initial=\{\{ opacity: 0, x: 20 \}\}\n\s*animate=\{\{ opacity: 1, x: 0 \}\}\n\s*exit=\{\{ opacity: 0, x: -20 \}\}\n\s*transition=\{\{ duration: 0\.2 \}\}\n\s*>/,
  '<motion.div\n                    key={activeZone}\n                    initial={{ opacity: 0, x: 20 }}\n                    animate={{ opacity: 1, x: 0 }}\n                    exit={{ opacity: 0, x: -20 }}\n                    transition={{ duration: 0.2 }}\n                    className="flex flex-col h-full"\n                  >'
);

// Button mt-auto pushes it to bottom
code = code.replace(
  /className="mt-12 w-full py-5 rounded-xl font-bold text-lg bg-brand-orange hover:bg-brand-orange-hover text-white transition-colors flex items-center justify-center gap-3 shadow-lg group"/,
  'className="mt-auto pt-6 w-full py-5 rounded-xl font-bold text-lg bg-brand-orange hover:bg-brand-orange-hover text-white transition-colors flex items-center justify-center gap-3 shadow-lg group"'
);

fs.writeFileSync('src/components/GymFloorPlan.tsx', code);
console.log('Layout updated.');
