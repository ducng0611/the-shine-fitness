import fs from 'fs';
import path from 'path';
import { ChatLogRecord, ChatFeedbackRecord, sanitizePii } from './chatLogStorage';

const DATA_DIR = path.join(process.cwd(), 'data');
const CHAT_LOGS_CSV = path.join(DATA_DIR, 'chat_logs.csv');
const CHAT_FEEDBACK_CSV = path.join(DATA_DIR, 'chat_feedback.csv');

// Helper to escape CSV cell value
function escapeCsv(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

// Parse a single CSV row handling escaped quotes and commas inside quotes
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// Initialize chat log storage file with proper headers if not existing
export function initChatLogCsvStorage(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(CHAT_LOGS_CSV)) {
    const header = 'id,sessionId,timestamp,lang,isMember,userMessage,botResponse,latencyMs,usedFallback,handoverTag,intent,pkSegment,responseChars,retrievedChunkIds,topSimilarity,groundedAnswer\n';
    fs.writeFileSync(CHAT_LOGS_CSV, header, 'utf-8');
  }

  if (!fs.existsSync(CHAT_FEEDBACK_CSV)) {
    const header = 'id,sessionId,messageId,feedback,createdAt\n';
    fs.writeFileSync(CHAT_FEEDBACK_CSV, header, 'utf-8');
  }
}

// Append a single chat log record to CSV
export function appendChatLogCsv(
  record: Omit<ChatLogRecord, 'id' | 'timestamp' | 'responseChars'> & Partial<Pick<ChatLogRecord, 'id' | 'timestamp' | 'responseChars'>>
): ChatLogRecord {
  initChatLogCsvStorage();

  const cleanUserMessage = sanitizePii(record.userMessage || '');
  const cleanBotResponse = sanitizePii(record.botResponse || '');

  const fullRecord: ChatLogRecord = {
    id: record.id || `CHAT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    sessionId: record.sessionId || `session_${Date.now()}`,
    timestamp: record.timestamp || new Date().toISOString(),
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

  const row = [
    fullRecord.id,
    fullRecord.sessionId,
    fullRecord.timestamp,
    fullRecord.lang,
    fullRecord.isMember ? 'true' : 'false',
    fullRecord.userMessage,
    fullRecord.botResponse,
    fullRecord.latencyMs,
    fullRecord.usedFallback ? 'true' : 'false',
    fullRecord.handoverTag,
    fullRecord.intent,
    fullRecord.pkSegment,
    fullRecord.responseChars,
    fullRecord.retrievedChunkIds,
    fullRecord.topSimilarity,
    fullRecord.groundedAnswer ? 'true' : 'false'
  ].map(escapeCsv).join(',') + '\n';

  fs.appendFileSync(CHAT_LOGS_CSV, row, 'utf-8');
  return fullRecord;
}

// Retrieve chat log records with optional date range filter (YYYY-MM-DD)
export function getChatLogsCsv(filter?: { from?: string; to?: string }): ChatLogRecord[] {
  initChatLogCsvStorage();

  if (!fs.existsSync(CHAT_LOGS_CSV)) {
    return [];
  }

  const content = fs.readFileSync(CHAT_LOGS_CSV, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  if (lines.length <= 1) {
    return [];
  }

  const records: ChatLogRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawFields = parseCsvLine(lines[i]);
    if (rawFields.length < 13) continue;

    const [
      id,
      sessionId,
      timestamp,
      lang,
      isMember,
      userMessage,
      botResponse,
      latencyMs,
      usedFallback,
      handoverTag,
      intent,
      pkSegment,
      responseChars,
      retrievedChunkIds,
      topSimilarity,
      groundedAnswer
    ] = rawFields;

    const recordDateStr = timestamp.slice(0, 10); // YYYY-MM-DD

    if (filter?.from && recordDateStr < filter.from) {
      continue;
    }
    if (filter?.to && recordDateStr > filter.to) {
      continue;
    }

    records.push({
      id,
      sessionId,
      timestamp,
      lang: lang || 'vi',
      isMember: isMember === 'true',
      userMessage,
      botResponse,
      latencyMs: parseInt(latencyMs, 10) || 0,
      usedFallback: usedFallback === 'true',
      handoverTag: handoverTag || '',
      intent: intent || '',
      pkSegment: pkSegment || '',
      responseChars: parseInt(responseChars, 10) || 0,
      retrievedChunkIds: retrievedChunkIds || '',
      topSimilarity: parseFloat(topSimilarity) || 0,
      groundedAnswer: groundedAnswer === 'true'
    });
  }

  return records;
}

// Append or save a chat feedback record to CSV
export function saveChatFeedbackCsv(record: {
  sessionId: string;
  messageId: string;
  feedback: 'like' | 'dislike';
  createdAt?: string;
}): ChatFeedbackRecord {
  initChatLogCsvStorage();

  const fullRecord: ChatFeedbackRecord = {
    id: `FB-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    sessionId: record.sessionId || `session_${Date.now()}`,
    messageId: record.messageId || '',
    feedback: record.feedback,
    createdAt: record.createdAt || new Date().toISOString()
  };

  const row = [
    fullRecord.id,
    fullRecord.sessionId,
    fullRecord.messageId,
    fullRecord.feedback,
    fullRecord.createdAt
  ].map(escapeCsv).join(',') + '\n';

  fs.appendFileSync(CHAT_FEEDBACK_CSV, row, 'utf-8');
  return fullRecord;
}

// Retrieve all chat feedback records from CSV
export function getChatFeedbacksCsv(): ChatFeedbackRecord[] {
  initChatLogCsvStorage();

  if (!fs.existsSync(CHAT_FEEDBACK_CSV)) {
    return [];
  }

  const content = fs.readFileSync(CHAT_FEEDBACK_CSV, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  if (lines.length <= 1) {
    return [];
  }

  const records: ChatFeedbackRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const rawFields = parseCsvLine(lines[i]);
    if (rawFields.length < 5) continue;

    const [id, sessionId, messageId, feedback, createdAt] = rawFields;
    records.push({
      id,
      sessionId,
      messageId,
      feedback: (feedback === 'dislike' ? 'dislike' : 'like'),
      createdAt
    });
  }

  return records;
}

