import React, { useState, useMemo } from 'react';
import { 
  Compass, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  MessageSquare, 
  Calendar, 
  Award, 
  ChevronRight, 
  Clock, 
  Activity, 
  Phone, 
  Mail, 
  HelpCircle, 
  Eye, 
  RefreshCw,
  Send,
  Zap,
  Tag,
  Gift,
  ExternalLink,
  Info
} from 'lucide-react';
import { CustomerRecord, JourneyStage, CustomerPersona } from '../../types';
import { 
  JOURNEY_STAGES, 
  TOUCHPOINTS_LIST, 
  PERSONA_PROFILES, 
  FIVE_W1H_MATRIX, 
  MOMENTS_OF_TRUTH, 
  TouchpointItem, 
  enrichCustomerWithJourney 
} from '../../data/customerJourneyData';

interface AdminCustomerJourneyTabProps {
  customers: CustomerRecord[];
  isDark: boolean;
  onUpdateCustomerStage: (customer: CustomerRecord, newStage: JourneyStage) => Promise<void>;
  onSendZaloIntervention: (customer: CustomerRecord, type: 'density_alert' | 'inbody_invite' | 'week3_cheer' | 'renewal_gift') => void;
  onNavigateToCustomerTab: (filterPersona?: string) => void;
}

type JourneyViewMode = 'emotion_curve' | 'pipeline' | '5w1h' | 'afrca' | 'mot';

export const AdminCustomerJourneyTab: React.FC<AdminCustomerJourneyTabProps> = ({
  customers,
  isDark,
  onUpdateCustomerStage,
  onSendZaloIntervention,
  onNavigateToCustomerTab
}) => {
  // State
  const [selectedPersona, setSelectedPersona] = useState<CustomerPersona>('general');
  const [activeViewMode, setActiveViewMode] = useState<JourneyViewMode>('emotion_curve');
  const [selectedTouchpoint, setSelectedTouchpoint] = useState<TouchpointItem | null>(TOUCHPOINTS_LIST[4]); // Default to InBody MoT
  const [selectedStage, setSelectedStage] = useState<JourneyStage | 'all'>('all');
  const [activeSimulationModal, setActiveSimulationModal] = useState<string | null>(null);
  const [pipelinePersonaFilter, setPipelinePersonaFilter] = useState<'all' | CustomerPersona>('all');
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);

  // Trigger brief toast
  const triggerToast = (msg: string) => {
    setActionSuccessToast(msg);
    setTimeout(() => setActionSuccessToast(null), 3500);
  };

  // Enrich customers with journey stage & matched persona
  const enrichedCustomers = useMemo(() => {
    return customers.map(c => {
      const enriched = enrichCustomerWithJourney(c);
      return {
        ...c,
        computedStage: c.journeyStage || enriched.stage,
        computedPersona: c.matchedPersona || enriched.persona,
        motAlert: enriched.motAlert,
        stageName: enriched.stageName
      };
    });
  }, [customers]);

  // Stage distribution counts
  const stageCounts = useMemo(() => {
    const counts: Record<JourneyStage, number> = {
      awareness: 0,
      consideration: 0,
      conversion: 0,
      service: 0,
      retention: 0
    };
    enrichedCustomers.forEach(c => {
      if (counts[c.computedStage] !== undefined) {
        counts[c.computedStage]++;
      }
    });
    return counts;
  }, [enrichedCustomers]);

  // Active persona profile
  const persona = PERSONA_PROFILES[selectedPersona];

  // Colors & Theme styling
  const textHeading = isDark ? 'text-white' : 'text-slate-900';
  const textSub = isDark ? 'text-slate-400' : 'text-slate-500';
  const cardBg = isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const subCardBg = isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-slate-50 border-slate-200';

  // SVG Emotion Curve generator
  const renderEmotionCurveSvg = () => {
    const width = 1100;
    const height = 260;
    const paddingLeft = 50;
    const paddingRight = 40;
    const paddingTop = 30;
    const paddingBottom = 60;
    const midY = (paddingTop + height - paddingBottom) / 2;
    const amp = (height - paddingBottom - paddingTop) / 2 - 12;

    const points = TOUCHPOINTS_LIST.map((tp, index) => {
      const x = paddingLeft + (index * (width - paddingLeft - paddingRight)) / (TOUCHPOINTS_LIST.length - 1);
      let emo = tp.emoDefault;
      if (selectedPersona === 'minh') emo = tp.emoMinh;
      if (selectedPersona === 'tuan') emo = tp.emoTuan;
      if (selectedPersona === 'huong') emo = tp.emoHuong;
      // y inverted: emo +2 is top, -2 is bottom
      const y = midY - (emo * amp) / 2;
      return { x, y, tp, emo };
    });

    // Generate smooth cubic bezier SVG path
    let pathD = `M ${points[0].x},${points[0].y} `;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i < points.length - 2 ? points[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      pathD += `C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y} `;
    }

    return (
      <div className="w-full overflow-x-auto pb-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[880px] h-auto select-none">
          <defs>
            <linearGradient id="curveGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FF7A1A" />
              <stop offset="35%" stopColor="#FFB05C" />
              <stop offset="65%" stopColor="#7AC88F" />
              <stop offset="100%" stopColor="#38BDF8" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Stage Background bands */}
          {JOURNEY_STAGES.map((stg, i) => {
            const startX = paddingLeft + (i * (width - paddingLeft - paddingRight)) / 5;
            const bandW = (width - paddingLeft - paddingRight) / 5;
            return (
              <g key={stg.id}>
                <rect 
                  x={startX} 
                  y={paddingTop - 10} 
                  width={bandW} 
                  height={height - paddingBottom + 20} 
                  fill={isDark ? (i % 2 === 0 ? '#1e293b' : '#0f172a') : (i % 2 === 0 ? '#f8fafc' : '#f1f5f9')} 
                  opacity={isDark ? 0.35 : 0.6}
                />
                <text 
                  x={startX + bandW / 2} 
                  y={paddingTop + 5} 
                  textAnchor="middle" 
                  className={`text-[11px] font-black uppercase tracking-wider ${isDark ? 'fill-slate-400' : 'fill-slate-600'}`}
                >
                  {stg.key} · {stg.titleVi}
                </text>
              </g>
            );
          })}

          {/* Baseline (0 Neutral) */}
          <line 
            x1={paddingLeft} 
            y1={midY} 
            x2={width - paddingRight} 
            y2={midY} 
            stroke={isDark ? '#475569' : '#cbd5e1'} 
            strokeDasharray="4 4" 
            strokeWidth="1.5" 
          />
          <text x={paddingLeft - 8} y={paddingTop + 14} textAnchor="end" className="text-[10px] font-bold fill-emerald-500">
            ▲ Hài lòng (+2)
          </text>
          <text x={paddingLeft - 8} y={midY + 3} textAnchor="end" className="text-[10px] font-semibold fill-slate-400">
            Trung tính (0)
          </text>
          <text x={paddingLeft - 8} y={height - paddingBottom - 8} textAnchor="end" className="text-[10px] font-bold fill-rose-500">
            ▼ Điểm đau (-2)
          </text>

          {/* Curve Path */}
          <path 
            d={pathD} 
            fill="none" 
            stroke="url(#curveGradient)" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            className="transition-all duration-500"
          />

          {/* Touchpoint Nodes */}
          {points.map(({ x, y, tp, emo }) => {
            const isSelected = selectedTouchpoint?.n === tp.n;
            const isPos = emo >= 0;
            const nodeColor = isPos ? '#10B981' : '#F43F5E';

            return (
              <g 
                key={tp.n} 
                className="cursor-pointer group"
                onClick={() => setSelectedTouchpoint(tp)}
              >
                {/* Connecting stem */}
                <line 
                  x1={x} 
                  y1={y} 
                  x2={x} 
                  y2={midY} 
                  stroke={isDark ? '#334155' : '#e2e8f0'} 
                  strokeWidth="1" 
                  strokeDasharray="2 2" 
                />

                {/* Pulsing ring for MoT or Selected */}
                {(tp.isMoT || isSelected) && (
                  <circle 
                    cx={x} 
                    cy={y} 
                    r={isSelected ? 18 : 15} 
                    fill="none" 
                    stroke={isSelected ? '#FF7A1A' : (tp.isMoT ? '#F59E0B' : nodeColor)} 
                    strokeWidth="2" 
                    strokeDasharray={tp.isMoT ? '3 3' : 'none'}
                    className="animate-pulse"
                  />
                )}

                {/* Node circle */}
                <circle 
                  cx={x} 
                  cy={y} 
                  r={isSelected ? 12 : 10} 
                  fill={nodeColor} 
                  stroke={isSelected ? '#ffffff' : (isDark ? '#0f172a' : '#ffffff')} 
                  strokeWidth="2.5" 
                  className="transition-transform group-hover:scale-125"
                />

                {/* Touchpoint number */}
                <text 
                  x={x} 
                  y={y + 3.5} 
                  textAnchor="middle" 
                  className="text-[10px] font-black fill-white pointer-events-none"
                >
                  {tp.n}
                </text>

                {/* Label below */}
                <text 
                  x={x} 
                  y={height - paddingBottom + 22 + (tp.n % 2 === 0 ? 14 : 0)} 
                  textAnchor="middle" 
                  className={`text-[9.5px] font-medium transition-colors ${
                    isSelected 
                      ? 'fill-orange-600 dark:fill-orange-400 font-bold' 
                      : (isDark ? 'fill-slate-400' : 'fill-slate-600')
                  }`}
                >
                  {tp.label.length > 16 ? tp.label.substring(0, 15) + '...' : tp.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {actionSuccessToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white shadow-lg text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionSuccessToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className={`p-5 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${cardBg}`}>
        <div>
          <div className="flex items-center space-x-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 flex items-center space-x-1">
              <Compass className="w-3 h-3 mr-1" />
              <span>Mô Hình ACCSR · 12 Điểm Chạm Thực Tế</span>
            </span>
            <span className={`text-xs font-semibold ${textSub}`}>
              Dữ liệu nghiên cứu The Shine Fitness & Yoga (154 Hoàng Hoa Thám)
            </span>
          </div>
          <h2 className={`text-xl sm:text-2xl font-black ${textHeading}`}>
            Hành Trình Chuyển Đổi Khách Hàng (Customer Journey)
          </h2>
          <p className={`text-xs mt-1 max-w-3xl ${textSub}`}>
            Bản đồ hành trình đa kênh từ lần đầu thấy quảng cáo 299K/tháng đến ngày gia hạn và giới thiệu bạn bè. 
            Theo dõi đường cảm xúc, gỡ bỏ 4 điểm đau cốt lõi và tối ưu hóa 3 khoảnh khắc quyết định (Moments of Truth).
          </p>
        </div>

        {/* View Mode Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          {[
            { id: 'emotion_curve', label: 'Đường Cảm Xúc 12 Điểm Chạm', icon: TrendingUp },
            { id: 'pipeline', label: 'Phễu Chuyển Đổi CRM', icon: Users },
            { id: '5w1h', label: 'Phân Tích 5W1H', icon: HelpCircle },
            { id: 'mot', label: '3 Khoảnh Khắc Quyết Định (MoT)', icon: Zap },
          ].map(m => {
            const Icon = m.icon;
            const active = activeViewMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setActiveViewMode(m.id as JourneyViewMode)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  active 
                    ? 'bg-orange-600 text-white shadow-xs' 
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5 Stage ACCSR Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {JOURNEY_STAGES.map((stg) => {
          const count = stageCounts[stg.id] || 0;
          const isFilterActive = selectedStage === stg.id;

          return (
            <button
              key={stg.id}
              onClick={() => setSelectedStage(selectedStage === stg.id ? 'all' : stg.id)}
              className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden group ${
                isFilterActive 
                  ? 'ring-2 ring-orange-500 shadow-md ' + cardBg 
                  : cardBg + ' hover:border-orange-500/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
                  {stg.key} · {stg.stepNum.split('/')[0]}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isFilterActive ? 'bg-orange-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {count} Hồ sơ
                </span>
              </div>
              <h4 className={`text-sm font-black ${textHeading}`}>
                {stg.titleVi}
              </h4>
              <p className={`text-[10.5px] line-clamp-1 mt-0.5 ${textSub}`}>
                {stg.description}
              </p>
              <div className="flex items-center space-x-1 mt-2">
                {stg.touchpointNumbers.map(n => (
                  <span 
                    key={n} 
                    className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-[9px] font-bold flex items-center justify-center text-slate-700 dark:text-slate-300"
                  >
                    {n}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Persona Selector Tabs */}
      <div className={`p-4 rounded-2xl border ${cardBg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <h3 className={`text-sm font-black ${textHeading}`}>
              Lựa Chọn Chân Dung Khách Hàng (Customer Persona)
            </h3>
            <span className={`text-xs ${textSub}`}>
              (Nhấn để xem đường cảm xúc và câu chuyện riêng biệt)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(['general', 'minh', 'tuan', 'huong'] as CustomerPersona[]).map(key => {
            const p = PERSONA_PROFILES[key];
            const isSelected = selectedPersona === key;

            return (
              <button
                key={key}
                onClick={() => setSelectedPersona(key)}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-start space-x-3 ${
                  isSelected 
                    ? 'border-orange-500 ring-2 ring-orange-500/20 ' + (isDark ? 'bg-orange-500/10' : 'bg-orange-50/60') 
                    : (isDark ? 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600' : 'bg-slate-50 border-slate-200 hover:border-slate-300')
                }`}
              >
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-base shrink-0 shadow-xs"
                  style={{ backgroundColor: p.colorHex }}
                >
                  {p.avatarLetter}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black truncate ${textHeading}`}>
                      {p.name}
                    </span>
                    {key !== 'general' && (
                      <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">
                        {p.age}t
                      </span>
                    )}
                  </div>
                  <p className={`text-[10.5px] line-clamp-1 mt-0.5 ${textSub}`}>
                    {p.badge}
                  </p>
                  <p className="text-[11px] italic line-clamp-1 mt-1 text-slate-500 dark:text-slate-400">
                    "{p.quote}"
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* VIEW 1: EMOTION CURVE & TOUCHPOINT DETAILS */}
      {activeViewMode === 'emotion_curve' && (
        <div className="space-y-6">
          {/* Emotion Curve Chart Box */}
          <div className={`p-5 rounded-2xl border ${cardBg}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: persona.colorHex }} />
                  <h3 className={`text-base font-black ${textHeading}`}>
                    Đường Cảm Xúc Của {persona.name} Qua 12 Điểm Chạm (ACCSR)
                  </h3>
                </div>
                <p className={`text-xs mt-0.5 ${textSub}`}>
                  Nhấp vào từng điểm chạm từ ① đến ⑫ để xem chi tiết điểm đau, giải pháp khắc phục và kịch bản can thiệp.
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center space-x-4 text-xs">
                <span className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Tích cực</span>
                </span>
                <span className="flex items-center space-x-1.5 text-rose-600 dark:text-rose-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Tiêu cực (Điểm đau)</span>
                </span>
                <span className="flex items-center space-x-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-amber-500" />
                  <span>Khoảnh khắc MoT</span>
                </span>
              </div>
            </div>

            {/* Render Curve */}
            {renderEmotionCurveSvg()}
          </div>

          {/* Selected Touchpoint Deep-Dive Card */}
          {selectedTouchpoint && (
            <div className={`p-5 rounded-2xl border border-l-4 transition-all ${cardBg} ${
              selectedTouchpoint.emoDefault >= 0 ? 'border-l-emerald-500' : 'border-l-rose-500'
            }`}>
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-orange-600 text-white font-black text-xs flex items-center justify-center">
                      {selectedTouchpoint.n}
                    </span>
                    <h3 className={`text-base sm:text-lg font-black ${textHeading}`}>
                      {selectedTouchpoint.label}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      selectedTouchpoint.channel === 'Owned' ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20' :
                      selectedTouchpoint.channel === 'Paid' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' :
                      selectedTouchpoint.channel === 'Earned' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    }`}>
                      Kênh: {selectedTouchpoint.channel}
                    </span>
                    {selectedTouchpoint.isMoT && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        ⚡ {selectedTouchpoint.motLabel}
                      </span>
                    )}
                  </div>

                  <p className={`text-xs ${textHeading} leading-relaxed`}>
                    <strong>Mô tả:</strong> {selectedTouchpoint.description}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                      <div className="flex items-center space-x-1.5 text-xs font-black text-rose-600 dark:text-rose-400 mb-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Điểm Đau Cốt Lõi (Pain Point)</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300">
                        {selectedTouchpoint.painPoint}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center space-x-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400 mb-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Giải Pháp & Cơ Hội Chuyển Đổi (Opportunity)</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300">
                        {selectedTouchpoint.solution}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons for this Touchpoint */}
                <div className="flex flex-wrap lg:flex-col gap-2 shrink-0">
                  {selectedTouchpoint.n === 3 && (
                    <button
                      onClick={() => setActiveSimulationModal('maps')}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-1.5 transition-all shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem Google Reviews 4.9★</span>
                    </button>
                  )}
                  {(selectedTouchpoint.n === 5 || selectedTouchpoint.n === 11) && (
                    <button
                      onClick={() => setActiveSimulationModal('inbody')}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1.5 transition-all shadow-xs"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>Xem Báo Cáo InBody 270</span>
                    </button>
                  )}
                  {selectedTouchpoint.n === 8 && (
                    <button
                      onClick={() => setActiveSimulationModal('zalo_density')}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white flex items-center space-x-1.5 transition-all shadow-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Mô Phỏng Zalo Mật Độ</span>
                    </button>
                  )}
                  {selectedTouchpoint.n === 6 && (
                    <button
                      onClick={() => setActiveSimulationModal('workout_plan')}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white flex items-center space-x-1.5 transition-all shadow-xs"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Xem Lộ Trình 3 Buổi/Tuần</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: CRM CONVERSION PIPELINE */}
      {activeViewMode === 'pipeline' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${cardBg}`}>
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-bold ${textSub}`}>Lọc Theo Persona:</span>
              <div className="flex flex-wrap gap-1">
                {(['all', 'minh', 'tuan', 'huong'] as const).map(pKey => (
                  <button
                    key={pKey}
                    onClick={() => setPipelinePersonaFilter(pKey)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      pipelinePersonaFilter === pKey
                        ? 'bg-orange-600 text-white'
                        : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {pKey === 'all' ? 'Tất cả' : PERSONA_PROFILES[pKey].name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs font-bold">
              <span className={textSub}>Tổng số hồ sơ trong phễu:</span>
              <span className="text-orange-600 dark:text-orange-400 font-black">{enrichedCustomers.length}</span>
            </div>
          </div>

          {/* 5 Column Kanban Pipeline */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {JOURNEY_STAGES.map(stg => {
              const columnCustomers = enrichedCustomers.filter(c => {
                if (c.computedStage !== stg.id) return false;
                if (pipelinePersonaFilter !== 'all' && c.computedPersona !== pipelinePersonaFilter) return false;
                return true;
              });

              return (
                <div 
                  key={stg.id}
                  className={`p-3 rounded-2xl border flex flex-col h-full min-h-[520px] ${
                    isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
                        {stg.key} · {stg.title}
                      </span>
                      <h4 className={`text-xs font-black ${textHeading}`}>
                        {stg.titleVi}
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                      {columnCustomers.length}
                    </span>
                  </div>

                  {/* Customer Cards */}
                  <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[580px] pr-1">
                    {columnCustomers.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-400 italic">
                        Chưa có hồ sơ trong giai đoạn này
                      </div>
                    ) : (
                      columnCustomers.slice(0, 15).map(cust => {
                        const matchedP = PERSONA_PROFILES[cust.computedPersona || 'general'];

                        return (
                          <div
                            key={cust.id}
                            className={`p-3 rounded-xl border transition-all text-left space-y-2 ${cardBg} hover:shadow-md hover:border-orange-500/50`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h5 className={`text-xs font-black ${textHeading}`}>
                                  {cust.fullName}
                                </h5>
                                <div className="flex items-center space-x-1.5 mt-0.5">
                                  <span className="text-[10px] font-mono text-slate-400">
                                    {cust.memberCode || 'LEAD'}
                                  </span>
                                  {cust.phone && (
                                    <span className="text-[10px] text-slate-500">
                                      · {cust.phone}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span 
                                className="px-1.5 py-0.5 rounded text-[9px] font-black text-white"
                                style={{ backgroundColor: matchedP.colorHex }}
                              >
                                {matchedP.avatarLetter}
                              </span>
                            </div>

                            {/* Status & Package */}
                            <div className="flex flex-wrap gap-1 text-[9.5px]">
                              {cust.packageCode && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                                  {cust.packageCode}
                                </span>
                              )}
                              <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold">
                                {cust.status}
                              </span>
                            </div>

                            {/* MoT Alert if any */}
                            {cust.motAlert && (
                              <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[9.5px] text-amber-700 dark:text-amber-300 leading-tight">
                                ⚠ {cust.motAlert}
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
                              {/* Stage Transition Selector */}
                              <select
                                value={cust.computedStage}
                                onChange={(e) => {
                                  onUpdateCustomerStage(cust, e.target.value as JourneyStage);
                                  triggerToast(`Đã chuyển ${cust.fullName} sang ${e.target.value}`);
                                }}
                                className="text-[10px] font-bold py-1 px-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 outline-none"
                              >
                                <option value="awareness">1. Nhận thức</option>
                                <option value="consideration">2. Suy xét</option>
                                <option value="conversion">3. Chuyển đổi</option>
                                <option value="service">4. Chăm sóc</option>
                                <option value="retention">5. Giữ chân</option>
                              </select>

                              {/* Trigger Intervention */}
                              <button
                                onClick={() => {
                                  if (cust.computedStage === 'service') {
                                    onSendZaloIntervention(cust, 'density_alert');
                                    triggerToast(`Đã gửi cảnh báo mật độ Zalo cho ${cust.fullName}`);
                                  } else if (cust.computedStage === 'consideration') {
                                    onSendZaloIntervention(cust, 'inbody_invite');
                                    triggerToast(`Đã gửi lịch hẹn đo InBody cho ${cust.fullName}`);
                                  } else {
                                    onSendZaloIntervention(cust, 'renewal_gift');
                                    triggerToast(`Đã gửi ưu đãi Early Bird cho ${cust.fullName}`);
                                  }
                                }}
                                title="Kích hoạt hành động can thiệp Zalo / Email"
                                className="p-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500 text-orange-600 hover:text-white transition-colors"
                              >
                                <Send className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: 5W1H ANALYSIS */}
      {activeViewMode === '5w1h' && (
        <div className="space-y-5">
          <div className={`p-5 rounded-2xl border ${cardBg}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <h3 className={`text-base font-black ${textHeading}`}>
                  Khung Phân Tích 5W1H — Chân Dung {persona.name}
                </h3>
              </div>
              <span className={`text-xs ${textSub}`}>
                Định vị nhu cầu cốt lõi trước khi xây dựng điểm chạm
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FIVE_W1H_MATRIX[selectedPersona].map((item) => (
                <div key={item.word} className={`p-4 rounded-xl border ${subCardBg} space-y-2`}>
                  <div className="flex items-center space-x-2">
                    <span 
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs"
                      style={{ backgroundColor: persona.colorHex }}
                    >
                      {item.letter}
                    </span>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        {item.word}
                      </span>
                      <h4 className={`text-xs font-black ${textHeading}`}>
                        {item.q}
                      </h4>
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pt-1">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: MOMENTS OF TRUTH (MoT) */}
      {activeViewMode === 'mot' && (
        <div className="space-y-4">
          <div className={`p-5 rounded-2xl border ${cardBg}`}>
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <h3 className={`text-base font-black ${textHeading}`}>
                Ba Khoảnh Khắc Quyết Định Cả Hành Trình (Moments of Truth)
              </h3>
            </div>
            <p className={`text-xs ${textSub} max-w-3xl mb-6`}>
              Nếu chỉ được đầu tư vào 3 điểm trong phòng tập, hãy tập trung vào 3 khoảnh khắc này. Chúng nằm tại các đỉnh và đáy cảm xúc — nơi khách hàng quyết định <strong>mua, ở lại hay rời bỏ</strong>.
            </p>

            <div className="space-y-4">
              {MOMENTS_OF_TRUTH.map(mot => (
                <div 
                  key={mot.code}
                  className={`p-5 rounded-2xl border transition-all ${subCardBg} hover:border-amber-500/50`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center space-x-3">
                      <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                        {mot.code}
                      </span>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          {mot.phase} · {mot.touchpoint}
                        </span>
                        <h4 className={`text-base font-black ${textHeading}`}>
                          {mot.title}
                        </h4>
                      </div>
                    </div>
                  </div>

                  <p className={`text-xs mb-4 ${textSub} leading-relaxed`}>
                    <strong>Bản chất tâm lý:</strong> {mot.why}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">
                        1. Thiết Kế Trải Nghiệm
                      </span>
                      <p className="text-xs text-slate-700 dark:text-slate-300">
                        {mot.actions.experience}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
                        2. Tối Ưu Chuyển Đổi
                      </span>
                      <p className="text-xs text-slate-700 dark:text-slate-300">
                        {mot.actions.conversion}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        3. Chỉ Số Đo Lường (KPI)
                      </span>
                      <p className="text-xs text-slate-700 dark:text-slate-300">
                        {mot.actions.kpi}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SIMULATION MODALS FOR POPUP INTERACTIONS */}
      {activeSimulationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className={`w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl border p-5 space-y-4 ${cardBg} shadow-2xl`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className={`text-base font-black ${textHeading}`}>
                {activeSimulationModal === 'maps' && '⭐ Trải Nghiệm Đọc Review Google Maps Thực Tế'}
                {activeSimulationModal === 'inbody' && '📊 Báo Cáo Đo InBody 270 Chuyên Dụng'}
                {activeSimulationModal === 'zalo_density' && '💬 Cảnh Báo Zalo Mật Độ Từng Khu Thời Gian Thực'}
                {activeSimulationModal === 'workout_plan' && '🏋️ Lộ Trình Tập Luyện 45 Phút Gợi Ý Cho Minh'}
              </h3>
              <button 
                onClick={() => setActiveSimulationModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            {activeSimulationModal === 'maps' && (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-blue-600 dark:text-blue-400">The Shine Fitness & Yoga</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500 text-white font-black">4.9 ★★★★★ (199 Đánh giá)</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">154 Hoàng Hoa Thám, P.12, Tân Bình, TP.HCM</p>
                  <p className="text-slate-700 dark:text-slate-200 italic">"Bất ngờ là rất tốt! Giá cả hợp lý, có vé tập ngày linh hoạt. HLV nhiệt tình và chu đáo."</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300">S'Life Gym (Đối thủ cùng đường)</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500 text-white font-bold">4.1 ★★★★☆ (568 Đánh giá)</span>
                  </div>
                  <p className="text-slate-500">126 Hoàng Hoa Thám, Tân Bình</p>
                  <p className="text-slate-500 dark:text-slate-400 italic">"Phòng rộng nhưng giá báo không nhất quán giữa các ca trực, hay bị mời chào gói dài hạn."</p>
                </div>
                <div className="p-3 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[11px]">
                  💡 <strong>Insight chuyển đổi:</strong> Khách hàng lựa chọn The Shine vì đánh giá 4.9★ minh bạch, không ép giá.
                </div>
              </div>
            )}

            {activeSimulationModal === 'inbody' && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] uppercase text-slate-400">Cân nặng</span>
                    <h4 className="text-lg font-black text-orange-600">81.5 kg <span className="text-xs text-emerald-500 font-bold">(-10.5kg)</span></h4>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] uppercase text-slate-400">Tỷ lệ mỡ PBF</span>
                    <h4 className="text-lg font-black text-emerald-500">20.6% <span className="text-xs text-slate-400">(từ 31.4%)</span></h4>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] uppercase text-slate-400">Khối lượng cơ SMM</span>
                    <h4 className="text-lg font-black text-sky-500">32.4 kg <span className="text-xs text-emerald-500 font-bold">(+2.6kg)</span></h4>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] uppercase text-slate-400">Mỡ nội tạng</span>
                    <h4 className="text-lg font-black text-emerald-600">Mức 9 <span className="text-xs text-slate-400">(từ mức 14)</span></h4>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px]">
                  🏆 <strong>Thành tựu 90 ngày của Tuấn:</strong> Điểm InBody tăng từ 54 lên 78 điểm. Đây là bằng chứng giữ chân hội viên tốt nhất.
                </div>
              </div>
            )}

            {activeSimulationModal === 'zalo_density' && (
              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 space-y-2">
                  <div className="flex items-center space-x-1.5 text-sky-600 font-black">
                    <Send className="w-4 h-4" />
                    <span>Zalo OA: The Shine Fitness & Yoga (19:00)</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200">
                    ⚠ Chào Ngọc Minh! <strong>Khu tạ tự do hiện đang đông (95% công suất)</strong>.
                  </p>
                  <div className="space-y-1.5 py-1">
                    <div className="flex justify-between text-[11px]">
                      <span>Khu Tạ Tay & Giàn Kháng Lực:</span>
                      <span className="font-bold text-rose-500">95% (Đông)</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full w-[95%]" />
                    </div>

                    <div className="flex justify-between text-[11px]">
                      <span>Máy Chạy Treadmill & Cardio:</span>
                      <span className="font-bold text-emerald-500">30% (Rất thoáng)</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full w-[30%]" />
                    </div>

                    <div className="flex justify-between text-[11px]">
                      <span>Phòng Xông Hơi Thảo Dược:</span>
                      <span className="font-bold text-emerald-500">20% (Sẵn sàng)</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full w-[20%]" />
                    </div>
                  </div>
                  <p className="text-emerald-700 dark:text-emerald-300 font-medium">
                    💡 <strong>Gợi ý:</strong> Minh nên chạy bộ 15 phút tại máy Cardio và xông hơi thư giãn trước, khu tạ sẽ hạ nhiệt vào lúc 19h35 nhé!
                  </p>
                </div>
              </div>
            )}

            {activeSimulationModal === 'workout_plan' && (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 space-y-2">
                  <h4 className="font-black text-sm text-orange-600 dark:text-orange-400">Giáo Án 45 Phút Tối Ưu Cho Dân Văn Phòng</h4>
                  <ul className="space-y-1.5 list-disc pl-4 text-slate-700 dark:text-slate-300">
                    <li><strong>00–10 Phút:</strong> Khởi động khớp cổ vai gáy & chạy dốc nhẹ trên máy Treadmill.</li>
                    <li><strong>10–30 Phút:</strong> 3 hiệp Lat Pulldown (kéo xô), Dumbbell Shoulder Press, Face Pulls giải tỏa co cứng cơ lưng.</li>
                    <li><strong>30–45 Phút:</strong> Giãn cơ toàn thân & 10 phút xông hơi thảo dược thải độc.</li>
                  </ul>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveSimulationModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
