/** Idempotent integration against the reviewed repository layout. No dependencies required. */
import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const edits = new Map();
function once(source, before, after, label) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected one known integration anchor, found ${count}. No files have been written.`);
  return source.replace(before, after);
}
for (const file of ['server/src/companion/router.ts', 'server/src/companion/core.mjs', 'server/src/companion/providers.ts',
  'src/components/companion/ChatbotGateway.tsx', 'src/components/companion/CompanionChat.tsx', 'tests/companion.test.mjs']) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing required companion module: ${file}`);
}

let server = read('server/src/index.ts');
if (!server.includes('import { registerCompanionRoutes }')) server = 'import { registerCompanionRoutes } from "./companion/router.ts";\n' + server;
if (!server.includes('registerCompanionRoutes(app);')) server = once(server, '  app.use(express.json());',
  '  // Companion has its own authenticated parser and food-photo size limit.\n  registerCompanionRoutes(app);\n  app.use(express.json());', 'Server JSON-parser anchor');

// Existing /api/members/lookup was authenticated but not owner-scoped. Keep verified admins,
// but never let ordinary accounts look up another member by UID/email/phone/memberCode.
if (!server.includes('// SHINE_COMPANION_OWNER_LOOKUP')) {
  const start = server.indexOf('  app.post("/api/members/lookup", requireAuth,');
  const end = server.indexOf('  // Admin Gym Packages Endpoints', start);
  if (start < 0 || end < start) throw new Error('Member lookup route boundaries changed. No files have been written.');
  let block = server.slice(start, end);
  const guard = `      // SHINE_COMPANION_OWNER_LOOKUP
      const lookupIsAdmin = Boolean(req.user?.email_verified &&
        (process.env.ADMIN_EMAILS || '').split(',').map(value => value.trim().toLowerCase())
          .filter(Boolean).includes((req.user?.email || '').trim().toLowerCase()));
      if (!lookupIsAdmin) {
        if (uid && uid !== requesterUid) return res.status(403).json({ error: 'Forbidden: owner-only member lookup' });
        const ownMember = await adminDb.collection('members').doc(requesterUid).get();
        return res.json({ success: true, member: ownMember.exists ? { ...ownMember.data(), uid: ownMember.id } : null });
      }

      let found: any = null;`;
  block = once(block, '      let found: any = null;', guard, 'Owner lookup guard');
  server = server.slice(0, start) + block + server.slice(end);
}
edits.set('server/src/index.ts', server);

let app = read('src/App.tsx');
if (!app.includes("import Chatbot from './components/companion/ChatbotGateway';")) app = once(app,
  "import Chatbot from './components/Chatbot';", "import Chatbot from './components/companion/ChatbotGateway';", 'App chatbot import');
edits.set('src/App.tsx', app);

let rules = read('firestore.rules');
if (!rules.includes('// SHINE_COMPANION_SERVER_ONLY')) rules = once(rules, '    match /{document=**} {', `    // SHINE_COMPANION_SERVER_ONLY: Admin SDK + owner-scoped API only.
    match /companion_members/{memberUid} {
      allow read, write: if false;
      match /{privateDocument=**} {
        allow read, write: if false;
      }
    }
    match /companion_catalogues/{catalogueId} {
      allow read, write: if false;
    }

    match /{document=**} {`, 'Firestore default-deny anchor');
edits.set('firestore.rules', rules);

let env = read('.env.example');
if (!env.includes('# SHINE_COMPANION_PILOT')) env += `

# SHINE_COMPANION_PILOT - disabled by default; review docs before enabling.
SHINE_COMPANION_ENABLED=false
VITE_SHINE_COMPANION_ENABLED=false
# Select a model actually available in your Gemini project. Never expose server keys via VITE_*.
SHINE_GEMINI_MODEL=
USDA_FDC_API_KEY=
GOOGLE_PLACES_API_KEY=
`;
edits.set('.env.example', env);

let readme = read('README.md');
if (!readme.includes('<!-- SHINE_COMPANION_ARCHITECTURE -->')) readme += `

<!-- SHINE_COMPANION_ARCHITECTURE -->
## Shine Companion: authenticated member AI pilot

A separate member experience now accompanies the existing guest service chatbot. It adds explicit profile/consent, gym-constrained workout cards, actual-set confirmation, food text/photo drafts, sourced calorie arithmetic, a timezone-aware diary, nearby food lookup with location permission, and three controlled brand-personality styles.

**This is a guarded pilot, not an already-deployed or clinically validated coaching product.** Detailed station inventory and floor directions are still required from gym management; the repository template is unverified and is never automatically enabled. Model extraction cannot write member logs. Real Firebase authentication and user confirmation are required.

- [Architecture and techniques (Vietnamese)](docs/shine-companion-architecture.md)
- [Setup, demo flows and acceptance checks (Vietnamese)](docs/shine-companion-rollout.md)
- [Unverified catalogue template](data/companion/companion-catalogue.template.json)
- Domain tests: \`node --test tests/companion.test.mjs\`
- Integration: \`node scripts/integrate_companion.mjs\` (idempotent)

Both \`SHINE_COMPANION_ENABLED\` and the frontend build flag \`VITE_SHINE_COMPANION_ENABLED\` default to false. API credentials remain server-side. Existing service RAG is preserved; the companion uses structured personal retrieval, JSON-schema extraction and deterministic domain rules rather than claiming a new autonomous multi-agent system.
`;
edits.set('README.md', readme);

// Small integration hardening: progress already contains fresh data, so do not start an
// unhandled background refresh; catalogue document must fit Firestore's document limit.
let ui = read('src/components/companion/CompanionChat.tsx');
const oldProgress = "if (data.kind === 'progress') { setTab('diary'); void refresh(); }";
if (ui.includes(oldProgress)) ui = ui.replace(oldProgress,
  "if (data.kind === 'progress') { setTab('diary'); setContext(previous => previous ? { ...previous, history: data.history, diary: data.diary } : previous); }");
edits.set('src/components/companion/CompanionChat.tsx', ui);
let router = read('server/src/companion/router.ts');
if (!router.includes("'CATALOGUE_TOO_LARGE'")) {
  const anchor = "    await adminDb.runTransaction(async tx => { const snap = await tx.get(catalogRef());";
  router = once(router, anchor,
    "    ensure(Buffer.byteLength(JSON.stringify(cat), 'utf8') < 900000, 'CATALOGUE_TOO_LARGE', 'Danh mục vượt giới hạn pilot. Chia nhỏ dữ liệu trước khi lưu.');\n" + anchor, 'Catalogue size guard');
}
edits.set('server/src/companion/router.ts', router);

// Every anchor has been validated before writing any file.
let changed = 0;
for (const [file, contents] of edits) if (read(file) !== contents) { fs.writeFileSync(path.join(root, file), contents, 'utf8'); console.log(`Updated ${file}`); changed++; }
console.log(changed ? `Integrated companion changes in ${changed} files.` : 'Companion integration already applied; no changes.');
