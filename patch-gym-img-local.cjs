const fs = require('fs');
let code = fs.readFileSync('src/components/GymFloorPlan.tsx', 'utf8');

code = code.replace(
  /"https:\/\/images\.unsplash\.com\/photo-1588644485584-c8c227bf7c43\?q=80&w=2070&auto=format&fit=crop"/g,
  '"/floor1.jpg"' 
);

code = code.replace(
  /"https:\/\/images\.unsplash\.com\/photo-1593079831268-3381b0c1239b\?q=80&w=2069&auto=format&fit=crop"/g,
  '"/floor2.jpg"' 
);

fs.writeFileSync('src/components/GymFloorPlan.tsx', code);
console.log('Updated GymFloorPlan to use downloaded local photos.');
