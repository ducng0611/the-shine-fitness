import React from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  UserCheck, 
  Lock, 
  Key,
  Users
} from 'lucide-react';
import { AdminUser } from '../../types';

interface AdminRbacTabProps {
  adminUsers: AdminUser[];
  currentAdmin: AdminUser;
  isDark: boolean;
  onOpenNewModal: () => void;
  onDeleteAdmin: (admin: AdminUser) => void;
}

export const AdminRbacTab: React.FC<AdminRbacTabProps> = ({
  adminUsers,
  currentAdmin,
  isDark,
  onOpenNewModal,
  onDeleteAdmin,
}) => {
  const textHeading = isDark ? 'text-white' : 'text-slate-900';
  const textSub = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
              ● Role-Based Access Control
            </span>
            <span className={`text-xs font-semibold ${textSub}`}>
              {adminUsers.length} Tài Khoản Quản Trị
            </span>
          </div>
          <h2 className={`text-xl font-black ${textHeading}`}>
            Phân Quyền & Tài Khoản Quản Trị (RBAC)
          </h2>
          <p className={`text-xs mt-0.5 ${textSub}`}>
            Quản lý tài khoản và quyền hạn nhân sự (Super Admin, Quản lý cơ sở, Marketing).
          </p>
        </div>

        {currentAdmin.role === 'super_admin' && (
          <button
            onClick={onOpenNewModal}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 transition-all flex items-center space-x-1.5 shadow-md shadow-orange-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Tài Khoản Admin (Firestore)</span>
          </button>
        )}
      </div>

      {/* Admin Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {adminUsers.map(admin => (
          <div
            key={admin.uid}
            className={`p-6 rounded-2xl border flex flex-col justify-between transition-all ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border ${
                  isDark ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-orange-100 text-orange-600 border-orange-200'
                }`}>
                  {admin.role === 'super_admin' ? 'SA' : admin.role === 'manager' ? 'MG' : 'MK'}
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                    admin.role === 'super_admin'
                      ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30'
                      : admin.role === 'manager'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
                  }`}>
                    {admin.role === 'super_admin' ? 'Super Admin' : admin.role === 'manager' ? 'Quản lý' : 'Marketing'}
                  </span>

                  {currentAdmin.role === 'super_admin' && admin.email !== currentAdmin.email && (
                    <button
                      onClick={() => onDeleteAdmin(admin)}
                      title="Xóa tài khoản này"
                      className={`p-1.5 rounded-lg transition-colors ${
                        isDark ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800' : 'text-slate-500 hover:text-rose-600 hover:bg-slate-100'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <h3 className={`text-base font-bold ${textHeading}`}>{admin.fullName}</h3>
              <p className={`text-xs mt-0.5 ${textSub}`}>{admin.email}</p>
              {admin.roleTitle && (
                <p className="text-xs text-orange-600 dark:text-amber-400 font-semibold mt-1">
                  {admin.roleTitle}
                </p>
              )}

              {/* Permissions list */}
              <div className={`mt-4 pt-4 border-t space-y-2 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${textSub}`}>
                  Quyền hạn cấp:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {admin.permissions.map((p, idx) => (
                    <span
                      key={idx}
                      className={`text-[10px] px-2 py-0.5 rounded border ${
                        isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {p === 'all' ? 'Toàn quyền (All)' : p}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className={`mt-6 pt-4 border-t text-[11px] flex items-center justify-between ${
              isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'
            }`}>
              <span>Đăng nhập gần nhất:</span>
              <span className={`font-mono font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {admin.lastLogin ? new Date(admin.lastLogin).toLocaleDateString('vi-VN') : 'Vừa xong'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Permissions Matrix Table */}
      <div className={`p-6 rounded-2xl border ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <h3 className={`text-base font-bold mb-1 ${textHeading}`}>
          Ma Trận Phân Quyền Vai Trò (Permissions Matrix)
        </h3>
        <p className={`text-xs mb-4 ${textSub}`}>
          Quy định phạm vi truy cập chức năng cho từng cấp độ tài khoản
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`uppercase text-[10px] tracking-wider ${
              isDark ? 'bg-slate-800/80 text-slate-400' : 'bg-slate-100 text-slate-600'
            }`}>
              <tr>
                <th className="py-3 px-4 rounded-l-lg">Chức năng hệ thống</th>
                <th className="py-3 px-4 text-center">Super Admin</th>
                <th className="py-3 px-4 text-center">Quản Lý Cơ Sở (Manager)</th>
                <th className="py-3 px-4 text-center rounded-r-lg">Chuyên Viên Marketing</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800 text-slate-300' : 'divide-slate-200 text-slate-700'}`}>
              <tr>
                <td className="py-3 px-4 font-semibold">Xem & Thao tác Hội viên (CRM)</td>
                <td className="py-3 px-4 text-center text-emerald-600 dark:text-emerald-400 font-bold">✓ Đầy đủ</td>
                <td className="py-3 px-4 text-center text-emerald-600 dark:text-emerald-400 font-bold">✓ Đầy đủ</td>
                <td className="py-3 px-4 text-center text-emerald-600 dark:text-emerald-400 font-bold">✓ Xem & Soạn Mail</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold">Thêm / Sửa / Xóa Gói Tập Luyện</td>
                <td className="py-3 px-4 text-center text-emerald-600 dark:text-emerald-400 font-bold">✓ Đầy đủ</td>
                <td className="py-3 px-4 text-center text-emerald-600 dark:text-emerald-400 font-bold">✓ Đầy đủ</td>
                <td className="py-3 px-4 text-center text-slate-400">Chỉ xem</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold">Tạo & Quản lý Mã Voucher / CTKM</td>
                <td className="py-3 px-4 text-center text-emerald-600 dark:text-emerald-400 font-bold">✓ Đầy đủ</td>
                <td className="py-3 px-4 text-center text-emerald-600 dark:text-emerald-400 font-bold">✓ Đầy đủ</td>
                <td className="py-3 px-4 text-center text-emerald-600 dark:text-emerald-400 font-bold">✓ Đầy đủ</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold">Thiết kế Luồng Email Marketing & AI</td>
                <td className="py-3 px-4 text-center text-emerald-600 dark:text-emerald-400 font-bold">✓ Đầy đủ</td>
                <td className="py-3 px-4 text-center text-emerald-600 dark:text-emerald-400 font-bold">✓ Đầy đủ</td>
                <td className="py-3 px-4 text-center text-emerald-600 dark:text-emerald-400 font-bold">✓ Đầy đủ</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold">Phân quyền & Cấp tài khoản Admin mới</td>
                <td className="py-3 px-4 text-center text-orange-600 dark:text-orange-400 font-bold">✓ Độc quyền</td>
                <td className="py-3 px-4 text-center text-slate-400">✗ Không có quyền</td>
                <td className="py-3 px-4 text-center text-slate-400">✗ Không có quyền</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
