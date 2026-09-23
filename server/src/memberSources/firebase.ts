import type { Firestore } from 'firebase-admin/firestore';
import type { Auth } from 'firebase-admin/auth';
import type { Obj } from './source';
import type { AuthAdmin, ImportStore } from './cloud';

export function firestoreSourceStore(db: Firestore): ImportStore {
  return {
    async get(path) { const snap = await db.doc(path).get(); return snap.exists ? snap.data() as Obj : null; },
    // One batch: the member docs and the receipt become visible together or not at all.
    async commit(writes) { const batch = db.batch(); for (const w of writes) batch.set(db.doc(w.path), w.data); await batch.commit(); },
  };
}

const missing = (e: any) => e?.code === 'auth/user-not-found' ? null : Promise.reject(e);
export function firebaseAuthAdmin(auth: Auth): AuthAdmin {
  return {
    getUser: uid => auth.getUser(uid).then(u => ({ uid: u.uid, email: u.email }), missing),
    getUserByEmail: email => auth.getUserByEmail(email).then(u => ({ uid: u.uid }), missing),
    createUser: async user => { await auth.createUser(user); },
  };
}
