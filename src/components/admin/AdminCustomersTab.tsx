import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Mail, 
  Database, 
  RefreshCw, 
  Users,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Sparkles,
  AlertCircle,
  Compass
} from 'lucide-react';
import { CustomerRecord } from '../../types';
import { enrichCustomerWithJourney } from '../../data/customerJourneyData';

interface AdminCustomersTabProps {
  customers: CustomerRecord[];
  loading: boolean;
  isDark: boolean;
  onRefreshData: () => Promise<void>;
  onOpenNewModal: () => void;
  onEditCustomer: (customer: CustomerRecord) => void;
  onDeleteCustomer: (customer: CustomerRecord) => void;
  onComposeEmailForCustomer: (customer: CustomerRecord) => void;
}

export const AdminCustomersTab: React.FC<AdminCustomersTabProps> = ({
  customers,
  loading,
  isDark,
  onRefreshData,
  onOpenNewModal,
  onEditCustomer,
  onDeleteCustomer,
  onComposeEmailForCustomer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [packageFilter, setPackageFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [journeyFilter, setJourneyFilter] = useState('all');
  const [personaFilter, setPersonaFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Ensure all customers have journey stage & persona assigned
  const enrichedCustomers = useMemo(() => {
    return customers.map(c => enrichCustomerWithJourney(c));
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    return enrichedCustomers.filter(c => {
      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchName = c.fullName?.toLowerCase().includes(query);
        const matchCode = c.memberCode?.toLowerCase().includes(query);
        const matchPhone = c.phone?.toLowerCase().includes(query);
        const matchEmail = c.email?.toLowerCase().includes(query);
        const matchOcc = c.occupation?.toLowerCase().includes(query);
        if (!matchName && !matchCode && !matchPhone && !matchEmail && !matchOcc) {
          return false;
        }
      }

      // Segment
      if (segmentFilter !== 'all') {
        if (c.customerSegment !== segmentFilter) return false;
      }

      // Package
      if (packageFilter !== 'all') {
        const code = c.packageCode || '';
        const name = c.packageInterested || '';
        if (!code.includes(packageFilter) && !name.includes(packageFilter)) return false;
      }

      // Status
      if (statusFilter !== 'all') {
        if (statusFilter === 'member') {
          if (c.status !== 'member' && c.membershipStatus !== 'Đang hoạt động') return false;
        } else if (statusFilter === 'expired') {
          if (c.membershipStatus !== 'Sắp hết hạn' && c.membershipStatus !== 'Đã dừng') return false;
        } else if (statusFilter === 'trial_active') {
          if (c.status !== 'trial_active') return false;
        } else if (statusFilter === 'new') {
          if (c.status !== 'new' && c.customerSegment !== 'Khách mới') return false;
        }
      }

      // Journey Stage
      if (journeyFilter !== 'all') {
        if (c.journeyStage !== journeyFilter) return false;
      }

      // Persona
      if (personaFilter !== 'all') {
        if (c.matchedPersona !== personaFilter) return false;
      }

      return true;
    });
  }, [enrichedCustomers, searchTerm, segmentFilter, packageFilter, statusFilter, journeyFilter, personaFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const paginatedCustomers = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, validPage, pageSize]);

  const textHeading = isDark ? 'text-white' : 'text-slate-900';
  const textSub = isDark ? 'text-slate-400' : 'text-slate-500';

  const inputClass = `px-3 py-2 text-xs rounded-xl border transition-colors outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 ${
    isDark ? 'bg-slate-800/90 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
  }`;

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className={`p-5 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              ● Firestore Database
            </span>
            <span className={`text-xs font-semibold ${textSub}`}>
              {customers.length} Hồ Sơ Đã Lưu Trữ
            </span>
          </div>
          <h2 className={`text-xl font-black ${textHeading}`}>
            Quản Lý Khách Hàng & Hội Viên (CRM)
          </h2>
          <p className={`text-xs mt-0.5 ${textSub}`}>
            Toàn bộ dữ liệu được quản lý trực tiếp trên Firebase Firestore. Bạn có thể Thêm, Sửa hoặc Xóa ngay tại đây.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onRefreshData}
            disabled={loading}
            title="Tải lại từ Firestore"
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center space-x-1.5 ${
              isDark 
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' 
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Đang tải...' : 'Làm mới'}</span>
          </button>

          <button
            onClick={onOpenNewModal}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 transition-all flex items-center space-x-1.5 shadow-md shadow-orange-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Khách Hàng (Firestore)</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className={`p-4 rounded-2xl border space-y-3 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className={`absolute left-3.5 top-2.5 w-4 h-4 ${textSub}`} />
            <input
              type="text"
              placeholder="Tìm theo Tên, Mã HV (TS_001...), SĐT, Email, Nghề nghiệp..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full pl-10 pr-4 py-2 text-xs rounded-xl border outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 ${
                isDark ? 'bg-slate-800/90 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Filter dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={journeyFilter}
              onChange={(e) => {
                setJourneyFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={inputClass}
            >
              <option value="all">🧭 Tất cả Hành Trình (ACCSR)</option>
              <option value="awareness">1. Nhận Thức (Awareness)</option>
              <option value="consideration">2. Suy Xét (Consideration)</option>
              <option value="conversion">3. Chốt Thẻ (Conversion)</option>
              <option value="service">4. Trải Nghiệm (Service)</option>
              <option value="retention">5. Giữ Chân (Retention)</option>
            </select>

            <select
              value={personaFilter}
              onChange={(e) => {
                setPersonaFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={inputClass}
            >
              <option value="all">👤 Tất cả Persona</option>
              <option value="minh">Persona: Ngọc Minh (Văn phòng)</option>
              <option value="tuan">Persona: Quốc Tuấn (Giảm cân / InBody)</option>
              <option value="huong">Persona: Thu Hương (Yoga / Sau sinh)</option>
            </select>

            <select
              value={segmentFilter}
              onChange={(e) => {
                setSegmentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={inputClass}
            >
              <option value="all">Tất cả Phân Khúc</option>
              <option value="VIP (Doanh thu cao)">⭐ VIP (Doanh thu cao)</option>
              <option value="Khách hàng trung thành">🤝 Khách hàng trung thành</option>
              <option value="Khách hàng tiềm năng">🎯 Khách hàng tiềm năng</option>
              <option value="Nguy cơ churn">⚠️ Nguy cơ Churn</option>
              <option value="Khách mới">🌱 Khách mới</option>
            </select>

            <select
              value={packageFilter}
              onChange={(e) => {
                setPackageFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={inputClass}
            >
              <option value="all">Tất cả Gói Tập</option>
              <option value="12T">12T (1 Năm)</option>
              <option value="3T">3T (3 Tháng)</option>
              <option value="1T">1T (1 Tháng)</option>
              <option value="6T">6T (6 Tháng)</option>
              <option value="24T">24T (2 Năm)</option>
              <option value="48T">48T (4 Năm)</option>
            </select>

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className={inputClass}
            >
              <option value={25}>25 dòng/trang</option>
              <option value={50}>50 dòng/trang</option>
              <option value={100}>100 dòng/trang</option>
            </select>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pt-1">
          {[
            { id: 'all', label: `Tất cả (${customers.length})` },
            { id: 'member', label: 'Đang hoạt động' },
            { id: 'expired', label: 'Sắp hết hạn / Đã dừng' },
            { id: 'trial_active', label: 'Đang tập thử' },
            { id: 'new', label: 'Khách mới đăng ký' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => {
                setStatusFilter(f.id);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                statusFilter === f.id
                  ? 'bg-orange-500 text-white shadow-sm'
                  : isDark
                  ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Customers Table */}
      <div className={`rounded-2xl border overflow-hidden ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`uppercase text-[10px] tracking-wider ${
              isDark ? 'bg-slate-800/80 text-slate-400' : 'bg-slate-100 text-slate-600'
            }`}>
              <tr>
                <th className="py-3.5 px-4">Mã HV & Họ Tên</th>
                <th className="py-3.5 px-4">Liên Hệ</th>
                <th className="py-3.5 px-4">Gói Tập & Chi Tiêu</th>
                <th className="py-3.5 px-4">Hành Trình ACCSR</th>
                <th className="py-3.5 px-4">Tần Suất Tập</th>
                <th className="py-3.5 px-4">Phân Khúc</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
              {paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className={`text-center py-12 ${textSub}`}>
                    Không tìm thấy hội viên nào khớp với bộ lọc.
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map(c => (
                  <tr 
                    key={c.id} 
                    className={`transition-colors ${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}
                  >
                    {/* Name & Code */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isDark ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-orange-100 text-orange-600 border border-orange-200'
                        }`}>
                          {c.fullName ? c.fullName[0].toUpperCase() : 'H'}
                        </div>
                        <div>
                          <div className={`font-bold text-sm leading-tight flex items-center space-x-1.5 ${textHeading}`}>
                            <span>{c.fullName}</span>
                            {c.gender && (
                              <span className={`text-[10px] font-normal ${textSub}`}>
                                ({c.gender})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-1.5 mt-0.5">
                            <span className="font-mono text-[11px] font-bold text-orange-600 dark:text-orange-400">
                              {c.memberCode || c.id.slice(0, 8)}
                            </span>
                            {c.occupation && (
                              <span className={`text-[10px] ${textSub}`}>
                                • {c.occupation}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-4">
                      <div className={`font-mono font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {c.phone || 'Chưa có SĐT'}
                      </div>
                      <div className={`text-[11px] ${textSub}`}>{c.email}</div>
                    </td>

                    {/* Package & Spending */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                          isDark ? 'bg-slate-800 text-orange-400 border border-slate-700' : 'bg-orange-50 text-orange-700 border border-orange-200'
                        }`}>
                          {c.packageCode || '12T'}
                        </span>
                        <span className={`font-semibold text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {c.packageInterested || 'Gói Hội Viên'}
                        </span>
                      </div>
                      <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                        {c.totalSpent ? `${c.totalSpent.toLocaleString('vi-VN')} đ` : '0 đ'}
                      </div>
                    </td>

                    {/* ACCSR Journey Stage */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wide w-fit ${
                          c.journeyStage === 'awareness' ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30' :
                          c.journeyStage === 'consideration' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30' :
                          c.journeyStage === 'conversion' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' :
                          c.journeyStage === 'service' ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30' :
                          'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                        }`}>
                          {c.journeyStage === 'awareness' ? '1. Nhận Thức' :
                           c.journeyStage === 'consideration' ? '2. Suy Xét' :
                           c.journeyStage === 'conversion' ? '3. Chốt Thẻ' :
                           c.journeyStage === 'service' ? '4. Trải Nghiệm' : '5. Giữ Chân'}
                        </span>
                        {c.matchedPersona && (
                          <span className={`text-[10px] flex items-center space-x-1 ${textSub}`}>
                            <span>Persona:</span>
                            <span className="font-semibold text-orange-600 dark:text-orange-400">
                              {c.matchedPersona === 'minh' ? 'Ngọc Minh' :
                               c.matchedPersona === 'tuan' ? 'Quốc Tuấn' :
                               c.matchedPersona === 'huong' ? 'Thu Hương' : 'Đại trà'}
                            </span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Frequency */}
                    <td className="py-3 px-4">
                      <div className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {c.checkinCount ? `${c.checkinCount} buổi tập` : '0 buổi'}
                        {c.ptSessions ? ` • ${c.ptSessions} PT` : ''}
                      </div>
                      <div className={`text-[10px] mt-0.5 ${textSub}`}>
                        {c.daysSinceLastCheckin !== undefined ? (
                          <span>Tập {c.daysSinceLastCheckin} ngày trước</span>
                        ) : (
                          <span>Chưa check-in</span>
                        )}
                      </div>
                    </td>

                    {/* Segment */}
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        c.customerSegment === 'VIP (Doanh thu cao)'
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                          : c.customerSegment === 'Khách hàng trung thành'
                          ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30'
                          : c.customerSegment === 'Nguy cơ churn'
                          ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                          : isDark
                          ? 'bg-slate-800 text-slate-300 border border-slate-700'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {c.customerSegment || 'Tiềm năng'}
                      </span>
                      {c.churnRisk && (
                        <div className={`text-[10px] mt-0.5 flex items-center space-x-1 ${textSub}`}>
                          <span>Churn:</span>
                          <span className={`font-bold ${
                            c.churnRisk === 'Cao' ? 'text-rose-500' : c.churnRisk === 'Trung bình' ? 'text-amber-500' : 'text-emerald-500'
                          }`}>
                            {c.churnRisk}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        c.membershipStatus === 'Đang hoạt động' || c.status === 'member'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                          : c.membershipStatus === 'Sắp hết hạn'
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                          : c.membershipStatus === 'Đã dừng'
                          ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                          : isDark
                          ? 'bg-slate-800 text-slate-300 border border-slate-700'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {c.membershipStatus || (c.status === 'member' ? 'Đang hoạt động' : 'Tập thử')}
                      </span>
                    </td>

                    {/* Action buttons: Edit, Compose Mail, Delete */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => onEditCustomer(c)}
                          title="Sửa thông tin hội viên (Firestore)"
                          className={`p-1.5 rounded-lg transition-colors ${
                            isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onComposeEmailForCustomer(c)}
                          title="Soạn email cho hội viên này"
                          className={`p-1.5 rounded-lg transition-colors ${
                            isDark ? 'text-orange-400 hover:text-orange-300 hover:bg-slate-800' : 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'
                          }`}
                        >
                          <Mail className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onDeleteCustomer(c)}
                          title="Xóa khách hàng khỏi Firestore"
                          className={`p-1.5 rounded-lg transition-colors ${
                            isDark ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10' : 'text-rose-600 hover:text-rose-700 hover:bg-rose-50'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className={textSub}>
            Hiển thị <span className={`font-bold ${textHeading}`}>{Math.min(filteredCustomers.length, (validPage - 1) * pageSize + 1)}</span> đến <span className={`font-bold ${textHeading}`}>{Math.min(filteredCustomers.length, validPage * pageSize)}</span> trên tổng số <span className="text-orange-600 dark:text-orange-400 font-bold">{filteredCustomers.length}</span> hội viên
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={validPage <= 1}
              className={`px-3 py-1.5 rounded-lg border font-semibold transition-colors disabled:opacity-40 ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              Trang trước
            </button>

            <div className={`px-3 py-1.5 rounded-lg font-mono text-xs ${
              isDark ? 'bg-slate-800/80 text-slate-300' : 'bg-white border border-slate-200 text-slate-700'
            }`}>
              Trang <span className="text-orange-600 dark:text-orange-400 font-bold">{validPage}</span> / {totalPages}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={validPage >= totalPages}
              className={`px-3 py-1.5 rounded-lg border font-semibold transition-colors disabled:opacity-40 ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              Trang sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
