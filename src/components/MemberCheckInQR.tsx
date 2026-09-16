import React, { useEffect, useState, useRef, useId } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, 
  RefreshCw, 
  CheckCircle2, 
  Download, 
  Sparkles, 
  Sun, 
  Clock, 
  ShieldCheck, 
  ScanLine, 
  MapPin, 
  Dumbbell 
} from 'lucide-react';
import { MemberUser } from './AuthModal';
import { Language } from '../translations';
import { recordCheckInInFirebase } from '../lib/firebase';

interface MemberCheckInQRProps {
  user: MemberUser;
  lang?: Language;
  onCheckInSuccess?: (checkInRecord: any) => void;
}

export const MemberCheckInQR: React.FC<MemberCheckInQRProps> = ({
  user,
  lang = 'vi',
  onCheckInSuccess
}) => {
  const qrImageId = useId();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(60);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [lastCheckIn, setLastCheckIn] = useState<{
    time: string;
    branch: string;
    count: number;
  } | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`shine_checkin_${user.memberCode}`);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return null;
  });

  const [checkInCount, setCheckInCount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`shine_checkin_count_${user.memberCode}`);
      return saved ? parseInt(saved, 10) : 8;
    }
    return 8;
  });

  // Generate a dynamic secure check-in payload
  const generateNewToken = () => {
    const timestamp = Date.now();
    const randomSalt = Math.random().toString(36).substring(2, 7).toUpperCase();
    const dynamicToken = `SHINE-CHECKIN|${user.memberCode}|${user.membershipTier}|${timestamp}|${randomSalt}`;
    setToken(dynamicToken);
    setCountdown(60);

    const payload = JSON.stringify({
      facility: "The Shine Fitness & Yoga",
      branch: "154 Hoang Hoa Tham, P.12, Tan Binh, TP.HCM",
      memberId: user.id,
      memberCode: user.memberCode,
      fullName: user.fullName,
      tier: user.membershipTier,
      token: dynamicToken,
      issuedAt: new Date(timestamp).toISOString()
    });

    QRCode.toDataURL(payload, {
      width: 320,
      margin: 1.5,
      color: {
        dark: '#111827',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    }).then(url => {
      setQrDataUrl(url);
    }).catch(err => {
      console.error('Failed to generate QR Code', err);
    });
  };

  // Initial generation
  useEffect(() => {
    generateNewToken();
  }, [user.memberCode, user.membershipTier]);

  // Countdown timer for security auto-refresh
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          generateNewToken();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [user.memberCode]);

  // Play pleasant check-in sound effect with Web Audio API
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  };

  // Simulate Reception Desk Scanner Check-in
  const handleSimulateScan = async () => {
    setIsScanning(true);
    playBeep();

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString(lang === 'vi' ? 'vi-VN' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const dateFormatted = now.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const newCount = checkInCount + 1;
    const checkInRecord = {
      time: `${timeFormatted} - ${dateFormatted}`,
      branch: 'The Shine - 154 Hoàng Hoa Thám, Tân Bình',
      count: newCount
    };

    setCheckInCount(newCount);
    setLastCheckIn(checkInRecord);

    if (typeof window !== 'undefined') {
      localStorage.setItem(`shine_checkin_${user.memberCode}`, JSON.stringify(checkInRecord));
      localStorage.setItem(`shine_checkin_count_${user.memberCode}`, newCount.toString());
    }

    // Save to Firestore check_ins collection
    await recordCheckInInFirebase({
      memberCode: user.memberCode,
      fullName: user.fullName,
      membershipTier: user.membershipTier,
      branch: 'The Shine - Tân Bình',
      checkInTime: new Date().toISOString(),
      status: 'SUCCESS'
    });

    if (onCheckInSuccess) {
      onCheckInSuccess(checkInRecord);
    }

    setTimeout(() => {
      setIsScanning(false);
    }, 1500);
  };

  // Download QR as image
  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `TheShine-CheckIn-${user.memberCode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isVip = user.membershipTier.toUpperCase() === 'VIP';

  return (
    <div className="bg-slate-50 dark:bg-black/30 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-white/10 shadow-xs space-y-5">
      
      {/* Top Banner with Reception Guidance */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-brand-orange/10 dark:bg-brand-orange/20 text-brand-orange flex items-center justify-center shrink-0">
            <ScanLine size={20} />
          </div>
          <div>
            <h4 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white uppercase italic tracking-wide">
              {lang === 'vi' ? 'Mã QR Check-in Quầy Lễ Tân' : 'Reception Check-in QR Code'}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {lang === 'vi' 
                ? 'Đưa mã này vào máy quét tại cổng để vào phòng tập tức thì' 
                : 'Present this code to the turnstile scanner for instant club entry'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={generateNewToken}
          title={lang === 'vi' ? 'Làm mới mã QR' : 'Refresh QR Code'}
          className="p-2 rounded-xl text-slate-500 hover:text-brand-orange hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
        >
          <RefreshCw size={17} className="hover:rotate-180 transition-transform duration-500" />
        </button>
      </div>

      {/* Center Dynamic QR Code Card */}
      <div className="flex flex-col items-center">
        <div className="relative p-4 sm:p-5 bg-white rounded-3xl shadow-xl border-4 border-slate-900/10 dark:border-white/10 group">
          
          {/* Top Brand Tag on QR Frame */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[9px] font-bold uppercase tracking-widest px-3 py-0.5 rounded-full shadow-md flex items-center gap-1">
            <ShieldCheck size={11} className="text-brand-orange" />
            <span>THE SHINE VERIFIED</span>
          </div>

          {/* QR Code Image */}
          {qrDataUrl ? (
            <div className="relative overflow-hidden rounded-xl">
              <img 
                id={qrImageId}
                src={qrDataUrl} 
                alt={`QR Check-in ${user.memberCode}`}
                className="w-48 h-48 sm:w-56 sm:h-56 object-contain block"
              />
              {/* Central Logo Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-11 h-11 rounded-xl bg-white shadow-lg border-2 border-brand-orange flex items-center justify-center p-1">
                  <Dumbbell size={20} className="text-brand-orange" />
                </div>
              </div>

              {/* Scanning Ray Simulation Animation */}
              {isScanning && (
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#34d399] animate-[bounce_1s_infinite]" />
              )}
            </div>
          ) : (
            <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center bg-slate-100 rounded-xl text-slate-400">
              <QrCode size={48} className="animate-pulse" />
            </div>
          )}

          {/* Bottom Member Identifier */}
          <div className="mt-3 text-center border-t border-slate-100 pt-2">
            <div className="text-[11px] font-mono font-black text-slate-900 tracking-wider">
              {user.memberCode}
            </div>
            <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest">
              {user.fullName} • <span className="text-brand-orange">{user.membershipTier}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Security Countdown & Token Status */}
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <Clock size={14} className="text-brand-orange" />
          <span>
            {lang === 'vi' ? 'Mã bảo mật làm mới sau:' : 'Security token refreshes in:'}{' '}
            <strong className="text-brand-orange font-mono">{countdown}s</strong>
          </span>
          <div className="w-16 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-brand-orange transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${(countdown / 60) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Reception Simulation & Quick Actions */}
      <div className="space-y-2.5">
        <button
          type="button"
          onClick={handleSimulateScan}
          disabled={isScanning}
          className={`w-full py-3 px-4 rounded-2xl font-heading font-bold text-xs uppercase italic flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
            isScanning
              ? 'bg-emerald-600 text-white animate-pulse'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
          }`}
        >
          <CheckCircle2 size={16} />
          <span>
            {isScanning
              ? (lang === 'vi' ? 'Đang xác thực quầy lễ tân...' : 'Validating at turnstile...')
              : (lang === 'vi' ? 'Chạm để Check-in thử tại quầy lễ tân' : 'Simulate Reception Check-in')}
          </span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleDownloadQR}
            className="py-2 px-3 bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/15 text-slate-800 dark:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
          >
            <Download size={14} />
            <span>{lang === 'vi' ? 'Lưu mã QR' : 'Save QR'}</span>
          </button>

          <button
            type="button"
            onClick={generateNewToken}
            className="py-2 px-3 bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/15 text-slate-800 dark:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>{lang === 'vi' ? 'Tạo mã mới' : 'New Token'}</span>
          </button>
        </div>
      </div>

      {/* Check-in Verification Status Alert */}
      {lastCheckIn && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl text-xs space-y-1 animate-fadeIn">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            <span>{lang === 'vi' ? 'Check-in thành công gần nhất' : 'Last successful check-in'}</span>
          </div>
          <div className="text-emerald-700 dark:text-emerald-400 pl-5 text-[11px] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
            <span>{lastCheckIn.branch}</span>
            <span className="font-mono font-semibold">{lastCheckIn.time}</span>
          </div>
          <div className="pl-5 text-[10px] text-emerald-600/80 dark:text-emerald-400/70 font-semibold pt-1">
            🔥 {lang === 'vi' 
              ? `Bạn đã chăm chỉ tập luyện ${checkInCount} buổi trong tháng này!` 
              : `You have completed ${checkInCount} workouts this month!`}
          </div>
        </div>
      )}

      {/* Reception Guidance Tips */}
      <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200/60 dark:border-amber-900/30 text-[11px] text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
        <Sun size={15} className="text-amber-500 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>{lang === 'vi' ? 'Mẹo quét mã nhanh:' : 'Quick check-in tip:'}</strong>{' '}
          {lang === 'vi'
            ? 'Vui lòng tăng độ sáng màn hình điện thoại lên 80-100% khi quét qua mắt đọc tại quầy lễ tân để cửa mở ngay lập tức.'
            : 'Please increase your phone screen brightness to 80-100% when passing the turnstile reader for instant door opening.'}
        </div>
      </div>

    </div>
  );
};
