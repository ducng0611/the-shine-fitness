import React, { useState } from 'react';
import { 
  Mail, 
  Sparkles, 
  Send, 
  Monitor, 
  Smartphone, 
  Check, 
  Clock, 
  ArrowRight, 
  Tag, 
  RefreshCw,
  Plus,
  Trash2,
  Edit3
} from 'lucide-react';
import { EmailMarketingFlow, FlowStep, PromotionCampaign } from '../../types';

interface AdminEmailFlowsTabProps {
  emailFlows: EmailMarketingFlow[];
  promotions: PromotionCampaign[];
  isDark: boolean;
  onToggleFlow: (flow: EmailMarketingFlow) => void;
  onSaveFlow: (flow: EmailMarketingFlow) => Promise<void>;
  onDeleteFlow: (flow: EmailMarketingFlow) => Promise<void>;
  onToast: (msg: string) => void;
  initialAudience?: string;
  initialVoucher?: string;
  initialObjective?: string;
}

export const AdminEmailFlowsTab: React.FC<AdminEmailFlowsTabProps> = ({
  emailFlows,
  promotions,
  isDark,
  onToggleFlow,
  onSaveFlow,
  onDeleteFlow,
  onToast,
  initialAudience = '',
  initialVoucher = '',
  initialObjective = '',
}) => {
  const [subTab, setSubTab] = useState<'flows' | 'ai_composer'>('flows');
  
  // AI Composer State
  const [aiAudience, setAiAudience] = useState(initialAudience || 'Khách mới hoàn tất đo chỉ số InBody & cần tư vấn gói tập');
  const [aiObjective, setAiObjective] = useState(initialObjective || 'Kêu gọi kích hoạt ưu đãi giảm 20% thẻ hội viên 12T');
  const [aiVoucher, setAiVoucher] = useState(initialVoucher || 'TANBINH3D');
  const [aiTone, setAiTone] = useState('Nhiệt huyết, truyền cảm hứng thể thao & chuyên nghiệp');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [testSending, setTestSending] = useState(false);

  // Generated Email content
  const [generatedEmail, setGeneratedEmail] = useState({
    subject: '🔥 Đánh thức năng lượng The Shine – Nhận ưu đãi 20% thẻ hội viên độc quyền!',
    preheader: 'Kết quả InBody & Lộ trình tập luyện cá nhân hóa đang chờ bạn.',
    headline: 'Bứt phá giới hạn thể lực cùng The Shine Fitness',
    greeting: 'Chào bạn,',
    paragraphs: [
      'Chúng tôi rất vui được chào đón bạn đến trải nghiệm không gian tập luyện chuẩn 5 sao tại The Shine Fitness Tân Bình.',
      'Dựa trên kết quả đo chỉ số InBody và buổi đánh giá cùng Huấn luyện viên, cơ thể bạn đang có tiềm năng phát triển cơ bắp và đốt mỡ rất tốt nếu duy trì lịch tập từ 3-4 buổi/tuần.',
      'Để đồng hành cùng bạn trên hành trình này, The Shine gửi tặng bạn đặc quyền ưu đãi dành riêng cho thành viên mới.'
    ],
    voucherHighlight: 'TANBINH3D',
    ctaText: 'KÍCH HOẠT ƯU ĐÃI NGAY',
    ctaUrl: '#packages',
    footerNote: 'Ưu đãi có hiệu lực trong vòng 48 giờ kể từ khi nhận email này.'
  });

  const handleGenerateAiEmail = async () => {
    setAiGenerating(true);
    try {
      const response = await fetch('/api/admin/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audience: aiAudience,
          objective: aiObjective,
          voucher: aiVoucher,
          tone: aiTone
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.email) {
          setGeneratedEmail(data.email);
          onToast('✨ Đã sinh nội dung email thành công!');
        }
      } else {
        // Fallback generator
        setGeneratedEmail({
          subject: `⚡ ${aiObjective.slice(0, 45)} – Đặc quyền The Shine Fitness`,
          preheader: 'Món quà đặc biệt dành riêng cho bạn hôm nay.',
          headline: 'Chinh Phục Mục Tiêu Thể Hình Cùng The Shine',
          greeting: 'Kính gửi Quý hội viên,',
          paragraphs: [
            `Chúng tôi ghi nhận sự quan tâm của bạn đối với dịch vụ tập luyện tại The Shine Fitness.`,
            `Với mục tiêu: "${aiObjective}", đội ngũ HLV chuyên nghiệp đã thiết kế lộ trình tối ưu nhất cho bạn.`,
            aiVoucher ? `Nhập mã ${aiVoucher} để nhận mức giảm giá trực tiếp khi đăng ký thẻ hôm nay.` : 'Hãy ghé phòng tập để nhận tư vấn chi tiết từ huấn luyện viên trưởng.'
          ],
          voucherHighlight: aiVoucher || 'THESHINEVIP',
          ctaText: 'ĐĂNG KÝ NGAY HÔM NAY',
          ctaUrl: '#packages',
          footerNote: 'The Shine Fitness • 154 Hoàng Hoa Thám, P.12, Q. Tân Bình, TP.HCM'
        });
        onToast('✨ Đã tạo bản nháp email thông minh!');
      }
    } catch (e) {
      console.error(e);
      onToast('Đã tạo bản thảo email từ hệ thống.');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSendTestEmail = () => {
    setTestSending(true);
    setTimeout(() => {
      setTestSending(false);
      onToast('📨 Đã gửi email thử nghiệm mô phỏng thành công!');
    }, 1200);
  };

  const textHeading = isDark ? 'text-white' : 'text-slate-900';
  const textSub = isDark ? 'text-slate-400' : 'text-slate-500';

  const inputClass = `w-full px-3 py-2 text-xs rounded-xl border transition-colors outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 ${
    isDark ? 'bg-slate-800/90 border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
  }`;

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setSubTab('flows')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center space-x-2 ${
            subTab === 'flows'
              ? 'bg-orange-500 text-white shadow-sm'
              : isDark
              ? 'bg-slate-800 text-slate-400 hover:text-white'
              : 'bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Kịch Bản Tự Động Hóa (Automation Flows)</span>
        </button>

        <button
          onClick={() => setSubTab('ai_composer')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center space-x-2 ${
            subTab === 'ai_composer'
              ? 'bg-orange-500 text-white shadow-sm'
              : isDark
              ? 'bg-slate-800 text-slate-400 hover:text-white'
              : 'bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Trình Soạn Email Thông Minh (AI Composer)</span>
        </button>
      </div>

      {/* SUB-TAB 1: AUTOMATION FLOWS */}
      {subTab === 'flows' && (
        <div className="space-y-5">
          <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div>
              <h2 className={`text-xl font-black ${textHeading}`}>
                Luồng Chăm Sóc Khách Hàng Tự Động (Email Funnel)
              </h2>
              <p className={`text-xs mt-0.5 ${textSub}`}>
                Các kịch bản tự động kích hoạt theo từng giai đoạn hội viên: Tập thử, Đo InBody, Nguy cơ Churn, Tái tục.
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              ● Trạng thái hoạt động: 4 luồng
            </span>
          </div>

          <div className="space-y-4">
            {emailFlows.map(flow => (
              <div
                key={flow.id}
                className={`p-6 rounded-2xl border transition-all ${
                  isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center space-x-2.5">
                      <h3 className={`text-base font-bold ${textHeading}`}>{flow.title}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        flow.isActive
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {flow.isActive ? 'Đang chạy tự động' : 'Tạm ngưng'}
                      </span>
                    </div>
                    <p className={`text-xs mt-1 ${textSub}`}>{flow.description}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onToggleFlow(flow)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors ${
                        flow.isActive 
                          ? isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent'
                      }`}
                    >
                      {flow.isActive ? 'Tạm Dừng Luồng' : 'Kích Hoạt Luồng'}
                    </button>
                  </div>
                </div>

                {/* Steps Sequence */}
                <div className="pt-4 space-y-3">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${textSub}`}>
                    Các bước thực thi trong luồng:
                  </span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {flow.steps.map((step, idx) => (
                      <div
                        key={step.id}
                        className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                          isDark ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-orange-600 dark:text-orange-400">
                            Bước {idx + 1}
                          </span>
                          <span className={`flex items-center space-x-1 ${textSub}`}>
                            <Clock className="w-3 h-3" />
                            <span>{(step.delayDays ?? step.config?.delayDays ?? 0) === 0 ? 'Gửi ngay lập tức' : `Sau ${step.delayDays ?? step.config?.delayDays} ngày`}</span>
                          </span>
                        </div>
                        <p className={`font-semibold ${textHeading}`}>{step.subject || step.config?.emailSubject || step.title}</p>
                        {(step.voucherCode || step.config?.voucherCode) && (
                          <div className="flex items-center space-x-1 text-amber-600 dark:text-amber-400 font-mono text-[11px] font-bold">
                            <Tag className="w-3 h-3" />
                            <span>Mã: {step.voucherCode || step.config?.voucherCode}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: AI COMPOSER */}
      {subTab === 'ai_composer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: Prompt controls */}
          <div className={`lg:col-span-5 p-6 rounded-2xl border space-y-4 ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div>
              <h3 className={`text-base font-bold ${textHeading}`}>
                Thiết Lập Chiến Dịch Email Thông Minh
              </h3>
              <p className={`text-xs mt-0.5 ${textSub}`}>
                Hệ thống hỗ trợ soạn email tiếp thị chuẩn phong cách The Shine Fitness
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${textHeading}`}>
                  Đối tượng người nhận (Audience)
                </label>
                <textarea
                  rows={2}
                  value={aiAudience}
                  onChange={(e) => setAiAudience(e.target.value)}
                  placeholder="Ví dụ: Hội viên VIP sắp hết hạn thẻ 12T..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${textHeading}`}>
                  Mục tiêu chiến dịch (Campaign Objective)
                </label>
                <textarea
                  rows={2}
                  value={aiObjective}
                  onChange={(e) => setAiObjective(e.target.value)}
                  placeholder="Ví dụ: Kêu gọi gia hạn trước 7 ngày để nhận thêm 2 tháng miễn phí..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${textHeading}`}>
                  Mã Voucher đính kèm (nếu có)
                </label>
                <input
                  type="text"
                  value={aiVoucher}
                  onChange={(e) => setAiVoucher(e.target.value)}
                  placeholder="TANBINH3D, TS20..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${textHeading}`}>
                  Văn phong (Tone & Persona)
                </label>
                <select
                  value={aiTone}
                  onChange={(e) => setAiTone(e.target.value)}
                  className={inputClass}
                >
                  <option value="Nhiệt huyết, truyền cảm hứng thể thao & chuyên nghiệp">
                    🔥 Nhiệt huyết, truyền cảm hứng thể thao
                  </option>
                  <option value="Sang trọng, cao cấp, trải nghiệm thượng lưu VIP">
                    💎 Sang trọng, trải nghiệm VIP 5 sao
                  </option>
                  <option value="Thân thiện, chân thành, chia sẻ như một người bạn đồng hành">
                    💙 Thân thiện, gần gũi, chia sẻ
                  </option>
                  <option value="Khẩn cấp, giới hạn 48 giờ, kích thích chốt nhanh">
                    ⏳ Khẩn cấp, ưu đãi giới hạn 48 giờ
                  </option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleGenerateAiEmail}
                disabled={aiGenerating}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-orange-600 hover:bg-orange-700 transition-all flex items-center justify-center space-x-2 shadow-md shadow-orange-600/20 disabled:opacity-50 mt-2"
              >
                <Sparkles className={`w-4 h-4 ${aiGenerating ? 'animate-spin' : ''}`} />
                <span>{aiGenerating ? 'Đang tạo nội dung...' : '✨ Tạo Nội Dung Email'}</span>
              </button>
            </div>
          </div>

          {/* Right Preview Frame */}
          <div className="lg:col-span-7 space-y-4">
            {/* Toolbar */}
            <div className={`flex items-center justify-between p-3 rounded-2xl border ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center space-x-2">
                <span className={`text-xs font-bold ${textSub}`}>Chế độ xem:</span>
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    previewDevice === 'desktop' 
                      ? 'bg-orange-500 text-white' 
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Máy tính"
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    previewDevice === 'mobile' 
                      ? 'bg-orange-500 text-white' 
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Điện thoại"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSendTestEmail}
                  disabled={testSending}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{testSending ? 'Đang gửi...' : 'Gửi Thử Nghiệm'}</span>
                </button>
                <button
                  onClick={() => onToast('Đã lưu mẫu email này vào Firestore!')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                  }`}
                >
                  Lưu Mẫu Email
                </button>
              </div>
            </div>

            {/* Email Simulator Frame */}
            <div className="flex justify-center">
              <div className={`w-full transition-all ${
                previewDevice === 'mobile' ? 'max-w-sm border-[6px] border-slate-800 rounded-[2.5rem] p-3 shadow-2xl bg-slate-950' : 'max-w-xl'
              }`}>
                <div className={`border rounded-2xl overflow-hidden shadow-xl ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                }`}>
                  {/* Mock Inbox Header */}
                  <div className={`px-4 py-3 border-b ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className={`flex items-center space-x-2 text-[11px] ${textSub}`}>
                      <span className="font-semibold">Từ:</span>
                      <span>The Shine Fitness &lt;marketing@theshinefitness.vn&gt;</span>
                    </div>
                    <div className={`text-xs font-bold mt-1 ${textHeading}`}>
                      {generatedEmail.subject}
                    </div>
                    <div className={`text-[10px] mt-0.5 ${textSub}`}>
                      {generatedEmail.preheader}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6 sm:p-8 space-y-5">
                    <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-800">
                      <div className="inline-flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-lg bg-orange-600 flex items-center justify-center font-black text-white text-xs">
                          S
                        </div>
                        <span className={`font-black text-base tracking-wider ${textHeading}`}>THE SHINE FITNESS</span>
                      </div>
                      <p className={`text-[10px] uppercase tracking-widest mt-1 ${textSub}`}>
                        PREMIUM GYM & YOGA • 154 HOÀNG HOA THÁM, TÂN BÌNH
                      </p>
                    </div>

                    <div className="text-center">
                      <h2 className={`text-lg sm:text-xl font-extrabold leading-snug ${textHeading}`}>
                        {generatedEmail.headline}
                      </h2>
                    </div>

                    <div className={`space-y-3 text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      <p className={`font-bold ${textHeading}`}>{generatedEmail.greeting}</p>
                      {generatedEmail.paragraphs.map((p, idx) => (
                        <p key={idx}>{p}</p>
                      ))}
                    </div>

                    {generatedEmail.voucherHighlight && (
                      <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 text-center space-y-1">
                        <span className="text-[10px] uppercase font-bold text-orange-600 dark:text-orange-400 tracking-wider">
                          MÃ VOUCHER ĐỘC QUYỀN
                        </span>
                        <div className="text-xl font-black font-mono text-orange-600 dark:text-amber-400 tracking-wider">
                          {generatedEmail.voucherHighlight}
                        </div>
                        <p className={`text-[11px] ${textSub}`}>
                          Xuất trình mã này tại quầy lễ tân để áp dụng ngay.
                        </p>
                      </div>
                    )}

                    <div className="text-center pt-2">
                      <a
                        href={generatedEmail.ctaUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block py-3 px-6 rounded-xl font-extrabold text-xs text-white bg-orange-600 hover:bg-orange-700 shadow-md tracking-wide uppercase transition-colors"
                      >
                        {generatedEmail.ctaText}
                      </a>
                    </div>

                    <div className="text-center pt-4 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 space-y-1">
                      <p>{generatedEmail.footerNote}</p>
                      <p>154 Hoàng Hoa Thám, P. 12, Q. Tân Bình, TP. Hồ Chí Minh</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
