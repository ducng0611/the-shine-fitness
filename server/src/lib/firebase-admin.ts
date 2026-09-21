import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../../firebase-applet-config.json';

if (!getApps().length) {
  // Read the projectId directly from firebase-applet-config.json
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

export const adminAuth = getAuth();
export const adminDb = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(getApps()[0], firebaseConfig.firestoreDatabaseId)
  : getFirestore();

