/** Export the Local Pilot member sources (profile snapshot + recorded facts) as one document for
 *  Shine Companion → Quản trị gym → "Nạp hồ sơ khách". Opens the database read-only and writes a
 *  new *.PRIVATE.json file, which .gitignore keeps out of Git. */
import { DatabaseSync } from 'node:sqlite';
import { existsSync, writeFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { parseImportPayload } from '../../server/src/memberSources/cloud';

const args = process.argv.slice(2), get = (key: string) => args.includes(key) ? args[args.indexOf(key) + 1] : undefined;
if (!args.includes('--local') || !get('--db') || !get('--out')) throw new Error('Required --local --db PILOT_SQLITE --out NEW_FILE.PRIVATE.json');
const dbPath = resolve(get('--db')!), out = resolve(get('--out')!);
if (!existsSync(dbPath)) throw new Error('Database not found');
if (!basename(out).endsWith('.PRIVATE.json') || existsSync(out)) throw new Error('Output must be a new file named *.PRIVATE.json');

const db = new DatabaseSync(dbPath, { readOnly: true });
try {
  const users = db.prepare('SELECT uid, source_json FROM local_users WHERE disabled=0 ORDER BY uid').all();
  const readDoc = (path: string) => { const r = db.prepare('SELECT body FROM local_documents WHERE path=?').get(path); return r ? JSON.parse(String(r.body)) : null; };
  const sources = users.map(u => ({ source: JSON.parse(String(u.source_json)), memory: readDoc(`member_source_memory/${u.uid}`) }));
  const batches = [...new Set(sources.map(s => s.source.batch))];
  if (batches.length !== 1) throw new Error(`Expected one QA batch, found ${batches.length}`);
  const document = {
    schemaVersion: 1, batch: batches[0], sourcePolicy: sources[0].source.provenance,
    cases: sources.map(({ source: s, memory }) => ({
      key: s.key, label: s.label, ageAtSource: s.ageAtSource, heightCm: s.heightCm, weightKg: s.weightKg, goal: s.goal,
      requiresReview: s.requiresReview, programId: s.programId, sourceStatus: s.sourceStatus, sourceNotes: s.sourceNotes,
      ...(memory?.fields && Object.keys(memory.fields).length ? { fields: memory.fields } : {}),
    })),
  };
  parseImportPayload(document); // same validation as the server import
  writeFileSync(out, JSON.stringify(document, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
  console.log(`Exported ${document.cases.length} members (${document.cases.filter(c => 'fields' in c).length} with recorded facts) to ${out}`);
} finally { db.close(); }
