const fs = require('fs');
const path = require('path');

// 1. Update server/src/index.ts
const serverIndexPath = path.join(__dirname, 'server/src/index.ts');
if (fs.existsSync(serverIndexPath)) {
  let content = fs.readFileSync(serverIndexPath, 'utf8');
  content = content.replace(/\.\/server\/csvStorage/g, './csvStorage');
  content = content.replace(/\.\/server\/excelDataService/g, './excelDataService');
  content = content.replace(/\.\/server\/genderHelper/g, './genderHelper');
  content = content.replace(/\.\/server\/chatConsultantKnowledge/g, './chatConsultantKnowledge');
  content = content.replace(/\.\/src\/middleware\/auth\.ts/g, './middleware/auth.ts');
  content = content.replace(/\.\/src\/db\/users\.ts/g, './db/users.ts');
  fs.writeFileSync(serverIndexPath, content);
  console.log('Updated server/src/index.ts imports');
} else {
  console.log('server/src/index.ts not found');
}

// 2. Update package.json
const pkgPath = path.join(__dirname, 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.scripts = pkg.scripts || {};
  pkg.scripts['dev:client'] = "vite";
  pkg.scripts['dev:server'] = "tsx server/src/index.ts";
  pkg.scripts['dev'] = "tsx server/src/index.ts";
  pkg.scripts['build'] = "vite build && esbuild server/src/index.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs";
  pkg.scripts['start'] = "node dist/server.cjs";
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  console.log('Updated package.json');
}

// 3. Create .env.example
const envContent = `PORT=3000
DATABASE_URL=
SQL_HOST=
SQL_USER=
SQL_PASSWORD=
SQL_DB_NAME=
GEMINI_API_KEY=
`;
fs.writeFileSync(path.join(__dirname, '.env.example'), envContent);
console.log('Created .env.example');

// 4. Create README.md
const readmeContent = `# The Shine Fitness & Yoga

A full-stack application built with React (Vite) and Express (Node.js).

## Architecture

This project is separated into Frontend and Backend for clear responsibility:

- \`src/\`: Contains all Frontend React code (components, styles, UI logic).
- \`server/src/\`: Contains all Backend Express code (API routes, database connection, middleware).
- \`scripts/\`: Contains python scripts for scraping and utilities.
- \`public/\`: Static assets served directly to the client.

## Getting Started

1. **Install Dependencies**
   \`\`\`bash
   npm install
   \`\`\`

2. **Environment Configuration**
   Copy \`.env.example\` to \`.env\` and fill in the required values:
   - \`GEMINI_API_KEY\`: Your Google Gemini API Key.
   - PostgreSQL credentials (\`SQL_HOST\`, \`SQL_USER\`, etc.) or \`DATABASE_URL\`.

3. **Development**
   Start the unified dev server (Express serving API + Vite as middleware):
   \`\`\`bash
   npm run dev
   \`\`\`
   
   *Alternatively, if running locally outside AI Studio constraints:*
   \`\`\`bash
   npm run dev:server
   npm run dev:client
   \`\`\`

4. **Production Build**
   \`\`\`bash
   npm run build
   npm run start
   \`\`\`
`;
fs.writeFileSync(path.join(__dirname, 'README.md'), readmeContent);
console.log('Created README.md');

