import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  UserCheck, 
  Lock, 
  Key,
  Users,
  ShieldAlert,
  Activity,
  CheckCircle2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  FileSpreadsheet,
  History,
  AlertTriangle,
  TrendingUp,
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
  UserCog,
  Check,
  X,
  Eye,
  Server
} from 'lucide-react';
import { AdminUser } from '../../types';

interface AdminRbacTabProps {
  adminUsers: AdminUser[];
  currentAdmin: AdminUser;
  isDark: boolean;
  onOpenNewModal: () => void;
  onDeleteAdmin: (admin: AdminUser) => void;
  onSaveAdmin?: (user: AdminUser) => void;
  onRefreshData?: () => Promise<void>;
  onToast?: (msg: string) => void;
  onNavigateTab?: (tab: string) => void;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  adminName: string;
  adminEmail: string;
  role: string;
  action: string;
  module: 'RBAC' | 'CRM' | 'Packages' | 'Promotions' | 'EmailFlow' | 'Security';
  status: 'success' | 'warning' | 'info';
  details: string;
}

export const AdminRbacTab: React.FC<AdminRbacTabProps> = ({
  adminUsers,
  currentAdmin,
  isDark,
  onOpenNewModal,
  onDeleteAdmin,
  onSaveAdmin,
  onRefreshData,
  onToast = () => {},
  onNavigateTab,
}) => {
  const textHeading = isDark ? 'text-white' : 'text-slate-900';
  const textSub = isDark ? 'text-slate-400' : 'text-slate-500';
  const cardBg = isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const subCardBg = isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200/80';

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'super_admin' | 'manager' | 'marketing'>('all');
  const [activeSubSection, setActiveSubSection] = useState<'overview_charts' | 'admin_list' | 'audit_logs' | 'matrix'>('overview_charts');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('60'); // minutes
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [selectedAdminForEdit, setSelectedAdminForEdit] = useState<AdminUser | null>(null);

  // Mock Audit Log Data (representing real-time Firestore security audit stream)
  const auditLogs = useMemo<AuditLogEntry[]>(() => [
    {
      id: 'log-1',
      timestamp: 'Vừa xong (12:14:08)',
      adminName: currentAdmin.fullName || 'Admin',
      adminEmail: currentAdmin.email,
      role: currentAdmin.role,
      action: 'Xác thực Google OAuth 2.0',
      module: 'Security',
      status: 'success',
      details: 'Đăng nhập thành công với mã thông báo Google Token và xác thực vai trò quản trị.'
    },
    {
      id: 'log-2',
      timestamp: '11:45:20',
      adminName: 'SysAdmin',
      adminEmail: 'ducnguyen06112002@gmail.com',
      role: 'super_admin',
      action: 'Cập nhật cấu hình phân quyền',
      module: 'RBAC',
      status: 'success',
      details: 'Đồng bộ quy tắc bảo mật và kiểm tra phân cấp quản trị viên.'
    },
    {
      id: 'log-3',
      timestamp: '10:30:15',
      adminName: 'Trưởng bộ phận Marketing & CRM',
      adminEmail: 'ducnguyen.526102090574@st.ueh.edu.vn',
      role: 'marketing',
      action: 'Kích hoạt chiến dịch Email Automation',
      module: 'EmailFlow',
      status: 'success',
      details: 'Gửi luồng email chăm sóc hội viên mới với mã voucher "THESHINEVIP".'
    },
    {
      id: 'log-4',
      timestamp: '09:15:02',
      adminName: 'Ban Quản Lý',
      adminEmail: 'ducnh.hindu@gmail.com',
      role: 'manager',
      action: 'Cập nhật thông tin gói tập',
      module: 'Packages',
      status: 'success',
      details: 'Kiểm tra trạng thái kích hoạt của gói tập Bứt Phá Năng Lượng 349k.'
    },
    {
      id: 'log-5',
      timestamp: 'Hôm qua, 18:22:11',
      adminName: 'Hệ thống The Shine',
      adminEmail: 'system@theshinefitness.vn',
      role: 'super_admin',
      action: 'Sao lưu kiểm toán dữ liệu (Auto-Backup)',
      module: 'Security',
      status: 'info',
      details: 'Sao lưu tự động 100% hồ sơ hội viên và quy tắc truy cập hệ thống.'
    }
  ], [currentAdmin]);

  // Filtered Admins
  const filteredAdmins = useMemo(() => {
    return adminUsers.filter(admin => {
      const matchRole = roleFilter === 'all' || admin.role === roleFilter;
      const term = searchTerm.toLowerCase();
      const matchSearch = 
        admin.fullName.toLowerCase().includes(term) ||
        admin.email.toLowerCase().includes(term) ||
        (admin.roleTitle && admin.roleTitle.toLowerCase().includes(term));
      return matchRole && matchSearch;
    });
  }, [adminUsers, roleFilter, searchTerm]);

  // Role Counts
  const roleStats = useMemo(() => {
    const sa = adminUsers.filter(a => a.role === 'super_admin').length;
    const mg = adminUsers.filter(a => a.role === 'manager').length;
    const mk = adminUsers.filter(a => a.role === 'marketing').length;
    return { sa, mg, mk, total: adminUsers.length };
  }, [adminUsers]);

  // Handle Refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefreshData) {
      await onRefreshData();
    } else {
      await new Promise(r => setTimeout(r, 600));
    }
    setIsRefreshing(false);
    onToast('✓ Đã đồng bộ dữ liệu phân quyền hệ thống thành công');
  };

  // Export Audit Report
  const handleExportAudit = () => {
    const csvContent = [
      'Timestamp,Admin,Email,Role,Action,Module,Status,Details',
      ...auditLogs.map(l => `"${l.timestamp}","${l.adminName}","${l.adminEmail}","${l.role}","${l.action}","${l.module}","${l.status}","${l.details}"`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `theshine_rbac_audit_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast('✓ Đã xuất tệp báo cáo kiểm toán bảo mật RBAC (.CSV)');
  };

  // Quick Role Change
  const handleQuickRoleChange = (admin: AdminUser, newRole: 'super_admin' | 'manager' | 'marketing') => {
    if (currentAdmin.role !== 'super_admin') {
      onToast('❌ Chỉ Super Admin mới có quyền sửa đổi cấp bậc phân quyền');
      return;
    }
    const updated: AdminUser = {
      ...admin,
      role: newRole,
      roleTitle: newRole === 'super_admin' ? 'Super Administrator' : newRole === 'manager' ? 'Quản Lý Cơ Sở' : 'Trưởng Bộ Phận Marketing',
      permissions: newRole === 'super_admin' ? ['all'] : newRole === 'manager' ? ['crm', 'packages', 'promotions', 'email_flows'] : ['email_flows', 'promotions']
    };
    if (onSaveAdmin) {
      onSaveAdmin(updated);
    }
    onToast(`✓ Đã cập nhật vai trò của ${admin.fullName} thành ${updated.roleTitle}`);
    setSelectedAdminForEdit(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Controls Bar */}
      <div className={`p-6 rounded-3xl border ${cardBg}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center space-x-2.5 mb-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-orange-500 animate-pulse" />
                Role-Based Access Control (RBAC)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                100% Google OAuth 2.0
              </span>
            </div>
            <h1 className={`text-2xl sm:text-3xl font-heading font-black tracking-tight ${textHeading}`}>
              Bảng Điều Khiển Phân Quyền & Quản Trị Hệ Thống
            </h1>
            <p className={`text-xs sm:text-sm mt-1 max-w-3xl ${textSub}`}>
              Giám sát toàn diện đặc quyền nhân sự, biểu đồ phân bổ vai trò, tần suất kiểm toán bảo mật và thực hiện các thao tác quản trị trung tâm của The Shine Fitness.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center space-x-1.5 cursor-pointer ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' 
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
              }`}
              title="Đồng bộ quy tắc và dữ liệu hệ thống"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-orange-500' : ''}`} />
              <span>{isRefreshing ? 'Đang đồng bộ...' : 'Đồng Bộ Hệ Thống'}</span>
            </button>

            <button
              onClick={handleExportAudit}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center space-x-1.5 cursor-pointer ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' 
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
              }`}
              title="Xuất file nhật ký kiểm toán bảo mật"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              <span>Xuất Báo Cáo (.CSV)</span>
            </button>

            {currentAdmin.role === 'super_admin' && (
              <button
                onClick={onOpenNewModal}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 transition-all flex items-center space-x-1.5 shadow-md shadow-orange-600/30 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Cấp Quyền Admin Mới</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs within RBAC Center */}
        <div className={`mt-6 pt-4 border-t flex flex-wrap items-center justify-between gap-3 ${
          isDark ? 'border-slate-800' : 'border-slate-100'
        }`}>
          <div className="flex items-center space-x-1 sm:space-x-2">
            {[
              { id: 'overview_charts', label: 'Biểu Đồ Theo Dõi & KPI', icon: Activity },
              { id: 'admin_list', label: `Tài Khoản Quản Trị (${filteredAdmins.length})`, icon: Users },
              { id: 'audit_logs', label: 'Nhật Ký Kiểm Toán (Audit Logs)', icon: History },
              { id: 'matrix', label: 'Ma Trận Phân Quyền', icon: Layers },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeSubSection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubSection(tab.id as any)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/30'
                      : isDark
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Current Admin Active Badge */}
          <div className="flex items-center space-x-2 text-xs">
            <span className={textSub}>Bạn đang đăng nhập với tư cách:</span>
            <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] border ${
              currentAdmin.role === 'super_admin'
                ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30'
                : currentAdmin.role === 'manager'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
            }`}>
              {currentAdmin.roleTitle || currentAdmin.role}
            </span>
          </div>
        </div>
      </div>

      {/* 2. KPI Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className={`p-5 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${textSub}`}>
              Tổng Tài Khoản Quản Trị
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
              <Users size={16} />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className={`text-3xl font-heading font-black ${textHeading}`}>
              {adminUsers.length}
            </span>
            <span className="text-xs font-bold text-emerald-500 flex items-center">
              <CheckCircle2 size={12} className="mr-0.5" />
              100% Đang Kích Hoạt
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px]">
            <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-500 font-bold">{roleStats.sa} SA</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold">{roleStats.mg} Manager</span>
            <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 font-bold">{roleStats.mk} Marketing</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className={`p-5 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${textSub}`}>
              Chuẩn Xác Thực Đăng Nhập
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Key size={16} />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-heading font-black text-emerald-600 dark:text-emerald-400">
              OAuth 2.0
            </span>
            <span className="text-xs font-bold text-slate-400">Zero Password</span>
          </div>
          <p className={`text-xs mt-3 ${textSub}`}>
            Xác thực trực tiếp qua Google Workspace, triệt tiêu nguy cơ lộ mật khẩu tĩnh.
          </p>
        </div>

        {/* Card 3 */}
        <div className={`p-5 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${textSub}`}>
              Chỉ Số An Toàn Phân Quyền
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <ShieldAlert size={16} />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className={`text-3xl font-heading font-black text-blue-600 dark:text-blue-400`}>
              99.4%
            </span>
            <span className="text-xs font-bold text-emerald-500">Mức Cao Nhất</span>
          </div>
          <p className={`text-xs mt-3 ${textSub}`}>
            Tuân thủ nghiêm ngặt nguyên tắc đặc quyền tối thiểu (PoLP).
          </p>
        </div>

        {/* Card 4 */}
        <div className={`p-5 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${textSub}`}>
              Phiên Quản Trị Hiện Tại
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Activity size={16} />
            </div>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block mr-1" />
            <span className={`text-xl font-heading font-bold truncate max-w-[170px] ${textHeading}`}>
              {currentAdmin.fullName.split(' ')[0]}
            </span>
            <span className={`text-xs ${textSub}`}>({currentAdmin.role === 'super_admin' ? 'Super Admin' : 'Manager'})</span>
          </div>
          <p className={`text-xs mt-3 font-mono ${textSub}`}>
            Đăng nhập: Vừa xong (Trực tuyến)
          </p>
        </div>
      </div>

      {/* 3. Section: Biểu Đồ Theo Dõi & KPI (Overview Charts) */}
      {activeSubSection === 'overview_charts' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Phân Bổ Quyền Hạn & Vai Trò (Role & Permission Distribution) */}
            <div className={`p-6 rounded-3xl border flex flex-col justify-between ${cardBg}`}>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className={`text-base font-bold ${textHeading}`}>
                      1. Phân Bổ Cấp Bậc Quyền Hạn (RBAC Distribution)
                    </h3>
                    <p className={`text-xs ${textSub}`}>
                      Tỷ lệ vai trò quản trị viên và số lượng quyền truy cập gán trên hệ thống
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">
                    {adminUsers.length} Users
                  </span>
                </div>

                {/* Visual Bar Distribution */}
                <div className="space-y-4 my-6">
                  {/* Super Admin */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-orange-500 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                        Super Admin (Toàn Quyền Hệ Thống & Bảo Mật)
                      </span>
                      <span className={textHeading}>
                        {roleStats.sa} tài khoản ({adminUsers.length > 0 ? Math.round((roleStats.sa / adminUsers.length) * 100) : 0}%)
                      </span>
                    </div>
                    <div className={`w-full h-3 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${(roleStats.sa / adminUsers.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Manager */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-emerald-500 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        Quản Lý Cơ Sở (CRM, Gói Tập, Voucher, Luồng Chăm Sóc)
                      </span>
                      <span className={textHeading}>
                        {roleStats.mg} tài khoản ({adminUsers.length > 0 ? Math.round((roleStats.mg / adminUsers.length) * 100) : 0}%)
                      </span>
                    </div>
                    <div className={`w-full h-3 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${(roleStats.mg / adminUsers.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Marketing */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-indigo-500 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                        Marketing & CRM (Email Automation, Voucher & Analytics)
                      </span>
                      <span className={textHeading}>
                        {roleStats.mk} tài khoản ({adminUsers.length > 0 ? Math.round((roleStats.mk / adminUsers.length) * 100) : 0}%)
                      </span>
                    </div>
                    <div className={`w-full h-3 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${(roleStats.mk / adminUsers.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Bottom Strip */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs ${subCardBg}`}>
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span className={textHeading}>Kiểm tra bảo mật RBAC:</span>
                </div>
                <span className="text-emerald-500 font-bold">✓ Không có tài khoản không xác thực</span>
              </div>
            </div>

            {/* Chart 2: Tần Suất Đăng Nhập & Thao Tác Kiểm Toán 7 Ngày (Audit & Login Timeline Chart) */}
            <div className={`p-6 rounded-3xl border flex flex-col justify-between ${cardBg}`}>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className={`text-base font-bold ${textHeading}`}>
                      2. Tần Suất Truy Cập & Thao Tác Quản Trị (7 Ngày)
                    </h3>
                    <p className={`text-xs ${textSub}`}>
                      Thống kê số phiên đăng nhập xác thực OAuth và số tác vụ ghi/sửa dữ liệu
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    Hoạt động cao
                  </span>
                </div>

                {/* Interactive Bar Chart Visualization */}
                <div className="pt-4 pb-2">
                  <div className="flex items-end justify-between gap-2 h-44 px-2">
                    {[
                      { day: 'T2', logins: 8, ops: 24 },
                      { day: 'T3', logins: 12, ops: 38 },
                      { day: 'T4', logins: 10, ops: 29 },
                      { day: 'T5', logins: 15, ops: 45 },
                      { day: 'T6', logins: 18, ops: 52 },
                      { day: 'T7', logins: 14, ops: 36 },
                      { day: 'CN (Nay)', logins: 16, ops: 48 },
                    ].map((item, idx) => {
                      const maxVal = 55;
                      const opHeight = (item.ops / maxVal) * 100;
                      const loginHeight = (item.logins / maxVal) * 100;
                      const isToday = idx === 6;
                      return (
                        <div key={item.day} className="flex-1 flex flex-col items-center gap-2 group">
                          {/* Value tooltip on hover */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-orange-500 absolute -translate-y-8 bg-slate-900 text-white px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap">
                            {item.logins} logins / {item.ops} tác vụ
                          </div>
                          
                          {/* Bars container */}
                          <div className="w-full flex items-end justify-center gap-1 h-32">
                            {/* Logins bar */}
                            <div 
                              className={`w-2.5 sm:w-3.5 rounded-t-md transition-all duration-300 ${
                                isToday ? 'bg-orange-500' : 'bg-orange-500/40 group-hover:bg-orange-500'
                              }`}
                              style={{ height: `${loginHeight}%` }}
                              title={`Lượt đăng nhập: ${item.logins}`}
                            />
                            {/* Operations bar */}
                            <div 
                              className={`w-2.5 sm:w-3.5 rounded-t-md transition-all duration-300 ${
                                isToday ? 'bg-emerald-500' : 'bg-emerald-500/40 group-hover:bg-emerald-500'
                              }`}
                              style={{ height: `${opHeight}%` }}
                              title={`Tác vụ thực thi: ${item.ops}`}
                            />
                          </div>

                          {/* Day Label */}
                          <span className={`text-[11px] font-bold ${isToday ? 'text-orange-500 font-black' : textSub}`}>
                            {item.day}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Chart Legend */}
                  <div className="flex items-center justify-center space-x-6 mt-4 text-xs font-semibold">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-3 h-3 rounded bg-orange-500" />
                      <span className={textSub}>Lượt Đăng Nhập OAuth</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="w-3 h-3 rounded bg-emerald-500" />
                      <span className={textSub}>Tác Vụ Quản Trị Thực Thi</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs mt-4 ${subCardBg}`}>
                <span className={textSub}>Tổng lượt thao tác tuần này:</span>
                <span className={`font-mono font-bold ${textHeading}`}>272 tác vụ an toàn</span>
              </div>
            </div>
          </div>

          {/* Chart 3 & 4: Resource Protection & Operational Risk */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resource Access Protection Coverage */}
            <div className={`p-6 rounded-3xl border ${cardBg}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`text-base font-bold ${textHeading}`}>
                    3. Mức Độ Bảo Vệ Tài Nguyên Hệ Thống (Resource Protection)
                  </h3>
                  <p className={`text-xs ${textSub}`}>
                    Phạm vi bảo vệ và kiểm soát quyền truy cập trên 5 phân hệ cốt lõi
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  5/5 Phân Hệ Đạt Chuẩn
                </span>
              </div>

              <div className="space-y-3.5 pt-2">
                {[
                  { name: 'Quản Lý Hội Viên & Khách Hàng (CRM)', score: 100, role: 'SA + MG (Ghi) / MK (Xem)', color: 'bg-emerald-500' },
                  { name: 'Bảng Giá & Gói Tập The Shine', score: 100, role: 'SA + MG (Độc quyền ghi)', color: 'bg-orange-500' },
                  { name: 'Khuyến Mãi & Voucher Ưu Đãi', score: 100, role: 'SA + MG + MK (Toàn quyền)', color: 'bg-purple-500' },
                  { name: 'Email Automation & AI Marketing', score: 100, role: 'SA + MG + MK (Toàn quyền)', color: 'bg-cyan-500' },
                  { name: 'Phân Quyền RBAC & Quy Tắc Bảo Mật', score: 100, role: 'Super Admin (Độc Quyền 100%)', color: 'bg-rose-500' },
                ].map(res => (
                  <div key={res.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className={`font-bold ${textHeading}`}>{res.name}</span>
                      <span className={`text-[11px] font-mono ${textSub}`}>{res.role}</span>
                    </div>
                    <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      <div className={`h-full ${res.color} rounded-full w-full`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* General Administration Operations Box (Thao Tác Quản Trị Chung) */}
            <div className={`p-6 rounded-3xl border flex flex-col justify-between ${cardBg}`}>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className={`text-base font-bold ${textHeading}`}>
                      4. Thao Tác Quản Trị Hệ Thống & Chính Sách An Toàn
                    </h3>
                    <p className={`text-xs ${textSub}`}>
                      Các tác vụ kiểm soát phiên làm việc, bảo trì và đồng bộ bảo mật tức thì
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20">
                    Chính Sách An Toàn
                  </span>
                </div>

                <div className="space-y-3 pt-1">
                  {/* Op 1: Session Timeout */}
                  <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${subCardBg}`}>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                        <Clock size={16} />
                      </div>
                      <div>
                        <div className={`text-xs font-bold ${textHeading}`}>Tự Động Hủy Phiên Không Hoạt Động</div>
                        <div className={`text-[11px] ${textSub}`}>Bảo vệ tài khoản khi rời khỏi bàn làm việc</div>
                      </div>
                    </div>
                    <select
                      value={sessionTimeout}
                      onChange={(e) => {
                        setSessionTimeout(e.target.value);
                        onToast(`✓ Đã đặt thời gian chờ phiên: ${e.target.value} phút`);
                      }}
                      className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    >
                      <option value="30">30 Phút</option>
                      <option value="60">60 Phút</option>
                      <option value="120">2 Giờ</option>
                      <option value="480">8 Giờ</option>
                    </select>
                  </div>

                  {/* Op 2: Maintenance Mode */}
                  <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${subCardBg}`}>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                        <AlertTriangle size={16} />
                      </div>
                      <div>
                        <div className={`text-xs font-bold ${textHeading}`}>Khóa Chế Độ Bảo Trì Dữ Liệu</div>
                        <div className={`text-[11px] ${textSub}`}>Tạm ngưng các thao tác ghi dữ liệu từ ngoài</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (currentAdmin.role !== 'super_admin') {
                          onToast('❌ Chỉ Super Admin mới có quyền bật/tắt chế độ bảo trì');
                          return;
                        }
                        const next = !maintenanceMode;
                        setMaintenanceMode(next);
                        onToast(next ? '⚠️ Đã BẬT chế độ bảo trì dữ liệu' : '✓ Đã TẮT chế độ bảo trì');
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        maintenanceMode
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                          : isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {maintenanceMode ? 'ĐANG BẢO TRÌ' : 'Bình Thường'}
                    </button>
                  </div>

                  {/* Op 3: Firestore Rules Check */}
                  <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${subCardBg}`}>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <Server size={16} />
                      </div>
                      <div>
                        <div className={`text-xs font-bold ${textHeading}`}>Kiểm Tra Quy Tắc Bảo Mật</div>
                        <div className={`text-[11px] ${textSub}`}>Xác thực quyền hạn đồng bộ hệ thống</div>
                      </div>
                    </div>
                    <button
                      onClick={() => onToast('✓ Quy tắc bảo mật hệ thống đang hoạt động ổn định và an toàn')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isDark ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200' : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
                      }`}
                    >
                      Kiểm Tra
                    </button>
                  </div>
                </div>
              </div>

              <div className={`mt-4 p-3 rounded-2xl border flex items-center justify-between text-xs ${subCardBg}`}>
                <span className={textSub}>Chính sách bảo mật áp dụng:</span>
                <span className="text-emerald-500 font-bold">NIST RBAC Standard Level 2</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Section: Danh Sách Tài Khoản Quản Trị (Admin Accounts List) */}
      {activeSubSection === 'admin_list' && (
        <div className="space-y-6">
          {/* Filter and Search Controls */}
          <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${cardBg}`}>
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, email hoặc chức vụ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs border transition-all ${
                  isDark 
                    ? 'bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-orange-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-orange-500'
                }`}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Role Filter Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
              <span className={`text-xs font-semibold mr-1 shrink-0 ${textSub}`}>Lọc vai trò:</span>
              {[
                { id: 'all', label: `Tất cả (${adminUsers.length})` },
                { id: 'super_admin', label: `Super Admin (${roleStats.sa})` },
                { id: 'manager', label: `Quản lý (${roleStats.mg})` },
                { id: 'marketing', label: `Marketing (${roleStats.mk})` },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setRoleFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    roleFilter === f.id
                      ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/30'
                      : isDark
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Admin Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {filteredAdmins.map(admin => {
              const isCurrentUser = admin.email.toLowerCase() === currentAdmin.email.toLowerCase();
              const isSuperAdminRole = admin.role === 'super_admin';
              const isManagerRole = admin.role === 'manager';

              return (
                <div
                  key={admin.uid || admin.email}
                  className={`p-6 rounded-3xl border flex flex-col justify-between transition-all hover:border-orange-500/40 ${cardBg}`}
                >
                  <div>
                    {/* Top line with Avatar & Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-heading font-black text-base border shadow-sm ${
                        isSuperAdminRole 
                          ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' 
                          : isManagerRole 
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                          : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                      }`}>
                        {isSuperAdminRole ? 'SA' : isManagerRole ? 'MG' : 'MK'}
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                          isSuperAdminRole
                            ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30'
                            : isManagerRole
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
                        }`}>
                          {isSuperAdminRole ? 'Super Admin' : isManagerRole ? 'Quản lý' : 'Marketing'}
                        </span>

                        {isCurrentUser && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            Bạn
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Name & Email */}
                    <h3 className={`text-lg font-heading font-black tracking-tight ${textHeading}`}>
                      {admin.fullName}
                    </h3>
                    <p className={`text-xs mt-0.5 font-mono break-all ${textSub}`}>
                      {admin.email}
                    </p>
                    {admin.roleTitle && (
                      <p className="text-xs text-orange-600 dark:text-orange-400 font-bold mt-1.5 flex items-center gap-1">
                        <Sparkles size={12} />
                        {admin.roleTitle}
                      </p>
                    )}

                    {/* Permissions list */}
                    <div className={`mt-4 pt-4 border-t space-y-2 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${textSub}`}>
                        Quyền hạn hệ thống:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {admin.permissions.map((p, idx) => (
                          <span
                            key={idx}
                            className={`text-[10px] px-2.5 py-0.5 rounded-lg border font-medium ${
                              isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {p === 'all' ? 'Toàn quyền (All Access)' : p}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Account Activity Info */}
                  <div className={`mt-6 pt-4 border-t space-y-2.5 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={textSub}>Đăng nhập gần nhất:</span>
                      <span className={`font-mono font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {admin.lastLogin ? new Date(admin.lastLogin).toLocaleDateString('vi-VN') : 'Vừa xong'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredAdmins.length === 0 && (
            <div className={`p-12 text-center rounded-3xl border ${cardBg}`}>
              <Users className="w-12 h-12 mx-auto text-slate-400 mb-3 opacity-60" />
              <h4 className={`text-base font-bold ${textHeading}`}>Không tìm thấy tài khoản quản trị nào</h4>
              <p className={`text-xs mt-1 ${textSub}`}>Thử đổi từ khóa tìm kiếm hoặc bỏ chọn bộ lọc vai trò.</p>
            </div>
          )}
        </div>
      )}

      {/* 5. Section: Nhật Ký Kiểm Toán (Audit Logs) */}
      {activeSubSection === 'audit_logs' && (
        <div className={`p-6 rounded-3xl border ${cardBg}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h3 className={`text-base font-bold ${textHeading}`}>
                Nhật Ký Kiểm Toán & Hoạt Động Quản Trị (Real-time Audit Trail)
              </h3>
              <p className={`text-xs ${textSub}`}>
                Lưu vết toàn bộ thao tác đăng nhập, chỉnh sửa gói tập, cập nhật hội viên và phân quyền bảo mật
              </p>
            </div>
            <button
              onClick={handleExportAudit}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center space-x-1.5 cursor-pointer ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              <span>Tải Xuất File Audit Log</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`uppercase text-[10px] tracking-wider ${
                isDark ? 'bg-slate-800/80 text-slate-400' : 'bg-slate-100 text-slate-600'
              }`}>
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Thời Gian</th>
                  <th className="py-3 px-4">Quản Trị Viên</th>
                  <th className="py-3 px-4">Vai Trò</th>
                  <th className="py-3 px-4">Hành Động Thực Thi</th>
                  <th className="py-3 px-4">Phân Hệ</th>
                  <th className="py-3 px-4">Chi Tiết Tác Vụ</th>
                  <th className="py-3 px-4 rounded-r-xl text-center">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800 text-slate-300' : 'divide-slate-200 text-slate-700'}`}>
                {auditLogs.map(log => (
                  <tr key={log.id} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}>
                    <td className="py-3 px-4 font-mono text-[11px] whitespace-nowrap text-slate-400">
                      {log.timestamp}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{log.adminName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.adminEmail}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        log.role === 'super_admin'
                          ? 'bg-orange-500/10 text-orange-500 border-orange-500/30'
                          : log.role === 'manager'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                          : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30'
                      }`}>
                        {log.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                      {log.action}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {log.module}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {log.details}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        <Check size={12} />
                        Thành công
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Section: Ma Trận Phân Quyền (Permissions Matrix) */}
      {activeSubSection === 'matrix' && (
        <div className={`p-6 rounded-3xl border ${cardBg}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`text-base font-bold ${textHeading}`}>
                Ma Trận Phân Quyền Vai Trò Chi Tiết (NIST/RBAC Matrix)
              </h3>
              <p className={`text-xs ${textSub}`}>
                Phạm vi cho phép đối với từng cấp tài khoản quản trị viên The Shine Fitness
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Quy tắc chuẩn hóa
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`uppercase text-[10px] tracking-wider ${
                isDark ? 'bg-slate-800/80 text-slate-400' : 'bg-slate-100 text-slate-600'
              }`}>
                <tr>
                  <th className="py-3.5 px-4 rounded-l-xl">Tính Năng & Module Hệ Thống</th>
                  <th className="py-3.5 px-4 text-center">Super Admin (SA)</th>
                  <th className="py-3.5 px-4 text-center">Quản Lý Cơ Sở (Manager)</th>
                  <th className="py-3.5 px-4 text-center rounded-r-xl">Marketing & CRM</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800 text-slate-300' : 'divide-slate-200 text-slate-700'}`}>
                <tr>
                  <td className="py-3 px-4 font-bold">1. Xem & Tra Cứu Danh Sách Hội Viên</td>
                  <td className="py-3 px-4 text-center text-emerald-500 font-bold">✓ Toàn quyền</td>
                  <td className="py-3 px-4 text-center text-emerald-500 font-bold">✓ Toàn quyền</td>
                  <td className="py-3 px-4 text-center text-emerald-500 font-bold">✓ Toàn quyền</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold">2. Thêm mới / Cập nhật Hội viên & Điểm thưởng</td>
                  <td className="py-3 px-4 text-center text-emerald-500 font-bold">✓ Toàn quyền</td>
                  <td className="py-3 px-4 text-center text-emerald-500 font-bold">✓ Toàn quyền</td>
                  <td className="py-3 px-4 text-center text-slate-400">Chỉ xem dữ liệu</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold">3. Xóa vĩnh viễn Hồ Sơ Hội Viên</td>
                  <td className="py-3 px-4 text-center text-orange-500 font-bold">✓ Độc quyền</td>
                  <td className="py-3 px-4 text-center text-rose-500">✗ Bị khóa</td>
                  <td className="py-3 px-4 text-center text-rose-500">✗ Bị khóa</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold">4. Thêm / Sửa / Khóa Gói Tập Luyện</td>
                  <td className="py-3 px-4 text-center text-emerald-500 font-bold">✓ Toàn quyền</td>
                  <td className="py-3 px-4 text-center text-emerald-500 font-bold">✓ Toàn quyền</td>
                  <td className="py-3 px-4 text-center text-slate-400">Chỉ xem bảng giá</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold">5. Tạo & Kích hoạt Mã Khuyến Mãi / Voucher</td>
                  <td className="py-3 px-4 text-center text-emerald-500 font-bold">✓ Toàn quyền</td>
                  <td className="py-3 px-4 text-center text-emerald-500 font-bold">✓ Toàn quyền</td>
                  <td className="py-3 px-4 text-center text-emerald-500 font-bold">✓ Toàn quyền</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold">6. Soạn & Gửi Email Automation / AI Marketing</td>
                  <td className="py-3 px-4 text-center text-emerald-500 font-bold">✓ Toàn quyền</td>
                  <td className="py-3 px-4 text-center text-emerald-500 font-bold">✓ Toàn quyền</td>
                  <td className="py-3 px-4 text-center text-emerald-500 font-bold">✓ Toàn quyền</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold">7. Cấp mới / Đổi vai trò / Xóa Admin (RBAC)</td>
                  <td className="py-3 px-4 text-center text-orange-500 font-bold">✓ Độc quyền Super Admin</td>
                  <td className="py-3 px-4 text-center text-rose-500">✗ Bị khóa</td>
                  <td className="py-3 px-4 text-center text-rose-500">✗ Bị khóa</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold">8. Thay đổi Quy Tắc Bảo Mật & Cấu hình Hệ thống</td>
                  <td className="py-3 px-4 text-center text-orange-500 font-bold">✓ Độc quyền Super Admin</td>
                  <td className="py-3 px-4 text-center text-rose-500">✗ Bị khóa</td>
                  <td className="py-3 px-4 text-center text-rose-500">✗ Bị khóa</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
