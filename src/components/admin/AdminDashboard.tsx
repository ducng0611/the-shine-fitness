import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Package, 
  Tag, 
  Mail, 
  LogOut, 
  ExternalLink, 
  Moon, 
  Sun, 
  Database,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Compass
} from 'lucide-react';
import { 
  AdminUser, 
  GymPackage, 
  PromotionCampaign, 
  EmailMarketingFlow, 
  CustomerRecord,
  JourneyStage
} from '../../types';
import { 
  DEFAULT_ADMINS,
  getAdminUsersFromFirebase,
  saveAdminUserToFirebase,
  deleteAdminUserFromFirebase,
  getPackagesFromFirebase,
  savePackageToFirebase,
  deletePackageFromFirebase,
  getPromotionsFromFirebase,
  savePromotionToFirebase,
  deletePromotionFromFirebase,
  getEmailFlowsFromFirebase,
  saveEmailFlowToFirebase,
  deleteEmailFlowFromFirebase,
  getAllCustomersUnified,
  saveCustomerToFirebase,
  createCustomerInFirebase,
  deleteCustomerFromFirebase,
  syncDistinctPackagesToFirebase,
  syncCustomersToFirebase
} from '../../lib/firebase';

import { AdminOverviewTab } from './AdminOverviewTab';
import { AdminCustomersTab } from './AdminCustomersTab';
import { AdminCustomerJourneyTab } from './AdminCustomerJourneyTab';
import { AdminPackagesTab } from './AdminPackagesTab';
import { AdminPromotionsTab } from './AdminPromotionsTab';
import { AdminEmailFlowsTab } from './AdminEmailFlowsTab';
import { AdminRbacTab } from './AdminRbacTab';
import { 
  EditCustomerModal, 
  NewCustomerModal, 
  GymPackageModal, 
  PromotionModal, 
  AdminUserModal 
} from './AdminModals';
import { AdminDeleteModal } from './AdminDeleteModal';

interface AdminDashboardProps {
  currentAdmin: AdminUser;
  onLogout: () => void;
  onExitAdmin: () => void;
}

type DashboardTab = 'overview' | 'customers' | 'customer_journey' | 'packages' | 'promotions' | 'email_flows' | 'rbac';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentAdmin,
  onLogout,
  onExitAdmin,
}) => {
  // Theme state: 'dark' or 'light'
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theshine_admin_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const isDark = theme === 'dark';

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theshine_admin_theme', next);
  };

  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [loading, setLoading] = useState<boolean>(true);

  // Firestore Data State
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [packages, setPackages] = useState<GymPackage[]>([]);
  const [promotions, setPromotions] = useState<PromotionCampaign[]>([]);
  const [emailFlows, setEmailFlows] = useState<EmailMarketingFlow[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(DEFAULT_ADMINS);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Modal visibility and state
  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(null);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<GymPackage | null>(null);
  const [isNewPackageModalOpen, setIsNewPackageModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<PromotionCampaign | null>(null);
  const [isNewPromotionModalOpen, setIsNewPromotionModalOpen] = useState(false);
  const [isNewAdminModalOpen, setIsNewAdminModalOpen] = useState(false);

  // Delete modal state
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    itemName: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    itemName: '',
    onConfirm: async () => {},
  });

  // State for composing email from other tabs
  const [composeInitial, setComposeInitial] = useState<{
    audience?: string;
    voucher?: string;
    objective?: string;
  }>({});

  // 1. Initial Data Fetching directly from Firestore
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedCustomers, fetchedPackages, fetchedPromos, fetchedFlows, fetchedAdmins] = await Promise.all([
        getAllCustomersUnified(),
        getPackagesFromFirebase(),
        getPromotionsFromFirebase(),
        getEmailFlowsFromFirebase(),
        getAdminUsersFromFirebase()
      ]);

      setCustomers(fetchedCustomers);
      setPackages(fetchedPackages);
      setPromotions(fetchedPromos);
      setEmailFlows(fetchedFlows);
      setAdminUsers(fetchedAdmins.length > 0 ? fetchedAdmins : DEFAULT_ADMINS);
    } catch (err) {
      console.error('Error loading Firestore dashboard data:', err);
      showToast('⚠️ Không thể tải toàn bộ dữ liệu từ Firestore. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Customer Actions
  const handleSaveCustomer = async (customer: CustomerRecord) => {
    const success = await saveCustomerToFirebase(customer);
    if (success) {
      setCustomers(prev => prev.map(c => c.id === customer.id ? customer : c));
      setEditingCustomer(null);
      showToast(`✓ Đã cập nhật thông tin hội viên ${customer.fullName} trên Firestore`);
    } else {
      showToast('❌ Lỗi khi lưu hội viên lên Firestore');
    }
  };

  const handleCreateCustomer = async (data: Partial<CustomerRecord>) => {
    try {
      const created = await createCustomerInFirebase(data);
      setCustomers(prev => [created, ...prev]);
      setIsNewCustomerModalOpen(false);
      showToast(`✓ Đã tạo thành công hội viên mới: ${created.fullName} (${created.memberCode})`);
    } catch (err) {
      console.error(err);
      showToast('❌ Không thể thêm hội viên mới');
    }
  };

  const handleDeleteCustomerClick = (customer: CustomerRecord) => {
    setDeleteModalState({
      isOpen: true,
      title: 'Xác Nhận Xóa Hội Viên',
      description: 'Hành động này sẽ xóa vĩnh viễn hồ sơ hội viên khỏi cơ sở dữ liệu Firebase Firestore.',
      itemName: `${customer.fullName} (${customer.memberCode || customer.id})`,
      onConfirm: async () => {
        const success = await deleteCustomerFromFirebase(customer.id);
        if (success) {
          setCustomers(prev => prev.filter(c => c.id !== customer.id));
          setDeleteModalState(prev => ({ ...prev, isOpen: false }));
          showToast(`✓ Đã xóa hội viên ${customer.fullName} khỏi Firestore`);
        } else {
          showToast('❌ Không thể xóa hội viên khỏi Firestore');
        }
      }
    });
  };

  // Customer Journey Actions
  const handleUpdateCustomerStage = async (customer: CustomerRecord, newStage: JourneyStage) => {
    const updated: CustomerRecord = {
      ...customer,
      journeyStage: newStage,
      lastContactedAt: new Date().toISOString()
    };
    const success = await saveCustomerToFirebase(updated);
    if (success) {
      setCustomers(prev => prev.map(c => c.id === customer.id ? updated : c));
      showToast(`✓ Đã cập nhật hành trình của ${customer.fullName} sang: ${newStage.toUpperCase()}`);
    } else {
      showToast('❌ Lỗi cập nhật giai đoạn hành trình trên Firestore');
    }
  };

  const handleSendZaloIntervention = (
    customer: CustomerRecord, 
    type: 'density_alert' | 'inbody_invite' | 'week3_cheer' | 'renewal_gift'
  ) => {
    let subject = '';
    let objective = '';
    if (type === 'density_alert') {
      subject = `[Zalo/SMS] Cảnh báo mật độ The Shine - Gợi ý tập luyện cho ${customer.fullName}`;
      objective = 'Cảnh báo giờ cao điểm 18h-20h (Khu tạ 95%, Cardio 30%, Xông hơi 20%)';
    } else if (type === 'inbody_invite') {
      subject = `[The Shine] Thư mời đo lại InBody 270 định kỳ - Đánh giá tiến độ của ${customer.fullName}`;
      objective = 'Mời đo lại InBody sau 60-90 ngày và nhận báo cáo trước - sau';
    } else if (type === 'week3_cheer') {
      subject = `[The Shine Coaching] Đồng hành tuần 3 - Bí quyết vượt chững cân cùng ${customer.fullName}`;
      objective = 'Động viên hội viên tuần 3-4, phòng ngừa nguy cơ mất lửa ngủ đông';
    } else {
      subject = `[Ưu Đãi Early Bird] Gia hạn thẻ tập The Shine nhận quà tặng tri ân dành riêng cho ${customer.fullName}`;
      objective = 'Ưu đãi gia hạn sớm 15% + Voucher 1 tháng cho bạn bè giới thiệu';
    }

    setComposeInitial({
      audience: customer.email || customer.fullName,
      voucher: type === 'renewal_gift' ? 'EARLYBIRD15' : 'INBODYFREE',
      objective: `${subject} - ${objective}`
    });
    setActiveTab('email_flows');
    showToast(`Đang mở luồng tự động hóa chăm sóc khách hàng cho ${customer.fullName}`);
  };

  // Package Actions
  const handleSavePackage = async (pkg: GymPackage) => {
    const success = await savePackageToFirebase(pkg);
    if (success) {
      setPackages(prev => {
        const exists = prev.some(p => p.id === pkg.id);
        return exists ? prev.map(p => p.id === pkg.id ? pkg : p) : [...prev, pkg];
      });
      setEditingPackage(null);
      setIsNewPackageModalOpen(false);
      showToast(`✓ Đã lưu gói tập "${pkg.name}" trên Firestore`);
    } else {
      showToast('❌ Lỗi lưu gói tập');
    }
  };

  const handleTogglePackage = async (pkg: GymPackage) => {
    const updated = { ...pkg, isActive: !pkg.isActive };
    await handleSavePackage(updated);
  };

  const handleDeletePackageClick = (pkg: GymPackage) => {
    setDeleteModalState({
      isOpen: true,
      title: 'Xóa Gói Tập Luyện',
      description: 'Gói tập này sẽ bị gỡ bỏ khỏi danh sách niêm yết trên hệ thống The Shine.',
      itemName: `${pkg.name} (${pkg.code})`,
      onConfirm: async () => {
        const success = await deletePackageFromFirebase(pkg.id);
        if (success) {
          setPackages(prev => prev.filter(p => p.id !== pkg.id));
          setDeleteModalState(prev => ({ ...prev, isOpen: false }));
          showToast(`✓ Đã xóa gói tập ${pkg.name}`);
        } else {
          showToast('❌ Không thể xóa gói tập');
        }
      }
    });
  };

  // Promotion Actions
  const handleSavePromotion = async (promo: PromotionCampaign) => {
    const success = await savePromotionToFirebase(promo);
    if (success) {
      setPromotions(prev => {
        const exists = prev.some(p => p.id === promo.id);
        return exists ? prev.map(p => p.id === promo.id ? promo : p) : [...prev, promo];
      });
      setEditingPromotion(null);
      setIsNewPromotionModalOpen(false);
      showToast(`✓ Đã cập nhật voucher "${promo.code}" trên Firestore`);
    } else {
      showToast('❌ Lỗi lưu voucher');
    }
  };

  const handleTogglePromotion = async (promo: PromotionCampaign) => {
    const updated = { ...promo, isActive: !promo.isActive };
    await handleSavePromotion(updated);
  };

  const handleDeletePromotionClick = (promo: PromotionCampaign) => {
    setDeleteModalState({
      isOpen: true,
      title: 'Xóa Mã Khuyến Mãi',
      description: 'Mã voucher này sẽ bị xóa khỏi hệ thống và không thể áp dụng được nữa.',
      itemName: `${promo.title} (Mã: ${promo.code})`,
      onConfirm: async () => {
        const success = await deletePromotionFromFirebase(promo.id);
        if (success) {
          setPromotions(prev => prev.filter(p => p.id !== promo.id));
          setDeleteModalState(prev => ({ ...prev, isOpen: false }));
          showToast(`✓ Đã xóa voucher ${promo.code}`);
        } else {
          showToast('❌ Không thể xóa voucher');
        }
      }
    });
  };

  // Flow Actions
  const handleToggleFlow = async (flow: EmailMarketingFlow) => {
    const isCurrentlyActive = flow.isActive ?? flow.status === 'active';
    const updated: EmailMarketingFlow = { 
      ...flow, 
      isActive: !isCurrentlyActive,
      status: !isCurrentlyActive ? 'active' : 'paused' 
    };
    const success = await saveEmailFlowToFirebase(updated);
    if (success) {
      setEmailFlows(prev => prev.map(f => f.id === flow.id ? updated : f));
      showToast(`✓ Đã ${updated.isActive ? 'kích hoạt' : 'tạm dừng'} luồng: ${flow.title || flow.name}`);
    }
  };

  const handleSaveFlow = async (flow: EmailMarketingFlow) => {
    const success = await saveEmailFlowToFirebase(flow);
    if (success) {
      setEmailFlows(prev => prev.map(f => f.id === flow.id ? flow : f));
      showToast(`✓ Đã lưu luồng "${flow.title || flow.name}"`);
    }
  };

  const handleDeleteFlow = async (flow: EmailMarketingFlow) => {
    const success = await deleteEmailFlowFromFirebase(flow.id);
    if (success) {
      setEmailFlows(prev => prev.filter(f => f.id !== flow.id));
      showToast(`✓ Đã xóa luồng "${flow.title || flow.name}"`);
    }
  };

  // RBAC Actions
  const handleSaveAdmin = async (user: AdminUser) => {
    const success = await saveAdminUserToFirebase(user);
    if (success) {
      setAdminUsers(prev => {
        const exists = prev.some(u => u.uid === user.uid);
        return exists ? prev.map(u => u.uid === user.uid ? user : u) : [...prev, user];
      });
      setIsNewAdminModalOpen(false);
      showToast(`✓ Đã cấp quyền quản trị cho ${user.fullName}`);
    } else {
      showToast('❌ Lỗi khi lưu tài khoản quản trị');
    }
  };

  const handleDeleteAdminClick = (user: AdminUser) => {
    if (user.uid === currentAdmin.uid) {
      showToast('⚠️ Không thể tự xóa tài khoản đang đăng nhập!');
      return;
    }
    setDeleteModalState({
      isOpen: true,
      title: 'Thu Hồi Quyền Quản Trị',
      description: 'Tài khoản này sẽ không còn quyền đăng nhập vào bảng quản trị The Shine.',
      itemName: `${user.fullName} (${user.email})`,
      onConfirm: async () => {
        const success = await deleteAdminUserFromFirebase(user.uid);
        if (success) {
          setAdminUsers(prev => prev.filter(u => u.uid !== user.uid));
          setDeleteModalState(prev => ({ ...prev, isOpen: false }));
          showToast(`✓ Đã thu hồi quyền quản trị của ${user.fullName}`);
        } else {
          showToast('❌ Lỗi khi thu hồi quyền');
        }
      }
    });
  };

  // Shortcuts to email flow
  const handleComposeForCustomer = (customer: CustomerRecord) => {
    setComposeInitial({
      audience: `Hội viên: ${customer.fullName} (${customer.packageInterested || customer.packageCode || 'Gói tập'})`,
      objective: `Chăm sóc và nâng cao trải nghiệm tập luyện cho hội viên ${customer.fullName}`,
      voucher: 'THESHINEVIP'
    });
    setActiveTab('email_flows');
  };

  const handleSendPromoToEmailFlow = (promo: PromotionCampaign) => {
    setComposeInitial({
      audience: `Tất cả hội viên và khách hàng tiềm năng The Shine Fitness`,
      objective: `Triển khai chương trình "${promo.title}" - Giảm ${promo.discountValue}${promo.discountType === 'percentage' ? '%' : 'đ'}`,
      voucher: promo.code
    });
    setActiveTab('email_flows');
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDark ? 'bg-[#0B0F17] text-slate-100' : 'bg-[#F8FAFC] text-slate-900'
    }`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center space-x-2 text-xs font-bold ${
            isDark 
              ? 'bg-slate-900 text-white border-slate-700 shadow-black/60' 
              : 'bg-white text-slate-900 border-slate-200 shadow-slate-300/60'
          }`}>
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${
        isDark ? 'bg-[#0B0F17]/90 border-slate-800' : 'bg-white/90 border-slate-200 shadow-xs'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand & Database Status */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center font-black text-white text-lg shadow-md shadow-orange-500/20">
              S
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-base tracking-wide uppercase">
                  The Shine Fitness
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                  isDark ? 'bg-slate-800 text-orange-400 border-slate-700' : 'bg-orange-50 text-orange-700 border-orange-200'
                }`}>
                  Admin CRM
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-[11px] text-emerald-500 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Firestore Live</span>
              </div>
            </div>
          </div>

          {/* Controls: Theme toggle, Admin details, Exit, Logout */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition-all flex items-center space-x-1.5 text-xs font-semibold ${
                isDark 
                  ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-amber-300' 
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
              title={isDark ? 'Chuyển sang giao diện Sáng (Light Mode)' : 'Chuyển sang giao diện Tối (Dark Mode)'}
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden md:inline">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span className="hidden md:inline">Dark Mode</span>
                </>
              )}
            </button>

            {/* Admin User Info */}
            <div className={`hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="w-6 h-6 rounded-lg bg-orange-600/20 text-orange-600 dark:text-orange-400 font-bold text-xs flex items-center justify-center">
                {currentAdmin.fullName ? currentAdmin.fullName[0].toUpperCase() : 'A'}
              </div>
              <div className="text-left leading-tight">
                <div className="text-xs font-bold">{currentAdmin.fullName}</div>
                <div className="text-[10px] text-slate-400">{currentAdmin.roleTitle || 'Quản trị viên'}</div>
              </div>
            </div>

            {/* Exit to Member Portal */}
            <button
              onClick={onExitAdmin}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center space-x-1.5 ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' 
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
              }`}
              title="Xem trang Hội viên & Khách hàng"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Trang Hội Viên</span>
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              className={`p-2 rounded-xl border text-rose-500 hover:bg-rose-500/10 transition-colors ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}
              title="Đăng xuất khỏi Admin"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Navigation Tabs Bar */}
        <div className={`p-1.5 rounded-2xl border flex items-center space-x-1 overflow-x-auto ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          {[
            { id: 'overview', label: 'Tổng Quan', icon: BarChart3, badge: null },
            { id: 'customers', label: 'Hội Viên & Khách Hàng', icon: Users, badge: customers.length },
            { id: 'customer_journey', label: 'Hành Trình Chuyển Đổi (ACCSR)', icon: Compass, badge: '5 Giai đoạn' },
            { id: 'packages', label: 'Gói Tập Luyện', icon: Package, badge: packages.length },
            { id: 'promotions', label: 'Khuyến Mãi & Voucher', icon: Tag, badge: promotions.length },
            { id: 'email_flows', label: 'Email Automation & AI', icon: Mail, badge: emailFlows.length },
            { id: 'rbac', label: 'Phân Quyền (RBAC)', icon: ShieldCheck, badge: adminUsers.length },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as DashboardTab)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== null && (
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <AdminOverviewTab
            customers={customers}
            packages={packages}
            promotions={promotions}
            isDark={isDark}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenNewCustomerModal={() => setIsNewCustomerModalOpen(true)}
            onOpenNewPackageModal={() => setIsNewPackageModalOpen(true)}
            onOpenNewPromotionModal={() => setIsNewPromotionModalOpen(true)}
          />
        )}

        {activeTab === 'customers' && (
          <AdminCustomersTab
            customers={customers}
            loading={loading}
            isDark={isDark}
            onRefreshData={loadDashboardData}
            onOpenNewModal={() => setIsNewCustomerModalOpen(true)}
            onEditCustomer={(cust) => setEditingCustomer(cust)}
            onDeleteCustomer={handleDeleteCustomerClick}
            onComposeEmailForCustomer={handleComposeForCustomer}
          />
        )}

        {activeTab === 'customer_journey' && (
          <AdminCustomerJourneyTab
            customers={customers}
            isDark={isDark}
            onUpdateCustomerStage={handleUpdateCustomerStage}
            onSendZaloIntervention={handleSendZaloIntervention}
            onNavigateToCustomerTab={() => setActiveTab('customers')}
          />
        )}

        {activeTab === 'packages' && (
          <AdminPackagesTab
            packages={packages}
            isDark={isDark}
            onOpenNewModal={() => setIsNewPackageModalOpen(true)}
            onEditPackage={(pkg) => setEditingPackage(pkg)}
            onTogglePackage={handleTogglePackage}
            onDeletePackage={handleDeletePackageClick}
          />
        )}

        {activeTab === 'promotions' && (
          <AdminPromotionsTab
            promotions={promotions}
            isDark={isDark}
            onOpenNewModal={() => setIsNewPromotionModalOpen(true)}
            onEditPromotion={(promo) => setEditingPromotion(promo)}
            onTogglePromotion={handleTogglePromotion}
            onDeletePromotion={handleDeletePromotionClick}
            onSendToEmailFlow={handleSendPromoToEmailFlow}
            onToast={showToast}
          />
        )}

        {activeTab === 'email_flows' && (
          <AdminEmailFlowsTab
            emailFlows={emailFlows}
            promotions={promotions}
            isDark={isDark}
            onToggleFlow={handleToggleFlow}
            onSaveFlow={handleSaveFlow}
            onDeleteFlow={handleDeleteFlow}
            onToast={showToast}
            initialAudience={composeInitial.audience}
            initialVoucher={composeInitial.voucher}
            initialObjective={composeInitial.objective}
          />
        )}

        {activeTab === 'rbac' && (
          <AdminRbacTab
            adminUsers={adminUsers}
            currentAdmin={currentAdmin}
            isDark={isDark}
            onOpenNewModal={() => setIsNewAdminModalOpen(true)}
            onDeleteAdmin={handleDeleteAdminClick}
          />
        )}
      </main>

      {/* MODALS */}
      {/* 1. Edit Customer Modal */}
      <EditCustomerModal
        isOpen={!!editingCustomer}
        customer={editingCustomer}
        isDark={isDark}
        onClose={() => setEditingCustomer(null)}
        onSave={handleSaveCustomer}
      />

      {/* 2. New Customer Modal */}
      <NewCustomerModal
        isOpen={isNewCustomerModalOpen}
        isDark={isDark}
        onClose={() => setIsNewCustomerModalOpen(false)}
        onCreate={handleCreateCustomer}
      />

      {/* 3. Package Modal (New or Edit) */}
      <GymPackageModal
        isOpen={isNewPackageModalOpen || !!editingPackage}
        packageItem={editingPackage}
        isDark={isDark}
        onClose={() => {
          setIsNewPackageModalOpen(false);
          setEditingPackage(null);
        }}
        onSave={handleSavePackage}
      />

      {/* 4. Promotion Modal (New or Edit) */}
      <PromotionModal
        isOpen={isNewPromotionModalOpen || !!editingPromotion}
        promotion={editingPromotion}
        isDark={isDark}
        onClose={() => {
          setIsNewPromotionModalOpen(false);
          setEditingPromotion(null);
        }}
        onSave={handleSavePromotion}
      />

      {/* 5. Admin User Modal */}
      <AdminUserModal
        isOpen={isNewAdminModalOpen}
        isDark={isDark}
        onClose={() => setIsNewAdminModalOpen(false)}
        onSave={handleSaveAdmin}
      />

      {/* 6. Universal Delete Modal */}
      <AdminDeleteModal
        isOpen={deleteModalState.isOpen}
        title={deleteModalState.title}
        description={deleteModalState.description}
        itemName={deleteModalState.itemName}
        isDark={isDark}
        onClose={() => setDeleteModalState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={deleteModalState.onConfirm}
      />
    </div>
  );
};
