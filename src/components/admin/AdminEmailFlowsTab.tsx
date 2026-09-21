import React, { useState, useEffect } from 'react';
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
  Edit3,
  CheckCircle2,
  UserCheck
} from 'lucide-react';
import { EmailMarketingFlow, FlowStep, PromotionCampaign } from '../../types';
import { EmailDispatchForm } from '../EmailDispatchForm';
import { auth } from '../../lib/firebase';

const getAdminAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = await auth.currentUser?.getIdToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

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
  const [subTab, setSubTab] = useState<'flows' | 'ai_flow_builder' | 'ai_composer' | 'logs'>('flows');
  
  // Test Email Recipient & Real Sent Logs
  const [testRecipientEmail, setTestRecipientEmail] = useState('ducnguyen06112002@gmail.com');
  const [emailLogs, setEmailLogs] = useState<any[]>([]);

  const fetchEmailLogs = async () => {
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch('/api/admin/email-logs', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.logs) setEmailLogs(data.logs);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchEmailLogs();
  }, []);
  
  // AI Flow Generator State
  const [flowPrompt, setFlowPrompt] = useState('Tạo luồng 3 bước tự động chăm sóc hội viên mới sau khi đăng ký tập thử Gym & Boxing: gửi mail 01 chào mừng ngay lập tức, mail 02 sau 3 ngày nhắc lịch kiểm tra thể trạng & tư vấn lộ trình tập luyện cùng HLV, mail 03 sau 7 ngày hướng dẫn đăng ký lộ trình PT 1:1');
  const [generatingFlow, setGeneratingFlow] = useState(false);
  const [aiFlowResult, setAiFlowResult] = useState<EmailMarketingFlow | null>(null);

  // AI Email Composer State
  const [aiAudience, setAiAudience] = useState(initialAudience || 'Khách mới hoàn tất kiểm tra thể trạng & cần tư vấn gói tập');
  const [aiObjective, setAiObjective] = useState(initialObjective || 'Kêu gọi kích hoạt ưu đãi giảm 20% thẻ hội viên 12T');
  const [aiVoucher, setAiVoucher] = useState(initialVoucher || 'TANBINH3D');
  const [aiTone, setAiTone] = useState('Nhiệt huyết, truyền cảm hứng thể thao & chuyên nghiệp');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [testSending, setTestSending] = useState(false);

  // Generated Email content
  const [generatedEmail, setGeneratedEmail] = useState({
    subject: '🔥 Đánh thức năng lượng The Shine – Nhận ưu đãi 20% thẻ hội viên độc quyền!',
    preheader: 'Kết quả kiểm tra thể trạng & Lộ trình tập luyện cá nhân hóa đang chờ bạn.',
    headline: 'Bứt phá giới hạn thể lực cùng The Shine Fitness',
    greeting: 'Chào bạn,',
    paragraphs: [
      'Chúng tôi rất vui được chào đón bạn đến trải nghiệm không gian tập luyện chuẩn 5 sao tại The Shine Fitness Tân Bình.',
      'Dựa trên kết quả kiểm tra thể trạng và buổi đánh giá cùng Huấn luyện viên, cơ thể bạn đang có tiềm năng phát triển thể lực và cải thiện vóc dáng rất tốt nếu duy trì lịch tập từ 3-4 buổi/tuần.',
      'Để đồng hành cùng bạn trên hành trình này, The Shine gửi tặng bạn đặc quyền ưu đãi dành riêng cho thành viên mới.'
    ],
    voucherHighlight: 'TANBINH3D',
    ctaText: 'KÍCH HOẠT ƯU ĐÃI NGAY',
    ctaUrl: '#packages',
    footerNote: 'Ưu đãi có hiệu lực trong vòng 48 giờ kể từ khi nhận email này.'
  });

  const handleGenerateAiFlow = async () => {
    if (!flowPrompt.trim()) {
      onToast('⚠️ Vui lòng nhập ý tưởng hoặc yêu cầu luồng email.');
      return;
    }
    setGeneratingFlow(true);
    try {
      const headers = await getAdminAuthHeaders();
      const response = await fetch('/api/admin/generate-email-flow', {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt: flowPrompt })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.flow) {
          setAiFlowResult(data.flow);
          onToast('✨ Đã sinh thành công luồng Email Marketing bằng AI!');
        }
      } else {
        onToast('❌ Không thể sinh luồng email. Vui lòng thử lại.');
      }
    } catch (e) {
      console.error(e);
      onToast('❌ Lỗi kết nối khi sinh luồng AI.');
    } finally {
      setGeneratingFlow(false);
    }
  };

  const handleSaveAiGeneratedFlow = async () => {
    if (!aiFlowResult) return;
    try {
      await onSaveFlow(aiFlowResult);
      onToast(`✓ Đã lưu và kích hoạt luồng "${aiFlowResult.title}" vào cơ sở dữ liệu!`);
      setAiFlowResult(null);
      setSubTab('flows');
    } catch (err) {
      onToast('❌ Lỗi khi lưu luồng vào cơ sở dữ liệu.');
    }
  };

  const handleGenerateAiEmail = async () => {
    setAiGenerating(true);
    try {
      const headers = await getAdminAuthHeaders();
      const response = await fetch('/api/admin/generate-email', {
        method: 'POST',
        headers,
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

  const handleSendTestEmail = async (overrideEmail?: string) => {
    const emailToUse = overrideEmail || testRecipientEmail;
    if (!emailToUse || !emailToUse.includes('@')) {
      onToast('⚠️ Vui lòng nhập địa chỉ email nhận thư thử nghiệm hợp lệ.');
      return;
    }
    setTestSending(true);
    try {
      const headers = await getAdminAuthHeaders();
      const response = await fetch('/api/admin/send-email-test', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          recipientEmail: emailToUse,
          recipientName: 'Khách Hàng Đăng Ký Test',
          subject: generatedEmail.subject || `🔥 [The Shine Fitness] Kích Hoạt Thẻ Tập Thử & Voucher SHINE-3DAY-7789`,
          voucherCode: generatedEmail.voucherHighlight || 'SHINE-3DAY-7789',
          flowName: 'Luồng Email Marketing Tự Động Test'
        })
      });
      const data = await response.json();
      if (data.success) {
        onToast(`📧 Đã thực thi gửi email tự động tới ${emailToUse}!`);
        fetchEmailLogs();
      } else {
        onToast('❌ Không thể gửi email thử nghiệm.');
      }
    } catch (e) {
      console.error(e);
      onToast('❌ Lỗi kết nối gửi email.');
    } finally {
      setTestSending(false);
    }
  };

  const textHeading = isDark ? 'text-white' : 'text-slate-900';
  const textSub = isDark ? 'text-slate-400' : 'text-slate-500';

  const inputClass = `w-full px-3 py-2 text-xs rounded-xl border transition-colors outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 ${
    isDark ? 'bg-slate-800/90 border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
  }`;

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 font-sans">
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
          <span>Kịch Bản Tự Động Hóa ({emailFlows.length} Luồng)</span>
        </button>

        <button
          onClick={() => setSubTab('ai_flow_builder')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center space-x-2 ${
            subTab === 'ai_flow_builder'
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
              : isDark
              ? 'bg-slate-800 text-amber-400 hover:text-white'
              : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>✨ Tạo Luồng Email Tự Động Bằng AI Prompt</span>
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
          <Edit3 className="w-4 h-4" />
          <span>Trình Soạn Email Thông Minh (AI Composer)</span>
        </button>

        <button
          onClick={() => {
            setSubTab('logs');
            fetchEmailLogs();
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center space-x-2 ${
            subTab === 'logs'
              ? 'bg-orange-500 text-white shadow-sm'
              : isDark
              ? 'bg-slate-800 text-slate-400 hover:text-white'
              : 'bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>📬 Lịch Sử Gửi Email Auto ({emailLogs.length} Thư)</span>
        </button>
      </div>

      {/* SUB-TAB 1: AUTOMATION FLOWS */}
      {subTab === 'flows' && (
        <div className="space-y-5">
          <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div>
              <h2 className={`text-xl sm:text-2xl font-heading font-black uppercase tracking-tight ${textHeading}`}>
                Luồng Chăm Sóc Khách Hàng Tự Động (Email Funnel)
              </h2>
              <p className={`text-xs mt-0.5 font-sans ${textSub}`}>
                Các kịch bản tự động kích hoạt theo từng giai đoạn hội viên: Tập thử, Đo InBody, Nguy cơ Churn, Tái tục.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-sans">
                ● Trạng thái hoạt động: {emailFlows.filter(f => f.isActive).length}/{emailFlows.length} luồng
              </span>
              <button
                onClick={() => setSubTab('ai_flow_builder')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-sm flex items-center space-x-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>+ Tạo Luồng Bằng AI</span>
              </button>
            </div>
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
                      <h3 className={`text-base font-heading font-bold uppercase tracking-wide ${textHeading}`}>{flow.title}</h3>
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
                    <button
                      onClick={() => onDeleteFlow(flow)}
                      className="p-1.5 rounded-xl border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 transition-colors"
                      title="Xóa luồng"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Steps Sequence */}
                <div className="pt-4 space-y-3">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${textSub}`}>
                    Các bước thực thi trong luồng ({flow.steps.length} bước):
                  </span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {flow.steps.map((step, idx) => (
                      <div
                        key={step.id || idx}
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

      {/* SUB-TAB 2: AI FLOW BUILDER (PROMPT BASED) */}
      {subTab === 'ai_flow_builder' && (
        <div className="space-y-6 font-sans">
          {/* Header Banner */}
          <div className={`p-6 rounded-2xl border ${
            isDark ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border-slate-800' : 'bg-gradient-to-r from-amber-50/80 via-orange-50/50 to-white border-amber-200/80 shadow-sm'
          }`}>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] font-extrabold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>AI Marketing Automation Engine</span>
                </div>
                <h2 className={`text-xl sm:text-2xl font-heading font-black uppercase tracking-tight ${textHeading}`}>
                  Tạo Luồng Gửi Email Marketing Tự Động Bằng AI Prompt
                </h2>
                <p className={`text-xs max-w-3xl leading-relaxed ${textSub}`}>
                  Chỉ cần nhập yêu cầu kịch bản bằng văn bản tiếng Việt. Trí tuệ nhân tạo Gemini sẽ tự động thiết kế phễu gửi email nhiều bước, thiết lập thời gian hoãn (delay), soạn nội dung hấp dẫn kèm mã ưu đãi Voucher cho từng giai đoạn hành trình khách hàng.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Prompt Form */}
            <div className={`lg:col-span-5 p-6 rounded-2xl border space-y-4 ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div>
                <h3 className={`text-sm font-bold uppercase tracking-wider ${textHeading}`}>
                  1. Mẫu Yêu Cầu Gợi Ý (Preset Prompts)
                </h3>
                <p className={`text-xs mt-0.5 ${textSub}`}>
                  Chọn mẫu có sẵn hoặc chỉnh sửa theo ý tưởng riêng:
                </p>
              </div>

              {/* Sample prompt chips */}
              <div className="space-y-2">
                {[
                  {
                    title: '🔥 Chuyển đổi khách tập thử Gym & Boxing (3 bước)',
                    prompt: 'Tạo luồng 3 bước tự động chăm sóc hội viên mới sau khi đăng ký tập thử Gym & Boxing: gửi mail 01 chào mừng ngay lập tức, mail 02 sau 3 ngày nhắc lịch đo InBody & tặng voucher SHINE349, mail 03 sau 7 ngày hướng dẫn đăng ký lộ trình PT 1:1'
                  },
                  {
                    title: '⚡ Nhắc gia hạn thẻ hội viên sắp hết hạn (2 bước)',
                    prompt: 'Tạo luồng 2 bước gửi tự động cho hội viên VIP sắp hết hạn thẻ trong 7 ngày: mail 01 thông báo quyền lợi tích điểm & tặng mã TANBINH3D giảm 20% gia hạn, mail 02 gửi sau 4 ngày cảnh báo hết hạn đặc quyền'
                  },
                  {
                    title: '💙 Vẫn chưa đi tập trong 14 ngày (2 bước)',
                    prompt: 'Tạo luồng 2 bước tái kích hoạt hội viên vắng tập trên 14 ngày: mail 01 hỏi thăm sức khỏe & tặng 1 buổi tập PT Stretch dãn cơ 0đ, mail 02 gửi sau 5 ngày chia sẻ động lực tập luyện cùng HLV trưởng'
                  },
                  {
                    title: '🎁 Kích hoạt ưu đãi hội viên mới (2 bước)',
                    prompt: 'Tạo luồng 2 bước tự động gửi email mừng sinh nhật hoặc chào mừng thành viên mới với mã voucher gia hạn giảm 30% trực tiếp tại quầy lễ tân The Shine Tân Bình'
                  }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFlowPrompt(item.prompt)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-start space-x-2 ${
                      flowPrompt === item.prompt
                        ? 'bg-orange-500/10 border-orange-500 text-orange-600 dark:text-orange-400 font-semibold'
                        : isDark
                        ? 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:border-slate-600'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <ArrowRight className="w-3.5 h-3.5 shrink-0 mt-0.5 text-orange-500" />
                    <span>{item.title}</span>
                  </button>
                ))}
              </div>

              <div className="pt-2 space-y-2">
                <label className={`block text-xs font-bold uppercase tracking-wider ${textHeading}`}>
                  2. Nội Dung Prompt Chi Tiết (Custom Prompt)
                </label>
                <textarea
                  rows={5}
                  value={flowPrompt}
                  onChange={(e) => setFlowPrompt(e.target.value)}
                  placeholder="Nhập mô tả kịch bản tự động bằng tiếng Việt..."
                  className={inputClass}
                />
              </div>

              <button
                type="button"
                onClick={handleGenerateAiFlow}
                disabled={generatingFlow}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-orange-500/20 disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className={`w-4 h-4 text-amber-200 ${generatingFlow ? 'animate-spin' : ''}`} />
                <span>{generatingFlow ? 'AI Đang Xây Dựng Luồng Direct...' : '✨ Sinh Luồng Email Marketing Với AI'}</span>
              </button>
            </div>

            {/* Generated Flow Preview */}
            <div className={`lg:col-span-7 p-6 rounded-2xl border space-y-5 ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              {!aiFlowResult ? (
                <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-3">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h4 className={`text-sm font-bold uppercase ${textHeading}`}>
                    Sẵn Sàng Sinh Luồng Email Tự Động
                  </h4>
                  <p className={`text-xs max-w-sm mt-1 ${textSub}`}>
                    Nhập nội dung prompt ở bên trái và bấm nút <strong>"Sinh Luồng Email Marketing Với AI"</strong> để xem kết quả kịch bản trực quan trước khi đưa vào hoạt động.
                  </p>
                </div>
              ) : (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {aiFlowResult.triggerLabel || aiFlowResult.trigger}
                        </span>
                        <h3 className={`text-base font-extrabold uppercase ${textHeading}`}>
                          {aiFlowResult.title}
                        </h3>
                      </div>
                      <p className={`text-xs mt-1 ${textSub}`}>{aiFlowResult.description}</p>
                    </div>

                    <button
                      onClick={handleSaveAiGeneratedFlow}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md flex items-center space-x-1.5 shrink-0 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>🚀 Lưu & Kích Hoạt Luồng</span>
                    </button>
                  </div>

                  {/* Steps Timeline */}
                  <div className="space-y-4">
                    <h4 className={`text-xs font-bold uppercase tracking-wider ${textSub}`}>
                      Chi Tiết {aiFlowResult.steps.length} Bước Thực Thi Được Sinh Bởi AI:
                    </h4>

                    <div className="space-y-3">
                      {aiFlowResult.steps.map((step, idx) => (
                        <div
                          key={step.id || idx}
                          className={`p-4 rounded-xl border relative transition-all ${
                            isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/60 text-xs">
                            <div className="flex items-center space-x-2 font-bold text-orange-600 dark:text-orange-400">
                              <span className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center text-[10px]">
                                {idx + 1}
                              </span>
                              <span>{step.title}</span>
                            </div>
                            <span className={`flex items-center space-x-1 text-[11px] ${textSub}`}>
                              <Clock className="w-3.5 h-3.5" />
                              <span>{(step.delayDays ?? step.config?.delayDays ?? 0) === 0 ? 'Gửi ngay lập tức' : `Sau ${step.delayDays ?? step.config?.delayDays} ngày`}</span>
                            </span>
                          </div>

                          <div className="pt-2.5 space-y-1.5 text-xs">
                            <p className={`font-bold ${textHeading}`}>
                              📧 {step.subject || step.config?.emailSubject}
                            </p>
                            {step.config?.emailPreheader && (
                              <p className={`text-[11px] italic ${textSub}`}>
                                "{step.config.emailPreheader}"
                              </p>
                            )}
                            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                              {step.config?.emailBodyHtml}
                            </p>

                            <div className="flex flex-wrap items-center gap-3 pt-2">
                              {(step.voucherCode || step.config?.voucherCode) && (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-mono text-xs font-bold">
                                  <Tag className="w-3 h-3" />
                                  <span>Mã: {step.voucherCode || step.config?.voucherCode}</span>
                                </span>
                              )}
                              {step.config?.ctaText && (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold text-[11px]">
                                  <span>Nút: {step.config.ctaText}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex justify-end space-x-2">
                      <button
                        onClick={() => setAiFlowResult(null)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                          isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        Hủy Kết Quả
                      </button>
                      <button
                        onClick={handleSaveAiGeneratedFlow}
                        className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>🚀 Lưu Vào Firestore Database</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
                  onClick={() => handleSendTestEmail()}
                  disabled={testSending}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{testSending ? 'Đang gửi...' : 'Gửi Thử Nghiệm'}</span>
                </button>
                <button
                  onClick={() => onToast('✓ Đã lưu mẫu email vào hệ thống!')}
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

      {/* SUB-TAB 4: EMAIL LOGS & TEST SENDER */}
      {subTab === 'logs' && (
        <div className="space-y-6">
          <EmailDispatchForm 
            isDark={isDark} 
            onToast={onToast} 
            title="Form Test Gửi Email Tự Động Trực Tiếp (Admin ducnguyen06112002@gmail.com)"
          />

          {/* Email Logs Table */}
          <div className={`p-5 rounded-2xl border space-y-4 ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <h3 className={`text-base font-bold ${textHeading}`}>
              Lịch Sử Gửi Mail Tự Động (Real-time Email Dispatch Logs)
            </h3>

            {emailLogs.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <Clock className="w-8 h-8 mx-auto text-slate-400 animate-pulse" />
                <p className={`text-xs ${textSub}`}>Chưa có email nào được gửi trong phiên làm việc hiện tại.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                      isDark ? 'border-slate-800 text-slate-400 bg-slate-800/50' : 'border-slate-200 text-slate-500 bg-slate-50'
                    }`}>
                      <th className="py-3 px-3">Thời Gian</th>
                      <th className="py-3 px-3">Người Nhận (Email)</th>
                      <th className="py-3 px-3">Tiêu Đề Email</th>
                      <th className="py-3 px-3">Sự Kiện Kích Hoạt</th>
                      <th className="py-3 px-3">Mã Voucher</th>
                      <th className="py-3 px-3">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
                    {emailLogs.map((log: any) => (
                      <tr key={log.id} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}>
                        <td className={`py-3 px-3 whitespace-nowrap ${textSub}`}>
                          {new Date(log.sentAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="py-3 px-3 font-semibold text-orange-500">
                          {log.recipient}
                          {log.recipientName && (
                            <span className={`block text-[10px] font-normal ${textSub}`}>{log.recipientName}</span>
                          )}
                        </td>
                        <td className={`py-3 px-3 max-w-xs truncate font-medium ${textHeading}`}>
                          {log.subject}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium text-[11px]">
                            <span>{log.triggerEvent || 'new_trial_registered'}</span>
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap font-mono font-bold text-amber-600 dark:text-amber-400">
                          {log.voucherCode || 'N/A'}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>DELIVERED</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
