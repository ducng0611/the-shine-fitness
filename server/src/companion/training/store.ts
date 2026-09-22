import type { Firestore, Transaction } from 'firebase-admin/firestore';
import type { RecordObject } from '../../../../shared/training';

export interface QuerySpec {
  filters?: { field: string; op: '==' | '>=' | '<='; value: unknown }[];
  order?: { field: string; direction: 'asc' | 'desc' };
  limit: number;
}
export interface TrainingTransaction {
  get(path: string): Promise<RecordObject | null>;
  set(path: string, value: RecordObject): void;
  delete(path: string): void;
}
export interface TrainingStore {
  get(path: string): Promise<RecordObject | null>;
  list(path: string, spec: QuerySpec): Promise<RecordObject[]>;
  atomic<T>(fn: (tx: TrainingTransaction) => Promise<T>): Promise<T>;
}
/** No local-file or anonymous fallback. Storage errors propagate to the API. */
export class FirestoreTrainingStore implements TrainingStore {
  constructor(private readonly db: Firestore) {}
  async get(path: string): Promise<RecordObject | null> {
    const snap = await this.db.doc(path).get(); return snap.exists ? { ...snap.data(), id: snap.id } : null;
  }
  async list(path: string, spec: QuerySpec): Promise<RecordObject[]> {
    let query: FirebaseFirestore.Query = this.db.collection(path);
    for (const f of spec.filters ?? []) query = query.where(f.field, f.op, f.value);
    if (spec.order) query = query.orderBy(spec.order.field, spec.order.direction);
    const snap = await query.limit(spec.limit).get();
    return snap.docs.map(d => ({ ...d.data(), id: d.id }));
  }
  async atomic<T>(fn: (tx: TrainingTransaction) => Promise<T>): Promise<T> {
    return this.db.runTransaction((tx: Transaction) => fn({
      get: async path => { const snap = await tx.get(this.db.doc(path)); return snap.exists ? { ...snap.data(), id: snap.id } : null; },
      set: (path, value) => { tx.set(this.db.doc(path), value); },
      delete: path => { tx.delete(this.db.doc(path)); }
    }));
  }
}
