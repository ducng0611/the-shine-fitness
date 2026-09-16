const fs = require('fs');
let code = fs.readFileSync('src/components/GymFloorPlan.tsx', 'utf8');

code = code.replace(
  /"https:\/\/images\.unsplash\.com\/photo-1571902943202-507ec2618e8f\?q=80&w=1975&auto=format&fit=crop"/,
  '"/floor1.jpg"'
);

code = code.replace(
  /"https:\/\/images\.unsplash\.com\/photo-1534438327276-14e5300c3a48\?q=80&w=1470&auto=format&fit=crop"/,
  '"/floor2.jpg"'
);

// Remove the filter brightness and contrast if it exists, so the original design from the video shows clearly
code = code.replace(
  /className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 filter brightness-75 contrast-125"/,
  'className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500"'
);


fs.writeFileSync('src/components/GymFloorPlan.tsx', code);
console.log('Updated GymFloorPlan to use local image paths.');
