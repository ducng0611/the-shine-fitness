import React, { useState, useEffect, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Cell
} from 'recharts';
import { 
  MessageSquare, 
  Clock, 
  Zap, 
  Users, 
  AlertTriangle, 
  PhoneCall, 
  MessageCircle, 
  RefreshCw, 
  Search, 
  Bot, 
  Sparkles, 
  CheckCircle2, 
  Layers,
  FileText,
  Headphones,
  ShieldAlert,
  Flame,
  Activity,
  Clock3,
  UserCheck,
  XCircle,
  AlertCircle,
  ArrowRight,
  Filter,
  Check,
  X,
  Info,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { DateRangePicker, DateRange, formatDisplayDate } from './DateRangePicker';
import { auth } from '../../lib/firebase';

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
  tag: string;
  summary: string;
  status: string;
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

interface ChatKpis {
  totalConversations: number;
  totalMessages: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  fallbackRate: number;
  handoverRate: number;
  avgResponseChars: number;
  segmentedSessionRate?: number;
  intentDistribution?: { intent: string; count: number }[];
  pkSegmentDistribution?: { segment: string; count: number }[];
  sourcedAnswerRate?: number;
  avgTopSimilarity?: number;
  handoverSuccessRate?: number;
  avgTimeToContactMinutes?: number;
  slaBreachRate?: number;
  openHandovers?: number;
  successRateByTag?: TagSuccessRate[];
  handoverStats?: HandoverKpis;
  feedbackStats?: {
    total: number;
    likes: number;
    dislikes: number;
    satisfactionRate: number;
  };
  ragInfo?: {
    enabled: boolean;
    available: boolean;
    builtAt?: string;
    chunkCount?: number;
  };
}

interface AdminChatAnalyticsTabProps {
  isDark: boolean;
}

const TRIGGER_META: Record<string, { label: string; color: string; badgeClass: string; icon: any; slaHours: number }> = {
  HEALTH_RISK: { 
    label: 'Sức khỏe & Chấn thương', 
    color: '#ef4444', 
    badgeClass: 'bg-rose-500/10 text-rose-500 border border-rose-500/20',
    icon: Activity,
    slaHours: 2
  },
  COMPLAINT: { 
    label: 'Khiếu nại & Bức xúc', 
    color: '#f97316', 
    badgeClass: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
    icon: ShieldAlert,
    slaHours: 2
  },
  REQUEST_HUMAN: { 
    label: 'Yêu cầu gặp người thật', 
    color: '#3b82f6', 
    badgeClass: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
    icon: Headphones,
    slaHours: 4
  },
  HOT_LEAD_OR_NEGOTIATION: { 
    label: 'Chốt gói & Thương lượng', 
    color: '#10b981', 
    badgeClass: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
    icon: Flame,
    slaHours: 4
  },
  LOW_CONFIDENCE: { 
    label: 'AI chưa rõ (Low Conf)', 
    color: '#8b5cf6', 
    badgeClass: 'bg-purple-500/10 text-purple-500 border border-purple-500/20',
    icon: AlertTriangle,
    slaHours: 24
  }
};

const STATUS_META: Record<string, { label: string; badgeClass: string; color: string }> = {
  CHO_TIEP_NHAN: {
    label: 'Chờ tiếp nhận',
    badgeClass: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
    color: '#f59e0b'
  },
  DANG_XU_LY: {
    label: 'Đang xử lý',
    badgeClass: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
    color: '#3b82f6'
  },
  DA_LIEN_HE: {
    label: 'Đã liên hệ',
    badgeClass: 'bg-purple-500/10 text-purple-500 border border-purple-500/20',
    color: '#8b5cf6'
  },
  THANH_CONG: {
    label: 'Thành công',
    badgeClass: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
    color: '#10b981'
  },
  KHONG_THANH_CONG: {
    label: 'Không thành công',
    badgeClass: 'bg-rose-500/10 text-rose-500 border border-rose-500/20',
    color: '#ef4444'
  }
};

const INTENT_META: Record<string, { label: string; color: string }> = {
  PRICE: { label: 'Báo giá', color: '#f59e0b' },
  SCHEDULE: { label: 'Lịch tập', color: '#3b82f6' },
  TRAINER: { label: 'HLV/PT', color: '#10b981' },
  FACILITY: { label: 'Cơ sở', color: '#8b5cf6' },
  POLICY: { label: 'Chính sách', color: '#6366f1' },
  TRIAL: { label: 'Tập thử', color: '#ec4899' },
  GREETING: { label: 'Chào hỏi', color: '#06b6d4' },
  OTHER: { label: 'Khác', color: '#64748b' }
};

const SEGMENT_META: Record<string, { label: string; color: string }> = {
  PK01: { label: 'HSSV / GenZ', color: '#ec4899' },
  PK02: { label: 'Dân văn phòng', color: '#3b82f6' },
  PK03: { label: 'Trung niên/Yoga', color: '#10b981' },
  PK04: { label: 'Pro Gymmer/PT', color: '#f59e0b' }
};

// SLA overdue calculation helper
function checkIsOverdue(item: HandoverRecord): boolean {
  if (!item || !item.createdAt) return false;
  const createdTime = new Date(item.createdAt).getTime();
  if (isNaN(createdTime)) return false;

  const slaHours = TRIGGER_META[item.tag]?.slaHours || 24;
  const deadline = createdTime + slaHours * 3600 * 1000;

  if (item.contactedAt) {
    const contactTime = new Date(item.contactedAt).getTime();
    if (!isNaN(contactTime)) {
      return contactTime > deadline;
    }
  }

  return Date.now() > deadline;
}

export const AdminChatAnalyticsTab: React.FC<AdminChatAnalyticsTabProps> = ({ isDark }) => {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '',
    endDate: '',
    presetKey: '30d',
    label: '30 ngày qua'
  });

  const [logs, setLogs] = useState<ChatLogRecord[]>([]);
  const [handoverQueue, setHandoverQueue] = useState<HandoverRecord[]>([]);
  const [handoverKpis, setHandoverKpis] = useState<HandoverKpis>({
    totalHandovers: 0,
    openHandovers: 0,
    resolvedHandovers: 0,
    successHandovers: 0,
    handoverSuccessRate: 0,
    avgTimeToContactMinutes: 0,
    slaBreachRate: 0,
    successRateByTag: []
  });

  const [kpi, setKpi] = useState<ChatKpis>({
    totalConversations: 0,
    totalMessages: 0,
    avgLatencyMs: 0,
    p95LatencyMs: 0,
    fallbackRate: 0,
    handoverRate: 0,
    avgResponseChars: 0
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Queue Filter States
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [tagFilter, setTagFilter] = useState<string>('ALL');

  // Updating record state
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Failure Reason Modal State
  const [isFailModalOpen, setIsFailModalOpen] = useState<boolean>(false);
  const [selectedRecordForFail, setSelectedRecordForFail] = useState<HandoverRecord | null>(null);
  const [failReason, setFailReason] = useState<string>('');

  // Audit Trail History Drawer/Modal State
  const [selectedRecordForHistory, setSelectedRecordForHistory] = useState<HandoverRecord | null>(null);

  const fetchChatLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('from', dateRange.startDate);
      if (dateRange.endDate) params.append('to', dateRange.endDate);

      const token = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const [logsRes, queueRes] = await Promise.all([
        fetch(`/api/admin/chat-logs?${params.toString()}`, { headers }),
        fetch(`/api/admin/handover-queue`, { headers })
      ]);

      if (!logsRes.ok) {
        throw new Error(`HTTP ${logsRes.status}: Không thể tải dữ liệu nhật ký AI`);
      }
      const data = await logsRes.json();
      setLogs(data.logs || []);
      setKpi(data.kpi || {
        totalConversations: 0,
        totalMessages: 0,
        avgLatencyMs: 0,
        p95LatencyMs: 0,
        fallbackRate: 0,
        handoverRate: 0,
        avgResponseChars: 0
      });

      if (queueRes.ok) {
        const qData = await queueRes.json();
        setHandoverQueue(qData.queue || []);
        if (qData.kpi) {
          setHandoverKpis(qData.kpi);
        }
      }
    } catch (err: any) {
      console.error('Error fetching chat analytics:', err);
      setError(err.message || 'Lỗi khi tải dữ liệu phân tích hội thoại');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChatLogs();
  }, [dateRange.startDate, dateRange.endDate]);

  // Handle status transitions (CHO_TIEP_NHAN -> DANG_XU_LY -> DA_LIEN_HE -> THANH_CONG / KHONG_THANH_CONG)
  const handleStatusUpdate = async (id: string, newStatus: string, note?: string) => {
    setUpdatingId(id);
    setActionError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/admin/handover-queue/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ newStatus, note })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}: Cập nhật trạng thái thất bại`);
      }

      await fetchChatLogs();
    } catch (err: any) {
      console.error('Failed to update handover status:', err);
      setActionError(err.message || 'Lỗi khi cập nhật trạng thái bản ghi');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOpenFailModal = (record: HandoverRecord) => {
    setSelectedRecordForFail(record);
    setFailReason('');
    setIsFailModalOpen(true);
  };

  const handleFailSubmit = async () => {
    if (!selectedRecordForFail || !failReason.trim()) return;
    await handleStatusUpdate(selectedRecordForFail.id, 'KHONG_THANH_CONG', failReason.trim());
    setIsFailModalOpen(false);
    setSelectedRecordForFail(null);
    setFailReason('');
  };

  // Filter handover queue
  const filteredHandoverQueue = useMemo(() => {
    return handoverQueue.filter(item => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (tagFilter !== 'ALL' && item.tag !== tagFilter) return false;
      return true;
    });
  }, [handoverQueue, statusFilter, tagFilter]);

  // Group logs by date for time series chart
  const dailyChartData = useMemo(() => {
    if (!logs.length) return [];

    const grouped: Record<string, { date: string; displayDate: string; messages: number; sessions: Set<string>; totalLatency: number }> = {};

    logs.forEach(log => {
      const d = log.timestamp ? log.timestamp.slice(0, 10) : 'Khác';
      if (!grouped[d]) {
        grouped[d] = {
          date: d,
          displayDate: formatDisplayDate(d),
          messages: 0,
          sessions: new Set(),
          totalLatency: 0
        };
      }
      grouped[d].messages += 1;
      if (log.sessionId) grouped[d].sessions.add(log.sessionId);
      grouped[d].totalLatency += log.latencyMs || 0;
    });

    return Object.keys(grouped)
      .sort()
      .map(d => ({
        date: grouped[d].displayDate,
        messages: grouped[d].messages,
        sessions: grouped[d].sessions.size,
        avgLatency: Math.round(grouped[d].totalLatency / grouped[d].messages)
      }));
  }, [logs]);

  // Trigger distribution chart data
  const triggerChartData = useMemo(() => {
    const counts: Record<string, number> = {
      HEALTH_RISK: 0,
      COMPLAINT: 0,
      REQUEST_HUMAN: 0,
      HOT_LEAD_OR_NEGOTIATION: 0,
      LOW_CONFIDENCE: 0
    };

    logs.forEach(l => {
      if (l.handoverTag && counts[l.handoverTag] !== undefined) {
        counts[l.handoverTag]++;
      }
    });

    if (Object.values(counts).reduce((a, b) => a + b, 0) === 0 && handoverQueue.length > 0) {
      handoverQueue.forEach(q => {
        if (q.tag && counts[q.tag] !== undefined) {
          counts[q.tag]++;
        }
      });
    }

    return [
      { name: 'Sức khỏe', tagKey: 'HEALTH_RISK', count: counts.HEALTH_RISK, fill: '#ef4444' },
      { name: 'Khiếu nại', tagKey: 'COMPLAINT', count: counts.COMPLAINT, fill: '#f97316' },
      { name: 'Người thật', tagKey: 'REQUEST_HUMAN', count: counts.REQUEST_HUMAN, fill: '#3b82f6' },
      { name: 'Chốt gói', tagKey: 'HOT_LEAD_OR_NEGOTIATION', count: counts.HOT_LEAD_OR_NEGOTIATION, fill: '#10b981' },
      { name: 'Chưa rõ (Low)', tagKey: 'LOW_CONFIDENCE', count: counts.LOW_CONFIDENCE, fill: '#8b5cf6' }
    ];
  }, [logs, handoverQueue]);

  // Intent distribution chart data
  const intentChartData = useMemo(() => {
    if (kpi.intentDistribution && kpi.intentDistribution.length > 0) {
      return kpi.intentDistribution.map(item => ({
        name: INTENT_META[item.intent]?.label || item.intent,
        intent: item.intent,
        count: item.count,
        fill: INTENT_META[item.intent]?.color || '#64748b'
      }));
    }
    const counts: Record<string, number> = { PRICE: 0, SCHEDULE: 0, TRAINER: 0, FACILITY: 0, POLICY: 0, TRIAL: 0, GREETING: 0, OTHER: 0 };
    logs.forEach(l => {
      const i = (l.intent || '').toUpperCase();
      if (counts[i] !== undefined) counts[i]++;
      else if (i) counts.OTHER++;
    });
    return Object.keys(counts).map(k => ({
      name: INTENT_META[k]?.label || k,
      intent: k,
      count: counts[k],
      fill: INTENT_META[k]?.color || '#64748b'
    }));
  }, [kpi.intentDistribution, logs]);

  // PK Segment distribution chart data
  const pkSegmentChartData = useMemo(() => {
    if (kpi.pkSegmentDistribution && kpi.pkSegmentDistribution.length > 0) {
      return kpi.pkSegmentDistribution.map(item => ({
        name: SEGMENT_META[item.segment]?.label || item.segment,
        segment: item.segment,
        count: item.count,
        fill: SEGMENT_META[item.segment]?.color || '#64748b'
      }));
    }
    const counts: Record<string, number> = { PK01: 0, PK02: 0, PK03: 0, PK04: 0 };
    logs.forEach(l => {
      if (l.pkSegment && counts[l.pkSegment] !== undefined) {
        counts[l.pkSegment]++;
      }
    });
    return Object.keys(counts).map(k => ({
      name: SEGMENT_META[k]?.label || k,
      segment: k,
      count: counts[k],
      fill: SEGMENT_META[k]?.color || '#64748b'
    }));
  }, [kpi.pkSegmentDistribution, logs]);

  // Filtered logs for the table
  const filteredLogs = useMemo(() => {
    let result = [...logs];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(l => 
        (l.userMessage && l.userMessage.toLowerCase().includes(term)) ||
        (l.botResponse && l.botResponse.toLowerCase().includes(term)) ||
        (l.sessionId && l.sessionId.toLowerCase().includes(term))
      );
    }
    return result.reverse().slice(0, 50);
  }, [logs, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'} shadow-sm transition-colors`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Phân Tích Hội Thoại & Chuyển Giao Tư Vấn AI (Step 10)
                </h2>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
                  Quy trình xử lý có trạng thái Handover, theo dõi SLA Breach và KPI Handover Success Rate
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <DateRangePicker 
              value={dateRange} 
              onChange={setDateRange} 
              isDark={isDark} 
            />
            <button
              onClick={fetchChatLogs}
              disabled={loading}
              className={`p-2.5 rounded-xl border ${
                isDark 
                  ? 'border-slate-800 bg-slate-800/60 text-slate-300 hover:bg-slate-800' 
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              } transition-colors flex items-center justify-center gap-2 text-sm font-medium`}
              title="Tải lại dữ liệu"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-500' : ''}`} />
              <span className="hidden sm:inline">Cập nhật</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error state messages */}
      {(error || actionError) && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error || actionError}</span>
          </div>
          <button onClick={() => { setError(null); setActionError(null); }} className="text-rose-400 hover:text-rose-300">
            <X size={16} />
          </button>
        </div>
      )}

      {/* NEW HANDOVER KPI CARDS ROW (Step 10 Handover Success & SLA Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Handover Success Rate */}
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Handover Success Rate
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {loading ? '...' : `${handoverKpis.handoverSuccessRate}%`}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>{handoverKpis.successHandovers} thành công / {handoverKpis.resolvedHandovers} đã kết thúc</span>
          </div>
        </div>

        {/* KPI 2: Avg Time to Contact */}
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex items-center justify-between text-blue-400 mb-2">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Thời Gian Liên Hệ TB
            </span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Clock size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-400">
            {loading ? '...' : `${handoverKpis.avgTimeToContactMinutes} phút`}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Tính từ mốc tạo yêu cầu đến khi Đã liên hệ
          </div>
        </div>

        {/* KPI 3: SLA Breach Rate */}
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex items-center justify-between text-rose-400 mb-2">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Tỷ Lệ Quá Hạn SLA
            </span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className={`text-2xl font-bold ${handoverKpis.slaBreachRate > 10 ? 'text-rose-500' : 'text-emerald-400'}`}>
            {loading ? '...' : `${handoverKpis.slaBreachRate}%`}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Chưa liên hệ trước hạn (SLA 2h - 24h)
          </div>
        </div>

        {/* KPI 4: Open Handovers */}
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Đang Chờ Xử Lý (Open)
            </span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock3 size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {loading ? '...' : `${handoverKpis.openHandovers} ca`}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Trạng thái Chờ / Đang xử lý / Đã liên hệ
          </div>
        </div>
      </div>

      {/* RAG Engine Status Banner */}
      <div className={`p-4 rounded-2xl border ${
        kpi.ragInfo?.enabled 
          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
          : isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
      } shadow-sm transition-colors`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${kpi.ragInfo?.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Hệ Thống Kho Tri Thức RAG (Retrieval-Augmented Generation)
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  kpi.ragInfo?.enabled 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                }`}>
                  {kpi.ragInfo?.enabled ? 'RAG_ENABLED = TRUE (ĐANG BẬT)' : 'RAG_ENABLED = FALSE (ĐANG TẮT)'}
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'} mt-0.5`}>
                Tra cứu vector ngữ nghĩa từ các file Markdown kho tri thức local, chống suy đoán/hallucination
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className={`px-3 py-1.5 rounded-xl border ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>
              <span className="text-slate-400">Trạng thái Index: </span>
              <span className={`font-semibold ${kpi.ragInfo?.available ? 'text-emerald-400' : 'text-rose-400'}`}>
                {kpi.ragInfo?.available ? 'Sẵn sàng' : 'Chưa có Index'}
              </span>
            </div>

            <div className={`px-3 py-1.5 rounded-xl border ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>
              <span className="text-slate-400">Tổng số Chunk: </span>
              <span className={`font-semibold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {kpi.ragInfo?.chunkCount ?? 0} chunks
              </span>
            </div>

            <div className={`px-3 py-1.5 rounded-xl border ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>
              <span className="text-slate-400">Build gần nhất: </span>
              <span className={`font-semibold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {kpi.ragInfo?.builtAt ? new Date(kpi.ragInfo.builtAt).toLocaleString('vi-VN') : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Row (Original AI Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-3">
        <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex items-center justify-between text-amber-500 mb-1.5">
            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tổng hội thoại</span>
            <Users className="w-3.5 h-3.5" />
          </div>
          <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {loading ? '...' : kpi.totalConversations.toLocaleString('vi-VN')}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Phiên tương tác</div>
        </div>

        <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex items-center justify-between text-blue-500 mb-1.5">
            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tổng tin nhắn</span>
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {loading ? '...' : kpi.totalMessages.toLocaleString('vi-VN')}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Lượt hỏi - đáp</div>
        </div>

        <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex items-center justify-between text-emerald-400 mb-1.5">
            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Sourced Rate</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className={`text-xl font-bold text-emerald-400`}>
            {loading ? '...' : `${kpi.sourcedAnswerRate ?? 0}%`}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Có nguồn RAG</div>
        </div>

        <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex items-center justify-between text-cyan-400 mb-1.5">
            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Avg Similarity</span>
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className={`text-xl font-bold text-cyan-400`}>
            {loading ? '...' : kpi.avgTopSimilarity ? `${(kpi.avgTopSimilarity * 100).toFixed(1)}%` : '0%'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Độ tương đồng</div>
        </div>

        <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex items-center justify-between text-emerald-500 mb-1.5">
            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Độ trễ TB</span>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {loading ? '...' : `${kpi.avgLatencyMs} ms`}
          </div>
          <div className="text-[10px] text-emerald-500 mt-0.5 font-medium">Phản hồi</div>
        </div>

        <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex items-center justify-between text-purple-500 mb-1.5">
            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Độ trễ P95</span>
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {loading ? '...' : `${kpi.p95LatencyMs} ms`}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Top 95%</div>
        </div>

        <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex items-center justify-between text-rose-500 mb-1.5">
            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tỷ lệ Fallback</span>
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div className={`text-xl font-bold ${kpi.fallbackRate > 5 ? 'text-rose-500' : isDark ? 'text-white' : 'text-slate-900'}`}>
            {loading ? '...' : `${kpi.fallbackRate}%`}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Model dự phòng</div>
        </div>

        <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex items-center justify-between text-indigo-400 mb-1.5">
            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tỷ lệ Handover</span>
            <PhoneCall className="w-3.5 h-3.5" />
          </div>
          <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {loading ? '...' : `${kpi.handoverRate}%`}
          </div>
          <div className="text-[10px] text-indigo-400 mt-0.5 font-semibold">
            {handoverQueue.length} ca
          </div>
        </div>

        <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex items-center justify-between text-pink-400 mb-1.5">
            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Hài lòng CSAT</span>
            <div className="flex items-center gap-1">
              <ThumbsUp className="w-3 h-3 text-emerald-400" />
              <ThumbsDown className="w-3 h-3 text-rose-400" />
            </div>
          </div>
          <div className={`text-xl font-bold ${kpi.feedbackStats && kpi.feedbackStats.satisfactionRate < 80 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {loading ? '...' : `${kpi.feedbackStats?.satisfactionRate ?? 100}%`}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {kpi.feedbackStats ? `${kpi.feedbackStats.likes}👍 / ${kpi.feedbackStats.dislikes}👎` : '0 đánh giá'}
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Messages & Sessions Trend */}
        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Xu Hướng Tin Nhắn & Phiên Tương Tác
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Số lượt tin nhắn gửi đến AI theo từng ngày
              </p>
            </div>
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <MessageCircle className="w-4 h-4" />
            </div>
          </div>

          <div className="h-64 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Đang tải biểu đồ...
              </div>
            ) : dailyChartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <MessageSquare className="w-8 h-8 text-slate-400 mb-2 opacity-50" />
                <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Chưa có hội thoại nào trong khoảng thời gian này
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                  <XAxis dataKey="date" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} />
                  <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                      borderColor: isDark ? '#334155' : '#cbd5e1',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: isDark ? '#ffffff' : '#0f172a'
                    }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="messages" name="Lượt tin nhắn" stroke="#ff7a1a" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="sessions" name="Số hội thoại" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: 5 Handover Triggers Distribution */}
        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Phân Bố 5 Trigger Chuyển Giao Tư Vấn
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Thống kê lý do kích hoạt handover trực tiếp
              </p>
            </div>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>

          <div className="h-64 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Đang tải biểu đồ trigger...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={triggerChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                  <XAxis dataKey="name" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} />
                  <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                      borderColor: isDark ? '#334155' : '#cbd5e1',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: isDark ? '#ffffff' : '#0f172a'
                    }} 
                  />
                  <Bar dataKey="count" name="Số lượt kích hoạt" radius={[6, 6, 0, 0]}>
                    {triggerChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 3: Intent Distribution (8 Intents) */}
        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Phân Bố Ý Định Khách Hàng (8 Intents)
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Nhận diện từ nhu cầu hỏi giá, lịch tập, HLV, thiết bị đến tập thử
              </p>
            </div>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <Layers className="w-4 h-4" />
            </div>
          </div>

          <div className="h-64 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Đang tải biểu đồ ý định...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={intentChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                  <XAxis dataKey="name" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} interval={0} />
                  <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                      borderColor: isDark ? '#334155' : '#cbd5e1',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: isDark ? '#ffffff' : '#0f172a'
                    }} 
                  />
                  <Bar dataKey="count" name="Số lượt hỏi" radius={[6, 6, 0, 0]}>
                    {intentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 4: PK Segment Distribution (4 Segments) */}
        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
                <span>Phân Bố 4 Phân Khúc Khách Hàng (PK01-PK04)</span>
                {kpi.segmentedSessionRate !== undefined && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/10 text-emerald-500 font-semibold">
                    {kpi.segmentedSessionRate}% phiên đã phân khúc
                  </span>
                )}
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                HSSV/GenZ, Dân văn phòng, Trung niên/Yoga, Pro Gymmer/PT
              </p>
            </div>
            <div className="p-2 rounded-lg bg-pink-500/10 text-pink-500">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="h-64 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Đang tải biểu đồ phân khúc...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pkSegmentChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                  <XAxis dataKey="name" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} />
                  <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                      borderColor: isDark ? '#334155' : '#cbd5e1',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: isDark ? '#ffffff' : '#0f172a'
                    }} 
                  />
                  <Bar dataKey="count" name="Số tin nhắn thuộc phân khúc" radius={[6, 6, 0, 0]}>
                    {pkSegmentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* STATEFUL HANDOVER QUEUE TABLE SECTION (Step 10 Core UI) */}
      <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
              <span>Hàng Đợi Chuyển Giao Tư Vấn Viên (Quy Trình 5 Trạng Thái)</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-cyan-500/10 text-cyan-500 font-medium">
                {filteredHandoverQueue.length} / {handoverQueue.length} yêu cầu
              </span>
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
              Vòng đời chuyển trạng thái: CHO_TIEP_NHAN → DANG_XU_LY → DA_LIEN_HE → THANH_CONG / KHONG_THANH_CONG
            </p>
          </div>

          {/* Queue Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <Filter size={14} className="text-slate-400" />
              <span className="text-slate-400 font-medium">Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium outline-none ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="CHO_TIEP_NHAN">Chờ tiếp nhận</option>
                <option value="DANG_XU_LY">Đang xử lý</option>
                <option value="DA_LIEN_HE">Đã liên hệ</option>
                <option value="THANH_CONG">Thành công</option>
                <option value="KHONG_THANH_CONG">Không thành công</option>
              </select>
            </div>

            {/* Tag Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Tag:</span>
              <select
                value={tagFilter}
                onChange={e => setTagFilter(e.target.value)}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium outline-none ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <option value="ALL">Tất cả Tag</option>
                <option value="HEALTH_RISK">Sức khỏe & Chấn thương (2h)</option>
                <option value="COMPLAINT">Khiếu nại & Bức xúc (2h)</option>
                <option value="REQUEST_HUMAN">Yêu cầu người thật (4h)</option>
                <option value="HOT_LEAD_OR_NEGOTIATION">Chốt gói & Thương lượng (4h)</option>
                <option value="LOW_CONFIDENCE">AI chưa rõ (24h)</option>
              </select>
            </div>
          </div>
        </div>

        {filteredHandoverQueue.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Không có yêu cầu chuyển giao tư vấn viên nào phù hợp bộ lọc.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-[11px] font-semibold uppercase tracking-wider ${
                  isDark ? 'border-slate-800 text-slate-400 bg-slate-800/30' : 'border-slate-200 text-slate-500 bg-slate-50'
                }`}>
                  <th className="py-3 px-3.5">ID & Mốc thời gian</th>
                  <th className="py-3 px-3.5">Loại Trigger (Tag)</th>
                  <th className="py-3 px-3.5">Trích đoạn Tóm tắt</th>
                  <th className="py-3 px-3.5 text-center">Trạng thái</th>
                  <th className="py-3 px-3.5">Người phụ trách</th>
                  <th className="py-3 px-3.5 text-center">Hạn SLA</th>
                  <th className="py-3 px-3.5 text-center">Thao tác chuyển đổi</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-xs ${isDark ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
                {filteredHandoverQueue.map(item => {
                  const meta = TRIGGER_META[item.tag] || {
                    label: item.tag,
                    badgeClass: 'bg-slate-500/10 text-slate-400',
                    icon: AlertTriangle,
                    slaHours: 24
                  };
                  const Icon = meta.icon;
                  const statusInfo = STATUS_META[item.status] || {
                    label: item.status,
                    badgeClass: 'bg-slate-500/10 text-slate-400',
                    color: '#64748b'
                  };

                  const isOverdue = checkIsOverdue(item);
                  const isHighPriorityOverdue = isOverdue && (item.tag === 'COMPLAINT' || item.tag === 'HEALTH_RISK');

                  const formattedTime = item.createdAt 
                    ? new Date(item.createdAt).toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit'
                      })
                    : '—';

                  const isUpdating = updatingId === item.id;

                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:${isDark ? 'bg-slate-800/40' : 'bg-slate-50/80'} transition-colors ${
                        isHighPriorityOverdue 
                          ? 'bg-rose-500/10 border-l-4 border-l-rose-500' 
                          : isOverdue 
                          ? 'bg-amber-500/5 border-l-2 border-l-amber-500' 
                          : ''
                      }`}
                    >
                      {/* ID & Timestamp */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className={`font-mono text-[11px] font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {item.id}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock size={10} />
                          <span>{formattedTime}</span>
                        </div>
                      </td>

                      {/* Tag */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold ${meta.badgeClass}`}>
                          <Icon size={12} />
                          <span>{meta.label}</span>
                        </span>
                      </td>

                      {/* Summary */}
                      <td className={`py-3 px-3.5 max-w-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <p className="line-clamp-2 text-xs whitespace-pre-wrap">{item.summary}</p>
                        {item.resolution && (
                          <div className="text-[10px] text-slate-400 mt-1 italic bg-slate-800/30 p-1 rounded">
                            Lý do/Kết quả: {item.resolution}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold inline-flex items-center gap-1 ${statusInfo.badgeClass}`}>
                          <span>{statusInfo.label}</span>
                        </span>
                      </td>

                      {/* Assignee / Actor */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-xs">
                        {item.assignee ? (
                          <span className="flex items-center gap-1 text-slate-300 font-medium">
                            <UserCheck size={12} className="text-emerald-400" />
                            <span>{item.assignee}</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Chưa phân công</span>
                        )}
                      </td>

                      {/* SLA Status */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        {isHighPriorityOverdue ? (
                          <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-bold animate-pulse flex items-center justify-center gap-1">
                            <AlertCircle size={10} />
                            <span>QUÁ HẠN KHẨN (SLA {meta.slaHours}h)</span>
                          </span>
                        ) : isOverdue ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-semibold flex items-center justify-center gap-1">
                            <Clock3 size={10} />
                            <span>Quá hạn (SLA {meta.slaHours}h)</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-medium">
                            Trong hạn ({meta.slaHours}h)
                          </span>
                        )}
                      </td>

                      {/* State Transition Actions */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        {isUpdating ? (
                          <span className="text-xs text-orange-400 flex items-center justify-center gap-1">
                            <RefreshCw size={12} className="animate-spin" />
                            <span>Đang xử lý...</span>
                          </span>
                        ) : item.status === 'CHO_TIEP_NHAN' ? (
                          <button
                            onClick={() => handleStatusUpdate(item.id, 'DANG_XU_LY')}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1 mx-auto shadow-sm"
                          >
                            <span>Tiếp nhận</span>
                            <ArrowRight size={12} />
                          </button>
                        ) : item.status === 'DANG_XU_LY' ? (
                          <button
                            onClick={() => handleStatusUpdate(item.id, 'DA_LIEN_HE')}
                            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1 mx-auto shadow-sm"
                          >
                            <span>Đã liên hệ</span>
                            <ArrowRight size={12} />
                          </button>
                        ) : item.status === 'DA_LIEN_HE' ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleStatusUpdate(item.id, 'THANH_CONG')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center gap-1"
                              title="Chuyển sang Thành công"
                            >
                              <Check size={12} />
                              <span>Thành công</span>
                            </button>
                            <button
                              onClick={() => handleOpenFailModal(item)}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors flex items-center gap-1"
                              title="Chuyển sang Không thành công (Bắt buộc điền lý do)"
                            >
                              <X size={12} />
                              <span>Thất bại</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-[11px] text-slate-500 font-medium">Hoàn tất</span>
                            {item.history && item.history.length > 0 && (
                              <button
                                onClick={() => setSelectedRecordForHistory(item)}
                                className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                                title="Xem lịch sử xử lý"
                              >
                                <Info size={12} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL FAILURE REASON INPUT (Mandatory for KHONG_THANH_CONG) */}
      {isFailModalOpen && selectedRecordForFail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-md p-6 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'} shadow-xl space-y-4`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-rose-500">
                <XCircle size={20} />
                <h3 className="font-bold text-base">Xác Nhận Không Thành Công</h3>
              </div>
              <button 
                onClick={() => setIsFailModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="text-xs space-y-2">
              <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-1">
                <div><span className="text-slate-400">ID:</span> <span className="font-mono font-bold">{selectedRecordForFail.id}</span></div>
                <div><span className="text-slate-400">Tag:</span> <span className="font-semibold">{selectedRecordForFail.tag}</span></div>
                <div className="line-clamp-2 text-slate-300"><span className="text-slate-400">Tóm tắt:</span> {selectedRecordForFail.summary}</div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-rose-400">
                  Lý do không thành công <span className="text-rose-500">* (Bắt buộc)</span>:
                </label>
                <textarea
                  value={failReason}
                  onChange={e => setFailReason(e.target.value)}
                  placeholder="Nhập lý do chi tiết (ví dụ: Khách hàng đổi ý, Không nghe máy 3 lần, Sai thông tin liên hệ...)"
                  rows={3}
                  className={`w-full p-3 text-xs rounded-xl border outline-none ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-rose-500' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-rose-500'
                  }`}
                />
                {!failReason.trim() && (
                  <p className="text-[10px] text-rose-500 mt-1">
                    ⚠️ Vui lòng nhập lý do để hoàn tất chuyển sang Không Thành Công.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsFailModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleFailSubmit}
                disabled={!failReason.trim() || updatingId === selectedRecordForFail.id}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition-colors ${
                  !failReason.trim()
                    ? 'bg-slate-700 cursor-not-allowed opacity-50'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {updatingId === selectedRecordForFail.id ? 'Đang cập nhật...' : 'Xác nhận Thất Bại'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUDIT TRAIL HISTORY MODAL */}
      {selectedRecordForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-lg p-6 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'} shadow-xl space-y-4`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-orange-500">
                <Info size={20} />
                <h3 className="font-bold text-base">Lịch Sử Chuyển Đổi Trạng Thái (Audit Trail)</h3>
              </div>
              <button 
                onClick={() => setSelectedRecordForHistory(null)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-80 overflow-y-auto pr-1">
              <div className="text-slate-400 font-mono">Bản ghi ID: {selectedRecordForHistory.id}</div>

              {selectedRecordForHistory.history && selectedRecordForHistory.history.length > 0 ? (
                <div className="space-y-2">
                  {selectedRecordForHistory.history.map((h, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-orange-400">{h.status}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{new Date(h.timestamp).toLocaleString('vi-VN')}</span>
                      </div>
                      <div className="text-slate-300">Thực hiện bởi: <span className="font-semibold text-white">{h.actor}</span></div>
                      {h.note && <div className="text-slate-400 italic">Ghi chú: "{h.note}"</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-500 italic">Chưa có thông tin lịch sử chi tiết.</div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRecordForHistory(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700 text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logs Table Section (Original Chat Logs) */}
      <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
              <span>Nhật Ký 50 Hội Thoại Gần Nhất</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-orange-500/10 text-orange-500 font-medium">
                {logs.length} bản ghi
              </span>
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
              Số điện thoại & email khách hàng đã được tự động ẩn danh hóa (PII Sanitized)
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Tìm nội dung câu hỏi, câu trả lời..."
              className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border ${
                isDark 
                  ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500 focus:border-orange-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-orange-500'
              } outline-none transition-colors`}
            />
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">
            Đang tải nhật ký hội thoại AI...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center px-4">
            <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500 mb-3">
              <MessageSquare className="w-8 h-8 opacity-70" />
            </div>
            <h4 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Chưa có hội thoại nào trong khoảng thời gian này
            </h4>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} max-w-md mt-1`}>
              Hãy thử chọn khoảng thời gian khác trên bộ lọc hoặc trải nghiệm tương tác với Chatbot AI trên trang chủ website để tạo hội thoại đầu tiên.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-[11px] font-semibold uppercase tracking-wider ${
                  isDark ? 'border-slate-800 text-slate-400 bg-slate-800/30' : 'border-slate-200 text-slate-500 bg-slate-50'
                }`}>
                  <th className="py-3 px-3.5">Thời gian</th>
                  <th className="py-3 px-3.5">Session ID</th>
                  <th className="py-3 px-3.5">Ý định (Intent)</th>
                  <th className="py-3 px-3.5">Phân khúc (PK)</th>
                  <th className="py-3 px-3.5">Đối tượng</th>
                  <th className="py-3 px-3.5">Câu hỏi của khách</th>
                  <th className="py-3 px-3.5">Phản hồi của AI</th>
                  <th className="py-3 px-3.5 text-center">Handover Tag</th>
                  <th className="py-3 px-3.5 text-center">Nguồn RAG</th>
                  <th className="py-3 px-3.5 text-right">Độ trễ</th>
                  <th className="py-3 px-3.5 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-xs ${isDark ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
                {filteredLogs.map(log => {
                  const formattedTime = log.timestamp 
                    ? new Date(log.timestamp).toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })
                    : '—';

                  const tagMeta = log.handoverTag ? TRIGGER_META[log.handoverTag] : null;

                  return (
                    <tr key={log.id} className={`hover:${isDark ? 'bg-slate-800/40' : 'bg-slate-50/80'} transition-colors`}>
                      <td className={`py-3 px-3.5 whitespace-nowrap font-mono text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {formattedTime}
                      </td>

                      <td className={`py-3 px-3.5 whitespace-nowrap font-mono text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`} title={log.sessionId}>
                        {log.sessionId ? `${log.sessionId.slice(0, 12)}...` : '—'}
                      </td>

                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {log.intent ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            {INTENT_META[log.intent]?.label || log.intent}
                          </span>
                        ) : (
                          <span className={`text-[11px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>—</span>
                        )}
                      </td>

                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {log.pkSegment ? (
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                            log.pkSegment === 'PK01' ? 'bg-pink-500/10 text-pink-500 border border-pink-500/20' :
                            log.pkSegment === 'PK02' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                            log.pkSegment === 'PK03' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                            'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          }`}>
                            {log.pkSegment}
                          </span>
                        ) : (
                          <span className={`text-[11px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>—</span>
                        )}
                      </td>

                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {log.isMember ? (
                          <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500 font-medium text-[10px]">
                            Hội viên
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-md ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'} font-medium text-[10px]`}>
                            Khách vãng lai
                          </span>
                        )}
                      </td>

                      <td className={`py-3 px-3.5 max-w-xs truncate ${isDark ? 'text-slate-200' : 'text-slate-800'} font-medium`} title={log.userMessage}>
                        {log.userMessage || '—'}
                      </td>

                      <td className={`py-3 px-3.5 max-w-sm truncate ${isDark ? 'text-slate-400' : 'text-slate-600'}`} title={log.botResponse}>
                        {log.botResponse || '—'}
                      </td>

                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        {tagMeta ? (
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${tagMeta.badgeClass}`}>
                            {tagMeta.label}
                          </span>
                        ) : (
                          <span className={`text-[11px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>—</span>
                        )}
                      </td>

                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        {log.groundedAnswer ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-mono text-[10px] border border-emerald-500/20" title={`Chunks: ${log.retrievedChunkIds || 'N/A'}`}>
                            RAG ({((log.topSimilarity || 0) * 100).toFixed(0)}%)
                          </span>
                        ) : (
                          <span className={`text-[10px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Standard</span>
                        )}
                      </td>

                      <td className={`py-3 px-3.5 text-right font-mono text-[11px] font-semibold ${
                        log.latencyMs < 1000 ? 'text-emerald-500' : log.latencyMs < 3000 ? 'text-amber-500' : 'text-rose-500'
                      }`}>
                        {log.latencyMs} ms
                      </td>

                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        {log.usedFallback ? (
                          <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 font-medium text-[10px]">
                            Fallback
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 font-medium text-[10px]">
                            Chuẩn
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChatAnalyticsTab;
