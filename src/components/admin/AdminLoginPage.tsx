import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  Info,
  RefreshCw,
  KeyRound
} from 'lucide-react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { AdminUser } from '../../types';
import { 
  auth,
  googleProvider
} from '../../lib/firebase';
import { validatePassword } from '../../utils/passwordValidation';

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
  const [oauthNotice, setOauthNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  // Realtime password evaluation
  const passCheck = validatePassword(password);

  // Google OAuth Login Action
  const handleGoogleOAuthLogin = async () => {
    setError(null);
    setOauthNotice(null);
    setOauthLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      if (!user || !user.email) {
        throw new Error('Không nhận được thông tin email từ tài khoản Google.');
      }

      const idToken = await user.getIdToken(true);
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        try {
          await signOut(auth);
        } catch (e) {
          // ignore
        }
        setError(data.error || `Truy cập bị từ chối: Tài khoản "${user.email}" không thuộc danh sách quản trị viên hợp lệ hoặc chưa được xác thực.`);
        return;
      }

      localStorage.setItem('theshine_current_admin', JSON.stringify(data.admin));
      onLoginSuccess(data.admin);
    } catch (err: any) {
      console.warn('Firebase popup OAuth error or blocked:', err);
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
        setOauthNotice('Cửa sổ Popup Google OAuth bị chặn hoặc đã đóng. Vui lòng mở lại và cho phép popup để đăng nhập.');
      } else {
        setError(err.message || 'Lỗi kết nối xác thực Google OAuth. Vui lòng thử lại.');
      }
    } finally {
      setOauthLoading(false);
    }
  };

  // Password Login Handler - Disabled for security
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('Phương thức đăng nhập mật khẩu đã bị vô hiệu hóa vì lý do bảo mật. Quản trị viên bắt buộc phải đăng nhập bằng Google OAuth bên dưới.');
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
        <div className="relative w-full max-w-lg bg-[#0F172A] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
          {/* Accent Line */}
          <div className="h-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500" />

          <div className="p-6 sm:p-8">
            {/* Title & Icon */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-xl font-black text-white uppercase tracking-tight">
                Xác Thực Quản Trị Viên
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                The Shine Fitness & Yoga Tân Bình
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-2.5 text-xs text-rose-300 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* OAuth Notice */}
            {oauthNotice && (
              <div className="mb-5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start space-x-2.5 text-xs text-amber-300 animate-fadeIn">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{oauthNotice}</span>
              </div>
            )}

            {/* SECTION 1: FORM ĐĂNG NHẬP BẰNG TÀI KHOẢN (ĐƯỢC ĐƯA LÊN TRÊN) */}
            <form onSubmit={handlePasswordLogin} className="space-y-4">
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
                    placeholder="Nhập email quản trị"
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
                    placeholder="Nhập mật khẩu"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                  />
                </div>

                {/* Password Rule Validation Criteria Checklist */}
                {password.length > 0 && (
                  <div className="mt-2.5 p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1.5 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Quy Chuẩn Mật Khẩu (Regex):
                      </span>
                      <span className={`text-[10px] font-extrabold ${passCheck.isValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {passCheck.isValid ? '✓ Đạt chuẩn' : '✗ Chưa đạt'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <div className={`flex items-center space-x-1.5 ${passCheck.hasMinLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {passCheck.hasMinLength ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>Tối thiểu 8 ký tự</span>
                      </div>

                      <div className={`flex items-center space-x-1.5 ${passCheck.hasUppercase ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {passCheck.hasUppercase ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>Chữ in hoa (A-Z)</span>
                      </div>

                      <div className={`flex items-center space-x-1.5 ${passCheck.hasLowercase ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {passCheck.hasLowercase ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>Chữ thường (a-z)</span>
                      </div>

                      <div className={`flex items-center space-x-1.5 ${passCheck.hasSpecialChar ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {passCheck.hasSpecialChar ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>Ký tự đặc biệt (@, #, $, ...)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || (password.length > 0 && !passCheck.isValid)}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span>Đang xác thực...</span>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Đăng Nhập Quản Trị</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* DIVIDER */}
            <div className="relative flex py-4 items-center">
              <div className="grow border-t border-slate-800"></div>
              <span className="shrink mx-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Hoặc
              </span>
              <div className="grow border-t border-slate-800"></div>
            </div>

            {/* SECTION 2: GOOGLE OAUTH (ĐOẠN DƯỚI - BỎ NGOẶC ĐƠN, BỎ BADGE, BỎ CÂU CHỈ 3 TÀI KHOẢN) */}
            <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/80">
              <div className="flex items-center space-x-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Đăng Nhập Google OAuth
                </span>
              </div>

              {/* Main Google OAuth Button */}
              <button
                type="button"
                onClick={() => handleGoogleOAuthLogin()}
                disabled={oauthLoading}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center space-x-3 shadow-md transition-all active:scale-[0.99] cursor-pointer"
              >
                {oauthLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-700" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                )}
                <span>Đăng Nhập Bằng Google</span>
              </button>
            </div>

            <div className="mt-5 pt-3 text-center border-t border-slate-800/60">
              <button
                onClick={onBackToHome}
                className="text-xs text-slate-400 hover:text-orange-400 transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Không phải quản trị viên? Quay lại Website Khách Hàng</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/60 py-3 px-4 text-center text-xs text-slate-500">
        The Shine Fitness & Yoga Management System • Phân quyền bảo mật đa lớp
      </footer>
    </div>
  );
};
