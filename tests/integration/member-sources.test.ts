import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import { PilotDatabase } from '../../server/src/local/sqlite';
import { seedQA, caseIdentity } from '../../server/src/local/seed';
import { importSourceMemory, MemberSourceReader } from '../../server/src/local/sourceMemory';
import { CloudMemberSourceReader, importMemberSources, sourceUid, virtualEmail, type AuthAdmin, type ImportStore } from '../../server/src/memberSources/cloud';
import { createConfiguredBuddyRouter } from '../../server/src/buddy/configured';
import { validatePassword } from '../../server/src/passwordValidation';
import { MemoryStore } from '../training/helpers';
import { syntheticManifest } from '../local/fixtures';

// Synthetic data only: the Local Pilot fixture accounts and invented facts.
const root = process.cwd();
const facts = { schemaVersion: 1 as const, cases: [{ key: 'adult-a', programId: 'prog_weight_gain_pt50', fields: {
  medicalHistory: { raw: 'SYNTHETIC health note A', status: 'recorded' as const, sourceRef: 'Synthetic-only source' },
  medications: { raw: null, status: 'not_recorded' as const, sourceRef: 'Synthetic-only source' },
  trainingGoal: { raw: 'SYNTHETIC goal A', status: 'recorded' as const, sourceRef: 'Synthetic-only source' } } }] };
const QUESTIONS = ['Trong ho so cua toi ghi benh ly nao?', 'Ho so cua toi co ghi thuoc dang dung khong?', 'Trong ho so cua toi, muc tieu tu khai la gi?', 'Meal plan PT giao cho toi la gi?'];

function memoryImportStore(backing = new MemoryStore()): ImportStore & { backing: MemoryStore } {
  return { backing, get: async p => { const r = await backing.get(p); if (!r) return null; const { id: _id, ...data } = r; return data; },
    commit: async writes => { for (const w of writes) backing.seed(w.path, w.data); } };
}
function fakeAuth(users = new Map<string, { uid: string; email: string }>()): AuthAdmin & { users: typeof users } {
  return { users, getUser: async uid => users.get(uid) ?? null,
    getUserByEmail: async email => [...users.values()].find(u => u.email === email) ?? null,
    createUser: async u => { users.set(u.uid, { uid: u.uid, email: u.email }); } };
}

/** Seed and import the Local Pilot, then run the real export script on it. */
async function exported() {
  const dir = mkdtempSync(join(tmpdir(), 'shine-export-')), dbPath = join(dir, 'pilot.sqlite'), out = join(dir, 'members.PRIVATE.json');
  const db = new PilotDatabase(dbPath);
  try { await seedQA(db, syntheticManifest, 'SYNTHETIC-test-only-9!', root); await importSourceMemory(db, root, facts); }
  finally { await db.close(); }
  const run = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/local/export-members.ts', '--local', '--db', dbPath, '--out', out], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  return { dir, dbPath, document: JSON.parse(readFileSync(out, 'utf8')) };
}

test('export → dry run writes nothing → import creates accounts once → re-import is unchanged', async () => {
  const { dir, document } = await exported();
  try {
    assert.equal(document.cases.length, syntheticManifest.cases.length);
    const store = memoryImportStore(), auth = fakeAuth();
    const dry = await importMemberSources({ payload: document, emailBase: 'owner@gmail.com', store, auth, root, apply: false });
    assert.equal(dry.status, 'dry_run'); assert.equal(store.backing.records.size, 0); assert.equal(auth.users.size, 0);
    const done = await importMemberSources({ payload: document, emailBase: 'owner@gmail.com', store, auth, root, apply: true });
    assert.equal(done.status, 'imported'); assert.equal(auth.users.size, document.cases.length);
    for (const a of done.accounts) {
      assert.match(a.email, /^owner\+kh-[-a-z0-9]+@gmail\.com$/);
      assert.equal(validatePassword(a.password!).isValid, true);
      assert(await store.get(`members/${a.uid}`)); assert(await store.get(`member_source_memory/${a.uid}`));
    }
    const again = await importMemberSources({ payload: document, emailBase: 'owner@gmail.com', store, auth, root, apply: true });
    assert.equal(again.status, 'unchanged'); assert(again.accounts.every((a: any) => a.account === 'existing' && !a.password));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('cloud reader answers exactly like the Local Pilot and never across owners', async () => {
  const { dir, dbPath, document } = await exported();
  const db = new PilotDatabase(dbPath);
  try {
    const store = memoryImportStore();
    await importMemberSources({ payload: document, emailBase: 'owner@gmail.com', store, auth: fakeAuth(), root, apply: true });
    const local = new MemberSourceReader(db), cloud = new CloudMemberSourceReader(store, root);
    for (const c of syntheticManifest.cases) {
      const localUid = caseIdentity(syntheticManifest, c).uid, cloudUid = sourceUid(syntheticManifest.batch, c.key);
      for (const q of QUESTIONS) {
        const answer = await cloud.answer(cloudUid, q, 'vi');
        assert(answer?.text, `no source answer for ${q}`);
        assert.deepEqual(answer, await local.answer(localUid, q, 'vi'), `${c.key}: ${q}`);
      }
      const review = await cloud.reviewContext(cloudUid, 'vi');
      assert(review?.text); assert.deepEqual(review, await local.reviewContext(localUid, 'vi'));
      const card = await cloud.profileCard(cloudUid);
      assert.equal(card!.label, c.label);
      if (c.key !== 'adult-a') assert(!JSON.stringify(await cloud.answer(cloudUid, QUESTIONS[0], 'vi')).includes('SYNTHETIC health note A'));
    }
    const a = await cloud.profileCard(sourceUid(syntheticManifest.batch, 'adult-a'));
    assert.equal(a!.fields.medicalHistory.raw, 'SYNTHETIC health note A'); assert.equal(a!.fields.medications.status, 'not_recorded');
    assert.equal(await cloud.profileCard('someone_else'), null);
  } finally { await db.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('import refuses account conflicts instead of taking over another sign-in', async () => {
  const { dir, document } = await exported();
  try {
    const key = document.cases[0].key, uid = sourceUid(document.batch, key);
    await assert.rejects(importMemberSources({ payload: document, emailBase: 'owner@gmail.com', store: memoryImportStore(),
      auth: fakeAuth(new Map([[uid, { uid, email: 'someone@else.com' }]])), root, apply: true }), /another email/);
    const email = virtualEmail('owner@gmail.com', key);
    await assert.rejects(importMemberSources({ payload: document, emailBase: 'owner@gmail.com', store: memoryImportStore(),
      auth: fakeAuth(new Map([['other-uid', { uid: 'other-uid', email }]])), root, apply: true }), /another account/);
    assert.throws(() => virtualEmail('not-an-email', 'x'));
    await assert.rejects(importMemberSources({ payload: { ...document, cases: [{ ...document.cases[0], role: 'admin' }] },
      emailBase: 'owner@gmail.com', store: memoryImportStore(), auth: fakeAuth(), root, apply: false }));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('AI Gym Buddy on the cloud router reads the signed-in member\'s imported record', async () => {
  const { dir, document } = await exported();
  const env = { chat: process.env.SHINE_CHAT_ENABLED, member: process.env.SHINE_CHAT_MEMBER_CONTEXT_ENABLED };
  process.env.SHINE_CHAT_ENABLED = 'true'; process.env.SHINE_CHAT_MEMBER_CONTEXT_ENABLED = 'true';
  const store = memoryImportStore();
  await importMemberSources({ payload: document, emailBase: 'owner@gmail.com', store, auth: fakeAuth(), root, apply: true });
  const uidA = sourceUid(document.batch, 'adult-a');
  const app = express(); app.use(express.json());
  app.use('/buddy', createConfiguredBuddyRouter({ store: store.backing, enabled: () => true, pilotUids: () => [], adminEmails: () => [], rateLimit: 1000,
    verifyToken: async token => ({ uid: token, email: `${token}@example.invalid`, email_verified: true }) } as any));
  const server = app.listen(0, '127.0.0.1'); await new Promise<void>(r => server.once('listening', r));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/buddy`;
  const call = async (path: string, body: unknown, token: string) => { const r = await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) }); return { status: r.status, body: await r.json() }; };
  const ask = async (token: string) => {
    const s = await call('/sessions', {}, token); assert.equal(s.status, 201);
    return (await call('/chat', { message: QUESTIONS[0], lang: 'vi', requestId: randomUUID(), conversationId: s.body.conversationId, expectedRevision: s.body.revision }, token)).body;
  };
  try {
    const own = await ask(uidA);
    assert.match(own.text, /SYNTHETIC health note A/); assert.equal(own.citations[0].scope, 'own_record');
    const other = await ask(sourceUid(document.batch, document.cases.find((c: any) => c.key !== 'adult-a').key));
    assert(!other.text.includes('SYNTHETIC health note A'));
  } finally {
    server.closeAllConnections(); await new Promise<void>(r => server.close(() => r()));
    process.env.SHINE_CHAT_ENABLED = env.chat; process.env.SHINE_CHAT_MEMBER_CONTEXT_ENABLED = env.member;
    if (env.chat === undefined) delete process.env.SHINE_CHAT_ENABLED; if (env.member === undefined) delete process.env.SHINE_CHAT_MEMBER_CONTEXT_ENABLED;
    rmSync(dir, { recursive: true, force: true });
  }
});
