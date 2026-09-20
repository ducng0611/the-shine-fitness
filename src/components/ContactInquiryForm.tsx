import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, AlertCircle, Sparkles, User, Phone, MessageSquare, ShieldCheck, HelpCircle } from 'lucide-react';

interface ContactInquiryFormProps {
  isDark?: boolean;
  onToast?: (msg: string) => void;
  title?: string;
}

// Strict email regex validation
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const ContactInquiryForm: React.FC<ContactInquiryFormProps> = ({
  isDark = false,
  onToast,
  title = "Gửi Thắc Mắc & Tư Vấn Trực Tiếp"
}) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("Tư vấn gói tập & Lịch học Yoga / Gym");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [responseResult, setResponseResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
    details?: any;
  } | null>(null);

  const adminEmail = "ducnguyen06112002@gmail.com";

  const handleEmailChange = (val: string) => {
    setEmail(val);
    setResponseResult(null);
    const trimmed = val.trim();
    if (!trimmed) {
      setEmailError("Vui lòng nhập địa chỉ email liên hệ.");
    } else if (!EMAIL_REGEX.test(trimmed)) {
      setEmailError("Email không hợp lệ (Định dạng mẫu: name@domain.com).");
    } else {
      setEmailError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResponseResult(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError("Vui lòng nhập địa chỉ email.");
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setEmailError("⚠️ Địa chỉ Email không khớp quy tắc Regex (Ví dụ: user@example.com).");
      return;
    }

    if (!message.trim()) {
      if (onToast) onToast("⚠️ Vui lòng nhập nội dung thắc mắc hoặc lời nhắn.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim() || "Hội Viên",
          email: trimmedEmail,
          phone: phone.trim() || "Chưa cung cấp",
          subject: subject.trim() || "Liên hệ tư vấn",
          message: message.trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResponseResult({
          success: true,
          message: data.message || `Đã gửi thành công câu hỏi tới ${adminEmail} và gửi email xác nhận tới ${trimmedEmail}!`,
          details: data.emailLog
        });
        if (onToast) onToast("📧 Đã gửi liên hệ trực tiếp thành công!");
        // Reset form
        setMessage("");
      } else {
        setResponseResult({
          success: false,
          error: data.error || "Không thể gửi liên hệ. Vui lòng thử lại sau."
        });
        if (onToast) onToast(`❌ Lỗi: ${data.error || "Gửi thất bại"}`);
      }
    } catch (err: any) {
      console.error("Error sending contact inquiry:", err);
      setResponseResult({
        success: false,
        error: "Lỗi kết nối máy chủ gửi thư."
      });
      if (onToast) onToast("❌ Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  const cardBg = isDark 
    ? "bg-slate-900/90 border-slate-800 text-white" 
    : "bg-white border-slate-200 text-slate-900 shadow-xl";

  const inputStyle = isDark
    ? "w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800/80 text-white text-sm focus:outline-hidden focus:border-orange-500 placeholder-slate-500 transition-all"
    : "w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:outline-hidden focus:border-orange-500 placeholder-slate-400 transition-all";

  return (
    <div className={`p-6 sm:p-8 rounded-3xl border transition-all ${cardBg}`}>
      {/* Form Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Form Liên Hệ Trực Tiếp (Admin Contact)</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black uppercase italic font-heading">
            {title}
          </h3>
        </div>

        <div className="flex items-center space-x-2 text-xs bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <div>
            <span className="block text-[10px] text-slate-400 uppercase font-bold">Email Admin Nhận & Gửi:</span>
            <span className="font-mono font-bold text-orange-500">{adminEmail}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-orange-500" />
              <span>Họ Và Tên Của Bạn</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nhập họ tên đầy đủ..."
              className={inputStyle}
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
              placeholder="Nhập số điện thoại..."
              className={inputStyle}
            />
          </div>
        </div>

        {/* Email Address with Regex */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <Mail className="w-3.5 h-3.5 text-orange-500" />
              <span>Địa Chỉ Email Của Bạn (Regex Checked) *</span>
            </span>
            <span className="text-[10px] font-normal text-slate-400">Hệ thống sẽ gửi thư xác nhận vào đây</span>
          </label>

          <div className="relative">
            <input
              type="text"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="Ví dụ: myemail@gmail.com..."
              required
              className={`${inputStyle} ${
                emailError ? 'border-rose-500 focus:border-rose-500 bg-rose-500/5' : ''
              }`}
            />
            {email && !emailError && (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 absolute right-3.5 top-3.5" />
            )}
          </div>

          {emailError && (
            <div className="mt-2 text-xs font-semibold text-rose-500 flex items-center space-x-1.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{emailError}</span>
            </div>
          )}
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center space-x-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-orange-500" />
            <span>Chủ Đề Thắc Mắc</span>
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Chủ đề câu hỏi..."
            className={inputStyle}
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center space-x-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-orange-500" />
            <span>Nội Dung Câu Hỏi / Yêu Cầu Tư Vấn *</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            required
            placeholder="Nhập nội dung thắc mắc của bạn về lộ trình tập, giá gói cước, HLV cá nhân..."
            className={inputStyle}
          />
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || !!emailError || !email.trim() || !message.trim()}
            className="w-full py-4 px-6 rounded-2xl font-black text-sm uppercase italic tracking-wider text-white bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-500 hover:to-amber-500 active:scale-[0.99] transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center space-x-2.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send className={`w-4 h-4 ${loading ? 'animate-bounce' : ''}`} />
            <span>{loading ? 'Đang gửi thông tin liên hệ...' : '🚀 GỬI LIÊN HỆ ĐẾN ADMIN NGAY'}</span>
          </button>
        </div>
      </form>

      {/* Response Display Card */}
      {responseResult && (
        <div className="mt-6 animate-fadeIn">
          {responseResult.success ? (
            <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>🎉 {responseResult.message}</span>
              </div>

              {responseResult.details && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-emerald-500/20">
                  <div>
                    <span className="text-slate-400 font-medium">Email Admin Nguồn:</span>
                    <span className="block font-mono font-bold text-orange-500">{adminEmail}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Email Người Nhận:</span>
                    <span className="block font-mono font-bold text-emerald-500">{responseResult.details.recipient}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Thời Gian Thực Thi:</span>
                    <span className="block text-slate-300">
                      {new Date(responseResult.details.sentAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Trạng Thái Nodemailer:</span>
                    <span className="block font-mono font-bold text-emerald-400">
                      {responseResult.details.status}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-5 bg-rose-500/10 border border-rose-500/30 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>❌ LỖI GỬI THƯ</span>
              </div>
              <p className="text-xs text-rose-500">{responseResult.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
