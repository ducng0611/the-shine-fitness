const fs = require('fs');
let authCode = fs.readFileSync('server/src/middleware/auth.ts', 'utf8');
authCode = authCode.replace(/\.\.\/lib\/firebase-admin\.ts/g, '../lib/firebase-admin.ts'); // Wait, the path might be different now.
fs.writeFileSync('server/src/middleware/auth.ts', authCode);

let adminCode = fs.readFileSync('server/src/lib/firebase-admin.ts', 'utf8');
// adminCode was importing '../../firebase-applet-config.json', now it is in server/src/lib so it should be '../../../firebase-applet-config.json'
adminCode = adminCode.replace(/..\/..\/firebase-applet-config.json/g, '../../../firebase-applet-config.json');
fs.writeFileSync('server/src/lib/firebase-admin.ts', adminCode);
