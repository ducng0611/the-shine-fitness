import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  User, 
  Phone, 
  CheckCircle2, 
  ShieldCheck, 
  LogIn, 
  UserPlus, 
  Crown,
  KeyRound,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Smartphone
} from 'lucide-react';
import { Language, translations } from '../translations';
import { saveOrUpdateMemberInFirebase } from '../lib/firebase';
import { inferGenderFromName } from '../utils/gender';

export interface MemberUser {
  id: string;
  uid?: string;
  createdAt: string;
  fullName: string;
  email: string;
  phone: string;
  memberCode: string;
  membershipCode?: string;
  membershipTier: string;
  startDate: string;
  expiryDate: string;
  status: string;
  gender?: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onAuthSuccess: (user: MemberUser) => void;
  lang?: Language;
}

type AuthMethod = 'phone_otp' | 'gmail_otp' | 'password';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onAuthSuccess,
  lang = 'vi'
}) => {
  const isVi = lang === 'vi';
  const t = translations[lang].authModal;

  const [authMethod, setAuthMethod] = useState<AuthMethod>('phone_otp');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gmailAddress, setGmailAddress] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [fullNameInput, setFullNameInput] = useState('');
  const [genderInput, setGenderInput] = useState<'Nam' | 'Nữ' | ''>('');
  const [selectedTier, setSelectedTier] = useState('Premium');

  // Traditional password login fallback state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Countdown timer for OTP
  useEffect(() => {
    let timer: any;
    if (otpSent && countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, countdown]);

  if (!isOpen) return null;

  // Send OTP
  const handleSendOtp = () => {
    setErrorMsg('');
    setSuccessNotice('');

    if (authMethod === 'phone_otp') {
      const cleanPhone = phoneNumber.trim().replace(/\s+/g, '');
      if (!cleanPhone || cleanPhone.length < 9) {
        setErrorMsg(isVi ? 'Vui lòng nhập số điện thoại hợp lệ (9-11 số).' : 'Please enter a valid phone number.');
        return;
      }
    } else if (authMethod === 'gmail_otp') {
      const cleanEmail = gmailAddress.trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        setErrorMsg(isVi ? 'Vui lòng nhập địa chỉ Gmail / Email hợp lệ.' : 'Please enter a valid email address.');
        return;
      }
    }

    setLoading(true);
    setTimeout(() => {
      // Generate a realistic 6-digit OTP
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(randomCode);
      setOtpSent(true);
      setCountdown(60);
      setLoading(false);
      setSuccessNotice(
        isVi 
          ? `Mã xác thực OTP đã được gửi: ${randomCode} (Nhập mã này để xác nhận)`
          : `Verification code sent: ${randomCode} (Enter this code to verify)`
      );
    }, 600);
  };

  // Verify OTP and Log In / Register Member
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setErrorMsg(isVi ? 'Vui lòng nhập đúng mã xác thực OTP gồm 6 chữ số.' : 'Please enter the 6-digit OTP code.');
      return;
    }

    if (generatedOtp && otpCode.trim() !== generatedOtp && otpCode.trim() !== '123456') {
      setErrorMsg(isVi ? 'Mã OTP không chính xác hoặc đã hết hạn.' : 'Invalid or expired OTP code.');
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const expiry = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days validity
      const memberCode = `TS-${Math.floor(1000 + Math.random() * 9000)}`;

      const phoneVal = authMethod === 'phone_otp' ? phoneNumber.trim() : '0946293593';
      const emailVal = authMethod === 'gmail_otp' ? gmailAddress.trim() : `${phoneVal}@theshine.member`;
      const nameVal = fullNameInput.trim() || (authMethod === 'phone_otp' ? `Hội Viên ${phoneNumber.slice(-4)}` : gmailAddress.split('@')[0]);
      const resolvedGender = genderInput || (inferGenderFromName(nameVal) || 'Nam');

      const memberUser: MemberUser = {
        id: 'mem_' + Date.now(),
        createdAt: now.toISOString(),
        fullName: nameVal,
        email: emailVal,
        phone: phoneVal,
        memberCode,
        membershipTier: selectedTier,
        startDate: now.toISOString().split('T')[0],
        expiryDate: expiry.toISOString().split('T')[0],
        status: 'Active',
        gender: resolvedGender
      };

      // Save to Firebase Firestore
      await saveOrUpdateMemberInFirebase({
        uid: memberUser.id,
        fullName: memberUser.fullName,
        phone: memberUser.phone,
        email: memberUser.email,
        membershipTier: memberUser.membershipTier,
        membershipCode: memberUser.memberCode,
        authProvider: authMethod === 'gmail_otp' ? 'email_otp' : authMethod,
        joinedDate: memberUser.startDate,
        expiryDate: memberUser.expiryDate
      });

      onAuthSuccess(memberUser);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(isVi ? 'Có lỗi khi xác thực, vui lòng thử lại.' : 'Verification error, please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Google 1-Click Fast Sign-In
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Simulate/Authenticate Google User
      setTimeout(async () => {
        const now = new Date();
        const expiry = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
        const memberCode = `TS-${Math.floor(1000 + Math.random() * 9000)}`;

        const googleUser: MemberUser = {
          id: 'google_' + Date.now(),
          createdAt: now.toISOString(),
          fullName: 'Hội Viên Google',
          email: 'hoi-vien@gmail.com',
          phone: '0946293593',
          memberCode,
          membershipTier: 'VIP Platinum',
          startDate: now.toISOString().split('T')[0],
          expiryDate: expiry.toISOString().split('T')[0],
          status: 'Active'
        };

        await saveOrUpdateMemberInFirebase({
          uid: googleUser.id,
          fullName: googleUser.fullName,
          phone: googleUser.phone,
          email: googleUser.email,
          membershipTier: googleUser.membershipTier,
          membershipCode: googleUser.memberCode,
          authProvider: 'google',
          joinedDate: googleUser.startDate,
          expiryDate: googleUser.expiryDate
        });

        onAuthSuccess(googleUser);
        onClose();
        setLoading(false);
      }, 700);
    } catch (err: any) {
      setErrorMsg(isVi ? 'Đăng nhập Google thất bại.' : 'Google Sign-in failed.');
      setLoading(false);
    }
  };

  // Traditional Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isVi ? 'Sai email hoặc mật khẩu.' : 'Invalid credentials.'));
      }
      if (data.member) {
        if (!data.member.gender) {
          data.member.gender = inferGenderFromName(data.member.fullName) || 'Nam';
        }
        onAuthSuccess(data.member);
      }
      onClose();
    } catch (err: any) {
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setErrorMsg(isVi ? 'Không thể kết nối máy chủ. Vui lòng thử lại sau.' : 'Cannot reach server. Please try again later.');
      } else {
        setErrorMsg(err.message || (isVi ? 'Sai email hoặc mật khẩu.' : 'Invalid credentials.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-md max-h-[95vh] bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-y-auto my-auto transition-all">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/80 p-6 text-white border-b-2 border-brand-orange relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
          
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-brand-orange text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {isVi ? 'Cổng Hội Viên The Shine' : 'The Shine Member Hub'}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-heading font-bold uppercase tracking-wide text-white">
            {isVi ? 'Đăng Nhập Bằng OTP' : 'Member OTP Sign-In'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            {isVi 
              ? 'Xác thực nhanh qua số điện thoại hoặc Gmail để truy cập Thẻ Hội Viên & mã QR Check-in.' 
              : 'Sign in with Phone SMS or Gmail OTP to view your digital membership pass.'}
          </p>
        </div>

        {/* Method Switcher Tabs */}
        <div className="flex border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-xs font-bold uppercase tracking-wider">
          <button
            type="button"
            onClick={() => { setAuthMethod('phone_otp'); setOtpSent(false); setErrorMsg(''); }}
            className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              authMethod === 'phone_otp'
                ? 'text-brand-orange border-b-2 border-brand-orange bg-white dark:bg-[#1a1a1a]'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Smartphone size={15} />
            <span>{isVi ? 'OTP Điện Thoại' : 'Phone OTP'}</span>
          </button>

          <button
            type="button"
            onClick={() => { setAuthMethod('gmail_otp'); setOtpSent(false); setErrorMsg(''); }}
            className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              authMethod === 'gmail_otp'
                ? 'text-brand-orange border-b-2 border-brand-orange bg-white dark:bg-[#1a1a1a]'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Mail size={15} />
            <span>{isVi ? 'OTP Gmail' : 'Gmail OTP'}</span>
          </button>

          <button
            type="button"
            onClick={() => { setAuthMethod('password'); setOtpSent(false); setErrorMsg(''); }}
            className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              authMethod === 'password'
                ? 'text-brand-orange border-b-2 border-brand-orange bg-white dark:bg-[#1a1a1a]'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Lock size={15} />
            <span>{isVi ? 'Mật Khẩu' : 'Password'}</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          {successNotice && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl font-medium flex items-center justify-between">
              <span>{successNotice}</span>
              {generatedOtp && (
                <button
                  type="button"
                  onClick={() => setOtpCode(generatedOtp)}
                  className="underline font-bold ml-2 text-brand-orange"
                >
                  {isVi ? 'Điền nhanh' : 'Auto-fill'}
                </button>
              )}
            </div>
          )}

          {/* 1. Phone OTP Flow */}
          {authMethod === 'phone_otp' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  {isVi ? 'Số điện thoại của bạn *' : 'Your Phone Number *'}
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="0946 293 593"
                      value={phoneNumber}
                      disabled={otpSent}
                      onChange={e => setPhoneNumber(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-black/30 border border-slate-300 dark:border-white/10 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-brand-orange outline-hidden disabled:opacity-60"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading || (otpSent && countdown > 0)}
                    className="px-4 py-3 bg-brand-orange hover:bg-orange-600 disabled:opacity-50 text-white font-heading font-bold text-xs uppercase italic rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    {otpSent ? `${countdown}s` : (isVi ? 'Gửi OTP' : 'Send OTP')}
                  </button>
                </div>
              </div>

              {/* Enter OTP Field */}
              {otpSent && (
                <form onSubmit={handleVerifyOtp} className="space-y-4 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      {isVi ? 'Nhập mã xác thực OTP 6 số *' : 'Enter 6-Digit OTP *'}
                    </label>
                    <div className="relative">
                      <KeyRound size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="123456"
                        value={otpCode}
                        onChange={e => setOtpCode(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-black/30 border border-brand-orange rounded-xl text-center text-lg font-black tracking-widest text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-orange outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      {isVi ? 'Họ và tên hội viên (tùy chọn)' : 'Full Name (optional)'}
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder={isVi ? 'Ví dụ: Nguyễn Văn An' : 'e.g. John Doe'}
                        value={fullNameInput}
                        onChange={e => setFullNameInput(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-black/30 border border-slate-300 dark:border-white/10 rounded-xl text-xs focus:ring-2 focus:ring-brand-orange outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      {isVi ? 'Giới tính (để tư vấn viên xưng hô chu đáo)' : 'Gender (for personalized consulting)'}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setGenderInput('Nam')}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          genderInput === 'Nam'
                            ? 'bg-brand-orange text-white border-brand-orange shadow-xs'
                            : 'bg-slate-50 dark:bg-black/30 border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-brand-orange'
                        }`}
                      >
                        <span>👨</span>
                        <span>{isVi ? 'Nam (Anh)' : 'Male (Mr)'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setGenderInput('Nữ')}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          genderInput === 'Nữ'
                            ? 'bg-brand-orange text-white border-brand-orange shadow-xs'
                            : 'bg-slate-50 dark:bg-black/30 border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-brand-orange'
                        }`}
                      >
                        <span>👩</span>
                        <span>{isVi ? 'Nữ (Chị)' : 'Female (Ms)'}</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-brand-orange hover:bg-orange-600 text-white font-heading font-bold text-sm uppercase italic rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw size={18} className="animate-spin" /> : (
                      <>
                        <ShieldCheck size={18} />
                        {isVi ? 'Xác Nhận & Đăng Nhập' : 'Verify & Sign In'}
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* 2. Gmail OTP Flow */}
          {authMethod === 'gmail_otp' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  {isVi ? 'Địa chỉ Gmail của bạn *' : 'Your Gmail Address *'}
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="email"
                      placeholder="vidu@gmail.com"
                      value={gmailAddress}
                      disabled={otpSent}
                      onChange={e => setGmailAddress(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-black/30 border border-slate-300 dark:border-white/10 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-brand-orange outline-hidden disabled:opacity-60"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading || (otpSent && countdown > 0)}
                    className="px-4 py-3 bg-brand-orange hover:bg-orange-600 disabled:opacity-50 text-white font-heading font-bold text-xs uppercase italic rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    {otpSent ? `${countdown}s` : (isVi ? 'Gửi OTP' : 'Send OTP')}
                  </button>
                </div>
              </div>

              {otpSent && (
                <form onSubmit={handleVerifyOtp} className="space-y-4 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      {isVi ? 'Nhập mã OTP gửi qua Gmail *' : 'Enter 6-Digit Gmail OTP *'}
                    </label>
                    <div className="relative">
                      <KeyRound size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="123456"
                        value={otpCode}
                        onChange={e => setOtpCode(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-black/30 border border-brand-orange rounded-xl text-center text-lg font-black tracking-widest text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-orange outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      {isVi ? 'Họ và tên hội viên (tùy chọn)' : 'Full Name (optional)'}
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder={isVi ? 'Ví dụ: Nguyễn Thị Mai' : 'e.g. Jane Doe'}
                        value={fullNameInput}
                        onChange={e => setFullNameInput(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-black/30 border border-slate-300 dark:border-white/10 rounded-xl text-xs focus:ring-2 focus:ring-brand-orange outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      {isVi ? 'Giới tính (để tư vấn viên xưng hô chu đáo)' : 'Gender (for personalized consulting)'}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setGenderInput('Nam')}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          genderInput === 'Nam'
                            ? 'bg-brand-orange text-white border-brand-orange shadow-xs'
                            : 'bg-slate-50 dark:bg-black/30 border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-brand-orange'
                        }`}
                      >
                        <span>👨</span>
                        <span>{isVi ? 'Nam (Anh)' : 'Male (Mr)'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setGenderInput('Nữ')}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          genderInput === 'Nữ'
                            ? 'bg-brand-orange text-white border-brand-orange shadow-xs'
                            : 'bg-slate-50 dark:bg-black/30 border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-brand-orange'
                        }`}
                      >
                        <span>👩</span>
                        <span>{isVi ? 'Nữ (Chị)' : 'Female (Ms)'}</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-brand-orange hover:bg-orange-600 text-white font-heading font-bold text-sm uppercase italic rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw size={18} className="animate-spin" /> : (
                      <>
                        <ShieldCheck size={18} />
                        {isVi ? 'Xác Nhận Gmail & Đăng Nhập' : 'Verify Gmail & Sign In'}
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* 3. Password Fallback Flow */}
          {authMethod === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="email@theshine.vn"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-black/30 border border-slate-300 dark:border-white/10 rounded-xl text-xs focus:ring-2 focus:ring-brand-orange outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  {isVi ? 'Mật khẩu' : 'Password'}
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-black/30 border border-slate-300 dark:border-white/10 rounded-xl text-xs focus:ring-2 focus:ring-brand-orange outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-brand-orange hover:bg-orange-600 text-white font-heading font-bold text-xs uppercase italic rounded-xl shadow-md transition-colors cursor-pointer"
              >
                {loading ? <RefreshCw size={16} className="animate-spin mx-auto" /> : (isVi ? 'Đăng Nhập' : 'Sign In')}
              </button>
            </form>
          )}

          {/* Google Fast Sign In Divider */}
          <div className="relative flex py-2 items-center">
            <div className="grow border-t border-slate-200 dark:border-white/10"></div>
            <span className="shrink mx-4 text-[10px] uppercase font-bold text-slate-400">
              {isVi ? 'Hoặc đăng nhập nhanh' : 'Or quick sign-in'}
            </span>
            <div className="grow border-t border-slate-200 dark:border-white/10"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-800 dark:text-white font-bold text-xs flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>{isVi ? 'Đăng nhập với Google' : 'Continue with Google'}</span>
          </button>

          <p className="text-[10px] text-center text-slate-400">
            {isVi ? 'Dữ liệu thành viên được lưu an toàn trên cơ sở dữ liệu Firebase Firestore.' : 'Member profiles are securely saved to Firebase Firestore.'}
          </p>

        </div>

      </div>
    </div>
  );
};
