const fs = require('fs');

let envCode = fs.readFileSync('.env.example', 'utf8');

envCode = envCode.replace(/SQL_HOST=\n?/g, '');
envCode = envCode.replace(/SQL_USER=\n?/g, '');
envCode = envCode.replace(/SQL_PASSWORD=\n?/g, '');
envCode = envCode.replace(/SQL_DB_NAME=\n?/g, '');
envCode = envCode.replace(/DATABASE_URL=\n?/g, '');

fs.writeFileSync('.env.example', envCode);
console.log('Removed SQL from .env.example');

