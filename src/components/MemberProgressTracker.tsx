import React, { useState, useEffect, useRef } from 'react';
import { 
  Scale, 
  Upload, 
  Plus, 
  Trash2, 
  TrendingDown, 
  TrendingUp, 
  Download, 
  Camera, 
  Calendar, 
  Sparkles, 
  Check, 
  AlertCircle,
  FileText,
  Activity,
  Image as ImageIcon,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { MemberUser } from './AuthModal';
import { Language } from '../translations';
import { MemberProgressEntry } from '../types';
import { 
  getMemberProgressFromFirebase, 
  saveMemberProgressToFirebase, 
  deleteMemberProgressFromFirebase 
} from '../lib/firebase';

interface MemberProgressTrackerProps {
  user: MemberUser;
  lang?: Language;
}

export const MemberProgressTracker: React.FC<MemberProgressTrackerProps> = ({
  user,
  lang = 'vi'
}) => {
  const [entries, setEntries] = useState<MemberProgressEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form fields
  const [weightKg, setWeightKg] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [bodyFatPct, setBodyFatPct] = useState<string>('');
  const [muscleMassKg, setMuscleMassKg] = useState<string>('');
  const [waistCm, setWaistCm] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [energyLevel, setEnergyLevel] = useState<number>(5);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Load entries from Firestore
  const loadEntries = async () => {
    setLoading(true);
    try {
      const data = await getMemberProgressFromFirebase(user.id, user.memberCode);
      setEntries(data);
    } catch (err) {
      console.error('Error loading progress entries:', err);
      showToast(lang === 'vi' ? 'Lỗi khi tải dữ liệu tiến trình' : 'Error loading progress data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, [user.id, user.memberCode]);

  // Handle Photo Upload with Client-Side Canvas Compression
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast(lang === 'vi' ? 'Vui lòng chọn file hình ảnh hợp lệ' : 'Please select a valid image file');
      return;
    }

    setPhotoUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.72);
          setPhotoBase64(compressedDataUrl);
        }
        setPhotoUploading(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Submit new entry to Firestore
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const weightNum = parseFloat(weightKg);
    if (isNaN(weightNum) || weightNum <= 0) {
      showToast(lang === 'vi' ? 'Vui lòng nhập số cân nặng hợp lệ' : 'Please enter valid weight');
      return;
    }

    setSaving(true);
    try {
      const newEntry: MemberProgressEntry = {
        id: `prog_${user.id}_${Date.now()}`,
        userId: user.id,
        memberCode: user.memberCode,
        date: date,
        weightKg: weightNum,
        bodyFatPct: bodyFatPct ? parseFloat(bodyFatPct) : undefined,
        muscleMassKg: muscleMassKg ? parseFloat(muscleMassKg) : undefined,
        waistCm: waistCm ? parseFloat(waistCm) : undefined,
        photoUrl: photoBase64 || undefined,
        notes: notes.trim() || undefined,
        energyLevel: energyLevel,
        createdAt: new Date().toISOString()
      };

      const success = await saveMemberProgressToFirebase(newEntry);
      if (success) {
        setEntries(prev => [...prev, newEntry].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        setIsFormOpen(false);
        setWeightKg('');
        setBodyFatPct('');
        setMuscleMassKg('');
        setWaistCm('');
        setNotes('');
        setPhotoBase64(null);
        showToast(lang === 'vi' ? '✓ Đã ghi nhận tiến trình lên Firestore thành công!' : '✓ Progress entry saved to Firestore!');
      } else {
        showToast(lang === 'vi' ? '❌ Không thể lưu vào Firestore' : '❌ Failed to save to Firestore');
      }
    } catch (err) {
      console.error(err);
      showToast(lang === 'vi' ? '❌ Lỗi hệ thống' : '❌ System error');
    } finally {
      setSaving(false);
    }
  };

  // Delete entry
  const handleDelete = async (id: string) => {
    if (!window.confirm(lang === 'vi' ? 'Bạn có chắc chắn muốn xóa bản ghi này?' : 'Are you sure you want to delete this log?')) {
      return;
    }
    const ok = await deleteMemberProgressFromFirebase(id);
    if (ok) {
      setEntries(prev => prev.filter(item => item.id !== id));
      showToast(lang === 'vi' ? '✓ Đã xóa bản ghi' : '✓ Log deleted');
    }
  };

  // Generate and Download PDF Report
  const handleDownloadReport = () => {
    if (entries.length === 0) {
      showToast(lang === 'vi' ? 'Chưa có bản ghi tiến trình nào để xuất báo cáo' : 'No progress entries found to export');
      return;
    }

    const firstEntry = entries[0];
    const latestEntry = entries[entries.length - 1];
    const weightDiff = (latestEntry.weightKg - firstEntry.weightKg).toFixed(1);
    const weightChangeSign = parseFloat(weightDiff) > 0 ? `+${weightDiff}` : `${weightDiff}`;

    // Build print-friendly HTML document
    const reportHtml = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="utf-8">
        <title>The Shine Fitness - Báo Cáo Tiến Trình Hội Viên</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 24px;
            background: #fff;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #ea580c;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .logo-text {
            font-size: 20px;
            font-weight: 900;
            color: #ea580c;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          .subtitle {
            font-size: 11px;
            color: #64748b;
            margin-top: 2px;
          }
          .member-info {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 24px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
          }
          .info-block label {
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 700;
            display: block;
          }
          .info-block span {
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 24px;
          }
          .stat-card {
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 12px;
            text-align: center;
            background: #fff;
          }
          .stat-card .val {
            font-size: 22px;
            font-weight: 900;
            color: #ea580c;
            margin-top: 4px;
          }
          .stat-card .lbl {
            font-size: 10px;
            text-transform: uppercase;
            color: #64748b;
            font-weight: 600;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            margin-bottom: 24px;
          }
          th {
            background: #f1f5f9;
            color: #475569;
            text-align: left;
            padding: 10px;
            font-size: 11px;
            text-transform: uppercase;
            border-bottom: 2px solid #cbd5e1;
          }
          td {
            padding: 10px;
            border-bottom: 1px solid #e2e8f0;
          }
          .photo-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            page-break-inside: avoid;
            margin-top: 16px;
          }
          .photo-item {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
            text-align: center;
            padding: 6px;
          }
          .photo-item img {
            width: 100%;
            height: 140px;
            object-fit: cover;
            border-radius: 6px;
          }
          .photo-date {
            font-size: 10px;
            font-weight: 700;
            margin-top: 4px;
            color: #475569;
          }
          .footer {
            border-top: 1px solid #e2e8f0;
            padding-top: 12px;
            margin-top: 32px;
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
          }
          @media print {
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="background: #ea580c; color: #fff; padding: 12px 20px; border-radius: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          <span style="font-size: 13px; font-weight: 600;">📄 Báo cáo tiến trình thể hình - Chọn máy in &quot;Lưu dưới dạng PDF&quot; (Save as PDF) để tải file về máy.</span>
          <button onclick="window.print()" style="background: #ffffff; color: #ea580c; border: none; padding: 8px 18px; border-radius: 8px; font-weight: 800; cursor: pointer; font-size: 12px; text-transform: uppercase;">
            🖨️ In / Tải PDF Ngay
          </button>
        </div>

        <div class="header">
          <div>
            <div class="logo-text">The Shine Fitness & Yoga</div>
            <div class="subtitle">154 Hoàng Hoa Thám, P. Bảy Hiền (P. 12 cũ), Q. Tân Bình, TP.HCM • Hotline: 0946 293 593</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 14px; font-weight: 800; color: #0f172a;">BÁO CÁO TIẾN TRÌNH THỂ HÌNH</div>
            <div class="subtitle">Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}</div>
          </div>
        </div>

        <div class="member-info">
          <div class="info-block">
            <label>Hội viên</label>
            <span>${user.fullName}</span>
          </div>
          <div class="info-block">
            <label>Mã Thẻ / Email</label>
            <span>${user.memberCode || user.id}</span>
          </div>
          <div class="info-block">
            <label>Hạng Hội Viên</label>
            <span>${user.membershipTier.toUpperCase()}</span>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="lbl">Cân Nặng Ban Đầu</div>
            <div class="val">${firstEntry.weightKg} kg</div>
          </div>
          <div class="stat-card">
            <div class="lbl">Cân Nặng Hiện Tại</div>
            <div class="val">${latestEntry.weightKg} kg</div>
          </div>
          <div class="stat-card">
            <div class="lbl">Tổng Thay Đổi</div>
            <div class="val" style="color: ${parseFloat(weightDiff) < 0 ? '#10b981' : '#ea580c'};">${weightChangeSign} kg</div>
          </div>
          <div class="stat-card">
            <div class="lbl">Số Lần Ghi Nhận</div>
            <div class="val" style="color: #0f172a;">${entries.length}</div>
          </div>
        </div>

        <h4 style="margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; color: #0f172a;">Lịch Sử Cân Nặng & Chỉ Số Cơ Thể</h4>
        <table>
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Cân Nặng (kg)</th>
              <th>% Mỡ Cơ Thể</th>
              <th>Cơ Bắp (kg)</th>
              <th>Vòng Eo (cm)</th>
              <th>Ghi Chú Tiến Trình</th>
            </tr>
          </thead>
          <tbody>
            ${entries.map(e => `
              <tr>
                <td style="font-weight: 600;">${new Date(e.date).toLocaleDateString('vi-VN')}</td>
                <td style="font-weight: 800; color: #ea580c;">${e.weightKg} kg</td>
                <td>${e.bodyFatPct ? `${e.bodyFatPct}%` : '-'}</td>
                <td>${e.muscleMassKg ? `${e.muscleMassKg} kg` : '-'}</td>
                <td>${e.waistCm ? `${e.waistCm} cm` : '-'}</td>
                <td style="color: #475569;">${e.notes || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        ${entries.some(e => e.photoUrl) ? `
          <h4 style="margin: 20px 0 8px 0; font-size: 13px; text-transform: uppercase; color: #0f172a;">Hình Ảnh Tiến Trình (Progress Photos)</h4>
          <div class="photo-grid">
            ${entries.filter(e => e.photoUrl).slice(-6).map(e => `
              <div class="photo-item">
                <img src="${e.photoUrl}" alt="Progress Photo" />
                <div class="photo-date">${new Date(e.date).toLocaleDateString('vi-VN')} (${e.weightKg} kg)</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="footer">
          <p>Tài liệu ghi nhận chính thức từ Hệ Thống Quản Lý Hội Viên The Shine Fitness & Yoga.</p>
          <p>Chúc mừng bạn đã kiên trì theo đuổi lối sống khỏe mạnh và bứt phá giới hạn bản thân!</p>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    // Open print window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(reportHtml);
      printWindow.document.close();
    } else {
      // Fallback: Create downloadable HTML blob if popup blocked
      const blob = new Blob([reportHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TheShine_Progress_Report_${user.fullName.replace(/\s+/g, '_')}.html`;
      a.click();
      URL.revokeObjectURL(url);
    }
    showToast(lang === 'vi' ? '✓ Đã tạo báo cáo tiến trình thành công!' : '✓ Progress report generated!');
  };

  // Calculations
  const firstWeight = entries.length > 0 ? entries[0].weightKg : null;
  const currentWeight = entries.length > 0 ? entries[entries.length - 1].weightKg : null;
  const weightChange = (firstWeight !== null && currentWeight !== null) 
    ? (currentWeight - firstWeight).toFixed(1) 
    : null;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className="p-3 bg-orange-500/10 border border-orange-500/30 text-orange-600 dark:text-orange-400 rounded-xl text-xs font-bold flex items-center gap-2">
          <Check size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Banner & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-orange-500/20">
              ● Firestore Cloud Synced
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {entries.length} {lang === 'vi' ? 'bản ghi' : 'entries'}
            </span>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wide">
            {lang === 'vi' ? 'Theo Dõi Tiến Trình & Cân Nặng' : 'Member Progress & Weight Tracker'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'vi' 
              ? 'Ghi nhận cân nặng định kỳ hàng tuần và lưu ảnh thể hình trên Firebase' 
              : 'Log weekly body weight and progress photos stored on Firestore'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadReport}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            title={lang === 'vi' ? 'Xuất và tải báo cáo PDF' : 'Download PDF Progress Report'}
          >
            <Download size={14} className="text-orange-500" />
            <span>{lang === 'vi' ? 'Tải Báo Cáo (PDF)' : 'Download Report'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-orange-600/20 active:scale-95"
          >
            <Plus size={14} />
            <span>{isFormOpen ? (lang === 'vi' ? 'Đóng Form' : 'Close') : (lang === 'vi' ? '+ Ghi Nhận Mới' : '+ Log Progress')}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            {lang === 'vi' ? 'Cân Nặng Ban Đầu' : 'Starting Weight'}
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {firstWeight !== null ? `${firstWeight}` : '--'} <span className="text-xs font-medium text-slate-400">kg</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            {lang === 'vi' ? 'Cân Nặng Hiện Tại' : 'Current Weight'}
          </span>
          <div className="text-xl sm:text-2xl font-black text-orange-600 dark:text-orange-400">
            {currentWeight !== null ? `${currentWeight}` : '--'} <span className="text-xs font-medium text-slate-400">kg</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            {lang === 'vi' ? 'Tổng Thay Đổi' : 'Total Change'}
          </span>
          <div className="flex items-center gap-1 text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {weightChange !== null ? (
              <>
                {parseFloat(weightChange) < 0 ? (
                  <TrendingDown size={18} className="text-emerald-500" />
                ) : (
                  <TrendingUp size={18} className="text-orange-500" />
                )}
                <span>{parseFloat(weightChange) > 0 ? `+${weightChange}` : weightChange}</span>
                <span className="text-xs font-medium text-slate-400">kg</span>
              </>
            ) : (
              '--'
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            {lang === 'vi' ? 'Lần Cập Nhật' : 'Total Logs'}
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {entries.length} <span className="text-xs font-medium text-slate-400">{lang === 'vi' ? 'tuần' : 'weeks'}</span>
          </div>
        </div>
      </div>

      {/* FORM: LOG NEW PROGRESS */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="p-6 rounded-3xl bg-white dark:bg-[#202020] border-2 border-orange-500/30 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-2">
              <Scale size={18} className="text-orange-500" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase">
                {lang === 'vi' ? 'Ghi Nhận Chỉ Số Tuần Này' : 'Log Weekly Metrics'}
              </h4>
            </div>
            <span className="text-xs text-orange-500 font-semibold">* Yêu cầu bắt buộc</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'vi' ? 'Cân nặng (kg) *' : 'Weight (kg) *'}
              </label>
              <input
                type="number"
                step="0.1"
                required
                placeholder="Ví dụ: 68.5"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'vi' ? 'Ngày cân *' : 'Log Date *'}
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'vi' ? '% Mỡ cơ thể (InBody)' : 'Body Fat % (Optional)'}
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="Ví dụ: 18.5"
                value={bodyFatPct}
                onChange={(e) => setBodyFatPct(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'vi' ? 'Số đo vòng eo (cm)' : 'Waist circumference (cm)'}
              </label>
              <input
                type="number"
                step="0.5"
                placeholder="Ví dụ: 78"
                value={waistCm}
                onChange={(e) => setWaistCm(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Photo Upload Section */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {lang === 'vi' ? 'Hình ảnh tiến trình (Progress Photo)' : 'Progress Photo'}
            </label>
            
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={photoUploading}
                className="px-4 py-2.5 rounded-xl border border-dashed border-orange-500/50 bg-orange-500/5 hover:bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Camera size={16} />
                <span>{photoUploading ? (lang === 'vi' ? 'Đang nén ảnh...' : 'Compressing...') : (lang === 'vi' ? 'Chọn hoặc chụp ảnh' : 'Upload photo')}</span>
              </button>

              {photoBase64 && (
                <div className="relative w-14 h-14 rounded-xl overflow-hidden border-2 border-orange-500 shrink-0">
                  <img src={photoBase64} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotoBase64(null)}
                    className="absolute top-0 right-0 bg-rose-600 text-white p-0.5 rounded-bl text-[10px]"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {lang === 'vi' ? 'Ghi chú tập luyện & cảm nhận' : 'Notes & Reflections'}
            </label>
            <textarea
              rows={2}
              placeholder={lang === 'vi' ? 'Ví dụ: Tuần này hoàn thành 4 buổi tập, cơ bắp săn chắc hơn, ngủ sâu giấc...' : 'E.g. Completed 4 workouts this week, felt energized...'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
            >
              {lang === 'vi' ? 'Hủy' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 cursor-pointer shadow-md shadow-orange-600/20 disabled:opacity-50"
            >
              {saving ? (lang === 'vi' ? 'Đang lưu...' : 'Saving...') : (lang === 'vi' ? 'Lưu Tiến Trình' : 'Save Log')}
            </button>
          </div>
        </form>
      )}

      {/* Progress Timeline & Visual Logs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {lang === 'vi' ? 'Lịch Sử Đo & Hình Ảnh Tiến Trình' : 'Log History & Photos'}
          </h4>
          <button 
            onClick={loadEntries} 
            className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1 hover:underline cursor-pointer"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            <span>{lang === 'vi' ? 'Cập nhật' : 'Refresh'}</span>
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">
            {lang === 'vi' ? 'Đang tải dữ liệu từ Firestore...' : 'Loading Firestore records...'}
          </div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-white/10 text-slate-400 space-y-2">
            <Scale size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-xs font-medium">
              {lang === 'vi' ? 'Bạn chưa có bản ghi tiến trình nào.' : 'No progress entries logged yet.'}
            </p>
            <p className="text-[11px] text-slate-500">
              {lang === 'vi' ? 'Bấm "+ Ghi Nhận Mới" để lưu chỉ số cân nặng tuần này!' : 'Click "+ Log Progress" to add your first weight log!'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.slice().reverse().map(entry => (
              <div 
                key={entry.id}
                className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-orange-500/30 transition-all"
              >
                <div className="flex items-start gap-3">
                  {/* Photo thumbnail or Icon */}
                  {entry.photoUrl ? (
                    <img 
                      src={entry.photoUrl} 
                      alt="Progress" 
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-white/10 shrink-0 shadow-xs" 
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-xs shrink-0 border border-orange-500/20">
                      <Scale size={20} />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-slate-900 dark:text-white">
                        {entry.weightKg} kg
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        • {new Date(entry.date).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {entry.bodyFatPct && <span>Mỡ: <strong className="text-slate-800 dark:text-slate-200">{entry.bodyFatPct}%</strong></span>}
                      {entry.muscleMassKg && <span>Cơ: <strong className="text-slate-800 dark:text-slate-200">{entry.muscleMassKg}kg</strong></span>}
                      {entry.waistCm && <span>Eo: <strong className="text-slate-800 dark:text-slate-200">{entry.waistCm}cm</strong></span>}
                    </div>

                    {entry.notes && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 italic">
                        "{entry.notes}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleDelete(entry.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title={lang === 'vi' ? 'Xóa bản ghi này' : 'Delete log'}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
