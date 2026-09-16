const fs = require('fs');
let code = fs.readFileSync('src/components/GymFloorPlan.tsx', 'utf8');

code = code.replace(
  /'text-slate-400 hover:text-white hover:bg-white\/5'/,
  '\'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5\''
);

fs.writeFileSync('src/components/GymFloorPlan.tsx', code);
console.log('GymFloorPlan floor 2 button adapted.');
