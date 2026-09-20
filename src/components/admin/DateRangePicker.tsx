import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronDown, 
  X, 
  Check, 
  RotateCcw, 
  ArrowRight,
  Clock,
  Sparkles
} from 'lucide-react';

export interface DateRange {
  startDate: string; // 'YYYY-MM-DD' or ''
  endDate: string;   // 'YYYY-MM-DD' or ''
  presetKey?: string; // 'all' | '7d' | '30d' | 'this_month' | 'last_month' | 'this_quarter' | '2025' | '2024' | 'custom'
  label?: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  isDark: boolean;
  className?: string;
}

interface PresetOption {
  key: string;
  label: string;
  sublabel?: string;
  getRange: () => { startDate: string; endDate: string };
}

// Format helper to YYYY-MM-DD
const formatDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Format for display (DD/MM/YYYY)
export const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  isDark,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStart, setTempStart] = useState(value.startDate || '');
  const [tempEnd, setTempEnd] = useState(value.endDate || '');
  const [activePreset, setActivePreset] = useState<string>(value.presetKey || 'all');
  const containerRef = useRef<HTMLDivElement>(null);

  // Synchronize internal state when value prop changes
  useEffect(() => {
    setTempStart(value.startDate || '');
    setTempEnd(value.endDate || '');
    setActivePreset(value.presetKey || 'all');
  }, [value.startDate, value.endDate, value.presetKey]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Defined Presets for The Shine Fitness analytics
  const presets: PresetOption[] = [
    {
      key: 'all',
      label: 'Toàn bộ dữ liệu',
      sublabel: 'Tất cả 850+ hội viên',
      getRange: () => ({ startDate: '', endDate: '' })
    },
    {
      key: '7d',
      label: '7 ngày gần nhất',
      sublabel: 'Tuần vận hành vừa qua',
      getRange: () => {
        // Base anchor date around 2025/2026
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 6);
        return { startDate: formatDate(start), endDate: formatDate(end) };
      }
    },
    {
      key: '30d',
      label: '30 ngày gần nhất',
      sublabel: 'Tháng hoạt động mới nhất',
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 29);
        return { startDate: formatDate(start), endDate: formatDate(end) };
      }
    },
    {
      key: 'this_month',
      label: 'Tháng này',
      sublabel: 'Từ đầu tháng đến nay',
      getRange: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { startDate: formatDate(start), endDate: formatDate(now) };
      }
    },
    {
      key: '2025',
      label: 'Năm hoạt động 2025',
      sublabel: '01/01/2025 – 31/12/2025',
      getRange: () => ({ startDate: '2025-01-01', endDate: '2025-12-31' })
    },
    {
      key: 'recent_6m',
      label: '6 tháng cao điểm 2025',
      sublabel: '01/06/2025 – 31/12/2025',
      getRange: () => ({ startDate: '2025-06-01', endDate: '2025-12-31' })
    },
    {
      key: '2024',
      label: 'Năm hoạt động 2024',
      sublabel: 'Giai đoạn khai trương',
      getRange: () => ({ startDate: '2024-01-01', endDate: '2024-12-31' })
    }
  ];

  const handleSelectPreset = (preset: PresetOption) => {
    setActivePreset(preset.key);
    const range = preset.getRange();
    setTempStart(range.startDate);
    setTempEnd(range.endDate);

    if (preset.key !== 'custom') {
      onChange({
        startDate: range.startDate,
        endDate: range.endDate,
        presetKey: preset.key,
        label: preset.label
      });
      setIsOpen(false);
    }
  };

  const handleApplyCustom = () => {
    let start = tempStart;
    let end = tempEnd;

    // Swap if inverted
    if (start && end && start > end) {
      const t = start;
      start = end;
      end = t;
      setTempStart(start);
      setTempEnd(end);
    }

    const label = start && end 
      ? `${formatDisplayDate(start)} – ${formatDisplayDate(end)}`
      : start 
        ? `Từ ${formatDisplayDate(start)}`
        : end 
          ? `Đến ${formatDisplayDate(end)}`
          : 'Toàn bộ thời gian';

    onChange({
      startDate: start,
      endDate: end,
      presetKey: 'custom',
      label
    });
    setActivePreset('custom');
    setIsOpen(false);
  };

  const handleReset = () => {
    setTempStart('');
    setTempEnd('');
    setActivePreset('all');
    onChange({
      startDate: '',
      endDate: '',
      presetKey: 'all',
      label: 'Toàn bộ dữ liệu'
    });
    setIsOpen(false);
  };

  // Human-readable trigger label
  const getTriggerLabel = () => {
    if (value.presetKey === 'all' || (!value.startDate && !value.endDate)) {
      return 'Toàn bộ thời gian';
    }
    if (value.label) {
      return value.label;
    }
    if (value.startDate && value.endDate) {
      return `${formatDisplayDate(value.startDate)} – ${formatDisplayDate(value.endDate)}`;
    }
    if (value.startDate) {
      return `Từ ${formatDisplayDate(value.startDate)}`;
    }
    if (value.endDate) {
      return `Đến ${formatDisplayDate(value.endDate)}`;
    }
    return 'Khoảng thời gian';
  };

  const isFiltered = Boolean((value.startDate || value.endDate) && value.presetKey !== 'all');

  // Calculate day difference for preview
  const dayCount = (tempStart && tempEnd) ? Math.max(1, Math.round((new Date(tempEnd).getTime() - new Date(tempStart).getTime()) / (1000 * 60 * 60 * 24)) + 1) : null;

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <div className="flex items-center space-x-1.5">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-bold font-sans transition-all cursor-pointer shadow-2xs ${
            isFiltered
              ? 'bg-orange-500/10 border-orange-500/40 text-orange-600 dark:text-orange-400 ring-2 ring-orange-500/20'
              : isDark
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:border-slate-600'
                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
          }`}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
        >
          <CalendarIcon className={`w-3.5 h-3.5 shrink-0 ${isFiltered ? 'text-orange-500' : 'text-slate-400'}`} />
          <span className="truncate max-w-[190px] sm:max-w-[240px]">
            {getTriggerLabel()}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Quick clear button when a date filter is active */}
        {isFiltered && (
          <button
            type="button"
            onClick={handleReset}
            title="Đặt lại toàn bộ thời gian"
            className={`p-1.5 rounded-xl border transition-colors cursor-pointer text-slate-400 hover:text-rose-500 ${
              isDark ? 'bg-slate-800 border-slate-700 hover:border-rose-900/50' : 'bg-white border-slate-200 hover:border-rose-200'
            }`}
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Popover Dropdown */}
      {isOpen && (
        <div 
          className={`absolute right-0 sm:right-auto sm:left-0 mt-2 z-50 w-[320px] sm:w-[380px] rounded-2xl border shadow-2xl p-4 transition-all font-sans ${
            isDark 
              ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-black/60' 
              : 'bg-white border-slate-200 text-slate-900 shadow-slate-200/80'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-heading font-black uppercase tracking-wider text-orange-500">
                Bộ Lọc Thời Gian Phân Tích
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Presets Grid */}
          <div className="mb-4">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Lựa chọn nhanh (Presets)
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {presets.map((preset) => {
                const isSelected = activePreset === preset.key;
                return (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`flex items-start justify-between p-2 rounded-xl text-left text-xs transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-orange-600 text-white border-orange-600 shadow-xs font-bold'
                        : isDark
                          ? 'bg-slate-800/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                          : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="truncate">
                      <div className="font-semibold truncate">{preset.label}</div>
                      {preset.sublabel && (
                        <div className={`text-[10px] truncate ${isSelected ? 'text-orange-100' : 'text-slate-400'}`}>
                          {preset.sublabel}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-1 mt-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Date Inputs Section */}
          <div className={`p-3 rounded-xl border mb-3 ${
            isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-orange-500" /> Tùy chỉnh ngày chính xác
              </span>
              {dayCount !== null && (
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500">
                  {dayCount} ngày
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                  Từ ngày (Start)
                </label>
                <input
                  type="date"
                  value={tempStart}
                  onChange={(e) => {
                    setTempStart(e.target.value);
                    setActivePreset('custom');
                  }}
                  className={`w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-white'
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                  Đến ngày (End)
                </label>
                <input
                  type="date"
                  value={tempEnd}
                  onChange={(e) => {
                    setTempEnd(e.target.value);
                    setActivePreset('custom');
                  }}
                  className={`w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-white'
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleReset}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <RotateCcw className="w-3 h-3" />
              <span>Đặt lại</span>
            </button>

            <button
              type="button"
              onClick={handleApplyCustom}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <span>Áp dụng bộ lọc</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
