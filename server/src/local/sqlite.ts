import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, chmodSync, lstatSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { QuerySpec, TrainingStore, TrainingTransaction } from '../companion/training/store';
import type { RecordObject } from '../../../shared/training';

/** Disk-backed, local-pilot-only database. No Firebase SDK, network or credentials. */
export class PilotDatabase {
  private readonly connection: DatabaseSync;
  private tail: Promise<unknown> = Promise.resolve();
  private readonly owner = new AsyncLocalStorage<boolean>();
  private closed = false;
  constructor(readonly filename: string) {
    if (filename !== ':memory:') {
      const full = resolve(filename), folder = dirname(full);
      mkdirSync(folder, { recursive: true, mode: 0o700 });
      if (lstatSync(folder).isSymbolicLink()) throw new Error('Unsafe database directory');
      try { if (lstatSync(full).isSymbolicLink()) throw new Error('Unsafe database file'); }
      catch (e) { if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e; }
      chmodSync(folder, 0o700);
    }
    this.connection = new DatabaseSync(filename, { timeout: 5000 });
    this.connection.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;');
    const version = Number(this.connection.prepare('PRAGMA user_version').get()!.user_version);
    if (version > 1) { this.connection.close(); throw new Error('Database schema newer than this application'); }
    this.connection.exec(`
      CREATE TABLE IF NOT EXISTS local_users (
        uid TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
        display_name TEXT NOT NULL, source_json TEXT NOT NULL, source_hash TEXT NOT NULL,
        minor INTEGER NOT NULL CHECK(minor IN (0,1)), needs_review INTEGER NOT NULL CHECK(needs_review IN (0,1)),
        disabled INTEGER NOT NULL DEFAULT 0 CHECK(disabled IN (0,1)),
        qa_only INTEGER NOT NULL DEFAULT 1 CHECK(qa_only = 1), created_at TEXT NOT NULL
      ) STRICT;
      CREATE TABLE IF NOT EXISTS local_sessions (
        token_hash TEXT PRIMARY KEY, uid TEXT NOT NULL REFERENCES local_users(uid) ON DELETE CASCADE,
        csrf TEXT NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, touched_at INTEGER NOT NULL
      ) STRICT;
      CREATE INDEX IF NOT EXISTS local_sessions_uid ON local_sessions(uid);
      CREATE TABLE IF NOT EXISTS local_documents (
        path TEXT PRIMARY KEY, collection TEXT NOT NULL, id TEXT NOT NULL, body TEXT NOT NULL CHECK(json_valid(body))
      ) STRICT;
      CREATE INDEX IF NOT EXISTS local_documents_collection ON local_documents(collection);
      PRAGMA user_version=1;
    `);
    if (filename !== ':memory:') chmodSync(filename, 0o600);
  }
  /** One queue for ALL SQL, so authentication cannot join an async training transaction. */
  access<T>(fn: (db: DatabaseSync) => T | Promise<T>): Promise<T> {
    if (this.owner.getStore()) return Promise.reject(new Error('Use transaction methods within atomic callbacks'));
    const next = this.tail.then(() => {
      if (this.closed) throw new Error('Database closed');
      return this.owner.run(true, () => fn(this.connection));
    });
    this.tail = next.catch(() => undefined);
    return next;
  }
  transaction<T>(fn: (db: DatabaseSync) => T | Promise<T>): Promise<T> {
    return this.access(async db => {
      db.exec('BEGIN IMMEDIATE');
      try { const result = await fn(db); db.exec('COMMIT'); return result; }
      catch (error) { if (db.isTransaction) db.exec('ROLLBACK'); throw error; }
    });
  }
  async close() {
    await this.access(db => { db.exec('PRAGMA wal_checkpoint(TRUNCATE)'); db.close(); this.closed = true; });
  }
}
function parts(path: string, collection = false) {
  const p = path.split('/');
  if (!p.length || p.some(s => !/^[A-Za-z0-9_-]{1,128}$/.test(s)) || p.length % 2 !== (collection ? 1 : 0)) throw new Error('Invalid document path');
  return { collection: p.slice(0, -1).join('/'), id: p.at(-1)! };
}
function read(db: DatabaseSync, path: string): RecordObject | null {
  parts(path); const row = db.prepare('SELECT body,id FROM local_documents WHERE path=?').get(path);
  return row ? { ...JSON.parse(String(row.body)), id: String(row.id) } : null;
}
export function writeDocument(db: DatabaseSync, path: string, body: RecordObject) {
  const p = parts(path);
  const json = JSON.stringify(body);
  if (!json || json.length > 500_000) throw new Error('Document too large');
  db.prepare('INSERT INTO local_documents(path,collection,id,body) VALUES(?,?,?,?) ON CONFLICT(path) DO UPDATE SET body=excluded.body').run(path, p.collection, p.id, json);
}
function valueAt(row: RecordObject, field: string): unknown {
  return field.split('.').reduce<unknown>((v, k) => v && typeof v === 'object' ? (v as RecordObject)[k] : undefined, row);
}
export class SQLiteTrainingStore implements TrainingStore {
  constructor(readonly database: PilotDatabase) {}
  get(path: string) { return this.database.access(db => read(db, path)); }
  list(path: string, spec: QuerySpec): Promise<RecordObject[]> {
    parts(path, true);
    if (!Number.isInteger(spec.limit) || spec.limit < 1 || spec.limit > 10_000) return Promise.reject(new Error('Invalid query limit'));
    return this.database.access(db => {
      const raw = db.prepare('SELECT body,id FROM local_documents WHERE collection=? ORDER BY id LIMIT 10001').all(path);
      if (raw.length > 10_000) throw new Error('Local pilot collection exceeds bounded query capacity');
      let rows: RecordObject[] = raw.map(r => ({ ...JSON.parse(String(r.body)), id: String(r.id) }));
      for (const f of spec.filters ?? []) {
        if (!['==','>=','<='].includes(f.op)) throw new Error('Unsupported comparison');
        rows = rows.filter(r => {
          const v = valueAt(r, f.field); if (v === undefined || typeof v !== typeof f.value) return false;
          if (f.op === '==') return v === f.value;
          if (typeof v === 'number' && typeof f.value === 'number') return f.op === '>=' ? v >= f.value : v <= f.value;
          if (typeof v === 'string' && typeof f.value === 'string') return f.op === '>=' ? v >= f.value : v <= f.value;
          return false;
        });
      }
      if (spec.order) {
        const { field, direction } = spec.order;
        rows = rows.filter(r => valueAt(r, field) !== undefined).sort((a,b) => {
          const x = valueAt(a, field) as string | number, y = valueAt(b, field) as string | number;
          const cmp = x === y ? String(a.id).localeCompare(String(b.id)) : x < y ? -1 : 1;
          return direction === 'desc' ? -cmp : cmp;
        });
      }
      return rows.slice(0, spec.limit);
    });
  }
  atomic<T>(fn: (tx: TrainingTransaction) => Promise<T>): Promise<T> {
    return this.database.transaction(async db => {
      // Preserve Firestore's read-before-write contract, including caller mistakes.
      const pending = new Map<string, RecordObject | null>();
      const result = await fn({
        get: async path => { if (pending.size) throw new Error('Transactions must read before writing'); return read(db, path); },
        set: (path, value) => { parts(path); pending.set(path, structuredClone(value)); },
        delete: path => { parts(path); pending.set(path, null); }
      });
      for (const [path, body] of pending) {
        if (body === null) db.prepare('DELETE FROM local_documents WHERE path=?').run(path);
        else writeDocument(db, path, body);
      }
      return result;
    });
  }
}
