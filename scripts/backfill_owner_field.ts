import fs from 'fs';
import path from 'path';
import { adminDb } from '../server/src/lib/firebase-admin.ts';

interface DocumentUpdate {
  collectionName: string;
  docId: string;
  originalData: Record<string, unknown>;
  updatePayload: Record<string, unknown>;
}

async function runBackfill() {
  const isApply = process.argv.includes('--apply');
  console.log(`==================================================`);
  console.log(`  FIRESTORE OWNER FIELD BACKFILL SCRIPT`);
  console.log(`  Mode: ${isApply ? 'APPLY (Writing changes to Firestore)' : 'DRY-RUN (Preview mode - No writes)'}`);
  console.log(`==================================================\n`);

  const collectionsToAudit = ['member_progress', 'check_ins', 'workout_logs', 'members', 'customers'];
  const pendingUpdates: DocumentUpdate[] = [];

  for (const colName of collectionsToAudit) {
    try {
      const snapshot = await adminDb.collection(colName).get();
      console.log(`[AUDIT] Collection '${colName}': Found ${snapshot.size} documents.`);

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Record<string, unknown>;
        const hasUserId = typeof data.userId === 'string' && data.userId.trim().length > 0;
        const hasUid = typeof data.uid === 'string' && data.uid.trim().length > 0;

        if (!hasUserId || !hasUid) {
          const ownerValue = (data.userId || data.uid || data.memberCode || data.email || docSnap.id) as string;
          const updatePayload: Record<string, unknown> = {};

          if (!hasUserId) {
            updatePayload.userId = ownerValue;
          }
          if (!hasUid) {
            updatePayload.uid = ownerValue;
          }

          pendingUpdates.push({
            collectionName: colName,
            docId: docSnap.id,
            originalData: data,
            updatePayload
          });
        }
      });
    } catch (colErr) {
      console.warn(`[WARN] Could not audit collection '${colName}':`, colErr);
    }
  }

  console.log(`\n--------------------------------------------------`);
  console.log(`AUDIT SUMMARY: ${pendingUpdates.length} documents require owner field backfilling.`);
  console.log(`--------------------------------------------------`);

  if (pendingUpdates.length === 0) {
    console.log(`✅ All existing documents already have valid 'userId' / 'uid' owner fields. No backfill needed.\n`);
    return;
  }

  // Display summary grouped by collection
  const summaryByCol: Record<string, number> = {};
  for (const item of pendingUpdates) {
    summaryByCol[item.collectionName] = (summaryByCol[item.collectionName] || 0) + 1;
  }

  for (const [cName, count] of Object.entries(summaryByCol)) {
    console.log(`  - Collection '${cName}': ${count} docs to backfill`);
  }

  console.log(`\nSample updates (first 3 items):`);
  pendingUpdates.slice(0, 3).forEach((item, idx) => {
    console.log(`  [${idx + 1}] Collection: ${item.collectionName} | Doc ID: ${item.docId}`);
    console.log(`      Payload to set: ${JSON.stringify(item.updatePayload)}`);
  });

  if (!isApply) {
    console.log(`\n==================================================`);
    console.log(`[DRY-RUN COMPLETE] No changes were written to Firestore.`);
    console.log(`To write changes, run: npm run backfill:owner -- --apply`);
    console.log(`==================================================\n`);
    return;
  }

  // APPLY MODE
  console.log(`\n--------------------------------------------------`);
  console.log(`[BACKUP] Creating backup before writing to Firestore...`);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'data', 'backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupFilePath = path.join(backupDir, `owner_backfill_${timestamp}.json`);
  const backupData = pendingUpdates.map((u) => ({
    collection: u.collectionName,
    docId: u.docId,
    originalData: u.originalData,
    appliedUpdate: u.updatePayload
  }));

  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf-8');
  console.log(`✅ Backup successfully saved to: ${backupFilePath}`);

  console.log(`\n[APPLY] Applying backfill updates to Firestore...`);
  const batchSize = 400;
  let batch = adminDb.batch();
  let opCount = 0;

  for (let i = 0; i < pendingUpdates.length; i++) {
    const item = pendingUpdates[i];
    const docRef = adminDb.collection(item.collectionName).doc(item.docId);
    batch.update(docRef, item.updatePayload);
    opCount++;

    if (opCount >= batchSize || i === pendingUpdates.length - 1) {
      await batch.commit();
      console.log(`  - Committed batch of ${opCount} updates...`);
      batch = adminDb.batch();
      opCount = 0;
    }
  }

  console.log(`\n==================================================`);
  console.log(`✅ [APPLY COMPLETE] Backfilled ${pendingUpdates.length} documents in Firestore.`);
  console.log(`==================================================\n`);
}

runBackfill().catch((err) => {
  console.error('Fatal error during backfill script execution:', err);
  process.exit(1);
});
