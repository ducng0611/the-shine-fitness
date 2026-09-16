import React from 'react';
import { 
  Users, 
  DollarSign, 
  Package, 
  Tag, 
  Mail, 
  TrendingUp, 
  UserPlus, 
  Plus, 
  Sparkles, 
  ArrowRight, 
  ChevronRight,
  Database,
  Compass,
  Zap
} from 'lucide-react';
import { CustomerRecord, GymPackage, PromotionCampaign } from '../../types';

interface AdminOverviewTabProps {
  customers: CustomerRecord[];
  packages: GymPackage[];
  promotions: PromotionCampaign[];
  isDark: boolean;
  onNavigateTab: (tab: 'customers' | 'packages' | 'promotions' | 'email_flows' | 'rbac' | 'customer_journey') => void;
  onOpenNewCustomerModal: () => void;
  onOpenNewPackageModal: () => void;
  onOpenNewPromotionModal: () => void;
}

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({
  customers,
  packages,
  promotions,
  isDark,
  onNavigateTab,
  onOpenNewCustomerModal,
  onOpenNewPackageModal,
  onOpenNewPromotionModal,
}) => {
  const totalRevenue = customers.reduce((acc, c) => acc + (c.totalSpent || 0), 0);
  const activeMembers = customers.filter(c => c.membershipStatus === 'Đang hoạt động' || c.status === 'member');
  const vipCount = customers.filter(c => c.customerSegment === 'VIP (Doanh thu cao)').length;

  const cardBase = `p-5 rounded-2xl border transition-all ${
    isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
  }`;

  const textHeading = isDark ? 'text-white' : 'text-slate-900';
  const textSub = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-6">
      {/* 5 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Members */}
        <div className={cardBase}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-semibold uppercase tracking-wider ${textSub}`}>
              Tổng Hội Viên
            </span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'
            }`}>
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className={`text-2xl sm:text-3xl font-black ${textHeading}`}>
              {customers.length.toLocaleString('vi-VN')}
            </span>
            <span className="text-xs font-bold text-emerald-500 flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
              {activeMembers.length} active
            </span>
          </div>
          <p className={`text-xs mt-2 ${textSub}`}>
            {vipCount} Hội viên phân khúc VIP
          </p>
        </div>

        {/* Card 2: Revenue */}
        <div className={cardBase}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-semibold uppercase tracking-wider ${textSub}`}>
              Doanh Thu Tích Lũy
            </span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
            }`}>
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className={`text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400`}>
              {(totalRevenue / 1000000000).toFixed(2)}
            </span>
            <span className={`text-xs font-bold ${textSub}`}>Tỷ VNĐ</span>
          </div>
          <p className={`text-xs mt-2 ${textSub}`}>
            Bình quân: {customers.length > 0 ? (totalRevenue / customers.length / 1000000).toFixed(1) : 0} Tr/HV
          </p>
        </div>

        {/* Card 3: Packages */}
        <div className={cardBase}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-semibold uppercase tracking-wider ${textSub}`}>
              Gói Tập Hoạt Động
            </span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-600'
            }`}>
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className={`text-2xl sm:text-3xl font-black ${textHeading}`}>
              {packages.filter(p => p.isActive).length} / {packages.length}
            </span>
            <span className={`text-xs font-semibold ${textSub}`}>gói niêm yết</span>
          </div>
          <p className={`text-xs mt-2 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
            Top 1: Gói 12T & Gói 3T
          </p>
        </div>

        {/* Card 4: Promos */}
        <div className={cardBase}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-semibold uppercase tracking-wider ${textSub}`}>
              CTKM & Voucher
            </span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'
            }`}>
              <Tag className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className={`text-2xl sm:text-3xl font-black ${textHeading}`}>
              {promotions.reduce((acc, p) => acc + p.usageCount, 0)}
            </span>
            <span className={`text-xs font-semibold ${textSub}`}>lượt kích hoạt</span>
          </div>
          <p className={`text-xs mt-2 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
            {promotions.filter(p => p.isActive).length} chương trình đang chạy
          </p>
        </div>

        {/* Card 5: Email */}
        <div className={cardBase}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-semibold uppercase tracking-wider ${textSub}`}>
              Tỷ Lệ Mở Email
            </span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'
            }`}>
              <Mail className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className={`text-2xl sm:text-3xl font-black ${textHeading}`}>73.8%</span>
            <span className="text-xs font-semibold text-emerald-500 flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> Chuẩn cao
            </span>
          </div>
          <p className={`text-xs mt-2 ${textSub}`}>
            Tự động hóa luồng CRM
          </p>
        </div>
      </div>

      {/* Quick Actions & Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funnel Progress */}
        <div className={`lg:col-span-2 p-6 rounded-2xl border ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`text-base font-bold ${textHeading}`}>
                Phễu Chuyển Đổi Hội Viên The Shine (Conversion Funnel)
              </h3>
              <p className={`text-xs mt-0.5 ${textSub}`}>
                Hành trình từ khách đăng ký trải nghiệm đến hội viên dài hạn
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Tỷ lệ chốt: 35.9%
            </span>
          </div>

          <div className="space-y-4 pt-1">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                  1. Đăng ký vé tập thử 3 ngày qua Website
                </span>
                <span className={`font-bold ${textHeading}`}>412 lượt (100%)</span>
              </div>
              <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <div className="h-full bg-orange-500 rounded-full w-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                  2. Nhận email tự động & Đến quầy lễ tân Check-in
                </span>
                <span className={`font-bold ${textHeading}`}>318 lượt (77.2%)</span>
              </div>
              <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <div className="h-full bg-amber-500 rounded-full w-[77.2%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                  3. Đo chỉ số InBody & Trải nghiệm 1 buổi cùng HLV PT
                </span>
                <span className={`font-bold ${textHeading}`}>245 lượt (59.4%)</span>
              </div>
              <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <div className="h-full bg-cyan-500 rounded-full w-[59.4%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                  4. Chốt thẻ hội viên chính thức (12T / 6T / 3T / 1T)
                </span>
                <span className="text-emerald-500 font-bold">148 hội viên mới (35.9%)</span>
              </div>
              <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <div className="h-full bg-emerald-500 rounded-full w-[35.9%]" />
              </div>
            </div>
          </div>

          {/* Customer Journey Link Banner */}
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h4 className={`text-xs font-black ${textHeading}`}>
                  Hành Trình Chuyển Đổi Khách Hàng (Mô hình ACCSR & 3 Persona)
                </h4>
                <p className={`text-[11px] ${textSub}`}>
                  Phân tích 5 giai đoạn, 12 điểm chạm và kịch bản chăm sóc cá nhân hóa
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('customer_journey')}
              className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-xs self-start sm:self-auto"
            >
              <span>Xem Bản Đồ Hành Trình</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={`p-6 rounded-2xl border flex flex-col justify-between ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <h3 className={`text-base font-bold mb-1 ${textHeading}`}>Thao Tác Quản Trị Nhanh</h3>
            <p className={`text-xs mb-4 ${textSub}`}>Tác vụ phổ biến trên cơ sở dữ liệu</p>

            <div className="space-y-2.5">
              <button
                onClick={() => onNavigateTab('customer_journey')}
                className={`w-full text-left p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-colors ${
                  isDark 
                    ? 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30 text-orange-300' 
                    : 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-800'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <Compass className="w-4 h-4 text-orange-500" />
                  <span>Hành Trình ACCSR (12 Điểm Chạm)</span>
                </span>
                <ArrowRight className="w-4 h-4 text-orange-500" />
              </button>

              <button
                onClick={onOpenNewCustomerModal}
                className={`w-full text-left p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-colors ${
                  isDark 
                    ? 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200' 
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <UserPlus className="w-4 h-4 text-orange-500" />
                  <span>Thêm Khách Hàng (Firestore)</span>
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={onOpenNewPackageModal}
                className={`w-full text-left p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-colors ${
                  isDark 
                    ? 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200' 
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <Plus className="w-4 h-4 text-emerald-500" />
                  <span>Thêm Gói Tập Mới</span>
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={onOpenNewPromotionModal}
                className={`w-full text-left p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-colors ${
                  isDark 
                    ? 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200' 
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-amber-500" />
                  <span>Tạo Mã Voucher Giảm Giá</span>
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigateTab('email_flows')}
                className={`w-full text-left p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-colors ${
                  isDark 
                    ? 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30 text-orange-300' 
                    : 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-800'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  <span>Soạn Email Marketing & Khuyến Mãi</span>
                </span>
                <ArrowRight className="w-4 h-4 text-orange-500" />
              </button>
            </div>
          </div>

          <div className={`mt-4 p-3 rounded-xl border text-[11px] flex items-center space-x-2 ${
            isDark ? 'bg-slate-800/50 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <Database className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Đồng bộ Firestore trực tiếp: <span className="font-mono font-semibold">customers & packages</span></span>
          </div>
        </div>
      </div>

      {/* Recent Customers list preview */}
      <div className={`p-6 rounded-2xl border ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`text-base font-bold ${textHeading}`}>Khách Hàng Mới Cập Nhật</h3>
            <p className={`text-xs ${textSub}`}>Lưu trữ trực tiếp trên Firestore</p>
          </div>
          <button
            onClick={() => onNavigateTab('customers')}
            className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center space-x-1"
          >
            <span>Xem tất cả {customers.length} khách hàng</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`uppercase text-[10px] tracking-wider ${
              isDark ? 'bg-slate-800/80 text-slate-400' : 'bg-slate-100 text-slate-600'
            }`}>
              <tr>
                <th className="py-3 px-4 rounded-l-lg">Họ & Tên</th>
                <th className="py-3 px-4">Số Điện Thoại / Email</th>
                <th className="py-3 px-4">Gói Tập</th>
                <th className="py-3 px-4">Chi Tiêu</th>
                <th className="py-3 px-4">Trạng Thái</th>
                <th className="py-3 px-4 rounded-r-lg">Ngày Cập Nhật</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
              {customers.slice(0, 5).map(c => (
                <tr key={c.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}>
                  <td className={`py-3.5 px-4 font-bold flex items-center space-x-2 ${textHeading}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      isDark ? 'bg-slate-800 text-orange-400 border border-slate-700' : 'bg-orange-100 text-orange-600 border border-orange-200'
                    }`}>
                      {c.fullName ? c.fullName[0].toUpperCase() : 'K'}
                    </div>
                    <span>{c.fullName}</span>
                  </td>
                  <td className={`py-3.5 px-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <div className="font-mono">{c.phone || 'Chưa cung cấp'}</div>
                    <div className={`text-[11px] ${textSub}`}>{c.email}</div>
                  </td>
                  <td className={`py-3.5 px-4 font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    <span className="font-mono text-orange-600 dark:text-orange-400 font-bold mr-1.5">
                      {c.packageCode || '12T'}
                    </span>
                    <span>{c.packageInterested || 'Gói Hội Viên'}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {c.totalSpent ? `${c.totalSpent.toLocaleString('vi-VN')} đ` : '0 đ'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      c.status === 'member' || c.membershipStatus === 'Đang hoạt động'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    }`}>
                      {c.membershipStatus || (c.status === 'member' ? 'Hội Viên' : 'Tập thử')}
                    </span>
                  </td>
                  <td className={`py-3.5 px-4 text-[11px] font-mono ${textSub}`}>
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString('vi-VN') : 'Mới'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
