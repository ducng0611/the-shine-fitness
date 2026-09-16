const fs = require('fs');
let code = fs.readFileSync('src/components/GymFloorPlan.tsx', 'utf8');

code = code.replace(
  /className=\"flex-1 w-full perspective-\\[2000px\\]\"/,
  'className="flex-1 w-full" style={{ perspective: "2000px" }}'
);

fs.writeFileSync('src/components/GymFloorPlan.tsx', code);
