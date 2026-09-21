import { adminDb } from './lib/firebase-admin';
import { ChatLogRecord, ChatFeedbackRecord, sanitizePii } from './chatLogStorage';

const chatLogsCache: ChatLogRecord[] = [];
const chatFeedbacksCache: ChatFeedbackRecord[] = [];

function mapDocToRecord(id: string, data: Record<string, unknown>): ChatLogRecord {
  let tsStr = new Date().toISOString();
  if (
    data.timestamp &&
    typeof data.timestamp === 'object' &&
    data.timestamp !== null &&
    'toDate' in data.timestamp &&
    typeof (data.timestamp as { toDate: () => Date }).toDate === 'function'
  ) {
    tsStr = (data.timestamp as { toDate: () => Date }).toDate().toISOString();
  } else if (typeof data.timestamp === 'string') {
    tsStr = data.timestamp;
  }

  return {
    id: id || (typeof data.id === 'string' ? data.id : ''),
    sessionId: typeof data.sessionId === 'string' ? data.sessionId : '',
    timestamp: tsStr,
    lang: typeof data.lang === 'string' ? data.lang : 'vi',
    isMember: Boolean(data.isMember),
    userMessage: typeof data.userMessage === 'string' ? data.userMessage : '',
    botResponse: typeof data.botResponse === 'string' ? data.botResponse : '',
    latencyMs: typeof data.latencyMs === 'number' ? data.latencyMs : 0,
    usedFallback: Boolean(data.usedFallback),
    handoverTag: typeof data.handoverTag === 'string' ? data.handoverTag : '',
    intent: typeof data.intent === 'string' ? data.intent : '',
    pkSegment: typeof data.pkSegment === 'string' ? data.pkSegment : '',
    responseChars: typeof data.responseChars === 'number' ? data.responseChars : 0,
    retrievedChunkIds: typeof data.retrievedChunkIds === 'string' ? data.retrievedChunkIds : '',
    topSimilarity: typeof data.topSimilarity === 'number' ? data.topSimilarity : 0,
    groundedAnswer: Boolean(data.groundedAnswer)
  };
}

export async function loadChatLogsFromFirestore(): Promise<ChatLogRecord[]> {
  try {
    const snap = await adminDb.collection('chat_logs').orderBy('timestamp', 'asc').get();
    const records: ChatLogRecord[] = [];
    snap.forEach((docSnap) => {
      records.push(mapDocToRecord(docSnap.id, docSnap.data() as Record<string, unknown>));
    });
    chatLogsCache.length = 0;
    chatLogsCache.push(...records);
    return records;
  } catch (err) {
    console.error('[ChatLogFirestoreStorage] Error loading chat logs from Firestore:', err);
    return chatLogsCache;
  }
}

export async function loadChatFeedbacksFromFirestore(): Promise<ChatFeedbackRecord[]> {
  try {
    const snap = await adminDb.collection('chat_feedback').orderBy('createdAt', 'asc').get();
    const records: ChatFeedbackRecord[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as Record<string, unknown>;
      let createdStr = new Date().toISOString();
      if (
        data.createdAt &&
        typeof data.createdAt === 'object' &&
        'toDate' in data.createdAt &&
        typeof (data.createdAt as { toDate: () => Date }).toDate === 'function'
      ) {
        createdStr = (data.createdAt as { toDate: () => Date }).toDate().toISOString();
      } else if (typeof data.createdAt === 'string') {
        createdStr = data.createdAt;
      }

      records.push({
        id: docSnap.id,
        sessionId: typeof data.sessionId === 'string' ? data.sessionId : '',
        messageId: typeof data.messageId === 'string' ? data.messageId : '',
        feedback: (data.feedback === 'dislike' ? 'dislike' : 'like'),
        createdAt: createdStr
      });
    });
    chatFeedbacksCache.length = 0;
    chatFeedbacksCache.push(...records);
    return records;
  } catch (err) {
    console.error('[ChatLogFirestoreStorage] Error loading chat feedbacks from Firestore:', err);
    return chatFeedbacksCache;
  }
}

export function initChatLogFirestoreStorage(): void {
  loadChatLogsFromFirestore().then((records) => {
    console.log(`[ChatLogFirestoreStorage] Initialized & loaded ${records.length} records into cache from Firestore.`);
  }).catch((err: unknown) => {
    console.error('[ChatLogFirestoreStorage] Initialization error for chat_logs:', err);
  });

  loadChatFeedbacksFromFirestore().then((records) => {
    console.log(`[ChatLogFirestoreStorage] Initialized & loaded ${records.length} feedback records into cache from Firestore.`);
  }).catch((err: unknown) => {
    console.error('[ChatLogFirestoreStorage] Initialization error for chat_feedback:', err);
  });
}

export function appendChatLogFirestore(
  record: Omit<ChatLogRecord, 'id' | 'timestamp' | 'responseChars'> & Partial<Pick<ChatLogRecord, 'id' | 'timestamp' | 'responseChars'>>
): ChatLogRecord {
  const cleanUserMessage = sanitizePii(record.userMessage || '');
  const cleanBotResponse = sanitizePii(record.botResponse || '');
  const now = new Date();
  const timestampIso = record.timestamp || now.toISOString();

  const fullRecord: ChatLogRecord = {
    id: record.id || `CHAT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    sessionId: record.sessionId || `session_${Date.now()}`,
    timestamp: timestampIso,
    lang: record.lang || 'vi',
    isMember: Boolean(record.isMember),
    userMessage: cleanUserMessage,
    botResponse: cleanBotResponse,
    latencyMs: typeof record.latencyMs === 'number' ? record.latencyMs : 0,
    usedFallback: Boolean(record.usedFallback),
    handoverTag: record.handoverTag || '',
    intent: record.intent || '',
    pkSegment: record.pkSegment || '',
    responseChars: typeof record.responseChars === 'number' ? record.responseChars : cleanBotResponse.length,
    retrievedChunkIds: record.retrievedChunkIds || '',
    topSimilarity: typeof record.topSimilarity === 'number' ? record.topSimilarity : 0,
    groundedAnswer: Boolean(record.groundedAnswer)
  };

  // Push to local memory cache
  chatLogsCache.push(fullRecord);

  // Document payload for Firestore
  const docData = {
    ...fullRecord,
    timestamp: new Date(timestampIso)
  };

  // Write asynchronously to Firestore (N3 error handling: console.error and proceed)
  adminDb.collection('chat_logs').doc(fullRecord.id).set(docData).catch((err: unknown) => {
    console.error('[ChatLogFirestoreStorage] Error writing chat_logs doc to Firestore:', err);
  });

  return fullRecord;
}

export function getChatLogsFirestore(filter?: { from?: string; to?: string }): ChatLogRecord[] {
  if (!filter || (!filter.from && !filter.to)) {
    return [...chatLogsCache];
  }

  return chatLogsCache.filter((rec) => {
    const recordDateStr = rec.timestamp.slice(0, 10);
    if (filter.from && recordDateStr < filter.from) {
      return false;
    }
    if (filter.to && recordDateStr > filter.to) {
      return false;
    }
    return true;
  });
}

export async function queryChatLogsFromFirestore(filter?: { from?: string; to?: string }): Promise<ChatLogRecord[]> {
  let queryRef: FirebaseFirestore.Query = adminDb.collection('chat_logs');
  if (filter?.from) {
    const fromDate = new Date(`${filter.from}T00:00:00.000Z`);
    queryRef = queryRef.where('timestamp', '>=', fromDate);
  }
  if (filter?.to) {
    const toDate = new Date(`${filter.to}T23:59:59.999Z`);
    queryRef = queryRef.where('timestamp', '<=', toDate);
  }

  const snap = await queryRef.get();
  const records: ChatLogRecord[] = [];
  snap.forEach((docSnap) => {
    records.push(mapDocToRecord(docSnap.id, docSnap.data() as Record<string, unknown>));
  });
  return records;
}

export function saveChatFeedbackFirestore(record: {
  sessionId: string;
  messageId: string;
  feedback: 'like' | 'dislike';
  createdAt?: string;
}): ChatFeedbackRecord {
  const now = new Date();
  const createdAtIso = record.createdAt || now.toISOString();
  const id = `FB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const fullRecord: ChatFeedbackRecord = {
    id,
    sessionId: record.sessionId || `session_${Date.now()}`,
    messageId: record.messageId || '',
    feedback: record.feedback,
    createdAt: createdAtIso
  };

  chatFeedbacksCache.push(fullRecord);

  const docData = {
    ...fullRecord,
    createdAt: new Date(createdAtIso)
  };

  adminDb.collection('chat_feedback').doc(fullRecord.id).set(docData).catch((err: unknown) => {
    console.error('[ChatLogFirestoreStorage] Error writing chat_feedback doc to Firestore:', err);
  });

  return fullRecord;
}

export function getChatFeedbacksFirestore(): ChatFeedbackRecord[] {
  return [...chatFeedbacksCache];
}


