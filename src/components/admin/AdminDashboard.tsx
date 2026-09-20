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
  Compass,
  ChevronDown,
  ChevronRight,
  Plus,
  RefreshCw,
  Sparkles,
  SlidersHorizontal,
  Layers,
  Activity,
  FileSpreadsheet,
  TrendingUp,
  Menu,
  X
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
import { AdminAnalyticsOverview } from './AdminAnalyticsOverview';
import { AdminCustomersTab } from './AdminCustomersTab';
import { AdminCustomerJourneyTab } from './AdminCustomerJourneyTab';
import { AdminPKSegmentsTab } from './AdminPKSegmentsTab';
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

type DashboardTab = 'overview' | 'analytics' | 'customers' | 'customer_journey' | 'pk_segments' | 'packages' | 'promotions' | 'email_flows' | 'rbac';

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
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [activeNavGroupDropdown, setActiveNavGroupDropdown] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
      showToast('⚠️ Không thể tải toàn bộ dữ liệu. Vui lòng thử lại.');
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
      showToast(`✓ Đã cập nhật thông tin hội viên ${customer.fullName}`);
    } else {
      showToast('❌ Lỗi khi lưu hội viên');
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
      description: 'Hành động này sẽ xóa vĩnh viễn hồ sơ hội viên khỏi cơ sở dữ liệu hệ thống.',
      itemName: `${customer.fullName} (${customer.memberCode || customer.id})`,
      onConfirm: async () => {
        const success = await deleteCustomerFromFirebase(customer.id);
        if (success) {
          setCustomers(prev => prev.filter(c => c.id !== customer.id));
          setDeleteModalState(prev => ({ ...prev, isOpen: false }));
          showToast(`✓ Đã xóa hội viên ${customer.fullName}`);
        } else {
          showToast('❌ Không thể xóa hội viên');
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
      showToast('❌ Lỗi cập nhật giai đoạn hành trình');
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
      subject = `[The Shine] Thư mời kiểm tra thể trạng định kỳ - Đánh giá tiến độ của ${customer.fullName}`;
      objective = 'Mời kiểm tra lại thể trạng sau 60-90 ngày và nhận báo cáo tiến độ';
    } else if (type === 'week3_cheer') {
      subject = `[The Shine Coaching] Đồng hành tuần 3 - Bí quyết vượt chững cân cùng ${customer.fullName}`;
      objective = 'Động viên hội viên tuần 3-4, phòng ngừa nguy cơ mất lửa ngủ đông';
    } else {
      subject = `[Ưu Đãi Early Bird] Gia hạn thẻ tập The Shine nhận quà tặng tri ân dành riêng cho ${customer.fullName}`;
      objective = 'Ưu đãi gia hạn sớm 15% + Voucher 1 tháng cho bạn bè giới thiệu';
    }

    setComposeInitial({
      audience: customer.email || customer.fullName,
      voucher: type === 'renewal_gift' ? 'EARLYBIRD15' : 'FITNESS0D',
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
      showToast(`✓ Đã lưu gói tập "${pkg.name}"`);
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
      showToast(`✓ Đã cập nhật voucher "${promo.code}"`);
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
    <div className={`min-h-screen flex font-sans transition-colors duration-200 ${
      isDark ? 'bg-[#0B0F17] text-slate-100' : 'bg-[#F8FAFC] text-slate-900'
    }`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center space-x-2 text-xs font-bold font-sans ${
            isDark 
              ? 'bg-slate-900 text-white border-slate-700 shadow-black/60' 
              : 'bg-white text-slate-900 border-slate-200 shadow-slate-300/60'
          }`}>
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* LEFT VERTICAL SIDEBAR MENU NAV */}
      {(() => {
        const navGroups = [
          {
            id: 'analytics',
            name: 'Báo Cáo & Thống Kê',
            icon: BarChart3,
            badge: null,
            items: [
              { id: 'overview' as DashboardTab, label: 'Tổng quan KPI', sublabel: 'KPIs & doanh thu', icon: BarChart3, badge: null },
              { id: 'analytics' as DashboardTab, label: 'Xu hướng & Tương tác', sublabel: 'Biểu đồ tăng trưởng & nguồn lead', icon: TrendingUp, badge: null },
            ]
          },
          {
            id: 'crm',
            name: 'Khách Hàng & CRM',
            icon: Users,
            badge: customers.length,
            items: [
              { id: 'customers' as DashboardTab, label: 'Danh sách hội viên', sublabel: 'Hồ sơ, trạng thái & CRM', icon: Users, badge: customers.length },
              { id: 'customer_journey' as DashboardTab, label: 'Hành trình khách hàng', sublabel: 'Phễu ACCSR & chuyển đổi', icon: Compass, badge: null },
              { id: 'pk_segments' as DashboardTab, label: 'Phân khúc khách hàng', sublabel: 'Sàng lọc 4 phân khúc PK01–PK04', icon: SlidersHorizontal, badge: null },
            ]
          },
          {
            id: 'services',
            name: 'Dịch Vụ & Gói Tập',
            icon: Package,
            badge: packages.length + promotions.length,
            items: [
              { id: 'packages' as DashboardTab, label: 'Gói tập luyện', sublabel: 'Bảng giá & quyền lợi', icon: Package, badge: packages.length },
              { id: 'promotions' as DashboardTab, label: 'Khuyến mãi & Voucher', sublabel: 'Mã giảm giá', icon: Tag, badge: promotions.length },
            ]
          },
          {
            id: 'marketing',
            name: 'Marketing & AI',
            icon: Mail,
            badge: emailFlows.length,
            items: [
              { id: 'email_flows' as DashboardTab, label: 'Email tự động', sublabel: 'Kịch bản tự động', icon: Mail, badge: emailFlows.length },
            ]
          },
          {
            id: 'system',
            name: 'Hệ Thống & RBAC',
            icon: ShieldCheck,
            badge: adminUsers.length,
            items: [
              { id: 'rbac' as DashboardTab, label: 'Phân quyền Admin', sublabel: 'Quản trị tài khoản & audit log', icon: ShieldCheck, badge: adminUsers.length },
            ]
          },
        ];

        const currentGroup = navGroups.find(g => g.items.some(it => it.id === activeTab)) || navGroups[0];
        const currentSubItem = currentGroup.items.find(it => it.id === activeTab) || currentGroup.items[0];

        return (
          <>
            {/* Sidebar Navigation */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
              isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
            } ${
              isDark ? 'bg-[#0E131F] border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
            }`}>
              {/* Sidebar Header: Brand & Title */}
              <div className="p-4 border-b border-slate-800/60 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="flex flex-col items-start leading-none italic font-heading transform -skew-x-6 select-none shrink-0">
                    <span className="bg-orange-500 text-white px-1.5 py-0.5 text-[0.55rem] font-black uppercase tracking-widest mb-0.5 shadow-xs rounded-xs">
                      The
                    </span>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-orange-500 font-black text-xl uppercase tracking-tighter">Shine</span>
                      <span className={`font-black text-xl uppercase tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>Fitness</span>
                    </div>
                  </div>
                  <div className="border-l border-slate-300 dark:border-slate-800 pl-2">
                    <div className="font-heading font-black text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200">
                      Dashboard
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider border font-sans ${
                      isDark ? 'bg-slate-800 text-orange-400 border-slate-700' : 'bg-orange-50 text-orange-700 border-orange-200'
                    }`}>
                      CRM & RBAC
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsMobileSidebarOpen(false)} 
                  className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Sidebar Vertical Navigation List */}
              <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
                {navGroups.map(group => (
                  <div key={group.id} className="space-y-1">
                    <div className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                      {group.name}
                    </div>
                    {group.items.map(subItem => {
                      const Icon = subItem.icon;
                      const isActive = activeTab === subItem.id;
                      return (
                        <button
                          key={subItem.id}
                          onClick={() => {
                            setActiveTab(subItem.id);
                            setIsMobileSidebarOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/25 ring-1 ring-orange-500/30'
                              : isDark
                              ? 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 truncate pr-2">
                            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                            <span className="truncate">{subItem.label}</span>
                          </div>
                          {subItem.badge !== null && (
                            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0 ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {subItem.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Sidebar Footer: Admin Profile & Controls */}
              <div className="p-3 border-t border-slate-800/60 dark:border-slate-800 space-y-2 shrink-0">
                <div className={`flex items-center justify-between p-2 rounded-xl border ${
                  isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center space-x-2 truncate">
                    <div className="w-7 h-7 rounded-lg bg-orange-600/20 text-orange-600 dark:text-orange-400 font-bold text-xs flex items-center justify-center shrink-0">
                      {currentAdmin.fullName ? currentAdmin.fullName[0].toUpperCase() : 'A'}
                    </div>
                    <div className="text-left leading-tight truncate">
                      <div className="text-xs font-bold truncate">{currentAdmin.fullName}</div>
                      <div className="text-[10px] text-slate-400 truncate">{currentAdmin.roleTitle || 'Quản trị viên'}</div>
                    </div>
                  </div>
                  <button
                    onClick={onLogout}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer"
                    title="Đăng xuất khỏi Admin"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={toggleTheme}
                    className={`flex-1 p-2 rounded-xl border transition-all flex items-center justify-center space-x-1.5 text-xs font-semibold cursor-pointer ${
                      isDark 
                        ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-amber-300' 
                        : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                    }`}
                    title={isDark ? 'Chuyển sang Giao diện Sáng' : 'Chuyển sang Giao diện Tối'}
                  >
                    {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
                    <span className="text-[11px] font-bold">{isDark ? 'Light' : 'Dark'}</span>
                  </button>

                  <button
                    onClick={onExitAdmin}
                    className={`flex-1 p-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                      isDark 
                        ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' 
                        : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                    }`}
                    title="Xem trang Hội viên & Khách hàng"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-bold">Hội Viên</span>
                  </button>
                </div>
              </div>
            </aside>

            {/* Main Area Wrapper */}
            <div className="flex-1 flex flex-col min-w-0 min-h-screen">
              {/* Top Header Bar */}
              <header className={`sticky top-0 z-30 border-b backdrop-blur-md transition-colors ${
                isDark ? 'bg-[#0B0F17]/90 border-slate-800' : 'bg-white/90 border-slate-200 shadow-xs'
              }`}>
                <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
                  {/* Left: Mobile Drawer Trigger & Breadcrumb */}
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setIsMobileSidebarOpen(true)}
                      className="lg:hidden p-2 rounded-xl border text-slate-400 hover:text-white border-slate-700 cursor-pointer"
                    >
                      <Menu size={20} />
                    </button>

                    <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs font-semibold">
                      <span className="text-orange-500 font-bold hidden sm:inline">The Shine</span>
                      <ChevronRight size={12} className="text-slate-400 hidden sm:inline" />
                      <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{currentGroup.name}</span>
                      <ChevronRight size={12} className="text-slate-400" />
                      <span className="font-bold text-orange-600 dark:text-orange-400">{currentSubItem.label}</span>
                    </div>
                  </div>

                  {/* Right: Quick Action Buttons & Refresh */}
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    {activeTab === 'customers' && (
                      <button
                        onClick={() => setIsNewCustomerModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center space-x-1 cursor-pointer shadow-xs"
                      >
                        <Plus size={14} />
                        <span className="hidden sm:inline">+ Thêm Hội Viên</span>
                      </button>
                    )}
                    {activeTab === 'packages' && (
                      <button
                        onClick={() => setIsNewPackageModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition-colors flex items-center space-x-1 cursor-pointer shadow-xs"
                      >
                        <Plus size={14} />
                        <span className="hidden sm:inline">+ Thêm Gói Tập</span>
                      </button>
                    )}
                    {activeTab === 'promotions' && (
                      <button
                        onClick={() => setIsNewPromotionModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors flex items-center space-x-1 cursor-pointer shadow-xs"
                      >
                        <Plus size={14} />
                        <span className="hidden sm:inline">+ Tạo Voucher</span>
                      </button>
                    )}
                    {activeTab === 'rbac' && currentAdmin.role === 'super_admin' && (
                      <button
                        onClick={() => setIsNewAdminModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition-colors flex items-center space-x-1 cursor-pointer shadow-xs"
                      >
                        <Plus size={14} />
                        <span className="hidden sm:inline">+ Cấp Quyền Admin</span>
                      </button>
                    )}

                    {/* Refresh Button */}
                    <button
                      onClick={loadDashboardData}
                      disabled={loading}
                      className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                        isDark ? 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                      title="Làm mới dữ liệu hệ thống"
                    >
                      <RefreshCw size={14} className={loading ? 'animate-spin text-orange-500' : ''} />
                    </button>

                    {/* Quick Actions Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setQuickActionsOpen(!quickActionsOpen)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 shadow-md shadow-orange-600/25 flex items-center space-x-1.5 cursor-pointer active:scale-95 transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">+ Thao Tác</span>
                        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${quickActionsOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {quickActionsOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setQuickActionsOpen(false)} />
                          <div className={`absolute right-0 top-full mt-2 w-64 rounded-2xl border shadow-2xl z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-150 ${
                            isDark ? 'bg-slate-900 border-slate-700 text-white shadow-black/80' : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/80'
                          }`}>
                            <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                              Tác Vụ Quản Trị Nhanh
                            </div>
                            <div className="space-y-1 mt-1">
                              <button
                                onClick={() => { setIsNewCustomerModalOpen(true); setQuickActionsOpen(false); }}
                                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-2.5 transition-colors cursor-pointer ${
                                  isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-700'
                                }`}
                              >
                                <Users className="w-4 h-4 text-emerald-500" />
                                <span>Thêm Hội Viên Mới</span>
                              </button>
                              <button
                                onClick={() => { setIsNewPackageModalOpen(true); setQuickActionsOpen(false); }}
                                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-2.5 transition-colors cursor-pointer ${
                                  isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-700'
                                }`}
                              >
                                <Package className="w-4 h-4 text-orange-500" />
                                <span>Thêm Gói Tập Luyện Mới</span>
                              </button>
                              <button
                                onClick={() => { setIsNewPromotionModalOpen(true); setQuickActionsOpen(false); }}
                                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-2.5 transition-colors cursor-pointer ${
                                  isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-700'
                                }`}
                              >
                                <Tag className="w-4 h-4 text-purple-500" />
                                <span>Tạo Voucher Khuyến Mãi</span>
                              </button>
                              {currentAdmin.role === 'super_admin' && (
                                <button
                                  onClick={() => { setIsNewAdminModalOpen(true); setQuickActionsOpen(false); }}
                                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-2.5 transition-colors cursor-pointer ${
                                    isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  <ShieldCheck className="w-4 h-4 text-rose-500" />
                                  <span>Cấp Quyền Admin Mới</span>
                                </button>
                              )}
                              <div className={`my-1 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`} />
                              <button
                                onClick={() => { loadDashboardData(); setQuickActionsOpen(false); showToast('✓ Đang đồng bộ toàn bộ dữ liệu...'); }}
                                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-2.5 transition-colors cursor-pointer ${
                                  isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-700'
                                }`}
                              >
                                <RefreshCw className="w-4 h-4 text-cyan-500" />
                                <span>Đồng Bộ Toàn Bộ Dữ Liệu</span>
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </header>

              {/* Main Content Workspace */}
              <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full flex-1">

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

        {activeTab === 'analytics' && (
          <AdminAnalyticsOverview
            customers={customers}
            packages={packages}
            isDark={isDark}
            onNavigateTab={(tab) => setActiveTab(tab)}
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

        {activeTab === 'pk_segments' && (
          <AdminPKSegmentsTab
            customers={customers}
            isDark={isDark}
            onNavigateToCustomers={(pkFilter) => {
              setActiveTab('customers');
            }}
            onToast={showToast}
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
            onSaveAdmin={handleSaveAdmin}
            onRefreshData={loadDashboardData}
            onToast={showToast}
            onNavigateTab={(tab) => setActiveTab(tab as DashboardTab)}
          />
        )}
      </main>
    </div>
  </>
);
})()}

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
