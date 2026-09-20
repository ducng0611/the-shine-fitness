import React, { useState, useEffect } from 'react';
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
  Scale,
  Edit3,
  Check,
  RotateCw,
  UserCheck,
  Radio
} from 'lucide-react';
import { MemberUser } from './AuthModal';
import { Language, translations } from '../translations';
import { MemberCheckInQR } from './MemberCheckInQR';
import { MemberWorkoutLog } from './MemberWorkoutLog';
import { MemberProgressTracker } from './MemberProgressTracker';
import { MemberBadges } from './MemberBadges';
import { findMemberInFirebase, saveOrUpdateMemberInFirebase } from '../lib/firebase';

interface MemberPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: MemberUser;
  onLogout: () => void;
  onUpdateUser?: (updated: MemberUser) => void;
  lang?: Language;
}

export const MemberPortalModal: React.FC<MemberPortalModalProps> = ({
  isOpen,
  onClose,
  user,
  onLogout,
  onUpdateUser,
  lang = 'vi'
}) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'workout' | 'progress' | 'card' | 'badges'>('qr');
  const [localUser, setLocalUser] = useState<MemberUser>(user);
  const [isSyncingFirebase, setIsSyncingFirebase] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editEmail, setEditEmail] = useState(user.email === 'hoi-vien@gmail.com' ? '' : user.email);
  const [editPhone, setEditPhone] = useState(user.phone === '0946293593' ? '' : user.phone);
  const [editFullName, setEditFullName] = useState(user.fullName);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Synchronize when prop user changes
  useEffect(() => {
    setLocalUser(user);
    setEditEmail(user.email === 'hoi-vien@gmail.com' ? '' : user.email);
    setEditPhone(user.phone === '0946293593' ? '' : user.phone);
    setEditFullName(user.fullName);
  }, [user]);

  // Sync / get latest member data directly from Firebase Firestore
  const fetchFromFirebase = async () => {
    setIsSyncingFirebase(true);
    setSaveSuccessMsg('');
    try {
      const fbRecord = await findMemberInFirebase({
        uid: user.id || user.uid,
        email: user.email === 'hoi-vien@gmail.com' ? undefined : user.email,
        phone: user.phone === '0946293593' ? undefined : user.phone,
        memberCode: user.memberCode
      });

      if (fbRecord) {
        const updated: MemberUser = {
          ...localUser,
          fullName: fbRecord.fullName || localUser.fullName,
          email: fbRecord.email || (localUser.email === 'hoi-vien@gmail.com' ? '' : localUser.email),
          phone: fbRecord.phone || (localUser.phone === '0946293593' ? '' : localUser.phone),
          memberCode: fbRecord.membershipCode || localUser.memberCode,
          membershipCode: fbRecord.membershipCode || localUser.membershipCode,
          membershipTier: fbRecord.membershipTier || localUser.membershipTier,
          startDate: fbRecord.joinedDate || localUser.startDate,
          expiryDate: fbRecord.expiryDate || localUser.expiryDate,
          gender: fbRecord.gender || localUser.gender,
          status: fbRecord.status || localUser.status
        };
        setLocalUser(updated);
        setEditEmail(updated.email);
        setEditPhone(updated.phone);
        setEditFullName(updated.fullName);
        if (onUpdateUser) onUpdateUser(updated);
      }
    } catch (err) {
      console.warn('Could not sync member data from Firebase:', err);
    } finally {
      setIsSyncingFirebase(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFromFirebase();
    }
  }, [isOpen, user.id, user.memberCode]);

  // Handle saving edited info directly to Firebase Firestore
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncingFirebase(true);
    try {
      const cleanEmail = editEmail.trim().toLowerCase();
      const cleanPhone = editPhone.trim().replace(/\s+/g, '');
      const cleanName = editFullName.trim() || localUser.fullName;

      const updatedUser: MemberUser = {
        ...localUser,
        fullName: cleanName,
        email: cleanEmail,
        phone: cleanPhone
      };

      // Persist to Firebase Firestore 'members' collection
      await saveOrUpdateMemberInFirebase({
        uid: localUser.id || localUser.uid || `mem_${Date.now()}`,
        fullName: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        membershipTier: localUser.membershipTier,
        membershipCode: localUser.memberCode,
        authProvider: 'google',
        joinedDate: localUser.startDate,
        expiryDate: localUser.expiryDate,
        gender: localUser.gender,
        status: localUser.status
      });

      setLocalUser(updatedUser);
      setIsEditingInfo(false);
      setSaveSuccessMsg(lang === 'vi' ? 'Đã lưu thông tin vào Firebase thành công!' : 'Saved to Firebase successfully!');
      if (onUpdateUser) onUpdateUser(updatedUser);
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error saving member info to Firebase:', err);
    } finally {
      setIsSyncingFirebase(false);
    }
  };

  if (!isOpen) return null;

  const t = translations[lang].memberPortal;
  const isVip = localUser.membershipTier.toUpperCase() === 'VIP';
  const isPremium = localUser.membershipTier.toUpperCase() === 'PREMIUM';

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-xs overflow-hidden animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="relative w-full max-w-lg md:max-w-3xl lg:max-w-4xl xl:max-w-5xl max-h-[92vh] sm:max-h-[88vh] flex flex-col bg-white dark:bg-[#15171e] text-slate-900 dark:text-slate-100 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden my-auto z-[10000]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="bg-slate-950 p-4 sm:p-5 text-white border-b border-white/10 relative shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-brand-orange text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
              The Shine Member
            </span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              {user.status || 'Active'}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-heading font-bold uppercase tracking-wide text-white">
            {t.title}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {lang === 'vi' 
              ? `Chào mừng ${user.gender === 'Nữ' ? 'Chị' : user.gender === 'Nam' ? 'Anh' : 'Anh/Chị'} quay trở lại` 
              : 'Welcome back'}, <strong className="text-white">{user.fullName}</strong>!
          </p>

          {/* Navigation Tabs - Responsive with no text truncation */}
          <div className="mt-3.5 flex overflow-x-auto no-scrollbar sm:grid sm:grid-cols-5 gap-1 sm:gap-1.5 bg-white/10 p-1 rounded-2xl border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('qr')}
              className={`py-2 px-2.5 sm:px-2 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 sm:shrink text-[11px] sm:text-xs ${
                activeTab === 'qr'
                  ? 'bg-brand-orange text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <ScanLine size={14} className="shrink-0" />
              <span>{lang === 'vi' ? 'Mã QR' : 'QR Check-in'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('workout')}
              className={`py-2 px-2.5 sm:px-2 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 sm:shrink text-[11px] sm:text-xs ${
                activeTab === 'workout'
                  ? 'bg-brand-orange text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Dumbbell size={14} className="shrink-0" />
              <span>{lang === 'vi' ? 'Nhật Ký Tập' : 'Workout Log'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('progress')}
              className={`py-2 px-2.5 sm:px-2 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 sm:shrink text-[11px] sm:text-xs ${
                activeTab === 'progress'
                  ? 'bg-brand-orange text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Scale size={14} className="shrink-0" />
              <span>{lang === 'vi' ? 'Tiến Trình' : 'Progress'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('badges')}
              className={`py-2 px-2.5 sm:px-2 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 sm:shrink text-[11px] sm:text-xs ${
                activeTab === 'badges'
                  ? 'bg-brand-orange text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Award size={14} className="shrink-0" />
              <span>{lang === 'vi' ? 'Huy Hiệu' : 'Badges'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('card')}
              className={`py-2 px-2.5 sm:px-2 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 sm:shrink text-[11px] sm:text-xs ${
                activeTab === 'card'
                  ? 'bg-brand-orange text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Crown size={14} className="shrink-0" />
              <span>{lang === 'vi' ? 'Thẻ Hội Viên' : 'Digital Card'}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0 space-y-5">
          
          {/* TAB 1: DYNAMIC QR CHECK-IN AT RECEPTION */}
          {activeTab === 'qr' && (
            <div className="animate-fadeIn">
              <MemberCheckInQR user={localUser} lang={lang} />
            </div>
          )}

          {/* TAB 2: DAILY WORKOUT LOG (SETS, REPS, WEIGHTS) */}
          {activeTab === 'workout' && (
            <div className="animate-fadeIn">
              <MemberWorkoutLog user={localUser} lang={lang} />
            </div>
          )}

          {/* TAB 3: MEMBER PROGRESS (WEEKLY WEIGHT & PHOTOS) */}
          {activeTab === 'progress' && (
            <div className="animate-fadeIn">
              <MemberProgressTracker user={localUser} lang={lang} />
            </div>
          )}

          {/* TAB 4: BADGES */}
          {activeTab === 'badges' && (
            <div className="animate-fadeIn">
              <MemberBadges user={localUser} lang={lang} />
            </div>
          )}

          {/* TAB 5: DIGITAL MEMBERSHIP CARD & PRIVILEGES */}
          {activeTab === 'card' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn items-start">
              {/* Left Column: Digital Membership Card with Standard 1.586 : 1 Aspect Ratio */}
              <div className="space-y-3.5 flex flex-col items-center sm:items-stretch">
                {/* Physical Card Mockup with 1.586 : 1 Aspect Ratio (Standard ISO/IEC 7810 Credit/VIP Card) */}
                <div 
                  className={`w-full max-w-[360px] sm:max-w-[400px] aspect-[1.586/1] mx-auto rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between select-none border transition-all duration-300 hover:shadow-amber-500/10 ${
                    isVip 
                      ? 'bg-gradient-to-br from-slate-950 via-zinc-900 to-amber-950/90 border-amber-400/50 shadow-amber-950/40' 
                      : isPremium 
                        ? 'bg-gradient-to-br from-slate-950 via-zinc-900 to-orange-950/90 border-orange-500/40 shadow-orange-950/30' 
                        : 'bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-900 border-slate-700/60 shadow-slate-950/40'
                  }`}
                >
                  {/* Subtle Gloss Sheen Reflection */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent pointer-events-none" />
                  
                  {/* Background Watermark Accent */}
                  <div className="absolute -right-3 -bottom-3 opacity-[0.07] pointer-events-none">
                    <Dumbbell size={150} />
                  </div>

                  {/* Card Top: Brand & Tier Badge */}
                  <div className="relative z-10 flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-xs shadow-xs">
                        TS
                      </div>
                      <div>
                        <div className="text-[10px] sm:text-[11px] font-black tracking-widest uppercase text-slate-200 leading-none">
                          THE SHINE
                        </div>
                        <div className="text-[8px] font-semibold tracking-wider text-slate-400 uppercase leading-tight mt-0.5">
                          FITNESS & YOGA
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/50 border border-white/20 text-[10px] sm:text-xs font-bold text-amber-300">
                      <Crown size={12} className="text-amber-400" />
                      <span>{localUser.membershipTier}</span>
                    </div>
                  </div>

                  {/* Card Middle: Gold Chip & Formatted Member ID */}
                  <div className="relative z-10 my-auto py-1">
                    <div className="flex items-center justify-between mb-1.5">
                      {/* Realistic EMV Smart Chip */}
                      <div className="w-8 h-6 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 p-[1px] shadow-sm relative flex items-center justify-center overflow-hidden border border-amber-300/60">
                        <div className="w-full h-full bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-500 rounded-[3px] grid grid-cols-2 gap-[1px] p-[2px] opacity-90">
                          <div className="border-r border-b border-amber-700/40" />
                          <div className="border-b border-amber-700/40" />
                          <div className="border-r border-amber-700/40" />
                          <div className="border-amber-700/40" />
                        </div>
                      </div>
                      
                      {/* NFC Contactless Wave Symbol */}
                      <div className="flex items-center gap-1 text-slate-400">
                        <Radio size={13} className="rotate-90 text-slate-400/80" />
                        <span className="text-[9px] uppercase tracking-wider font-mono text-slate-400/90 font-semibold">NFC</span>
                      </div>
                    </div>

                    {/* Member Code Styled like Bank / VIP Card Number */}
                    <div className="font-mono text-sm sm:text-base font-bold tracking-[0.18em] text-amber-200/95 drop-shadow-sm">
                      {localUser.memberCode}
                    </div>
                  </div>

                  {/* Card Bottom: Member Name & Expiry Date */}
                  <div className="relative z-10 flex justify-between items-end pt-1 border-t border-white/10 text-white">
                    <div>
                      <div className="text-[8px] sm:text-[9px] uppercase tracking-wider text-slate-400 font-medium">
                        CARDHOLDER
                      </div>
                      <div className="text-xs sm:text-sm font-heading font-bold uppercase tracking-wide text-white truncate max-w-[190px] sm:max-w-[220px]">
                        {localUser.fullName}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[8px] sm:text-[9px] uppercase tracking-wider text-slate-400 font-medium">
                        VALID THRU
                      </div>
                      <div className="text-xs font-mono font-bold text-amber-300">
                        {localUser.expiryDate}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Action Button situated directly below card */}
                <button
                  type="button"
                  onClick={() => setActiveTab('qr')}
                  className="w-full max-w-[360px] sm:max-w-[400px] mx-auto bg-white dark:bg-white/10 hover:bg-slate-50 dark:hover:bg-white/15 border border-slate-200 dark:border-white/15 p-3 rounded-2xl flex items-center justify-between transition-all shadow-sm group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-orange text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      <QrCode size={19} />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                        {lang === 'vi' ? 'Mã QR Check-in Lễ Tân' : 'Reception Check-in QR'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {localUser.memberCode} • {lang === 'vi' ? 'Nhấn để mở mã quét vào cổng' : 'Tap to scan and enter'}
                      </div>
                    </div>
                  </div>
                  <ScanLine size={18} className="text-brand-orange shrink-0" />
                </button>

                <div className="w-full max-w-[360px] sm:max-w-[400px] mx-auto p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <UserCheck size={15} className="text-emerald-500 shrink-0" />
                  <span className="leading-tight">
                    {lang === 'vi' 
                      ? 'Hồ sơ thẻ hội viên được bảo mật & đồng bộ tự động từ Firebase Firestore.' 
                      : 'Member profile is securely stored and synced via Firebase Firestore.'}
                  </span>
                </div>
              </div>

              {/* Right Column: Privileges and Account Details */}
              <div className="space-y-4">
                {/* Membership Benefits List */}
                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Crown size={14} className="text-brand-orange" />
                    <span>{t.privileges} ({localUser.membershipTier})</span>
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

                {/* User Account Info & Firebase Persistence */}
                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase tracking-wider text-[11px] text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <Sparkles size={13} className="text-brand-orange" />
                      {lang === 'vi' ? 'Thông tin tài khoản (Firebase)' : 'Account Profile (Firebase)'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={fetchFromFirebase}
                        disabled={isSyncingFirebase}
                        title={lang === 'vi' ? 'Làm mới từ Firebase' : 'Sync from Firebase'}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-brand-orange hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <RotateCw size={13} className={isSyncingFirebase ? 'animate-spin' : ''} />
                      </button>
                      {!isEditingInfo && (
                        <button
                          type="button"
                          onClick={() => setIsEditingInfo(true)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-brand-orange/10 hover:bg-brand-orange/20 text-brand-orange font-semibold rounded-lg transition-colors cursor-pointer text-[11px]"
                        >
                          <Edit3 size={12} />
                          <span>{lang === 'vi' ? 'Sửa thông tin' : 'Edit info'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {saveSuccessMsg && (
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 text-[11px]">
                      <Check size={14} className="shrink-0" />
                      <span>{saveSuccessMsg}</span>
                    </div>
                  )}

                  {!isEditingInfo ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-white/5">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Mail size={13} /> Email:
                        </span>
                        <strong className="text-slate-900 dark:text-white font-medium">
                          {localUser.email && localUser.email !== 'hoi-vien@gmail.com' ? (
                            localUser.email
                          ) : (
                            <span className="text-amber-500 font-normal italic">
                              {lang === 'vi' ? 'Chưa liên kết email' : 'No email linked'}
                            </span>
                          )}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-white/5">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Phone size={13} /> {lang === 'vi' ? 'Điện thoại:' : 'Phone:'}
                        </span>
                        <strong className="text-slate-900 dark:text-white font-medium">
                          {localUser.phone && localUser.phone !== '0946293593' ? (
                            localUser.phone
                          ) : (
                            <span className="text-amber-500 font-normal italic">
                              {lang === 'vi' ? 'Chưa liên kết SĐT' : 'No phone linked'}
                            </span>
                          )}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-white/5">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Calendar size={13} /> {t.startDate}:
                        </span>
                        <strong className="text-slate-900 dark:text-white font-medium">{localUser.startDate}</strong>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <CheckCircle2 size={13} className="text-emerald-500" /> Trạng thái:
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                          {localUser.status || 'Active'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveInfo} className="space-y-2.5 pt-1 animate-fadeIn">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          {lang === 'vi' ? 'Họ và tên' : 'Full Name'}
                        </label>
                        <input
                          type="text"
                          required
                          value={editFullName}
                          onChange={e => setEditFullName(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-black/30 border border-slate-300 dark:border-white/15 rounded-lg text-xs outline-hidden focus:border-brand-orange"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          placeholder="example@gmail.com"
                          value={editEmail}
                          onChange={e => setEditEmail(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-black/30 border border-slate-300 dark:border-white/15 rounded-lg text-xs outline-hidden focus:border-brand-orange"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          {lang === 'vi' ? 'Số điện thoại' : 'Phone number'}
                        </label>
                        <input
                          type="tel"
                          placeholder="0912 345 678"
                          value={editPhone}
                          onChange={e => setEditPhone(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-black/30 border border-slate-300 dark:border-white/15 rounded-lg text-xs outline-hidden focus:border-brand-orange"
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsEditingInfo(false)}
                          className="flex-1 py-1.5 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold rounded-lg text-xs transition-colors cursor-pointer hover:bg-slate-300"
                        >
                          {lang === 'vi' ? 'Hủy' : 'Cancel'}
                        </button>
                        <button
                          type="submit"
                          disabled={isSyncingFirebase}
                          className="flex-1 py-1.5 bg-brand-orange hover:bg-orange-600 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          {isSyncingFirebase ? (
                            <RotateCw size={12} className="animate-spin" />
                          ) : (
                            <Check size={12} />
                          )}
                          <span>{lang === 'vi' ? 'Lưu vào Firebase' : 'Save to Firebase'}</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Sticky Bottom Footer */}
        <div className="shrink-0 p-3 sm:p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/90 backdrop-blur-sm flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 sm:px-5 bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            {t.close}
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="py-2 px-3.5 sm:px-4 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-200 dark:border-rose-900"
          >
            <LogOut size={14} /> {t.logout}
          </button>
        </div>

      </div>
    </div>
  );
};
