/** DTOs only: no model keys, database clients or personal profiles. */
export const BUDDY_VERSION = 'buddy-v1' as const;
export const BUDDY_BASE = '/api/companion/training/buddy';
export const BUDDY_TASKS = ['BUSINESS_QA','FITNESS_EDUCATION','HEALTH_EDUCATION','NUTRITION_EDUCATION','MEMBER_CONTEXT_QA','PERSONAL_PLAN_REQUEST','LOGGING_REQUEST','PROFESSIONAL_REVIEW','URGENT_SAFETY','OUT_OF_SCOPE'] as const;
export type BuddyTask = typeof BUDDY_TASKS[number];
export type BuddyMode = 'guest' | 'authenticated_user' | 'authorized_member';
export type BuddyLanguage = 'vi' | 'en';
export interface BuddyIdentity { uid: string | null; emailVerified: boolean; admin: boolean; privateCredentialVerified?: boolean; authProvider?: 'firebase' | 'local' }
export interface BuddyCitation { id: string; title: string; url?: string; checkedAt?: string; scope: 'education' | 'business' | 'own_record' }
export interface BuddyTimings { authMs: number; routeMs: number; contextMs: number; retrievalMs: number; modelMs: number; firstContentMs: number | null; totalMs: number; modelCalls: number; cacheHit: boolean; fallback: boolean }
export interface BuddyReply {
  version: typeof BUDDY_VERSION;
  requestId: string; conversationId: string; sessionId: string; revision: number;
  mode: BuddyMode; task: BuddyTask; text: string;
  citations: BuddyCitation[]; missingFields: string[]; reasonCodes: string[];
  action: 'open_training' | null;
  handover: boolean; handoverTag: 'HEALTH_RISK' | null;
  handoverStatus: 'not_requested' | 'suggested';
  saved: false; timings: BuddyTimings;
}
export interface BuddyRequest { message: string; conversationId: string; requestId: string; expectedRevision: number; lang: BuddyLanguage }
export interface BuddySession { conversationId: string; guestToken?: string; revision: number; expiresAt: string; mode: BuddyMode }
export type BuddyEvent =
  | { type: 'meta'; requestId: string; conversationId: string }
  | { type: 'delta'; text: string }
  | { type: 'done'; reply: BuddyReply }
  | { type: 'error'; code: string; message: string };
export class BuddyError extends Error {
  constructor(public readonly code: string, message: string, public readonly status = 400) { super(message); }
}
export const opaqueId = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f-]{36}$/.test(v);
export function parseBuddyRequest(value: unknown): BuddyRequest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new BuddyError('invalid_request','Yêu cầu không hợp lệ.');
  const r = value as Record<string,unknown>;
  if (Object.keys(r).some(k => !['message','conversationId','requestId','expectedRevision','lang'].includes(k))) throw new BuddyError('unexpected_fields','Không gửi danh tính, hồ sơ hoặc lịch sử trong nội dung yêu cầu.');
  if (typeof r.message !== 'string' || !r.message.trim() || r.message.length > 4000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(r.message)) throw new BuddyError('invalid_message','Tin nhắn cần từ 1 đến 4.000 ký tự.');
  if (!opaqueId(r.conversationId) || !opaqueId(r.requestId)) throw new BuddyError('invalid_id','Mã yêu cầu hoặc hội thoại không hợp lệ.');
  if (!Number.isSafeInteger(r.expectedRevision) || Number(r.expectedRevision) < 0 || Number(r.expectedRevision) > 1000) throw new BuddyError('invalid_revision','Phiên bản hội thoại không hợp lệ.');
  if (r.lang !== 'vi' && r.lang !== 'en') throw new BuddyError('invalid_language','Chọn tiếng Việt hoặc tiếng Anh.');
  return r as unknown as BuddyRequest;
}
export const emptyTimings = (): BuddyTimings => ({authMs:0,routeMs:0,contextMs:0,retrievalMs:0,modelMs:0,firstContentMs:null,totalMs:0,modelCalls:0,cacheHit:false,fallback:false});
