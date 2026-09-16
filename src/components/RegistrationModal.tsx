import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Sparkles, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  Target, 
  Gift,
  Dumbbell,
  ArrowRight
} from 'lucide-react';
import { translations, Language } from '../translations';
import { saveRegistrationToFirebase } from '../lib/firebase';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language;
  defaultPackage?: string;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  lang = 'vi',
  defaultPackage
}) => {
  const t = translations[lang].bookingModal;
  const initialPkg = defaultPackage || t.packageOptions[0];

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    packageType: initialPkg,
    goal: t.goalOptions[0],
    preferredTime: t.timeOptions[2],
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState<any>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.fullName.trim()) {
      setErrorMessage(lang === 'vi' ? 'Vui lòng nhập Họ và tên của bạn.' : 'Please enter your full name.');
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMessage(lang === 'vi' ? 'Vui lòng nhập Số điện thoại liên hệ.' : 'Please enter your phone number.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMessage(lang === 'vi' ? 'Vui lòng nhập địa chỉ Email hợp lệ.' : 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const voucherCode = `SHINE-3DAY-${Math.floor(1000 + Math.random() * 9000)}`;
      const regRecord = {
        ...formData,
        voucherCode,
        createdAt: new Date().toISOString()
      };

      // Save directly to Firebase Firestore
      await saveRegistrationToFirebase(regRecord);

      setSuccessData(regRecord);
    } catch (err: any) {
      setErrorMessage(err.message || (lang === 'vi' ? 'Không thể kết nối máy chủ.' : 'Could not submit registration.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setSuccessData(null);
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[95vh] bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-y-auto my-auto transition-all">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/80 p-6 sm:p-7 text-white border-b-2 border-brand-orange relative">
          <button 
            onClick={handleResetAndClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-brand-orange text-white text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
              {t.badge}
            </span>
            <span className="text-xs text-amber-300 font-medium flex items-center gap-1">
              <Gift size={13} /> {lang === 'vi' ? 'Voucher 3 ngày trải nghiệm' : '3-Day Free Trial Pass'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-heading font-bold uppercase tracking-wide text-white">
            {t.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md leading-relaxed">
            {t.desc}
          </p>
        </div>

        {/* Success View */}
        {successData ? (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl">
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-emerald-900 dark:text-emerald-200">
                  {t.successTitle}
                </h3>
                <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-300">
                  {t.successSubtitle}
                </p>
              </div>
            </div>

            {/* Voucher Box */}
            <div className="bg-gradient-to-br from-brand-orange to-amber-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 opacity-15">
                <Dumbbell size={140} />
              </div>
              <div className="relative z-10">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-black/30 px-3 py-1 rounded-full inline-block mb-2">
                  {t.voucherCode}
                </span>
                <div className="text-2xl sm:text-3xl font-heading font-bold tracking-wider font-mono">
                  SHINE-TRIAL-{successData.id ? successData.id.replace('REG-', '') : 'FREE'}
                </div>
                <p className="text-xs sm:text-sm opacity-95 mt-2 leading-relaxed">
                  {t.voucherDesc}
                </p>
              </div>
            </div>

            {/* Information Summary */}
            <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-white/5">
                <span className="text-slate-500">{t.fullName}:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{successData.fullName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-white/5">
                <span className="text-slate-500">{t.phone}:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{successData.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-white/5">
                <span className="text-slate-500">{t.serviceInterest}:</span>
                <span className="font-semibold text-brand-orange">{successData.packageType}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full py-3.5 px-6 bg-brand-orange hover:bg-orange-600 text-white font-bold text-sm rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                {t.doneBtn} <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          /* Input Form */
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4 sm:space-y-5">
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs sm:text-sm rounded-xl flex items-center gap-2">
                <span>⚠️ {errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <User size={14} className="text-brand-orange" />
                  {t.fullName}
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder={t.fullNamePlaceholder}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-black/30 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:border-brand-orange transition-colors"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Phone size={14} className="text-brand-orange" />
                  {t.phone}
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={t.phonePlaceholder}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-black/30 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:border-brand-orange transition-colors"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail size={14} className="text-brand-orange" />
                {t.email}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={t.emailPlaceholder}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-black/30 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:border-brand-orange transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Package Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Dumbbell size={14} className="text-brand-orange" />
                  {t.serviceInterest}
                </label>
                <select
                  value={formData.packageType}
                  onChange={(e) => setFormData({ ...formData, packageType: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-black/30 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:border-brand-orange transition-colors"
                >
                  {t.packageOptions.map((opt, i) => (
                    <option key={i} value={opt} className="text-slate-900 dark:text-white dark:bg-neutral-900">
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preferred Time */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Clock size={14} className="text-brand-orange" />
                  {t.preferredTime}
                </label>
                <select
                  value={formData.preferredTime}
                  onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-black/30 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:border-brand-orange transition-colors"
                >
                  {t.timeOptions.map((time, idx) => (
                    <option key={idx} value={time} className="text-slate-900 dark:text-white dark:bg-neutral-900">
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Goal */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Target size={14} className="text-brand-orange" />
                {t.goal}
              </label>
              <select
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-black/30 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:border-brand-orange transition-colors"
              >
                {t.goalOptions.map((goal, idx) => (
                  <option key={idx} value={goal} className="text-slate-900 dark:text-white dark:bg-neutral-900">
                    {goal}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                {t.notes}
              </label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t.notesPlaceholder}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-black/30 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:border-brand-orange transition-colors"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-brand-orange hover:bg-orange-600 text-white font-bold text-sm sm:text-base rounded-2xl shadow-xl hover:shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{t.submitting}</span>
                  </>
                ) : (
                  <>
                    <span>{t.submitBtn}</span>
                    <Sparkles size={18} />
                  </>
                )}
              </button>
            </div>

            <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
              🔒 {lang === 'vi' ? 'Thông tin của bạn được bảo mật tuyệt đối và chỉ dùng để xếp lịch tập thử.' : 'Your information is strictly protected and only used for your trial scheduling.'}
            </p>
          </form>
        )}

      </div>
    </div>
  );
};
