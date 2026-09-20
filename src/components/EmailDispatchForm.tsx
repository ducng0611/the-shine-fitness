import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, AlertCircle, Sparkles, Key, User, Phone, Gift, ShieldCheck } from 'lucide-react';

interface EmailDispatchFormProps {
  isDark?: boolean;
  onToast?: (msg: string) => void;
  title?: string;
  defaultEmail?: string;
}

// Strict email regex validation
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const EmailDispatchForm: React.FC<EmailDispatchFormProps> = ({
  isDark = false,
  onToast,
  title = "Form Gửi Email Tự Động (Email Dispatcher)",
  defaultEmail = "ducnguyen06112002@gmail.com"
}) => {
  const [recipientEmail, setRecipientEmail] = useState(defaultEmail);
  const [fullName, setFullName] = useState("Hội Viên Test");
  const [phone, setPhone] = useState("0946293593");
  const [appPassword, setAppPassword] = useState("");
  const [showAppPassInput, setShowAppPassInput] = useState(false);

  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [sendResult, setSendResult] = useState<any>(null);

  const adminEmail = "ducnguyen06112002@gmail.com";

  const handleEmailChange = (val: string) => {
    setRecipientEmail(val);
    setSendResult(null);
    if (!val.trim()) {
      setValidationError("Vui lòng nhập địa chỉ email nhận thư.");
    } else if (!EMAIL_REGEX.test(val.trim())) {
      setValidationError("Email không đúng định dạng. Ví dụ hợp lệ: name@domain.com");
    } else {
      setValidationError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendResult(null);

    const emailTrimmed = recipientEmail.trim();
    if (!emailTrimmed) {
      setValidationError("Vui lòng nhập địa chỉ email.");
      return;
    }

    if (!EMAIL_REGEX.test(emailTrimmed)) {
      setValidationError("⚠️ Địa chỉ Email không đúng định dạng Regex (Ví dụ hợp lệ: ducnguyen@gmail.com).");
      return;
    }

    setValidationError("");
    setLoading(true);

    try {
      const response = await fetch('/api/trigger-registration-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailTrimmed,
          fullName: fullName.trim() || "Khách Hàng",
          phone: phone.trim() || "Chưa cung cấp",
          packageType: "Trải nghiệm Yoga, Gym & Boxing 3 Ngày 0đ",
          goal: "Cải thiện vóc dáng & sức khỏe",
          appPassword: appPassword.trim() || undefined
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSendResult({
          success: true,
          recipient: emailTrimmed,
          sender: adminEmail,
          voucherCode: data.emailLog?.voucherCode || "SHINE-3DAY-7789",
          sentAt: data.emailLog?.sentAt || new Date().toISOString(),
          status: data.emailLog?.status || "DELIVERED",
          note: data.emailLog?.note || "Đã thực thi tự động gửi email xác nhận & voucher thành công!"
        });
        if (onToast) onToast(`📧 Đã thực thi gửi email thành công tới ${emailTrimmed}!`);
      } else {
        setSendResult({
          success: false,
          error: data.error || "Không thể thực thi gửi email."
        });
        if (onToast) onToast(`❌ Lỗi gửi email: ${data.error || 'Thất bại'}`);
      }
    } catch (err: any) {
      console.error("Error submitting email form:", err);
      setSendResult({
        success: false,
        error: "Lỗi kết nối tới server backend."
      });
      if (onToast) onToast("❌ Lỗi kết nối tới máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  const bgCard = isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900 shadow-xl";
  const inputClass = isDark 
    ? "w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800/80 text-white text-sm focus:outline-hidden focus:border-orange-500 placeholder-slate-500 transition-all"
    : "w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:outline-hidden focus:border-orange-500 placeholder-slate-400 transition-all";

  return (
    <div className={`p-6 sm:p-8 rounded-3xl border transition-all ${bgCard}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Xác Nhận & Gửi Mail Trực Tiếp</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black uppercase italic font-heading">
            {title}
          </h3>
        </div>

        <div className="flex items-center space-x-2 text-xs bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <div>
            <span className="block text-[10px] text-slate-400 uppercase font-bold">Email Nguồn (Sender Admin):</span>
            <span className="font-mono font-bold text-orange-500">{adminEmail}</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-orange-500" />
              <span>Họ Và Tên Người Nhận</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nhập họ tên (ví dụ: Nguyễn Văn A)..."
              className={inputClass}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <Phone className="w-3.5 h-3.5 text-orange-500" />
              <span>Số Điện Thoại Liên Hệ</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Nhập SĐT..."
              className={inputClass}
            />
          </div>
        </div>

        {/* Email Input with Regex */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <Mail className="w-3.5 h-3.5 text-orange-500" />
              <span>Địa Chỉ Email Nhận Thư (To Email) *</span>
            </span>
            <span className="text-[10px] font-normal text-slate-400">Được kiểm tra định dạng chuẩn Regex</span>
          </label>

          <div className="relative">
            <input
              type="text"
              value={recipientEmail}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="Nhập email (ví dụ: ducnguyen06112002@gmail.com)..."
              required
              className={`${inputClass} ${
                validationError ? 'border-rose-500 focus:border-rose-500 bg-rose-500/5' : ''
              }`}
            />
            {recipientEmail && !validationError && (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 absolute right-3.5 top-3.5" />
            )}
          </div>

          {validationError && (
            <div className="mt-2 text-xs font-semibold text-rose-500 flex items-center space-x-1.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}
        </div>

        {/* Toggle Optional App Password */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAppPassInput(!showAppPassInput)}
            className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Key className="w-3.5 h-3.5" />
            <span>{showAppPassInput ? "Ẩn Cấu Hình Gmail App Password" : "🔑 Nhập Mật Khẩu Ứng Dụng Gmail (Nếu Có)"}</span>
          </button>

          {showAppPassInput && (
            <div className="mt-3 p-4 bg-orange-500/5 border border-orange-500/20 rounded-2xl space-y-2 animate-fadeIn">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                Mật khẩu ứng dụng Gmail (16 ký tự Google App Password):
              </label>
              <input
                type="password"
                value={appPassword}
                onChange={(e) => setAppPassword(e.target.value)}
                placeholder="Nhập mật khẩu 16 ký tự Google App Password..."
                className={inputClass}
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                * Mật khẩu ứng dụng được tạo tại: Google Account &gt; Security &gt; 2-Step Verification &gt; App passwords.
              </p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || !!validationError || !recipientEmail.trim()}
            className="w-full py-4 px-6 rounded-2xl font-black text-sm uppercase italic tracking-wider text-white bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-500 hover:to-amber-500 active:scale-[0.99] transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center space-x-2.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send className={`w-4 h-4 ${loading ? 'animate-bounce' : ''}`} />
            <span>{loading ? 'Đang Thực Thi Gửi Email Tự Động...' : '🚀 XÁC NHẬN GỬI EMAIL NGAY'}</span>
          </button>
        </div>
      </form>

      {/* Result Display Card */}
      {sendResult && (
        <div className="mt-6 animate-fadeIn">
          {sendResult.success ? (
            <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>🎉 ĐÃ THỰC THI GỬI EMAIL THÀNH CÔNG!</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-emerald-500/20">
                <div>
                  <span className="text-slate-400 font-medium">Email Nguồn (Sender):</span>
                  <span className="block font-mono font-bold text-orange-500">{sendResult.sender}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Email Nhận (Recipient):</span>
                  <span className="block font-mono font-bold text-emerald-500">{sendResult.recipient}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Mã Voucher Kèm Theo:</span>
                  <span className="block font-mono font-bold text-amber-500">{sendResult.voucherCode}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Thời Gian Gửi:</span>
                  <span className="block font-medium text-slate-300">
                    {new Date(sendResult.sentAt).toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-emerald-500/10 rounded-xl text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                {sendResult.note}
              </div>
            </div>
          ) : (
            <div className="p-5 bg-rose-500/10 border border-rose-500/30 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>❌ KHÔNG THỂ GỬI EMAIL</span>
              </div>
              <p className="text-xs text-rose-500">{sendResult.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
