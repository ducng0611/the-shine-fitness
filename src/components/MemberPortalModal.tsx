import React, { useState } from 'react';
import { 
  X, 
  QrCode, 
  Crown, 
  Calendar, 
  CheckCircle2, 
  LogOut, 
  Mail, 
  Phone, 
  Dumbbell,
  ScanLine,
  Sparkles,
  Award,
  Scale
} from 'lucide-react';
import { MemberUser } from './AuthModal';
import { Language, translations } from '../translations';
import { MemberCheckInQR } from './MemberCheckInQR';
import { MemberWorkoutLog } from './MemberWorkoutLog';
import { MemberProgressTracker } from './MemberProgressTracker';
import { MemberBadges } from './MemberBadges';

interface MemberPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: MemberUser;
  onLogout: () => void;
  lang?: Language;
}

export const MemberPortalModal: React.FC<MemberPortalModalProps> = ({
  isOpen,
  onClose,
  user,
  onLogout,
  lang = 'vi'
}) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'workout' | 'progress' | 'card' | 'badges'>('qr');

  if (!isOpen) return null;

  const t = translations[lang].memberPortal;
  const isVip = user.membershipTier.toUpperCase() === 'VIP';
  const isPremium = user.membershipTier.toUpperCase() === 'PREMIUM';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-xl sm:max-w-2xl bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden my-6">
        
        {/* Header */}
        <div className="bg-slate-950 p-5 sm:p-6 text-white border-b border-white/10 relative">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="bg-brand-orange text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
              The Shine Member
            </span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              {user.status || 'Active'}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-heading font-bold uppercase tracking-wide text-white">
            {t.title}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {lang === 'vi' 
              ? `Chào mừng ${user.gender === 'Nữ' ? 'Chị' : user.gender === 'Nam' ? 'Anh' : 'Anh/Chị'} quay trở lại` 
              : 'Welcome back'}, <strong className="text-white">{user.fullName}</strong>!
          </p>

          {/* Navigation Tabs (QR Check-in vs Workout Log vs Progress vs Digital Card) */}
          <div className="mt-5 grid grid-cols-3 sm:grid-cols-5 gap-1 sm:gap-2 bg-white/10 p-1 rounded-2xl border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('qr')}
              className={`py-2 px-1 sm:px-2 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer text-[10px] sm:text-[11px] md:text-xs ${
                activeTab === 'qr'
                  ? 'bg-brand-orange text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <ScanLine size={14} className="shrink-0" />
              <span className="truncate">{t.checkInTab}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5 shrink-0"></span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('workout')}
              className={`py-2 px-1 sm:px-2 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer text-[10px] sm:text-[11px] md:text-xs ${
                activeTab === 'workout'
                  ? 'bg-brand-orange text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Dumbbell size={14} className="shrink-0" />
              <span className="truncate">{t.workoutTab || (lang === 'vi' ? 'Nhật Ký Tập' : 'Workout Log')}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('progress')}
              className={`py-2 px-1 sm:px-2 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer text-[10px] sm:text-[11px] md:text-xs ${
                activeTab === 'progress'
                  ? 'bg-brand-orange text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Scale size={14} className="shrink-0" />
              <span className="truncate">{lang === 'vi' ? 'Tiến Trình' : 'Progress'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('badges')}
              className={`py-2 px-1 sm:px-2 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer text-[10px] sm:text-[11px] md:text-xs ${
                activeTab === 'badges'
                  ? 'bg-brand-orange text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Award size={14} className="shrink-0 hidden sm:block" />
              <span className="truncate">{lang === 'vi' ? 'Huy Hiệu' : 'Badges'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('card')}
              className={`py-2 px-1 sm:px-2 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer text-[10px] sm:text-[11px] md:text-xs ${
                activeTab === 'card'
                  ? 'bg-brand-orange text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Crown size={14} className="shrink-0" />
              <span className="truncate">{t.cardTab}</span>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          
          {/* TAB 1: DYNAMIC QR CHECK-IN AT RECEPTION */}
          {activeTab === 'qr' && (
            <div className="animate-fadeIn">
              <MemberCheckInQR user={user} lang={lang} />
            </div>
          )}

          {/* TAB 2: DAILY WORKOUT LOG (SETS, REPS, WEIGHTS) */}
          {activeTab === 'workout' && (
            <div className="animate-fadeIn">
              <MemberWorkoutLog user={user} lang={lang} />
            </div>
          )}

          {/* TAB 3: MEMBER PROGRESS (WEEKLY WEIGHT & PHOTOS) */}
          {activeTab === 'progress' && (
            <div className="animate-fadeIn">
              <MemberProgressTracker user={user} lang={lang} />
            </div>
          )}

          {/* TAB 5: BADGES */}
          {activeTab === 'badges' && (
            <div className="animate-fadeIn">
              <MemberBadges user={user} lang={lang} />
            </div>
          )}

          {/* TAB 4: DIGITAL MEMBERSHIP CARD & PRIVILEGES */}
          {activeTab === 'card' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Digital Membership Card */}
              <div className={`rounded-3xl p-6 text-white shadow-xl relative overflow-hidden ${
                isVip 
                  ? 'bg-gradient-to-br from-slate-900 via-amber-950 to-amber-900 border-2 border-amber-400/50' 
                  : isPremium 
                    ? 'bg-gradient-to-br from-slate-900 via-orange-950 to-brand-orange/90 border border-orange-500/40' 
                    : 'bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700'
              }`}>
                {/* Background Accent */}
                <div className="absolute -right-6 -bottom-6 opacity-10">
                  <Dumbbell size={160} />
                </div>

                <div className="relative z-10 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-300">
                        THE SHINE FITNESS & YOGA
                      </span>
                      <h3 className="text-xl sm:text-2xl font-heading font-bold uppercase italic tracking-wide">
                        {user.fullName}
                      </h3>
                      {user.gender && (
                        <span className="inline-block mt-1 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-white/20 text-slate-200">
                          {user.gender === 'Nam' ? '👨 Quý Anh (Nam)' : '👩 Quý Chị (Nữ)'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 px-3 py-1 bg-black/40 backdrop-blur-xs rounded-full border border-white/20 text-xs font-bold text-amber-300">
                      <Crown size={14} />
                      <span>{user.membershipTier}</span>
                    </div>
                  </div>

                  {/* QR Quick Toggle Box */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('qr')}
                    className="w-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-xs p-3 rounded-2xl flex items-center justify-between transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white text-slate-900 flex items-center justify-center">
                        <QrCode size={24} />
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-white">
                          {lang === 'vi' ? 'Chạm để phóng to mã QR Check-in' : 'Tap to expand check-in QR code'}
                        </div>
                        <div className="text-[11px] font-mono text-amber-300 font-bold">
                          {user.memberCode}
                        </div>
                      </div>
                    </div>
                    <ScanLine size={18} className="text-white/70" />
                  </button>

                  <div className="flex justify-between text-[11px] text-slate-300 pt-2 border-t border-white/15">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">{t.membershipCode}</div>
                      <div className="font-mono font-bold text-white">{user.memberCode}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase">{t.expiryDate}</div>
                      <div className="font-mono font-bold text-white">{user.expiryDate}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Membership Benefits List */}
              <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  {t.privileges} ({user.membershipTier})
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    <span>{lang === 'vi' ? 'Không giới hạn giờ tập (06:00 - 21:00 T2-T7, 06:00 - 20:30 CN)' : 'Unlimited club access (06:00 AM - 09:00 PM Mon-Sat, 06:00 AM - 08:30 PM Sun)'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    <span>{lang === 'vi' ? 'Đo chỉ số InBody định kỳ hàng tháng miễn phí cùng HLV' : 'Free monthly InBody analysis with a Personal Trainer'}</span>
                  </li>
                  {isVip && (
                    <>
                      <li className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold">
                        <Crown size={14} className="shrink-0" />
                        <span>{lang === 'vi' ? 'Tủ Locker VIP riêng biệt & Phòng xông hơi thảo dược' : 'Private VIP Locker & Herbal Sauna suite'}</span>
                      </li>
                      <li className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold">
                        <Crown size={14} className="shrink-0" />
                        <span>{lang === 'vi' ? '01 buổi tập 1-kèm-1 cùng Huấn luyện viên PT hàng tuần' : '1 weekly 1-on-1 session with a Personal Trainer'}</span>
                      </li>
                    </>
                  )}
                  {isPremium && !isVip && (
                    <li className="flex items-center gap-2 text-brand-orange font-semibold">
                      <CheckCircle2 size={14} className="shrink-0" />
                      <span>{lang === 'vi' ? 'Tham gia mọi lớp Yoga, Zumba, GroupX không giới hạn' : 'Unlimited access to all Yoga, Zumba & GroupX classes'}</span>
                    </li>
                  )}
                </ul>
              </div>

              {/* User Account Info */}
              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 px-1">
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-slate-400" />
                  <span>Email: <strong className="text-slate-900 dark:text-white">{user.email}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-slate-400" />
                  <span>{lang === 'vi' ? 'Điện thoại:' : 'Phone:'} <strong className="text-slate-900 dark:text-white">{user.phone}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400" />
                  <span>{t.startDate}: <strong className="text-slate-900 dark:text-white">{user.startDate}</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-5 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              {t.close}
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-200 dark:border-rose-900"
            >
              <LogOut size={14} /> {t.logout}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
