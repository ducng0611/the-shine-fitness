import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  TrendingUp, 
  Tag, 
  Database,
  Eye,
  EyeOff
} from 'lucide-react';
import { GymPackage } from '../../types';

interface AdminPackagesTabProps {
  packages: GymPackage[];
  isDark: boolean;
  onOpenNewModal: () => void;
  onEditPackage: (pkg: GymPackage) => void;
  onTogglePackage: (pkg: GymPackage) => void;
  onDeletePackage: (pkg: GymPackage) => void;
}

export const AdminPackagesTab: React.FC<AdminPackagesTabProps> = ({
  packages,
  isDark,
  onOpenNewModal,
  onEditPackage,
  onTogglePackage,
  onDeletePackage,
}) => {
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredPackages = packages.filter(pkg => {
    if (categoryFilter === 'all') return true;
    return pkg.category === categoryFilter;
  });

  const textHeading = isDark ? 'text-white' : 'text-slate-900';
  const textSub = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className={`p-5 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              ● Firestore Packages
            </span>
            <span className={`text-xs font-semibold ${textSub}`}>
              {packages.length} Gói Đang Quản Lý
            </span>
          </div>
          <h2 className={`text-xl font-black ${textHeading}`}>
            Quản Lý Gói Tập & Thẻ Hội Viên
          </h2>
          <p className={`text-xs mt-0.5 ${textSub}`}>
            Các gói tập được lưu trữ và cập nhật trực tiếp trên Firebase Firestore. Mọi thay đổi sẽ hiển thị ngay cho khách hàng.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={onOpenNewModal}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 transition-all flex items-center space-x-1.5 shadow-md shadow-orange-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Gói Mới (Firestore)</span>
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'Tất cả các gói' },
          { id: 'gym', label: 'Gym & Cardio' },
          { id: 'all_inclusive', label: 'Toàn Năng (All-Inclusive)' },
          { id: 'pt', label: 'Huấn Luyện Viên PT 1:1' },
          { id: 'special', label: 'Học Sinh / Sinh Viên' }
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setCategoryFilter(f.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              categoryFilter === f.id
                ? 'bg-orange-500 text-white shadow-sm'
                : isDark
                ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPackages.map(pkg => (
          <div
            key={pkg.id}
            className={`relative p-6 rounded-2xl border transition-all flex flex-col justify-between ${
              pkg.isActive 
                ? isDark 
                  ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700' 
                  : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                : isDark
                ? 'bg-slate-950/60 border-slate-900 opacity-60'
                : 'bg-slate-100 border-slate-200 opacity-60'
            }`}
          >
            {/* Badge */}
            {pkg.badge && (
              <div className="absolute top-4 right-4">
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                  {pkg.badge}
                </span>
              </div>
            )}

            <div>
              <div className="flex items-center space-x-2">
                <span className={`text-xs font-bold uppercase tracking-wider font-mono px-2 py-0.5 rounded border ${
                  isDark ? 'bg-slate-800 text-orange-400 border-slate-700' : 'bg-orange-50 text-orange-700 border-orange-200'
                }`}>
                  {pkg.code}
                </span>
                <span className={`text-[11px] font-semibold ${textSub}`}>
                  {pkg.durationDays} ngày
                </span>
              </div>

              <h3 className={`text-lg font-bold mt-2.5 ${textHeading}`}>{pkg.name}</h3>
              {pkg.nameEn && <p className={`text-xs ${textSub}`}>{pkg.nameEn}</p>}

              {/* Price */}
              <div className={`my-4 pb-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-black text-orange-600 dark:text-orange-400">
                    {pkg.price.toLocaleString('vi-VN')} VNĐ
                  </span>
                  <span className={`text-xs ${textSub}`}>/ {pkg.durationLabel}</span>
                </div>
                {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                  <div className={`text-xs line-through mt-0.5 ${textSub}`}>
                    Giá gốc: {pkg.originalPrice.toLocaleString('vi-VN')} VNĐ
                  </div>
                )}
              </div>

              {/* Benefits Checklist */}
              <div className="space-y-2 mb-6">
                <p className={`text-[11px] font-bold uppercase tracking-wider ${textSub}`}>
                  Quyền lợi gói tập:
                </p>
                {pkg.benefits.map((b, idx) => (
                  <div key={idx} className={`flex items-start space-x-2 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions & Status */}
            <div className={`pt-4 border-t flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <button
                onClick={() => onTogglePackage(pkg)}
                className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors flex items-center space-x-1.5 ${
                  pkg.isActive 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                    : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {pkg.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{pkg.isActive ? 'Đang Bán' : 'Tạm Ngưng'}</span>
              </button>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => onEditPackage(pkg)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="Chỉnh sửa gói"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeletePackage(pkg)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isDark ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800' : 'text-slate-600 hover:text-rose-600 hover:bg-slate-100'
                  }`}
                  title="Xóa gói"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
