import React, { useState, useMemo } from 'react';
import { 
  Users, 
  MapPin, 
  UserCheck, 
  Zap, 
  Filter, 
  Search, 
  Send, 
  Download, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  FileSpreadsheet,
  Info,
  ChevronRight,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { CustomerRecord } from '../../types';
import { 
  PK_SEGMENTS_LIST, 
  PKSegmentCode, 
  getCustomerPKSegment 
} from '../../data/pkSegmentsData';

interface AdminPKSegmentsTabProps {
  customers: CustomerRecord[];
  isDark: boolean;
  onNavigateToCustomers: (pkFilter?: string) => void;
  onSendZaloIntervention?: (customer: CustomerRecord, note: string) => void;
  onToast?: (msg: string) => void;
}

export const AdminPKSegmentsTab: React.FC<AdminPKSegmentsTabProps> = ({
  customers,
  isDark,
  onNavigateToCustomers,
  onSendZaloIntervention,
  onToast
}) => {
  const [selectedPK, setSelectedPK] = useState<PKSegmentCode | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeToast, setActiveToast] = useState<string | null>(null);

  const showLocalToast = (msg: string) => {
    if (onToast) {
      onToast(msg);
    } else {
      setActiveToast(msg);
      setTimeout(() => setActiveToast(null), 3000);
    }
  };

  // Enrich customers with computed PK Segment
  const enrichedCustomers = useMemo(() => {
    return customers.map(c => ({
      ...c,
      computedPK: getCustomerPKSegment(c)
    }));
  }, [customers]);

  // Counts per segment
  const counts = useMemo(() => {
    const map: Record<PKSegmentCode, number> = {
      PK01: 0,
      PK02: 0,
      PK03: 0,
      PK04: 0
    };
    enrichedCustomers.forEach(c => {
      if (map[c.computedPK] !== undefined) {
        map[c.computedPK]++;
      }
    });
    return map;
  }, [enrichedCustomers]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return enrichedCustomers.filter(c => {
      if (selectedPK !== 'all' && c.computedPK !== selectedPK) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const nameMatch = c.fullName?.toLowerCase().includes(q);
        const phoneMatch = c.phone?.toLowerCase().includes(q);
        const codeMatch = c.memberCode?.toLowerCase().includes(q);
        const goalMatch = c.trainingGoal?.toLowerCase().includes(q);
        return nameMatch || phoneMatch || codeMatch || goalMatch;
      }
      return true;
    });
  }, [enrichedCustomers, selectedPK, searchTerm]);

  // Export CSV Report for PK Segments
  const handleExportReport = () => {
    try {
      const csvRows: string[] = [];
      
      // Header for Summary
      csvRows.push('BÁO CÁO PHÂN KHÚC KHÁCH HÀNG PK01-PK04 (THE SHINE FITNESS)');
      csvRows.push(`Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}`);
      csvRows.push('');
      csvRows.push('--- BẢNG 6.2 SÀNG LỌC VÀ PHÂN LOẠI PK01-PK04 ---');
      csvRows.push('Mã PK,Chân dung đề xuất,Tín hiệu chính,Số lượng khách hàng,Tỷ lệ %');

      PK_SEGMENTS_LIST.forEach(seg => {
        const count = counts[seg.code] || 0;
        const pct = enrichedCustomers.length > 0 ? ((count / enrichedCustomers.length) * 100).toFixed(1) : '0';
        const safePersona = `"${seg.personaName.replace(/"/g, '""')}"`;
        const safeSignal = `"${seg.primarySignal.replace(/"/g, '""')}"`;
        csvRows.push(`${seg.code},${safePersona},${safeSignal},${count},${pct}%`);
      });

      csvRows.push('');
      csvRows.push('--- DANH SÁCH CHI TIẾT HỘI VIÊN THEO PHÂN KHÚC ---');
      csvRows.push('Mã HV,Họ và tên,Số điện thoại,Phân khúc PK,Gói quan tâm / Nhu cầu,Mục tiêu tập luyện,Chân dung PK');

      const targetMembers = selectedPK === 'all' ? enrichedCustomers : filteredMembers;

      targetMembers.forEach(m => {
        const segInfo = PK_SEGMENTS_LIST.find(s => s.code === m.computedPK) || PK_SEGMENTS_LIST[0];
        const code = m.memberCode || m.id;
        const name = `"${(m.fullName || '').replace(/"/g, '""')}"`;
        const phone = `"${m.phone || ''}"`;
        const pk = m.computedPK;
        const pkg = `"${(m.packageInterested || m.packageCode || 'Gói Tiêu Chuẩn').replace(/"/g, '""')}"`;
        const goal = `"${(m.trainingGoal || 'Duy trì vóc dáng & sức khỏe').replace(/"/g, '""')}"`;
        const persona = `"${segInfo.personaName.replace(/"/g, '""')}"`;

        csvRows.push(`${code},${name},${phone},${pk},${pkg},${goal},${persona}`);
      });

      const csvContent = '\uFEFF' + csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Bao_Cao_Phan_Khuc_Khach_Hang_PK01_PK04_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showLocalToast('✓ Đã tải xuống file CSV Báo cáo Phân khúc thành công!');
    } catch (err) {
      console.error('Lỗi xuất báo cáo:', err);
      showLocalToast('❌ Có lỗi khi tạo file xuất báo cáo.');
    }
  };

  const cardBg = isDark ? 'bg-[#151C2C] border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const textHeading = isDark ? 'text-white' : 'text-slate-900';
  const textSub = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Alert */}
      {activeToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl font-bold text-xs flex items-center space-x-2 animate-bounce">
          <CheckCircle2 size={16} />
          <span>{activeToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className={`p-5 rounded-2xl border ${cardBg} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-black uppercase bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
              Quy Chuẩn Sàng Lọc 6.2
            </span>
            <span className={`text-xs ${textSub}`}>Bổ sung phân loại chuẩn website</span>
          </div>
          <h2 className={`text-xl font-black font-heading mt-1.5 ${textHeading}`}>
            Sàng Lọc & Phân Loại Khách Hàng (PK01 – PK04)
          </h2>
          <p className={`text-xs mt-1 max-w-3xl ${textSub}`}>
            Phân khúc hội viên dựa trên vị trí địa lý, trải nghiệm tập luyện, nhu cầu lớp nhóm và mong muốn tiện ích cá nhân để tối ưu kịch bản chuyển đổi & chăm sóc.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleExportReport}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center space-x-2 transition-all cursor-pointer ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
            }`}
          >
            <Download size={14} />
            <span>Xuất Báo Cáo PK</span>
          </button>
          <button
            onClick={() => onNavigateToCustomers()}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-md transition-all flex items-center space-x-2"
          >
            <Users size={14} />
            <span>Xem Danh Sách CRM</span>
          </button>
        </div>
      </div>

      {/* TABLE 6.2 EXACT REPLICA FROM IMAGE */}
      <div className={`p-5 rounded-2xl border ${cardBg}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
            <h3 className={`text-sm font-black uppercase tracking-wide ${textHeading}`}>
              6.2. Sàng lọc và phân loại PK01–PK04
            </h3>
          </div>
          <span className="text-[11px] font-medium text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20">
            Tổng {enrichedCustomers.length} Khách Hàng
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={isDark ? 'bg-slate-900/80 text-slate-300' : 'bg-slate-100/80 text-slate-700'}>
                <th className="py-3 px-4 font-black border-b border-slate-200 dark:border-slate-800 w-20">Mã</th>
                <th className="py-3 px-4 font-black border-b border-slate-200 dark:border-slate-800 w-64">Chân dung đề xuất</th>
                <th className="py-3 px-4 font-black border-b border-slate-200 dark:border-slate-800">Tín hiệu chính</th>
                <th className="py-3 px-4 font-black border-b border-slate-200 dark:border-slate-800 text-center w-36">Hội viên thực tế</th>
                <th className="py-3 px-4 font-black border-b border-slate-200 dark:border-slate-800 text-right w-36">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {PK_SEGMENTS_LIST.map(seg => {
                const count = counts[seg.code] || 0;
                const pct = enrichedCustomers.length > 0 ? Math.round((count / enrichedCustomers.length) * 100) : 0;
                const isSelected = selectedPK === seg.code;

                return (
                  <tr 
                    key={seg.code} 
                    className={`transition-colors cursor-pointer ${
                      isSelected 
                        ? (isDark ? 'bg-orange-500/15' : 'bg-orange-50/80') 
                        : (isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50')
                    }`}
                    onClick={() => setSelectedPK(isSelected ? 'all' : seg.code)}
                  >
                    <td className="py-3.5 px-4 font-black">
                      <span 
                        className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black font-mono border ${seg.badgeBgLight} ${seg.badgeBgDark}`}
                      >
                        {seg.code}
                      </span>
                    </td>
                    <td className={`py-3.5 px-4 font-bold ${textHeading}`}>
                      {seg.personaName}
                    </td>
                    <td className={`py-3.5 px-4 ${textSub}`}>
                      {seg.primarySignal}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="font-black text-sm text-orange-600 dark:text-orange-400">
                        {count} khách
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        ({pct}% tổng CRM)
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPK(seg.code);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                          isSelected
                            ? 'bg-orange-600 text-white border-orange-600'
                            : (isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800')
                        }`}
                      >
                        {isSelected ? 'Đang Lọc' : 'Xem Lọc'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4 CARDS MATRIX */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PK_SEGMENTS_LIST.map(seg => {
          const count = counts[seg.code] || 0;
          const isSelected = selectedPK === seg.code;

          return (
            <div 
              key={seg.code}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                isSelected 
                  ? 'ring-2 ring-orange-500 border-orange-500 ' + (isDark ? 'bg-orange-500/10' : 'bg-orange-50/60') 
                  : cardBg
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span 
                    className="px-2.5 py-1 rounded-lg text-xs font-black font-mono text-white shadow-xs"
                    style={{ backgroundColor: seg.colorHex }}
                  >
                    {seg.code}
                  </span>
                  <span className={`text-xs font-bold ${textSub}`}>
                    {count} hội viên
                  </span>
                </div>

                <h4 className={`text-sm font-black ${textHeading}`}>
                  {seg.personaName}
                </h4>

                <p className={`text-xs mt-2 line-clamp-2 ${textSub}`}>
                  {seg.primarySignal}
                </p>

                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 text-[11px]">
                  <div>
                    <span className="font-bold text-slate-500 dark:text-slate-400">Gói tập phù hợp:</span>
                    <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-slate-700 dark:text-slate-300 font-medium">
                      {seg.preferredPackages.map((pkg, idx) => (
                        <li key={idx} className="truncate">{pkg}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="font-bold text-slate-500 dark:text-slate-400">Động lực quyết định:</span>
                    <p className="text-orange-600 dark:text-orange-400 font-medium line-clamp-2 mt-0.5">
                      {seg.keyMotivator}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => {
                    setSelectedPK(seg.code);
                    showLocalToast(`Đã lọc danh sách theo phân khúc ${seg.code}`);
                  }}
                  className={`text-xs font-bold flex items-center space-x-1 transition-colors ${
                    isSelected ? 'text-orange-600 dark:text-orange-400 font-black' : 'text-slate-600 dark:text-slate-300 hover:text-orange-500'
                  }`}
                >
                  <span>{isSelected ? 'Đang lọc theo mã' : 'Lọc danh sách'}</span>
                  <ChevronRight size={14} />
                </button>

                <button
                  onClick={() => showLocalToast(`✓ Đã kích hoạt chiến dịch Zalo OA cho phân khúc ${seg.code}`)}
                  className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 transition-all"
                  title={`Gửi Zalo OA kịch bản ${seg.code}`}
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* CRM MEMBERS DIRECTORY FILTERED BY PK */}
      <div className={`p-5 rounded-2xl border ${cardBg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className={`text-sm font-black uppercase tracking-wide flex items-center gap-2 ${textHeading}`}>
              <Users className="w-4 h-4 text-orange-500" />
              <span>Danh Sách Khách Hàng Thuộc Phân Khúc</span>
              {selectedPK !== 'all' && (
                <span className="px-2 py-0.5 rounded-md bg-orange-500 text-white text-xs font-mono font-bold">
                  {selectedPK}
                </span>
              )}
            </h3>
            <p className={`text-xs mt-0.5 ${textSub}`}>
              Hiển thị {filteredMembers.length} kết quả phù hợp với bộ lọc phân khúc.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {/* Quick Segment Filter Buttons */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setSelectedPK('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedPK === 'all' 
                    ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Tất cả ({enrichedCustomers.length})
              </button>
              {PK_SEGMENTS_LIST.map(s => (
                <button
                  key={s.code}
                  onClick={() => setSelectedPK(s.code)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedPK === s.code 
                      ? 'bg-orange-600 text-white shadow-xs' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {s.code} ({counts[s.code] || 0})
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Tìm tên, SĐT..."
                className={`pl-8 pr-3 py-1.5 text-xs rounded-xl border outline-none w-44 transition-colors ${
                  isDark ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Member Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={isDark ? 'bg-slate-900/80 text-slate-300' : 'bg-slate-100/80 text-slate-700'}>
                <th className="py-2.5 px-3 font-bold border-b border-slate-200 dark:border-slate-800">Mã HV</th>
                <th className="py-2.5 px-3 font-bold border-b border-slate-200 dark:border-slate-800">Họ & Tên</th>
                <th className="py-2.5 px-3 font-bold border-b border-slate-200 dark:border-slate-800">Số Điện Thoại</th>
                <th className="py-2.5 px-3 font-bold border-b border-slate-200 dark:border-slate-800 text-center">Phân Khúc PK</th>
                <th className="py-2.5 px-3 font-bold border-b border-slate-200 dark:border-slate-800">Gói Tập / Nhu Cầu</th>
                <th className="py-2.5 px-3 font-bold border-b border-slate-200 dark:border-slate-800">Mục Tiêu Tập Luyện</th>
                <th className="py-2.5 px-3 font-bold border-b border-slate-200 dark:border-slate-800 text-right">Thao Tác Zalo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-slate-400">
                    Chưa tìm thấy khách hàng nào khớp với phân khúc đã chọn.
                  </td>
                </tr>
              ) : (
                filteredMembers.slice(0, 20).map(member => {
                  const segInfo = PK_SEGMENTS_LIST.find(s => s.code === member.computedPK) || PK_SEGMENTS_LIST[0];

                  return (
                    <tr key={member.id} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}>
                      <td className="py-2.5 px-3 font-mono font-bold text-orange-500">
                        {member.memberCode || member.id.slice(0, 6)}
                      </td>
                      <td className={`py-2.5 px-3 font-bold ${textHeading}`}>
                        {member.fullName}
                      </td>
                      <td className={`py-2.5 px-3 font-mono ${textSub}`}>
                        {member.phone}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span 
                          className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-black font-mono border ${segInfo.badgeBgLight} ${segInfo.badgeBgDark}`}
                        >
                          {member.computedPK}
                        </span>
                      </td>
                      <td className={`py-2.5 px-3 ${textSub}`}>
                        {member.packageInterested || member.packageCode || 'Gói Tiêu Chuẩn'}
                      </td>
                      <td className={`py-2.5 px-3 ${textSub}`}>
                        {member.trainingGoal || 'Duy trì vóc dáng & sức khỏe'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => showLocalToast(`✓ Đã gửi tin nhắn Zalo tư vấn kịch bản ${member.computedPK} cho ${member.fullName}`)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 transition-all border border-orange-500/20 flex items-center space-x-1 ml-auto"
                        >
                          <Send size={11} />
                          <span>Gửi Zalo PK</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredMembers.length > 20 && (
          <div className="mt-3 text-center">
            <button
              onClick={() => onNavigateToCustomers(selectedPK)}
              className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline inline-flex items-center space-x-1"
            >
              <span>Xem tất cả {filteredMembers.length} hội viên thuộc phân khúc {selectedPK} trong danh sách CRM</span>
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
