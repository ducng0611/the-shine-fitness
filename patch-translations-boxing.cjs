const fs = require('fs');

let transCode = fs.readFileSync('src/translations.ts', 'utf8');

// Insert boxing into Vietnamese zones
transCode = transCode.replace(
  /machines: \{ name: 'Khu Máy Kháng Lực'/,
  "boxing: { name: 'Khu Vực Boxing', desc: 'Sàn đấu chuẩn và bao cát chuyên dụng dành riêng cho Boxing, Kickboxing, Muay Thái.', equipment: ['Sàn Boxing', 'Bao cát', 'Găng tay', 'Đích đấm'] },\n        machines: { name: 'Khu Máy Kháng Lực'"
);

// Insert boxing into English zones
transCode = transCode.replace(
  /machines: \{ name: 'Resistance Machines'/,
  "boxing: { name: 'Boxing Zone', desc: 'Standard boxing ring and heavy bags for Boxing, Kickboxing, and Muay Thai.', equipment: ['Boxing Ring', 'Heavy Bags', 'Gloves', 'Focus Mitts'] },\n        machines: { name: 'Resistance Machines'"
);

fs.writeFileSync('src/translations.ts', transCode);
console.log('Translations updated with boxing.');
