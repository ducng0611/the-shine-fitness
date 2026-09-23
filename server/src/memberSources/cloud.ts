/** Firestore deployment of member source memory: owner-only reads for AI Gym Buddy and the
 *  member's profile card, and the admin import that creates virtual sign-in accounts.
 *  Private source files never enter Git; the admin pastes the export from the Local Pilot. */
import { randomBytes } from 'node:crypto';
import { hash, id, validateEnrichment, loadSourceBundle, reviewContextFromSnapshot, answerFromSnapshot,
  type Obj, type SourceAnswer, type SourceSnapshot, type PrivateEnrichment } from './source';
import { parseManifest, type QAManifest } from './manifest';
import type { BuddyLanguage } from '../../../shared/buddyChat';
import { ownSourceQuery } from '../../../shared/buddySourceQuery';

export interface SourceDocStore { get(path: string): Promise<Obj | null> }
const MEMORY = 'member_source_memory', RECEIPT = 'member_source_imports/current';
const FACT_KEYS = ['trainingGoal', 'medicalHistory', 'medications', 'medicalClearance', 'ptNotes'] as const;

export class CloudMemberSourceReader {
  private bundle: ReturnType<typeof loadSourceBundle> | null = null;
  constructor(private store: SourceDocStore, private root: string) {}
  private lists() { return (this.bundle ??= loadSourceBundle(this.root)).lists; }
  async hasSource(uid: string) { return id(uid) && !!(await this.store.get(`${MEMORY}/${uid}`)); }
  async snapshot(uid: string): Promise<SourceSnapshot | null> {
    if (!id(uid)) throw new Error('Invalid owner');
    const [memory, receipt] = await Promise.all([this.store.get(`${MEMORY}/${uid}`), this.store.get(RECEIPT)]);
    if (!memory || !receipt) return null;
    if (memory.uid !== uid || memory.importRevision !== receipt.revision) throw new Error('Source snapshot is stale or belongs to another owner');
    validateEnrichment({ schemaVersion: 1, cases: [{ key: memory.sourceProfile?.key, programId: memory.sourceProgramId, fields: memory.fields ?? {} }] });
    const program = this.lists().programs.find(p => p.id === memory.sourceProgramId);
    if (!program || hash(program) !== memory.programHash) throw new Error('Source program changed since import; run the member import again');
    return { memory, program, receipt, assets: this.lists().assets };
  }
  async reviewContext(uid: string, lang: BuddyLanguage): Promise<SourceAnswer | null> {
    const snap = await this.snapshot(uid); return snap ? reviewContextFromSnapshot(snap, lang) : null;
  }
  async answer(uid: string, message: string, lang: BuddyLanguage, topic: string | null = null): Promise<SourceAnswer | null> {
    if (!ownSourceQuery(message, topic)) return null;
    return answerFromSnapshot(await this.snapshot(uid), message, lang, topic);
  }
  /** Read-only card for the signed-in member: original wording and status only, nothing inferred. */
  async profileCard(uid: string) {
    const snap = await this.snapshot(uid);
    if (!snap) return null;
    const s = snap.memory.sourceProfile, fields = snap.memory.fields ?? {};
    return {
      label: s.label, ageAtSource: s.ageAtSource, heightCm: s.heightCm, weightKg: s.weightKg, goal: s.goal,
      requiresReview: s.requiresReview, notes: Array.isArray(s.sourceNotes) ? s.sourceNotes : [],
      fields: Object.fromEntries(FACT_KEYS.map(k => [k, { raw: fields[k]?.raw ?? null, status: fields[k]?.status ?? 'not_recorded' }])),
      program: { id: snap.program.id, name: snap.program.name, sessionCount: Array.isArray(snap.program.referenceSessions) ? snap.program.referenceSessions.length : 0 },
      importedAt: snap.memory.importedAt, revision: snap.receipt.revision,
    };
  }
}

/** One pasted document: the Local Pilot manifest cases, each with its optional private fields. */
export function parseImportPayload(raw: unknown): { manifest: QAManifest; enrichment: PrivateEnrichment } {
  const r = raw as Obj;
  if (!r || typeof r !== 'object' || Array.isArray(r) || Object.keys(r).some(k => !['schemaVersion', 'batch', 'sourcePolicy', 'cases'].includes(k))
    || r.schemaVersion !== 1 || !Array.isArray(r.cases)) throw new Error('Invalid member import document');
  const manifest = parseManifest({ schemaVersion: 1, qaOnly: true, batch: r.batch, sourcePolicy: r.sourcePolicy,
    cases: r.cases.map((c: Obj) => { const { fields: _fields, ...rest } = c ?? {}; return rest; }) });
  const enrichment = validateEnrichment({ schemaVersion: 1,
    cases: r.cases.filter((c: Obj) => c?.fields).map((c: Obj) => ({ key: c.key, programId: c.programId, fields: c.fields })) });
  return { manifest, enrichment };
}

/** Plus-addressing keeps every virtual account in a mailbox the owner controls. */
export function virtualEmail(base: string, key: string) {
  const m = /^([^@\s+]+)@([^@\s]+\.[^@\s]+)$/.exec(String(base ?? '').trim().toLowerCase());
  if (!m) throw new Error('Email base must be a mailbox such as owner@gmail.com');
  return `${m[1]}+kh-${key}@${m[2]}`;
}
export const sourceUid = (batch: string, key: string) => `shineqa_${hash([batch, key]).slice(0, 24)}`;
/** Meets the website rule: 8+ characters with upper case, lower case and a special character. */
export const newPassword = () => `Shine!${randomBytes(9).toString('base64url')}a9`;

export interface AuthAdmin {
  getUser(uid: string): Promise<{ uid: string; email?: string } | null>;
  getUserByEmail(email: string): Promise<{ uid: string } | null>;
  createUser(user: { uid: string; email: string; password: string; emailVerified: true; displayName: string }): Promise<void>;
}
export interface ImportStore extends SourceDocStore { commit(writes: { path: string; data: Obj }[]): Promise<void> }

export async function importMemberSources(o: { payload: unknown; emailBase: string; store: ImportStore; auth: AuthAdmin; root: string; apply: boolean; now?: number }) {
  const { manifest, enrichment } = parseImportPayload(o.payload);
  const bundle = loadSourceBundle(o.root), now = o.now ?? Date.now();
  const programs = new Map(bundle.lists.programs.map(p => [p.id, p]));
  const previous = await o.store.get(RECEIPT);
  const members = [];
  for (const c of manifest.cases) {
    const program = programs.get(c.programId);
    if (!program) throw new Error(`Unknown program reference: ${c.programId}`);
    const uid = sourceUid(manifest.batch, c.key), email = virtualEmail(o.emailBase, c.key);
    const existing = await o.auth.getUser(uid);
    if (existing && (existing.email ?? '').toLowerCase() !== email) throw new Error(`Account ${uid} already exists with another email`);
    if (!existing) { const owner = await o.auth.getUserByEmail(email); if (owner) throw new Error(`${email} already belongs to another account`); }
    const prior = await o.store.get(`${MEMORY}/${uid}`);
    if (prior && prior.sourceProfile?.key !== c.key) throw new Error('Existing source belongs to another case');
    const input = enrichment.cases.find(e => e.key === c.key);
    // An omitted enrichment keeps previous values instead of silently clearing them.
    const fields = input ? { ...prior?.fields, ...input.fields } : (prior?.fields ?? {});
    members.push({ c, uid, email, program, fields, createAccount: !existing, memberDoc: await o.store.get(`members/${uid}`) });
  }
  const contentHash = hash({ programs: members.map(m => hash(m.program)), members: members.map(m => ({ uid: m.uid, email: m.email, source: m.c, fields: m.fields })) });
  const counts = { members: members.length, ...Object.fromEntries(Object.entries(bundle.lists).map(([k, v]) => [k, v.length])) };
  const unchanged = previous?.contentHash === contentHash && members.every(m => !m.createAccount);
  const revision = unchanged ? previous!.revision : (previous?.revision ?? 0) + 1;
  const accounts = members.map(m => ({ label: m.c.label, email: m.email, uid: m.uid, account: m.createAccount ? 'create' : 'existing', password: null as string | null }));
  if (!o.apply || unchanged) return { status: unchanged ? 'unchanged' : 'dry_run', revision, counts, accounts };

  const importedAt = new Date(now).toISOString(), passwords = new Map<string, string>();
  for (const m of members.filter(x => x.createAccount)) {
    const password = newPassword();
    await o.auth.createUser({ uid: m.uid, email: m.email, password, emailVerified: true, displayName: m.c.label });
    passwords.set(m.uid, password);
  }
  const writes: { path: string; data: Obj }[] = [];
  for (const m of members) {
    if (!m.memberDoc) writes.push({ path: `members/${m.uid}`, data: {
      uid: m.uid, fullName: m.c.label, email: m.email, phone: '', membershipTier: 'Standard', membershipCode: `QA-${m.c.key}`,
      status: 'Active', authProvider: 'password', joinedDate: importedAt.slice(0, 10),
      expiryDate: new Date(now + 365 * 86400_000).toISOString().slice(0, 10), qaOnly: true, createdAt: importedAt } });
    writes.push({ path: `${MEMORY}/${m.uid}`, data: {
      schemaVersion: 1, uid: m.uid, email: m.email, sourceProfile: { ...m.c, batch: manifest.batch, provenance: manifest.sourcePolicy },
      fields: m.fields, sourceProgramId: m.c.programId, programHash: hash(m.program),
      sourceAssociation: 'operator_linked_reference_not_assignment', assignedProgramId: null, mealPlanAssignment: null,
      importRevision: revision, importedAt, qaOnly: true, eligibleForPlanner: false } });
  }
  const receipt = { revision, contentHash, counts, importedAt, previousRevision: previous?.revision ?? 0, trainingWrites: 0, assignmentWrites: 0 };
  writes.push({ path: RECEIPT, data: receipt }, { path: `member_source_imports/revision_${revision}`, data: receipt });
  await o.store.commit(writes);
  return { status: 'imported', revision, counts, accounts: accounts.map(a => ({ ...a, password: passwords.get(a.uid) ?? null })) };
}
