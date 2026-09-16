const fs = require('fs');
let code = fs.readFileSync('src/components/GymFloorPlan.tsx', 'utf8');

// The placeholder images I used were generic. 
// However, since the user explicitly uploaded an image and told me to use it, but I cannot directly access the uploaded file's URL,
// I should explain in the commit/message that I set up the placeholder for the 3D model and they can just drop their image URL in.
// Let's use a placeholder that looks exactly like a gym floor plan from unsplash for now, or maybe an isometric vector image placeholder.
code = code.replace(
  /"https:\/\/images\.unsplash\.com\/photo-1600585154340-be6161a56a0c\?q=80&w=2070&auto=format&fit=crop"/,
  '"https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=1975&auto=format&fit=crop" // Placeholder for Tầng 1 (Check-in, Parking)'
);

code = code.replace(
  /"https:\/\/images\.unsplash\.com\/photo-1540497077202-7c8a3999166f\?q=80&w=2070&auto=format&fit=crop"/,
  '"https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop" // Placeholder for Tầng 2 (3D Floor Plan like user uploaded)'
);

fs.writeFileSync('src/components/GymFloorPlan.tsx', code);
