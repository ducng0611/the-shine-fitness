import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  X, 
  Sparkles, 
  CheckCircle2, 
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { AdminUser, AdminRole } from '../../types';
import { DEFAULT_ADMINS, getAdminUsersFromFirebase } from '../../lib/firebase';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (admin: AdminUser) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      // Look up in configured admins
      const admins = await getAdminUsersFromFirebase();
      const matched = admins.find(a => a.email.toLowerCase() === cleanEmail) ||
        DEFAULT_ADMINS.find(a => a.email.toLowerCase() === cleanEmail);

      // Simple password check for demo admin access
      if (cleanEmail === 'ducnguyen06112002@gmail.com' || cleanEmail === 'admin@theshinefitness.vn' || cleanEmail === 'marketing@theshinefitness.vn') {
        if (!password || password.length < 4) {
          setError('Vui lòng nhập mật khẩu (tối thiểu 4 ký tự).');
          setLoading(false);
          return;
        }
      }

      if (matched) {
        const authenticatedAdmin: AdminUser = {
          ...matched,
          lastLogin: new Date().toISOString()
        };
        localStorage.setItem('theshine_current_admin', JSON.stringify(authenticatedAdmin));
        onLoginSuccess(authenticatedAdmin);
        onClose();
      } else {
        // If email not in admin list
        setError(`Email "${email}" chưa được cấp quyền quản trị trong hệ thống. Vui lòng liên hệ Super Admin.`);
      }
    } catch (err) {
      console.error('Admin login error:', err);
      setError('Đã xảy ra lỗi khi xác thực. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (admin: AdminUser) => {
    setEmail(admin.email);
    setPassword('admin123456');
    setError(null);
    
    // Direct login
    localStorage.setItem('theshine_current_admin', JSON.stringify(admin));
    onLoginSuccess(admin);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0F172A] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header Glow */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          title="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 md:p-8">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-lg text-white">THE SHINE FITNESS</h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  Admin Portal
                </span>
              </div>
              <p className="text-xs text-slate-400">Đăng nhập tài khoản Quản trị viên</p>
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Email Quản Trị
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ducnguyen06112002@gmail.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Mật Khẩu Quản Trị
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Đang xác thực...</span>
              ) : (
                <>
                  <span>Đăng Nhập Vào Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins for Instant Testing */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span>Đăng nhập nhanh (Tài khoản được phân quyền)</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </p>

            <div className="space-y-2">
              {DEFAULT_ADMINS.map((admin) => (
                <button
                  key={admin.uid}
                  type="button"
                  onClick={() => handleQuickLogin(admin)}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-orange-500/50 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs border border-orange-500/30">
                      {admin.role === 'super_admin' ? 'SA' : admin.role === 'manager' ? 'MG' : 'MK'}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">
                        {admin.fullName}
                      </p>
                      <p className="text-[11px] text-slate-400">{admin.email}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-700/80 text-slate-300 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                    Vào ngay
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-[11px] text-slate-400">
              Dữ liệu quản trị được đồng bộ và lưu trữ trên Firebase Firestore.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
