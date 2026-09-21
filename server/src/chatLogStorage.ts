import {
  initChatLogCsvStorage,
  appendChatLogCsv,
  getChatLogsCsv,
  saveChatFeedbackCsv,
  getChatFeedbacksCsv
} from './chatLogCsvStorage';
import {
  initChatLogFirestoreStorage,
  appendChatLogFirestore,
  getChatLogsFirestore,
  saveChatFeedbackFirestore,
  getChatFeedbacksFirestore
} from './chatLogFirestoreStorage';

export interface ChatFeedbackRecord {
  id: string;
  sessionId: string;
  messageId: string;
  feedback: 'like' | 'dislike';
  createdAt: string;
}

export interface ChatLogRecord {
  id: string;
  sessionId: string;
  timestamp: string;
  lang: string;
  isMember: boolean;
  userMessage: string;
  botResponse: string;
  latencyMs: number;
  usedFallback: boolean;
  handoverTag: string;
  intent: string;
  pkSegment: string;
  responseChars: number;
  retrievedChunkIds?: string;
  topSimilarity?: number;
  groundedAnswer?: boolean;
}

// Anonymize Vietnamese phone numbers and emails to protect PII
export function sanitizePii(text: string): string {
  if (!text) return '';
  // Match Vietnamese phone numbers: +84 or 0 followed by 9-10 digits, allowing spaces, dots, or hyphens
  const phoneRegex = /(?:\+84|0)(?:[\s.-]*\d){9,10}\b/g;
  // Match standard email addresses
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

  return text
    .replace(emailRegex, '[đã ẩn]')
    .replace(phoneRegex, '[đã ẩn]');
}

export function isFirestoreBackend(): boolean {
  return (process.env.STORAGE_BACKEND || 'csv').toLowerCase() === 'firestore';
}

export function initChatLogStorage(): void {
  const backend = (process.env.STORAGE_BACKEND || 'csv').toLowerCase();
  console.log(`[ChatLogStorage] Initializing with backend: "${backend}"`);
  if (backend === 'firestore') {
    initChatLogFirestoreStorage();
  } else {
    initChatLogCsvStorage();
  }
}

export function appendChatLog(
  record: Omit<ChatLogRecord, 'id' | 'timestamp' | 'responseChars'> & Partial<Pick<ChatLogRecord, 'id' | 'timestamp' | 'responseChars'>>
): ChatLogRecord {
  if (isFirestoreBackend()) {
    return appendChatLogFirestore(record);
  }
  return appendChatLogCsv(record);
}

export function getChatLogs(filter?: { from?: string; to?: string }): ChatLogRecord[] {
  if (isFirestoreBackend()) {
    return getChatLogsFirestore(filter);
  }
  return getChatLogsCsv(filter);
}

export function saveChatFeedback(record: {
  sessionId: string;
  messageId: string;
  feedback: 'like' | 'dislike';
  createdAt?: string;
}): ChatFeedbackRecord {
  if (isFirestoreBackend()) {
    return saveChatFeedbackFirestore(record);
  }
  return saveChatFeedbackCsv(record);
}

export function getChatFeedbacks(): ChatFeedbackRecord[] {
  if (isFirestoreBackend()) {
    return getChatFeedbacksFirestore();
  }
  return getChatFeedbacksCsv();
}

