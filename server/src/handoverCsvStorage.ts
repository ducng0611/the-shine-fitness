import fs from 'fs';
import path from 'path';
import { HandoverTag } from './handoverRules';
import { sanitizePii } from './chatLogStorage';
import {
  HandoverRecord,
  HandoverHistoryItem,
  HandoverKpis,
  normalizeHandoverStatus,
  VALID_TRANSITIONS,
  getHandoverKpis
} from './handoverStorage';

const DATA_DIR = path.join(process.cwd(), 'data');
const BACKUP_DIR = path.join(DATA_DIR, 'backup');
const HANDOVER_CSV = path.join(DATA_DIR, 'handover_queue.csv');

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

// Initialize handover queue CSV file if not exists
export function initHandoverCsvStorage(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(HANDOVER_CSV)) {
    const header = 'id,createdAt,sessionId,tag,summary,status,assignee,contactedAt,resolvedAt,resolution,history\n';
    fs.writeFileSync(HANDOVER_CSV, header, 'utf-8');
  }
}

// Add a new handover request to the CSV queue
export function addHandoverRecordCsv(record: {
  sessionId: string;
  tag: HandoverTag | string;
  summary: string;
  status?: string;
}): HandoverRecord {
  initHandoverCsvStorage();

  const cleanSummary = sanitizePii(record.summary || '');
  const now = new Date().toISOString();
  const initialStatus = 'CHO_TIEP_NHAN';

  const initialHistory: HandoverHistoryItem[] = [
    {
      status: initialStatus,
      actor: 'System',
      timestamp: now,
      note: 'Khởi tạo từ yêu cầu chuyển giao AI'
    }
  ];

  const newRecord: HandoverRecord = {
    id: `HO-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: now,
    sessionId: record.sessionId || `session_${Date.now()}`,
    tag: record.tag || 'REQUEST_HUMAN',
    summary: cleanSummary,
    status: initialStatus,
    assignee: '',
    contactedAt: '',
    resolvedAt: '',
    resolution: '',
    history: initialHistory
  };

  const row = [
    newRecord.id,
    newRecord.createdAt,
    newRecord.sessionId,
    newRecord.tag,
    newRecord.summary,
    newRecord.status,
    newRecord.assignee || '',
    newRecord.contactedAt || '',
    newRecord.resolvedAt || '',
    newRecord.resolution || '',
    JSON.stringify(newRecord.history || [])
  ].map(escapeCsv).join(',') + '\n';

  fs.appendFileSync(HANDOVER_CSV, row, 'utf-8');
  return newRecord;
}

// Retrieve handover records from CSV, newest first
export function getHandoverQueueCsv(): HandoverRecord[] {
  initHandoverCsvStorage();

  if (!fs.existsSync(HANDOVER_CSV)) {
    return [];
  }

  const content = fs.readFileSync(HANDOVER_CSV, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  if (lines.length <= 1) {
    return [];
  }

  const records: HandoverRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawFields = parseCsvLine(lines[i]);
    if (rawFields.length < 6) continue;

    const [id, createdAt, sessionId, tag, summary, rawStatus] = rawFields;
    const assignee = rawFields[6] || '';
    const contactedAt = rawFields[7] || '';
    const resolvedAt = rawFields[8] || '';
    const resolution = rawFields[9] || '';
    const historyStr = rawFields[10] || '[]';

    let history: HandoverHistoryItem[] = [];
    try {
      history = JSON.parse(historyStr);
    } catch {
      history = [];
    }

    const normStatus = normalizeHandoverStatus(rawStatus);

    records.push({
      id,
      createdAt,
      sessionId,
      tag,
      summary,
      status: normStatus,
      assignee,
      contactedAt,
      resolvedAt,
      resolution,
      history
    });
  }

  // Return newest records first
  return records.reverse();
}

export function updateHandoverStatusCsv(
  id: string,
  newStatus: string,
  actor: string,
  note?: string
): HandoverRecord {
  initHandoverCsvStorage();

  const content = fs.readFileSync(HANDOVER_CSV, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  if (lines.length <= 1) {
    throw new Error(`Không tìm thấy bản ghi chuyển giao có ID "${id}".`);
  }

  const records: HandoverRecord[] = [];
  let targetIndex = -1;

  for (let i = 1; i < lines.length; i++) {
    const rawFields = parseCsvLine(lines[i]);
    if (rawFields.length < 6) continue;

    const [recId, createdAt, sessionId, tag, summary, rawStatus] = rawFields;
    const assignee = rawFields[6] || '';
    const contactedAt = rawFields[7] || '';
    const resolvedAt = rawFields[8] || '';
    const resolution = rawFields[9] || '';
    const historyStr = rawFields[10] || '[]';

    let history: HandoverHistoryItem[] = [];
    try {
      history = JSON.parse(historyStr);
    } catch {
      history = [];
    }

    const rec: HandoverRecord = {
      id: recId,
      createdAt,
      sessionId,
      tag,
      summary,
      status: normalizeHandoverStatus(rawStatus),
      assignee,
      contactedAt,
      resolvedAt,
      resolution,
      history
    };

    if (recId === id) {
      targetIndex = records.length;
    }
    records.push(rec);
  }

  if (targetIndex === -1) {
    throw new Error(`Không tìm thấy bản ghi chuyển giao có ID "${id}".`);
  }

  const record = records[targetIndex];
  const currentStatus = record.status;

  const allowedNext = VALID_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(newStatus)) {
    throw new Error(
      `Không thể chuyển trạng thái từ "${currentStatus}" sang "${newStatus}". Chiều chuyển hợp lệ: CHO_TIEP_NHAN → DANG_XU_LY → DA_LIEN_HE → THANH_CONG / KHONG_THANH_CONG.`
    );
  }

  if (newStatus === 'KHONG_THANH_CONG' && (!note || !note.trim())) {
    throw new Error('Lý do thất bại là bắt buộc khi chuyển trạng thái sang "KHONG_THANH_CONG".');
  }

  const now = new Date().toISOString();

  record.status = newStatus;
  record.assignee = actor;

  if (newStatus === 'DA_LIEN_HE' && !record.contactedAt) {
    record.contactedAt = now;
  }

  if (newStatus === 'THANH_CONG' || newStatus === 'KHONG_THANH_CONG') {
    record.resolvedAt = now;
    record.resolution = note?.trim() || '';
  }

  if (!record.history) {
    record.history = [];
  }
  record.history.push({
    status: newStatus,
    actor,
    timestamp: now,
    note: note?.trim() || ''
  });

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(BACKUP_DIR, `handover_queue_${timestampStr}.csv`);
  fs.copyFileSync(HANDOVER_CSV, backupFile);

  const header = 'id,createdAt,sessionId,tag,summary,status,assignee,contactedAt,resolvedAt,resolution,history\n';
  const csvRows = records.map(r => {
    return [
      r.id,
      r.createdAt,
      r.sessionId,
      r.tag,
      r.summary,
      r.status,
      r.assignee || '',
      r.contactedAt || '',
      r.resolvedAt || '',
      r.resolution || '',
      JSON.stringify(r.history || [])
    ].map(escapeCsv).join(',');
  }).join('\n') + '\n';

  const tempFile = path.join(DATA_DIR, `handover_queue.csv.tmp_${Date.now()}`);
  fs.writeFileSync(tempFile, header + csvRows, 'utf-8');
  fs.renameSync(tempFile, HANDOVER_CSV);

  return record;
}
