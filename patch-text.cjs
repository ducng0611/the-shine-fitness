const fs = require('fs');
let code = fs.readFileSync('src/translations.ts', 'utf8');

code = code.replace(
  /bookAppointment: 'Đặt Lịch Trực Tuyến'/,
  "bookAppointment: 'Đặt Lịch'"
);
code = code.replace(
  /directions: 'Xem chỉ đường trên Google Maps'/,
  "directions: 'Xem Chỉ Đường'"
);

code = code.replace(
  /bookAppointment: 'Book Online Appointment'/,
  "bookAppointment: 'Book Now'"
);
code = code.replace(
  /directions: 'Open in Google Maps'/,
  "directions: 'Get Directions'"
);

fs.writeFileSync('src/translations.ts', code);
console.log('Text shortened successfully.');
