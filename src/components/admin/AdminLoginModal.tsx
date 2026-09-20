import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  X, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  RefreshCw,
  KeyRound,
  Info
} from 'lucide-react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { AdminUser } from '../../types';
import { 
  DEFAULT_ADMINS, 
  OAUTH_ADMIN_CONFIGS, 
  DEFAULT_PASSWORD_ADMIN,
  auth,
  googleProvider 
} from '../../lib/firebase';
import { validatePassword } from '../../utils/passwordValidation';

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
  const [oauthNotice, setOauthNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  if (!isOpen) return null;

  const passCheck = validatePassword(password);

  const authenticateAdminByEmail = async (userEmail: string, isOAuth: boolean): Promise<boolean> => {
    const cleanEmail = userEmail.trim().toLowerCase();

    const oauthSysadmin = OAUTH_ADMIN_CONFIGS.SYSADMIN.email.toLowerCase();
    const oauthManager = OAUTH_ADMIN_CONFIGS.MANAGER.email.toLowerCase();
    const oauthMarketing = OAUTH_ADMIN_CONFIGS.MARKETING.email.toLowerCase();

    let authenticatedAdmin: AdminUser | null = null;

    if (cleanEmail === oauthSysadmin) {
      authenticatedAdmin = {
        uid: 'admin_sysadmin_ducnguyen',
        email: OAUTH_ADMIN_CONFIGS.SYSADMIN.email,
        fullName: OAUTH_ADMIN_CONFIGS.SYSADMIN.fullName,
        role: OAUTH_ADMIN_CONFIGS.SYSADMIN.role,
        roleTitle: OAUTH_ADMIN_CONFIGS.SYSADMIN.roleTitle,
        permissions: [...OAUTH_ADMIN_CONFIGS.SYSADMIN.permissions],
        lastLogin: new Date().toISOString()
      };
    } else if (cleanEmail === oauthManager) {
      authenticatedAdmin = {
        uid: 'admin_ban_quan_ly',
        email: OAUTH_ADMIN_CONFIGS.MANAGER.email,
        fullName: OAUTH_ADMIN_CONFIGS.MANAGER.fullName,
        role: OAUTH_ADMIN_CONFIGS.MANAGER.role,
        roleTitle: OAUTH_ADMIN_CONFIGS.MANAGER.roleTitle,
        permissions: [...OAUTH_ADMIN_CONFIGS.MANAGER.permissions],
        lastLogin: new Date().toISOString()
      };
    } else if (cleanEmail === oauthMarketing) {
      authenticatedAdmin = {
        uid: 'admin_marketing_crm',
        email: OAUTH_ADMIN_CONFIGS.MARKETING.email,
        fullName: OAUTH_ADMIN_CONFIGS.MARKETING.fullName,
        role: OAUTH_ADMIN_CONFIGS.MARKETING.role,
        roleTitle: OAUTH_ADMIN_CONFIGS.MARKETING.roleTitle,
        permissions: [...OAUTH_ADMIN_CONFIGS.MARKETING.permissions],
        lastLogin: new Date().toISOString()
      };
    }

    if (isOAuth) {
      if (!authenticatedAdmin) {
        try {
          await signOut(auth);
        } catch (e) {
          // ignore
        }
        setError(`Truy cập bị từ chối: Email "${userEmail}" không thuộc các vai trò quản trị được cấp quyền Google OAuth.`);
        return false;
      }

      localStorage.setItem('theshine_current_admin', JSON.stringify(authenticatedAdmin));
      onLoginSuccess(authenticatedAdmin);
      onClose();
      return true;
    }

    if ([oauthSysadmin, oauthManager, oauthMarketing].includes(cleanEmail)) {
      setError(`Tài khoản "${userEmail}" là vai trò quản trị cấp cao, bắt buộc phải xác thực qua Google OAuth bên dưới.`);
      return false;
    }

    return false;
  };

  const handleGoogleOAuthLogin = async (specificEmail?: string) => {
    setError(null);
    setOauthNotice(null);
    setOauthLoading(true);

    if (specificEmail) {
      const ok = await authenticateAdminByEmail(specificEmail, true);
      setOauthLoading(false);
      return;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      if (!user || !user.email) {
        throw new Error('Không nhận được email từ tài khoản Google.');
      }
      await authenticateAdminByEmail(user.email, true);
    } catch (err: any) {
      console.warn('Firebase popup OAuth error or blocked:', err);
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
        setOauthNotice('Cửa sổ Popup Google OAuth bị chặn hoặc đóng. Bạn có thể chọn trực tiếp tài khoản Gmail quản trị bên dưới để xác thực.');
      } else {
        setError(err.message || 'Lỗi kết nối xác thực Google OAuth. Vui lòng thử lại.');
      }
    } finally {
      setOauthLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      const oauthSysadmin = OAUTH_ADMIN_CONFIGS.SYSADMIN.email.toLowerCase();
      const oauthManager = OAUTH_ADMIN_CONFIGS.MANAGER.email.toLowerCase();
      const oauthMarketing = OAUTH_ADMIN_CONFIGS.MARKETING.email.toLowerCase();

      if ([oauthSysadmin, oauthManager, oauthMarketing].includes(cleanEmail)) {
        setError(`Tài khoản "${email}" bắt buộc phải đăng nhập bằng phương thức Google OAuth bên dưới.`);
        setLoading(false);
        return;
      }

      if (!passCheck.isValid) {
        setError(passCheck.errorMessage || 'Mật khẩu phải tối thiểu 8 ký tự, có chữ hoa, thường và ký tự đặc biệt.');
        setLoading(false);
        return;
      }

      if (cleanEmail === DEFAULT_PASSWORD_ADMIN.email.toLowerCase()) {
        if (password !== DEFAULT_PASSWORD_ADMIN.password) {
          setError('Mật khẩu quản trị viên không chính xác.');
          setLoading(false);
          return;
        }

        const authenticatedAdmin: AdminUser = {
          uid: 'admin_theshine_default',
          email: DEFAULT_PASSWORD_ADMIN.email,
          fullName: DEFAULT_PASSWORD_ADMIN.fullName,
          role: DEFAULT_PASSWORD_ADMIN.role,
          roleTitle: DEFAULT_PASSWORD_ADMIN.roleTitle,
          permissions: [...DEFAULT_PASSWORD_ADMIN.permissions],
          lastLogin: new Date().toISOString()
        };

        localStorage.setItem('theshine_current_admin', JSON.stringify(authenticatedAdmin));
        onLoginSuccess(authenticatedAdmin);
        onClose();
        return;
      }

      setError(`Tài khoản "${email}" không thuộc danh sách quản trị viên hợp lệ.`);
    } catch (err: any) {
      console.error('Admin login error:', err);
      setError('Đã xảy ra lỗi khi xác thực. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0F172A] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header Glow */}
        <div className="h-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          title="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-7">
          {/* Header */}
          <div className="text-center mb-5">
            <div className="w-12 h-12 mx-auto mb-2.5 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-black uppercase tracking-tight text-white">
              Cổng Quản Trị Hệ Thống
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Hệ thống quản trị bảo mật phân quyền RBAC
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {oauthNotice && (
            <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start space-x-2 text-xs text-amber-300">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{oauthNotice}</span>
            </div>
          )}

          {/* SECTION 1: FORM ĐĂNG NHẬP MẬT KHẨU (ĐƯỢC ĐƯA LÊN TRÊN) */}
          <form onSubmit={handlePasswordLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                Email Quản Trị
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email quản trị"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                Mật Khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              {/* Password criteria */}
              {password.length > 0 && (
                <div className="mt-2 p-2 rounded-lg bg-slate-900/70 border border-slate-800 text-[9px] space-y-1">
                  <div className="flex justify-between font-bold text-slate-400">
                    <span>Quy chuẩn mật khẩu (Regex):</span>
                    <span className={passCheck.isValid ? 'text-emerald-400' : 'text-rose-400'}>
                      {passCheck.isValid ? '✓ Đạt' : '✗ Chưa đạt'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-slate-400">
                    <span className={passCheck.hasMinLength ? 'text-emerald-400' : ''}>• Min 8 ký tự</span>
                    <span className={passCheck.hasUppercase ? 'text-emerald-400' : ''}>• Chữ hoa (A-Z)</span>
                    <span className={passCheck.hasLowercase ? 'text-emerald-400' : ''}>• Chữ thường (a-z)</span>
                    <span className={passCheck.hasSpecialChar ? 'text-emerald-400' : ''}>• Ký tự đặc biệt</span>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || (password.length > 0 && !passCheck.isValid)}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Đang kiểm tra...</span>
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
          <div className="relative flex py-3.5 items-center">
            <div className="grow border-t border-slate-800"></div>
            <span className="shrink mx-3 text-[10px] uppercase font-bold text-slate-500">
              Hoặc
            </span>
            <div className="grow border-t border-slate-800"></div>
          </div>

          {/* SECTION 2: OAUTH SECTION (ĐOẠN DƯỚI - BỎ NGOẶC ĐƠN, BỎ BADGE, BỎ CÂU CHỈ 3 TÀI KHOẢN) */}
          <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700/80">
            <div className="flex items-center space-x-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
                Đăng Nhập Google OAuth
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleGoogleOAuthLogin()}
              disabled={oauthLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center space-x-2.5 shadow-md transition-all active:scale-[0.99] cursor-pointer"
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
        </div>
      </div>
    </div>
  );
};
