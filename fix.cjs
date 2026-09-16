const fs = require('fs');
let code = fs.readFileSync('src/components/GymFloorPlan.tsx', 'utf8');

// Fix the syntax error from my JS comment replacement
code = code.replace(
  /\/\/ Placeholder for Tầng 1 \(Check-in, Parking\) /g,
  ""
);
code = code.replace(
  /\/\/ Placeholder for Tầng 2 \(3D Floor Plan like user uploaded\)/g,
  ""
);

fs.writeFileSync('src/components/GymFloorPlan.tsx', code);
console.log('Fixed syntax error');
