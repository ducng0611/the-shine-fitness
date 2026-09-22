// One-time source-only correction; no data, provider or database access.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
function replace(path, expectedSha, oldText, newText) {
  const content = fs.readFileSync(path);
  const sha = createHash('sha1').update(`blob ${content.length}\0`).update(content).digest('hex');
  assert.equal(sha, expectedSha, `Unexpected baseline for ${path}`);
  const text = content.toString('utf8');
  assert.equal(text.split(oldText).length, 2, `Expected one exact edit in ${path}`);
  fs.writeFileSync(path, text.replace(oldText, newText));
}
replace('src/components/pathways/PathwayIntakeModal.tsx', 'f889cc0d6e05b8e948eaee419fa54a8048a84680',
  'const [caseId,setCaseId] = useState(newId)',
  'const [caseId,setCaseId] = useState<string>(newId)');
replace('src/lib/firebase.ts', 'c1a11729aeb34f1eec4f00dad70763fa3056364a',
  'adminsMap.set(data.email.toLowerCase(), { uid: docSnap.id, ...data });',
  '// The document key is authoritative; a stored field must not overwrite it.\n        adminsMap.set(data.email.toLowerCase(), { ...data, uid: docSnap.id });');
const cssPath='src/components/pathways/pathways.css';
let css=fs.readFileSync(cssPath,'utf8');
assert(css.includes('.pathway-grid{grid-template-columns:1fr}'));
css=css.replace('.pathway-grid{grid-template-columns:1fr}', '.pathway-grid{grid-template-columns:minmax(0,1fr)}');
css+='\n/* Constrain grid descendants, not just hide the overflow. Tables retain their own horizontal scroll. */\n.pathway-dialog,.pathway-dialog *{box-sizing:border-box}\n.pathway-body,.pathway-grid,.pathway-grid>section,.pathway-dialog header>div{min-width:0;max-width:100%}\n.pathway-dialog{overflow-wrap:anywhere}\n.pathway-dialog textarea,.pathway-dialog input[type=file]{display:block;min-width:0;max-width:100%;width:100%}\n.pathway-dialog button{max-width:100%;white-space:normal;overflow-wrap:anywhere}\n.pathway-dialog header>button{flex-shrink:0;align-self:flex-start}\n.pathway-table{max-width:100%;min-width:0}\n';
fs.writeFileSync(cssPath,css);
