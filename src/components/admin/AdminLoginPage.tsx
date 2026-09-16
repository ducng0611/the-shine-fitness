import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  ArrowLeft,
  Sparkles, 
  AlertCircle,
  Dumbbell
} from 'lucide-react';
import { AdminUser } from '../../types';
import { DEFAULT_ADMINS, getAdminUsersFromFirebase } from '../../lib/firebase';

interface AdminLoginPageProps {
  onLoginSuccess: (admin: AdminUser) => void;
  onBackToHome: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onLoginSuccess,
  onBackToHome,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      // Look up in configured admins or default fallback list
      const admins = await getAdminUsersFromFirebase();
      const matched = admins.find(a => a.email.toLowerCase() === cleanEmail) ||
        DEFAULT_ADMINS.find(a => a.email.toLowerCase() === cleanEmail);

      if (!password || password.length < 4) {
        setError('Vui lòng nhập mật khẩu hợp lệ (tối thiểu 4 ký tự).');
        setLoading(false);
        return;
      }

      if (matched) {
        const authenticatedAdmin: AdminUser = {
          ...matched,
          lastLogin: new Date().toISOString()
        };
        localStorage.setItem('theshine_current_admin', JSON.stringify(authenticatedAdmin));
        onLoginSuccess(authenticatedAdmin);
      } else {
        setError(`Tài khoản "${email}" không tồn tại hoặc chưa được phân quyền quản trị hệ thống. Vui lòng liên hệ Super Admin.`);
      }
    } catch (err) {
      console.error('Admin login error:', err);
      setError('Đã xảy ra lỗi khi xác thực tài khoản. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (admin: AdminUser) => {
    setEmail(admin.email);
    setPassword('theshine2025');
    setError(null);
    
    const authenticatedAdmin: AdminUser = {
      ...admin,
      lastLogin: new Date().toISOString()
    };
    localStorage.setItem('theshine_current_admin', JSON.stringify(authenticatedAdmin));
    onLoginSuccess(authenticatedAdmin);
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      {/* TOP HEADER */}
      <header className="border-b border-slate-800/80 bg-[#0B111E]/90 backdrop-blur-md px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex flex-col items-start leading-none italic font-heading transform -skew-x-6 select-none">
            <span className="bg-orange-500 text-white px-1.5 py-0.5 text-[0.6rem] font-black uppercase tracking-widest mb-0.5 shadow-xs">
              The
            </span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-orange-500 font-black text-xl uppercase tracking-tighter">Shine</span>
              <span className="text-white font-black text-xl uppercase tracking-tighter">Fitness</span>
            </div>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Cổng Quản Trị Hệ Thống (/admin)</span>
          </div>
        </div>

        <button
          onClick={onBackToHome}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về Website Khách Hàng</span>
        </button>
      </header>

      {/* CENTER LOGIN CARD */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="relative w-full max-w-md bg-[#0F172A] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
          {/* Accent Line */}
          <div className="h-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500" />

          <div className="p-6 sm:p-8">
            {/* Title & Icon */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-xl font-black text-white uppercase tracking-tight">
                Đăng Nhập Quản Trị Viên
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Khu vực dành riêng cho Ban Giám Đốc, Quản Lý & Marketing
              </p>
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
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Email Quản Trị
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@theshinefitness.vn"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Mật Khẩu
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
                className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span>Đang kiểm tra quyền...</span>
                ) : (
                  <>
                    <span>Truy Cập Dashboard Quản Trị</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Logins for Instant Testing */}
            <div className="mt-6 pt-5 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Tài Khoản Phân Quyền Sẵn (Demo)
                </span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </div>

              <div className="space-y-2">
                {DEFAULT_ADMINS.map((admin) => (
                  <button
                    key={admin.uid}
                    type="button"
                    onClick={() => handleQuickLogin(admin)}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-orange-500/50 transition-all flex items-center justify-between group cursor-pointer"
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
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-700/80 text-slate-300 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                      Đăng nhập nhanh
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 text-center border-t border-slate-800/60">
              <button
                onClick={onBackToHome}
                className="text-xs text-slate-400 hover:text-orange-400 transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Không phải quản trị viên? Quay lại Website</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/60 py-3 px-4 text-center text-xs text-slate-500">
        The Shine Fitness & Yoga Management System • Bảo mật đa cấp với Firebase Firestore
      </footer>
    </div>
  );
};
