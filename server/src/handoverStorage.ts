import { HandoverTag } from './handoverRules';
import {
  initHandoverCsvStorage,
  addHandoverRecordCsv,
  getHandoverQueueCsv,
  updateHandoverStatusCsv
} from './handoverCsvStorage';
import {
  initHandoverFirestoreStorage,
  addHandoverRecordFirestore,
  getHandoverQueueFirestore,
  updateHandoverStatusFirestore
} from './handoverFirestoreStorage';

export interface HandoverHistoryItem {
  status: string;
  actor: string;
  timestamp: string;
  note?: string;
}

export interface HandoverRecord {
  id: string;
  createdAt: string;
  sessionId: string;
  tag: HandoverTag | string;
  summary: string;
  status: 'CHO_TIEP_NHAN' | 'DANG_XU_LY' | 'DA_LIEN_HE' | 'THANH_CONG' | 'KHONG_THANH_CONG' | string;
  assignee?: string;
  contactedAt?: string;
  resolvedAt?: string;
  resolution?: string;
  history?: HandoverHistoryItem[];
}

export interface TagSuccessRate {
  tag: string;
  total: number;
  resolved: number;
  successful: number;
  successRate: number;
  open: number;
  slaBreached: number;
}

export interface HandoverKpis {
  totalHandovers: number;
  openHandovers: number;
  resolvedHandovers: number;
  successHandovers: number;
  handoverSuccessRate: number;
  avgTimeToContactMinutes: number;
  slaBreachRate: number;
  successRateByTag: TagSuccessRate[];
}

/**
 * Hạn xử lý chuyển giao (SLA) theo Tag (tính bằng GIỜ).
 * Tính từ mốc createdAt đến khi chuyển sang trạng thái DA_LIEN_HE (contactedAt).
 */
export const HANDOVER_SLA_HOURS: Record<string, number> = {
  COMPLAINT: 2,               // Khiếu nại & bức xúc dịch vụ: 2 giờ
  HEALTH_RISK: 2,             // Sức khỏe & chấn thương: 2 giờ
  REQUEST_HUMAN: 4,           // Yêu cầu gặp người thật: 4 giờ
  HOT_LEAD_OR_NEGOTIATION: 4, // Chốt gói & thương lượng: 4 giờ
  LOW_CONFIDENCE: 24          // AI chưa rõ thông tin: 24 giờ
};

export const DEFAULT_SLA_HOURS = 24;

// Forward-only transition map for handover lifecycle
export const VALID_TRANSITIONS: Record<string, string[]> = {
  CHO_TIEP_NHAN: ['DANG_XU_LY'],
  DANG_XU_LY: ['DA_LIEN_HE'],
  DA_LIEN_HE: ['THANH_CONG', 'KHONG_THANH_CONG'],
  THANH_CONG: [],
  KHONG_THANH_CONG: []
};

export function isFirestoreBackend(): boolean {
  return (process.env.STORAGE_BACKEND || 'csv').toLowerCase() === 'firestore';
}

// Normalize legacy status names from old CSV / Firestore records
export function normalizeHandoverStatus(status: string): string {
  if (!status || status.includes('Chờ tiếp nhận') || status === 'CHO_TIEP_NHAN') {
    return 'CHO_TIEP_NHAN';
  }
  if (status.includes('Đang xử lý') || status === 'DANG_XU_LY') {
    return 'DANG_XU_LY';
  }
  if (status.includes('Đã liên hệ') || status === 'DA_LIEN_HE') {
    return 'DA_LIEN_HE';
  }
  if (status.includes('Thành công') || status === 'THANH_CONG') {
    return 'THANH_CONG';
  }
  if (status.includes('Không thành công') || status === 'KHONG_THANH_CONG') {
    return 'KHONG_THANH_CONG';
  }
  return status;
}

// Get SLA limit in hours for a given tag
export function getHandoverSlaHours(tag: string): number {
  return HANDOVER_SLA_HOURS[tag] || DEFAULT_SLA_HOURS;
}

// Check if a handover record has breached its SLA
export function isHandoverOverdue(record: HandoverRecord): boolean {
  if (!record || !record.createdAt) return false;
  const createdTime = new Date(record.createdAt).getTime();
  if (isNaN(createdTime)) return false;

  const slaHours = getHandoverSlaHours(record.tag);
  const deadline = createdTime + slaHours * 3600 * 1000;

  if (record.contactedAt) {
    const contactTime = new Date(record.contactedAt).getTime();
    if (!isNaN(contactTime)) {
      return contactTime > deadline;
    }
  }

  return Date.now() > deadline;
}

export function initHandoverStorage(): void {
  const backend = (process.env.STORAGE_BACKEND || 'csv').toLowerCase();
  console.log(`[HandoverStorage] Initializing with backend: "${backend}"`);
  if (backend === 'firestore') {
    initHandoverFirestoreStorage();
  } else {
    initHandoverCsvStorage();
  }
}

export function addHandoverRecord(record: {
  sessionId: string;
  tag: HandoverTag | string;
  summary: string;
  status?: string;
}): HandoverRecord {
  if (isFirestoreBackend()) {
    return addHandoverRecordFirestore(record);
  }
  return addHandoverRecordCsv(record);
}

export function getHandoverQueue(): HandoverRecord[] {
  if (isFirestoreBackend()) {
    return getHandoverQueueFirestore();
  }
  return getHandoverQueueCsv();
}

export function updateHandoverStatus(
  id: string,
  newStatus: string,
  actor: string,
  note?: string
): HandoverRecord {
  if (isFirestoreBackend()) {
    return updateHandoverStatusFirestore(id, newStatus, actor, note);
  }
  return updateHandoverStatusCsv(id, newStatus, actor, note);
}

/**
 * Computes pre-calculated Handover KPIs based on records in queue.
 */
export function getHandoverKpis(recordsInput?: HandoverRecord[]): HandoverKpis {
  const records = recordsInput || getHandoverQueue();
  const totalHandovers = records.length;

  const openHandovers = records.filter(r =>
    ['CHO_TIEP_NHAN', 'DANG_XU_LY', 'DA_LIEN_HE'].includes(r.status)
  ).length;

  const resolvedHandovers = records.filter(r =>
    ['THANH_CONG', 'KHONG_THANH_CONG'].includes(r.status)
  ).length;

  const successHandovers = records.filter(r => r.status === 'THANH_CONG').length;

  const handoverSuccessRate = resolvedHandovers > 0
    ? Number(((successHandovers / resolvedHandovers) * 100).toFixed(1))
    : 0;

  const contactedRecords = records.filter(r => r.contactedAt && r.createdAt);
  let totalContactMinutes = 0;
  contactedRecords.forEach(r => {
    const diffMs = new Date(r.contactedAt!).getTime() - new Date(r.createdAt).getTime();
    if (!isNaN(diffMs) && diffMs >= 0) {
      totalContactMinutes += diffMs / (1000 * 60);
    }
  });

  const avgTimeToContactMinutes = contactedRecords.length > 0
    ? Math.round(totalContactMinutes / contactedRecords.length)
    : 0;

  const breachedRecords = records.filter(r => isHandoverOverdue(r));
  const slaBreachRate = totalHandovers > 0
    ? Number(((breachedRecords.length / totalHandovers) * 100).toFixed(1))
    : 0;

  const ALL_TAGS = ['REQUEST_HUMAN', 'HOT_LEAD_OR_NEGOTIATION', 'COMPLAINT', 'LOW_CONFIDENCE', 'HEALTH_RISK'];
  const tagMap = new Map<string, HandoverRecord[]>();

  ALL_TAGS.forEach(t => tagMap.set(t, []));

  records.forEach(r => {
    const t = r.tag || 'OTHER';
    if (!tagMap.has(t)) {
      tagMap.set(t, []);
    }
    tagMap.get(t)!.push(r);
  });

  const successRateByTag: TagSuccessRate[] = Array.from(tagMap.entries()).map(([tag, recs]) => {
    const total = recs.length;
    const resolved = recs.filter(r => ['THANH_CONG', 'KHONG_THANH_CONG'].includes(r.status)).length;
    const successful = recs.filter(r => r.status === 'THANH_CONG').length;
    const open = recs.filter(r => ['CHO_TIEP_NHAN', 'DANG_XU_LY', 'DA_LIEN_HE'].includes(r.status)).length;
    const slaBreached = recs.filter(r => isHandoverOverdue(r)).length;
    const successRate = resolved > 0 ? Number(((successful / resolved) * 100).toFixed(1)) : 0;

    return {
      tag,
      total,
      resolved,
      successful,
      successRate,
      open,
      slaBreached
    };
  });

  return {
    totalHandovers,
    openHandovers,
    resolvedHandovers,
    successHandovers,
    handoverSuccessRate,
    avgTimeToContactMinutes,
    slaBreachRate,
    successRateByTag
  };
}
