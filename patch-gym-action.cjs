const fs = require('fs');

// 1. Update Translations
let transCode = fs.readFileSync('src/translations.ts', 'utf8');
transCode = transCode.replace(
  /title: 'Sơ Đồ Phòng Tập 3D'/,
  "title: 'Sơ Đồ Phòng Tập'"
);
transCode = transCode.replace(
  /title: '3D Gym Floor Plan'/,
  "title: 'Gym Floor Plan'"
);
fs.writeFileSync('src/translations.ts', transCode);
console.log('Translations updated.');

// 2. Update GymFloorPlan.tsx
let gymCode = fs.readFileSync('src/components/GymFloorPlan.tsx', 'utf8');
gymCode = gymCode.replace(
  /interface GymFloorPlanProps \{\n  lang: Language;\n\}/,
  "interface GymFloorPlanProps {\n  lang: Language;\n  onOpenRegistration?: () => void;\n}"
);
gymCode = gymCode.replace(
  /export function GymFloorPlan\(\{ lang \}: GymFloorPlanProps\) \{/,
  "export function GymFloorPlan({ lang, onOpenRegistration }: GymFloorPlanProps) {"
);

// Replace the click handler for the button
gymCode = gymCode.replace(
  /onClick=\{\(\) => \{\n\s*const bookBtn = document\.getElementById\('bookNowButton'\);\n\s*if \(bookBtn\) bookBtn\.click\(\);\n\s*\}\}/,
  "onClick={() => { if (onOpenRegistration) onOpenRegistration(); }}"
);

fs.writeFileSync('src/components/GymFloorPlan.tsx', gymCode);
console.log('GymFloorPlan.tsx updated.');

// 3. Update App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace(
  /<GymFloorPlan lang=\{lang\} \/>/,
  "<GymFloorPlan lang={lang} onOpenRegistration={() => openRegistration()} />"
);
fs.writeFileSync('src/App.tsx', appCode);
console.log('App.tsx updated.');
