import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Plus, 
  Trash2, 
  Tag, 
  ShieldCheck, 
  DollarSign, 
  Clock, 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { 
  CustomerRecord, 
  GymPackage, 
  PromotionCampaign, 
  AdminUser, 
  PackageCategory, 
  DiscountType,
  AdminRole
} from '../../types';

// ==================== EDIT CUSTOMER MODAL ====================
interface EditCustomerModalProps {
  isOpen: boolean;
  customer: CustomerRecord | null;
  onClose: () => void;
  onSave: (customer: CustomerRecord) => Promise<void>;
  isDark: boolean;
}

export const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  isOpen,
  customer,
  onClose,
  onSave,
  isDark,
}) => {
  const [formData, setFormData] = useState<CustomerRecord | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData(customer ? { ...customer } : null);
  }, [customer]);

  if (!isOpen || !formData) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const inputClass = `w-full px-3 py-2 text-xs rounded-xl border transition-colors outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 ${
    isDark 
      ? 'bg-slate-800/90 border-slate-700 text-slate-100 placeholder-slate-500' 
      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
  }`;

  const labelClass = `block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`;
  const sectionClass = `p-4 rounded-xl border ${isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className={`w-full max-w-2xl rounded-2xl p-6 border shadow-2xl my-8 max-h-[90vh] overflow-y-auto ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold">Cập Nhật Hồ Sơ Hội Viên (Firestore)</h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Mã: <span className="font-mono text-orange-500 font-bold">{formData.memberCode || formData.id}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Mã Hội Viên</label>
              <input
                type="text"
                value={formData.memberCode || ''}
                onChange={(e) => setFormData({ ...formData, memberCode: e.target.value })}
                placeholder="TS_001..."
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Họ & Tên *</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Giới tính</label>
              <select
                value={formData.gender || 'Nam'}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className={inputClass}
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Số điện thoại *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Nghề nghiệp</label>
              <input
                type="text"
                value={formData.occupation || ''}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                placeholder="Kinh doanh, Kỹ sư..."
                className={inputClass}
              />
            </div>
          </div>

          <div className={sectionClass}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Gói Tập</label>
                <select
                  value={formData.packageCode || '12T'}
                  onChange={(e) => {
                    const code = e.target.value;
                    const map: Record<string, string> = {
                      '12T': 'Gói 12 Tháng (1 Năm)',
                      '6T': 'Gói 6 Tháng',
                      '3T': 'Gói 3 Tháng',
                      '1T': 'Gói 1 Tháng',
                      '24T': 'Gói 24 Tháng (2 Năm)',
                      '48T': 'Gói 48 Tháng (VIP Diamond)'
                    };
                    setFormData({ ...formData, packageCode: code, packageInterested: map[code] || code });
                  }}
                  className={inputClass}
                >
                  <option value="12T">12T - Gói 12 Tháng (1 Năm)</option>
                  <option value="6T">6T - Gói 6 Tháng</option>
                  <option value="3T">3T - Gói 3 Tháng</option>
                  <option value="1T">1T - Gói 1 Tháng</option>
                  <option value="24T">24T - Gói 24 Tháng (2 Năm)</option>
                  <option value="48T">48T - Gói 48 Tháng (VIP Diamond)</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Tổng Chi Tiêu (VNĐ)</label>
                <input
                  type="number"
                  value={formData.totalSpent || 0}
                  onChange={(e) => setFormData({ ...formData, totalSpent: Number(e.target.value) })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Trạng Thái Thẻ</label>
                <select
                  value={formData.membershipStatus || 'Đang hoạt động'}
                  onChange={(e) => setFormData({ ...formData, membershipStatus: e.target.value })}
                  className={inputClass}
                >
                  <option value="Đang hoạt động">Đang hoạt động</option>
                  <option value="Sắp hết hạn">Sắp hết hạn</option>
                  <option value="Đã dừng">Đã dừng</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              <div>
                <label className={labelClass}>Phân Khúc Khách Hàng</label>
                <select
                  value={formData.customerSegment || 'Khách hàng trung thành'}
                  onChange={(e) => setFormData({ ...formData, customerSegment: e.target.value })}
                  className={inputClass}
                >
                  <option value="VIP (Doanh thu cao)">⭐ VIP (Doanh thu cao)</option>
                  <option value="Khách hàng trung thành">🤝 Khách hàng trung thành</option>
                  <option value="Khách hàng tiềm năng">🎯 Khách hàng tiềm năng</option>
                  <option value="Nguy cơ churn">⚠️ Nguy cơ churn</option>
                  <option value="Khách mới">🌱 Khách mới</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Số Buổi Đã Check-in</label>
                <input
                  type="number"
                  value={formData.checkinCount || 0}
                  onChange={(e) => setFormData({ ...formData, checkinCount: Number(e.target.value) })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Số Buổi Tập Cùng PT</label>
                <input
                  type="number"
                  value={formData.ptSessions || 0}
                  onChange={(e) => setFormData({ ...formData, ptSessions: Number(e.target.value) })}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass}>Ghi chú chăm sóc hội viên</label>
            <textarea
              rows={2}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ghi chú sở thích, huấn luyện viên phụ trách, mục tiêu thể hình..."
              className={inputClass}
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-semibold rounded-xl border ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {saving ? 'Đang lưu vào Firestore...' : 'Lưu Thay Đổi (Firestore)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==================== NEW CUSTOMER MODAL ====================
interface NewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (customer: Partial<CustomerRecord>) => Promise<void>;
  onCreate?: (customer: Partial<CustomerRecord>) => Promise<void>;
  isDark: boolean;
}

export const NewCustomerModal: React.FC<NewCustomerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onCreate,
  isDark,
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    gender: 'Nam',
    occupation: '',
    packageCode: '12T',
    packageInterested: 'Gói 12 Tháng (1 Năm)',
    totalSpent: 6000000,
    customerSegment: 'Khách mới',
    membershipStatus: 'Đang hoạt động',
    status: 'member' as const,
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.phone.trim()) return;
    const handleSave = onSave || onCreate;
    if (!handleSave) return;
    setSaving(true);
    try {
      await handleSave({
        ...formData,
        memberCode: `TS_${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString(),
        checkinCount: 0,
        ptSessions: 0,
        daysSinceLastCheckin: 0,
        churnRisk: 'Thấp',
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const inputClass = `w-full px-3 py-2 text-xs rounded-xl border transition-colors outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 ${
    isDark 
      ? 'bg-slate-800/90 border-slate-700 text-slate-100 placeholder-slate-500' 
      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
  }`;

  const labelClass = `block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className={`w-full max-w-xl rounded-2xl p-6 border shadow-2xl my-8 max-h-[90vh] overflow-y-auto ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold">Thêm Khách Hàng Mới Trực Tiếp Lên Firestore</h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Hệ thống sẽ tạo mã hội viên tự động và lưu trữ tức thì vào database.
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Họ & Tên *</label>
              <input
                type="text"
                required
                placeholder="Nguyễn Văn A..."
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Số điện thoại *</label>
              <input
                type="text"
                required
                placeholder="0901234567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                placeholder="customer@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Giới tính</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className={inputClass}
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Nghề nghiệp</label>
              <input
                type="text"
                placeholder="Kinh doanh..."
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Gói Tập Mua</label>
              <select
                value={formData.packageCode}
                onChange={(e) => {
                  const code = e.target.value;
                  const map: Record<string, string> = {
                    '12T': 'Gói 12 Tháng (1 Năm)',
                    '6T': 'Gói 6 Tháng',
                    '3T': 'Gói 3 Tháng',
                    '1T': 'Gói 1 Tháng',
                    '24T': 'Gói 24 Tháng (2 Năm)',
                    '48T': 'Gói 48 Tháng (VIP Diamond)'
                  };
                  const priceMap: Record<string, number> = {
                    '12T': 6680000,
                    '6T': 4300000,
                    '3T': 2226000,
                    '1T': 748000,
                    '24T': 10943000,
                    '48T': 21400000
                  };
                  setFormData({ 
                    ...formData, 
                    packageCode: code, 
                    packageInterested: map[code] || code,
                    totalSpent: priceMap[code] || 6000000
                  });
                }}
                className={inputClass}
              >
                <option value="12T">12T - Gói 12 Tháng (1 Năm)</option>
                <option value="6T">6T - Gói 6 Tháng</option>
                <option value="3T">3T - Gói 3 Tháng</option>
                <option value="1T">1T - Gói 1 Tháng</option>
                <option value="24T">24T - Gói 24 Tháng (2 Năm)</option>
                <option value="48T">48T - Gói 48 Tháng (VIP Diamond)</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Tổng Chi Tiêu (VNĐ)</label>
              <input
                type="number"
                value={formData.totalSpent}
                onChange={(e) => setFormData({ ...formData, totalSpent: Number(e.target.value) })}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Ghi chú</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Nhu cầu giảm cân, PT kèm riêng..."
              className={inputClass}
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-semibold rounded-xl border ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {saving ? 'Đang tạo trên Firestore...' : 'Tạo Khách Hàng (Firestore)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==================== GYM PACKAGE MODAL ====================
interface PackageModalProps {
  isOpen: boolean;
  packageItem: GymPackage | null;
  onClose: () => void;
  onSave: (pkg: GymPackage) => Promise<void>;
  isDark: boolean;
}

export const GymPackageModal: React.FC<PackageModalProps> = ({
  isOpen,
  packageItem,
  onClose,
  onSave,
  isDark,
}) => {
  const [formData, setFormData] = useState<GymPackage>({
    id: '',
    name: '',
    nameEn: '',
    code: '12T',
    category: 'gym',
    durationDays: 365,
    durationLabel: '12 Tháng (1 Năm)',
    price: 6680000,
    originalPrice: 8000000,
    benefits: ['Tập không giới hạn khung giờ', 'Tủ đồ locker cá nhân', 'Đo InBody định kỳ'],
    isActive: true,
    isPopular: false,
    badge: 'Bán chạy nhất'
  });
  const [benefitInput, setBenefitInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (packageItem) {
      setFormData({ ...packageItem });
    } else {
      setFormData({
        id: `pkg_${Date.now()}`,
        name: '',
        nameEn: '',
        code: '12T',
        category: 'gym',
        durationDays: 365,
        durationLabel: '12 Tháng',
        price: 6000000,
        originalPrice: 7500000,
        benefits: ['Tập không giới hạn', 'Tủ locker cá nhân', 'Đo InBody miễn phí'],
        isActive: true,
        isPopular: false,
      });
    }
  }, [packageItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const addBenefit = () => {
    if (benefitInput.trim()) {
      setFormData({
        ...formData,
        benefits: [...formData.benefits, benefitInput.trim()]
      });
      setBenefitInput('');
    }
  };

  const removeBenefit = (idx: number) => {
    setFormData({
      ...formData,
      benefits: formData.benefits.filter((_, i) => i !== idx)
    });
  };

  const inputClass = `w-full px-3 py-2 text-xs rounded-xl border transition-colors outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 ${
    isDark 
      ? 'bg-slate-800/90 border-slate-700 text-slate-100 placeholder-slate-500' 
      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
  }`;

  const labelClass = `block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className={`w-full max-w-xl rounded-2xl p-6 border shadow-2xl my-8 max-h-[90vh] overflow-y-auto ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold">
              {packageItem ? 'Chỉnh Sửa Gói Tập (Firestore)' : 'Thêm Gói Tập Mới (Firestore)'}
            </h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Lưu trực tiếp vào bộ sưu tập packages trên Firebase Firestore
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className={labelClass}>Tên Gói Tập *</label>
              <input
                type="text"
                required
                placeholder="Gói 12 Tháng (1 Năm)..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Mã Gói (Code)</label>
              <input
                type="text"
                placeholder="12T, 6T, 3T..."
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Phân Loại</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as PackageCategory })}
                className={inputClass}
              >
                <option value="gym">Gym & Cardio</option>
                <option value="all_inclusive">Toàn Năng (All-Inclusive)</option>
                <option value="pt">Huấn Luyện Viên PT 1:1</option>
                <option value="special">Học Sinh / Sinh Viên</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Thời Hạn (Ngày)</label>
              <input
                type="number"
                value={formData.durationDays}
                onChange={(e) => setFormData({ ...formData, durationDays: Number(e.target.value) })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Nhãn Thời Hạn</label>
              <input
                type="text"
                placeholder="12 Tháng, 6 Tháng..."
                value={formData.durationLabel}
                onChange={(e) => setFormData({ ...formData, durationLabel: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Giá Bán Niêm Yết (VNĐ) *</label>
              <input
                type="number"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Giá Gốc Trước Khuyến Mãi</label>
              <input
                type="number"
                value={formData.originalPrice || 0}
                onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Huy hiệu (Badge)</label>
              <input
                type="text"
                placeholder="Bán chạy nhất, Tiết kiệm 40%..."
                value={formData.badge || ''}
                onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="flex items-center space-x-6 pt-5">
              <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                />
                <span>Đang kinh doanh</span>
              </label>
              <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPopular || false}
                  onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                  className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                />
                <span>Gói nổi bật</span>
              </label>
            </div>
          </div>

          {/* Benefits list */}
          <div>
            <label className={labelClass}>Quyền Lợi Đi Kèm</label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                placeholder="Nhập quyền lợi (VD: Tủ đồ cá nhân, Nước khoáng...)"
                value={benefitInput}
                onChange={(e) => setBenefitInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addBenefit(); } }}
                className={inputClass}
              />
              <button
                type="button"
                onClick={addBenefit}
                className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shrink-0"
              >
                Thêm
              </button>
            </div>

            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {formData.benefits.map((b, idx) => (
                <div key={idx} className={`flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs ${
                  isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="text-slate-300 dark:text-slate-300">{b}</span>
                  <button type="button" onClick={() => removeBenefit(idx)} className="text-rose-400 hover:text-rose-500 p-0.5">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-semibold rounded-xl border ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {saving ? 'Đang lưu Firestore...' : 'Lưu Gói Tập (Firestore)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==================== PROMOTION MODAL ====================
interface PromotionModalProps {
  isOpen: boolean;
  promotion: PromotionCampaign | null;
  onClose: () => void;
  onSave: (promo: PromotionCampaign) => Promise<void>;
  isDark: boolean;
}

export const PromotionModal: React.FC<PromotionModalProps> = ({
  isOpen,
  promotion,
  onClose,
  onSave,
  isDark,
}) => {
  const [formData, setFormData] = useState<PromotionCampaign>({
    id: '',
    title: '',
    description: '',
    code: '',
    discountType: 'percentage',
    discountValue: 20,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
    usageLimit: 100,
    usageCount: 0,
    applicablePackages: [],
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (promotion) {
      setFormData({ ...promotion });
    } else {
      setFormData({
        id: `promo_${Date.now()}`,
        title: '',
        description: '',
        code: `TS${Math.floor(100 + Math.random() * 900)}`,
        discountType: 'percentage',
        discountValue: 15,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
        usageLimit: 200,
        usageCount: 0,
        applicablePackages: [],
        isActive: true,
      });
    }
  }, [promotion, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.code.trim()) return;
    setSaving(true);
    try {
      await onSave({ ...formData, code: formData.code.toUpperCase().trim() });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const inputClass = `w-full px-3 py-2 text-xs rounded-xl border transition-colors outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 ${
    isDark 
      ? 'bg-slate-800/90 border-slate-700 text-slate-100 placeholder-slate-500' 
      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
  }`;

  const labelClass = `block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className={`w-full max-w-lg rounded-2xl p-6 border shadow-2xl my-8 max-h-[90vh] overflow-y-auto ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold">
              {promotion ? 'Chỉnh Sửa Mã Khuyến Mãi (Firestore)' : 'Tạo Mã Khuyến Mãi / Voucher Mới (Firestore)'}
            </h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Lưu trực tiếp vào bộ sưu tập promotions trên Firebase Firestore
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Mã Voucher (Code) *</label>
              <input
                type="text"
                required
                placeholder="TANBINH3D..."
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className={`${inputClass} font-mono font-bold text-orange-500`}
              />
            </div>
            <div>
              <label className={labelClass}>Tên Chiến Dịch *</label>
              <input
                type="text"
                required
                placeholder="Ưu Đãi Tân Binh 3 Ngày..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Mô Tả Chương Trình</label>
            <textarea
              rows={2}
              placeholder="Chi tiết điều kiện áp dụng, đối tượng khách hàng..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Hình Thức Giảm Giá</label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value as DiscountType })}
                className={inputClass}
              >
                <option value="percentage">Giảm theo % (Phần trăm)</option>
                <option value="fixed_amount">Giảm tiền cố định (VNĐ)</option>
                <option value="free_trial">Tập thử miễn phí (Free Trial)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Mức Giảm ({formData.discountType === 'percentage' ? '%' : 'VNĐ'})</label>
              <input
                type="number"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Ngày Bắt Đầu</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Ngày Kết Thúc</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Giới Hạn Lượt Dùng</label>
              <input
                type="number"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                className={inputClass}
              />
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                />
                <span>Kích hoạt mã ngay</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-semibold rounded-xl border ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {saving ? 'Đang lưu Firestore...' : 'Lưu Voucher (Firestore)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==================== ADMIN USER MODAL ====================
interface AdminUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (admin: AdminUser) => Promise<void>;
  isDark: boolean;
}

export const AdminUserModal: React.FC<AdminUserModalProps> = ({
  isOpen,
  onClose,
  onSave,
  isDark,
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'manager' as AdminRole,
    roleTitle: 'Quản Lý Cơ Sở Tân Bình',
  });
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) return;
    setSaving(true);
    try {
      const permissions = formData.role === 'super_admin' 
        ? ['all'] 
        : formData.role === 'manager' 
        ? ['customers', 'packages', 'promotions', 'reports'] 
        : ['customers_view', 'promotions', 'email_flows'];

      await onSave({
        uid: `admin_${Date.now()}`,
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        roleTitle: formData.roleTitle.trim(),
        permissions,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const inputClass = `w-full px-3 py-2 text-xs rounded-xl border transition-colors outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 ${
    isDark 
      ? 'bg-slate-800/90 border-slate-700 text-slate-100 placeholder-slate-500' 
      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
  }`;

  const labelClass = `block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className={`w-full max-w-md rounded-2xl p-6 border shadow-2xl my-8 max-h-[90vh] overflow-y-auto ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold">Thêm Nhân Sự Quản Trị (RBAC)</h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Cấp tài khoản & quyền truy cập vào Firebase Firestore
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <label className={labelClass}>Họ & Tên Nhân Sự *</label>
            <input
              type="text"
              required
              placeholder="Nguyễn Văn Quản Lý..."
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Email Đăng Nhập Quản Trị *</label>
            <input
              type="email"
              required
              placeholder="manager@theshinefitness.vn"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Vai Trò (Role RBAC)</label>
            <select
              value={formData.role}
              onChange={(e) => {
                const role = e.target.value as AdminRole;
                const titleMap: Record<AdminRole, string> = {
                  'super_admin': 'Tổng Quản Trị Hệ Thống (Super Admin)',
                  'manager': 'Quản Lý Cơ Sở Phòng Gym (Branch Manager)',
                  'marketing': 'Chuyên Viên Marketing & Khách Hàng (Marketing Lead)'
                };
                setFormData({ ...formData, role, roleTitle: titleMap[role] });
              }}
              className={inputClass}
            >
              <option value="manager">Quản Lý Cơ Sở (Manager)</option>
              <option value="marketing">Chuyên Viên Marketing (Marketing Lead)</option>
              <option value="super_admin">Super Admin (Toàn Quyền)</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Chức Danh / Bộ Phận</label>
            <input
              type="text"
              value={formData.roleTitle}
              onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-semibold rounded-xl border ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {saving ? 'Đang tạo...' : 'Cấp Quyền Tài Khoản (Firestore)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
