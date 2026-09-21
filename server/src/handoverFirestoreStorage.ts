import { adminDb } from './lib/firebase-admin';
import { HandoverTag } from './handoverRules';
import { sanitizePii } from './chatLogStorage';
import {
  HandoverRecord,
  HandoverHistoryItem,
  normalizeHandoverStatus,
  VALID_TRANSITIONS
} from './handoverStorage';

const handoverCache: HandoverRecord[] = [];

function parseTimestampField(field: unknown): string {
  if (!field) return '';
  if (
    typeof field === 'object' &&
    field !== null &&
    'toDate' in field &&
    typeof (field as { toDate: () => Date }).toDate === 'function'
  ) {
    return (field as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof field === 'string') return field;
  return '';
}

function mapDocToHandoverRecord(id: string, data: Record<string, unknown>): HandoverRecord {
  const rawHistory = Array.isArray(data.history) ? data.history : [];
  const history: HandoverHistoryItem[] = rawHistory.map((item: unknown) => {
    const obj = (item && typeof item === 'object') ? (item as Record<string, unknown>) : {};
    return {
      status: typeof obj.status === 'string' ? obj.status : '',
      actor: typeof obj.actor === 'string' ? obj.actor : '',
      timestamp: parseTimestampField(obj.timestamp),
      note: typeof obj.note === 'string' ? obj.note : ''
    };
  });

  const rawStatus = typeof data.status === 'string' ? data.status : 'CHO_TIEP_NHAN';

  return {
    id: id || (typeof data.id === 'string' ? data.id : ''),
    createdAt: parseTimestampField(data.createdAt) || new Date().toISOString(),
    sessionId: typeof data.sessionId === 'string' ? data.sessionId : '',
    tag: typeof data.tag === 'string' ? data.tag : 'REQUEST_HUMAN',
    summary: typeof data.summary === 'string' ? data.summary : '',
    status: normalizeHandoverStatus(rawStatus),
    assignee: typeof data.assignee === 'string' ? data.assignee : '',
    contactedAt: parseTimestampField(data.contactedAt),
    resolvedAt: parseTimestampField(data.resolvedAt),
    resolution: typeof data.resolution === 'string' ? data.resolution : '',
    history
  };
}

export async function loadHandoverQueueFromFirestore(): Promise<HandoverRecord[]> {
  try {
    const snap = await adminDb.collection('handover_queue').orderBy('createdAt', 'desc').get();
    const records: HandoverRecord[] = [];
    snap.forEach((docSnap) => {
      records.push(mapDocToHandoverRecord(docSnap.id, docSnap.data() as Record<string, unknown>));
    });
    handoverCache.length = 0;
    handoverCache.push(...records);
    return records;
  } catch (err) {
    console.error('[HandoverFirestoreStorage] Error loading handover queue from Firestore:', err);
    return handoverCache;
  }
}

export function initHandoverFirestoreStorage(): void {
  loadHandoverQueueFromFirestore().then((records) => {
    console.log(`[HandoverFirestoreStorage] Initialized & loaded ${records.length} records into cache from Firestore.`);
  }).catch((err: unknown) => {
    console.error('[HandoverFirestoreStorage] Initialization error:', err);
  });
}

export function addHandoverRecordFirestore(record: {
  sessionId: string;
  tag: HandoverTag | string;
  summary: string;
  status?: string;
}): HandoverRecord {
  const cleanSummary = sanitizePii(record.summary || '');
  const nowIso = new Date().toISOString();
  const initialStatus = 'CHO_TIEP_NHAN';

  const initialHistoryItem: HandoverHistoryItem = {
    status: initialStatus,
    actor: 'System',
    timestamp: nowIso,
    note: 'Khởi tạo từ yêu cầu chuyển giao AI'
  };

  const newRecord: HandoverRecord = {
    id: `HO-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: nowIso,
    sessionId: record.sessionId || `session_${Date.now()}`,
    tag: record.tag || 'REQUEST_HUMAN',
    summary: cleanSummary,
    status: initialStatus,
    assignee: '',
    contactedAt: '',
    resolvedAt: '',
    resolution: '',
    history: [initialHistoryItem]
  };

  // Add to cache (newest first)
  handoverCache.unshift(newRecord);

  // Payload for Firestore
  const docData = {
    ...newRecord,
    createdAt: new Date(nowIso),
    contactedAt: null,
    resolvedAt: null,
    history: [
      {
        status: initialStatus,
        actor: 'System',
        timestamp: new Date(nowIso),
        note: 'Khởi tạo từ yêu cầu chuyển giao AI'
      }
    ]
  };

  // Write asynchronously to Firestore (N3 error handling: console.error and proceed)
  adminDb.collection('handover_queue').doc(newRecord.id).set(docData).catch((err: unknown) => {
    console.error('[HandoverFirestoreStorage] Error writing handover_queue doc to Firestore:', err);
  });

  return newRecord;
}

export function getHandoverQueueFirestore(): HandoverRecord[] {
  return [...handoverCache];
}

export function updateHandoverStatusFirestore(
  id: string,
  newStatus: string,
  actor: string,
  note?: string
): HandoverRecord {
  const targetIndex = handoverCache.findIndex((r) => r.id === id);
  if (targetIndex === -1) {
    throw new Error(`Không tìm thấy bản ghi chuyển giao có ID "${id}".`);
  }

  const record = handoverCache[targetIndex];
  const currentStatus = record.status;

  // Synchronous state transition validation
  const allowedNext = VALID_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(newStatus)) {
    throw new Error(
      `Không thể chuyển trạng thái từ "${currentStatus}" sang "${newStatus}". Chiều chuyển hợp lệ: CHO_TIEP_NHAN → DANG_XU_LY → DA_LIEN_HE → THANH_CONG / KHONG_THANH_CONG.`
    );
  }

  if (newStatus === 'KHONG_THANH_CONG' && (!note || !note.trim())) {
    throw new Error('Lý do thất bại là bắt buộc khi chuyển trạng thái sang "KHONG_THANH_CONG".');
  }

  const nowIso = new Date().toISOString();
  const nowDate = new Date(nowIso);

  // Update in-memory record
  record.status = newStatus;
  record.assignee = actor;

  if (newStatus === 'DA_LIEN_HE' && !record.contactedAt) {
    record.contactedAt = nowIso;
  }

  if (newStatus === 'THANH_CONG' || newStatus === 'KHONG_THANH_CONG') {
    record.resolvedAt = nowIso;
    record.resolution = note?.trim() || '';
  }

  if (!record.history) {
    record.history = [];
  }

  const newHistoryItem: HandoverHistoryItem = {
    status: newStatus,
    actor,
    timestamp: nowIso,
    note: note?.trim() || ''
  };
  record.history.push(newHistoryItem);

  // Firestore transaction for optimistic locking and atomic state update (N4)
  adminDb.runTransaction(async (transaction) => {
    const docRef = adminDb.collection('handover_queue').doc(id);
    const docSnap = await transaction.get(docRef);

    if (!docSnap.exists) {
      throw new Error(`Bản ghi ${id} không tồn tại trên Firestore.`);
    }

    const docData = (docSnap.data() || {}) as Record<string, unknown>;
    const dbStatus = normalizeHandoverStatus(typeof docData.status === 'string' ? docData.status : '');

    const dbAllowedNext = VALID_TRANSITIONS[dbStatus] || [];
    if (!dbAllowedNext.includes(newStatus)) {
      throw new Error(`Xung đột trạng thái Firestore: Không thể chuyển từ ${dbStatus} sang ${newStatus}.`);
    }

    const updatedDocData: Record<string, unknown> = {
      status: newStatus,
      assignee: actor,
      updatedAt: nowDate
    };

    if (newStatus === 'DA_LIEN_HE' && !docData.contactedAt) {
      updatedDocData.contactedAt = nowDate;
    }

    if (newStatus === 'THANH_CONG' || newStatus === 'KHONG_THANH_CONG') {
      updatedDocData.resolvedAt = nowDate;
      updatedDocData.resolution = note?.trim() || '';
    }

    const existingHistory = Array.isArray(docData.history) ? docData.history : [];
    existingHistory.push({
      status: newStatus,
      actor,
      timestamp: nowDate,
      note: note?.trim() || ''
    });
    updatedDocData.history = existingHistory;

    transaction.update(docRef, updatedDocData);
  }).catch((err: unknown) => {
    console.error(`[HandoverFirestoreStorage] Transaction error updating status for ${id}:`, err);
  });

  return record;
}

