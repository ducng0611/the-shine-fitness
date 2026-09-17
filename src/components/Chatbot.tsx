import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  RotateCcw, 
  ShieldCheck, 
  Sparkles,
  User,
  Clock,
  CheckCircle2,
  MapPin,
  Facebook,
  Music2,
  ExternalLink,
  Gift,
  Copy,
  Check,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Language, translations } from '../translations';
import { MemberUser } from './AuthModal';
import { getCustomerPronoun } from '../utils/gender';

type Message = {
  id: string;
  role: 'user' | 'model';
  text: string;
  isAck?: boolean;
};

interface ChatbotProps {
  lang?: Language;
  currentUser?: MemberUser | null;
  onOpenTrialModal?: () => void;
}

// Clean LaTeX and mathematical formatting from bot outputs
function formatBotResponse(text: string): string {
  if (!text) return '';
  
  let formatted = text;

  // Handle LaTeX fractions \frac{numerator}{denominator}
  formatted = formatted.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 ÷ ($2)');

  // Remove LaTeX \text{...}
  formatted = formatted.replace(/\\text\{([^}]+)\}/g, '$1');

  // Replace common LaTeX symbols
  formatted = formatted.replace(/\\times/g, '×');
  formatted = formatted.replace(/\\div/g, '÷');
  formatted = formatted.replace(/\\approx/g, '≈');
  formatted = formatted.replace(/\\le/g, '≤');
  formatted = formatted.replace(/\\ge/g, '≥');
  formatted = formatted.replace(/\\cdot/g, '•');

  // Clean mathematical delimiters $$, $, \[, \], \(, \)
  formatted = formatted.replace(/\$\$\s*(.*?)\s*\$\$/gs, '\n\n【 $1 】\n\n');
  formatted = formatted.replace(/\\\[\s*(.*?)\s*\\\]/gs, '\n\n【 $1 】\n\n');
  formatted = formatted.replace(/\\\(\s*(.*?)\s*\\\)/gs, '$1');
  formatted = formatted.replace(/\$([^\$\n]+)\$/g, '$1');

  // Standardize multiple line breaks
  formatted = formatted.replace(/\n{3,}/g, '\n\n');

  return formatted.trim();
}

// Marketing acknowledgments rotated when customer sends messages with proper honorifics
function getAckMessagesVi(pronoun: string): string[] {
  return [
    `Dạ The Shine đã nhận được tin nhắn của ${pronoun} rồi ạ! ${pronoun} đợi em một xíu xiu nhé, em kiểm tra và trả lời ngay cho ${pronoun} đây ạ 🧡\n\n*(Bật mí nhỏ: The Shine đang tặng Voucher 03 ngày tập thử VIP mã SHINE-TRIAL-FREE + đo InBody 0đ tại 154 Hoàng Hoa Thám, ${pronoun} đừng bỏ lỡ nha! Giờ mở cửa: T2-T7 06:00-21:00, CN 06:00-20:30)*`,
    `Dạ em đã nhận được câu hỏi của ${pronoun} rồi ạ! Em kiểm tra thông tin và phản hồi ${pronoun} ngay đây nha ✨\n\n*(Nhân tiện The Shine đang có ưu đãi giảm 20% thẻ tập cho HSSV, vé ngày Day Pass 100k và tặng 02 buổi PT 1-kèm-1 cho gói Premium nữa đó ạ!)*`,
    `Dạ em nghe đây ạ! Đợi em vài giây kiểm tra chi tiết gửi ${pronoun} liền nhé 💪\n\n*(Gợi ý: Vé tập thử 3 ngày mã SHINE-TRIAL-FREE bên em được dùng không giới hạn toàn bộ phòng gym 3 tầng 1.500m², studio Yoga/Zumba, xông hơi khô & ướt thảo dược hoàn toàn 0đ nhé!)*`
  ];
}

const ACK_MARKETING_MESSAGES_EN = [
  "Thank you for messaging The Shine! Please give me just a few seconds to pull up the details and reply right away 🧡\n\n*(Quick perk: The Shine is offering a complimentary 3-Day VIP Trial Pass (code SHINE-TRIAL-FREE) + InBody assessment at 154 Hoang Hoa Tham — open Mon-Sat 06:00-21:00, Sun 06:00-20:30!)*",
  "Got your message! I'm checking the details and replying right now ✨\n\n*(By the way, we currently offer 20% off for students, 100k Day Pass, and 2 free 1-on-1 PT sessions with our Premium membership!)*",
  "Thanks for reaching out! Give me just a moment 💪\n\n*(Did you know? Our 3-day pass includes full access to gym equipment, yoga classes, herbal steam rooms, and free parking!)*"
];

export function getPersonalizedGreeting(lang: Language, user?: MemberUser | null): string {
  const currentHour = new Date().getHours();
  // Time blocks:
  // Sáng: 5:00 - 11:59
  // Trưa & Chiều: 12:00 - 17:59
  // Tối & Đêm: 18:00 - 4:59
  const isMorning = currentHour >= 5 && currentHour < 12;
  const isAfternoon = currentHour >= 12 && currentHour < 18;

  const { pronoun, greetingTitle } = getCustomerPronoun(user?.gender, user?.fullName);
  const userName = user?.fullName?.trim();
  const tier = user?.membershipTier ? user.membershipTier.toUpperCase() : null;

  if (lang === 'vi') {
    if (user && userName) {
      const callTitle = greetingTitle || `${pronoun} ${userName}`;
      if (isMorning) {
        return `Chào buổi sáng ${callTitle}! ☀️ Chúc ${pronoun} một ngày mới tràn đầy năng lượng và bứt phá mục tiêu thể hình tại The Shine! Em là tư vấn viên The Shine, hôm nay em có thể hỗ trợ gì cho hội viên ${tier || 'thân thiết'} của mình (lịch tập, đặt hẹn PT, lịch lớp Yoga/Zumba...) không ạ?`;
      } else if (isAfternoon) {
        return `Chào buổi chiều ${callTitle}! 🌤️ Hôm nay ${pronoun} đã lên lịch ghé 154 Hoàng Hoa Thám tập luyện xả stress chưa ạ? Em là tư vấn viên The Shine, em có thể hỗ trợ ${pronoun} kiểm tra lịch lớp chiều tối nay hay hỗ trợ đặt lịch HLV cá nhân không ạ?`;
      } else {
        return `Chào buổi tối ${callTitle}! 🌙 Sau một ngày làm việc bận rộn, ghé The Shine đốt mỡ và thư giãn tại phòng xông hơi thảo dược là tuyệt nhất đấy ạ! Em có thể giúp gì cho hội viên ${tier || 'The Shine'} tối nay ạ?`;
      }
    } else {
      const coreMessage = `Em là tư vấn viên tại The Shine Fitness & Yoga (154 Hoàng Hoa Thám, Tân Bình.\nGiờ mở cửa: 06:00 - 21:00 T2-T7, 06:00 - 20:30 CN).\nHôm nay em có thể hỗ trợ Anh/Chị tìm hiểu giá các gói tập, lịch lớp Yoga/Zumba hay đăng ký nhận Voucher 3 ngày tập thử VIP miễn phí ạ?`;
      if (isMorning) {
        return `Chào buổi sáng Anh/Chị ạ! ☀️ Chúc Anh/Chị một ngày mới ngập tràn năng lượng!\n${coreMessage}`;
      } else if (isAfternoon) {
        return `Chào buổi chiều Anh/Chị ạ! 🌤️ Chúc Anh/Chị một buổi chiều tràn đầy năng lượng!\n${coreMessage}`;
      } else {
        return `Chào buổi tối Anh/Chị ạ! 🌙 Chúc Anh/Chị một buổi tối thư giãn!\n${coreMessage}`;
      }
    }
  } else {
    if (userName) {
      if (isMorning) {
        return `Good morning, ${userName}! ☀️ Wishing you an energized day! As your Shine ${tier || 'fitness'} concierge, how may I assist your training journey today (class schedules, PT bookings, or gym amenities)?`;
      } else if (isAfternoon) {
        return `Good afternoon, ${userName}! 🌤️ Ready for a rejuvenating workout today? Let me know if you need help with evening class schedules or personal trainer bookings!`;
      } else {
        return `Good evening, ${userName}! 🌙 Ready to unwind and sweat it out at The Shine tonight? How can I assist our valued ${tier || 'member'} this evening?`;
      }
    } else {
      if (isMorning) {
        return `Good morning! ☀️ Wishing you a wonderful and energetic day ahead. I'm your fitness consultant at The Shine Fitness & Yoga (154 Hoang Hoa Tham, open 06:00 - 21:00 Mon-Sat, 06:00 - 20:30 Sun). How can I assist you today with membership pricing, class schedules, or claiming your free 3-day trial pass (code SHINE-TRIAL-FREE)?`;
      } else if (isAfternoon) {
        return `Good afternoon! 🌤️ Hope your day is going great! I'm your consultant from The Shine Fitness & Yoga. May I help you explore our gym packages, Yoga & Zumba classes, or book a free 3-day trial session today?`;
      } else {
        return `Good evening! 🌙 Looking to de-stress with a refreshing workout tonight? I'm your consultant at The Shine Fitness & Yoga. May I guide you through our special memberships or reserve your complimentary 3-day pass (code SHINE-TRIAL-FREE)?`;
      }
    }
  }
}

export default function Chatbot({ lang = 'vi', currentUser, onOpenTrialModal }: ChatbotProps) {
  const t = translations[lang].chatbot;
  const [isOpen, setIsOpen] = useState(false);

  // Auto-open chatbot after 1.5s to suggest helping the customer
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);
  const [effectiveUser, setEffectiveUser] = useState<MemberUser | null>(currentUser || null);
  const [copiedVoucher, setCopiedVoucher] = useState(false);

  // Fallback to localStorage if currentUser not passed directly
  useEffect(() => {
    if (currentUser) {
      setEffectiveUser(currentUser);
    } else if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('the_shine_member');
      if (saved) {
        try {
          setEffectiveUser(JSON.parse(saved));
        } catch (e) {
          setEffectiveUser(null);
        }
      } else {
        setEffectiveUser(null);
      }
    }
  }, [currentUser]);

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('shine_chatbot_messages');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading chatbot messages from localStorage', e);
    }
    return [
      { 
        id: 'initial', 
        role: 'model', 
        text: getPersonalizedGreeting(lang, currentUser)
      }
    ];
  });

  // Persist the last 3 messages to localStorage
  useEffect(() => {
    try {
      const messagesToSave = messages.slice(-3);
      localStorage.setItem('shine_chatbot_messages', JSON.stringify(messagesToSave));
    } catch (e) {
      console.error('Error saving chatbot messages to localStorage', e);
    }
  }, [messages]);
  const [input, setInput] = useState('');
  const [isConsultantTyping, setIsConsultantTyping] = useState(false);
  const ackIndexRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick inquiry suggestions for customers
  const quickSuggestions = [
    lang === 'vi' ? '🎁 Nhận Voucher tập thử 3 ngày' : '🎁 Claim Free 3-Day Pass',
    lang === 'vi' ? '⏰ Giờ mở cửa & Địa chỉ 154 Hoàng Hoa Thám' : '⏰ Hours & Location',
    lang === 'vi' ? '💳 Bảng giá thẻ tập & Ưu đãi HSSV giảm 20%' : '💳 Pricing & Student 20% off',
    lang === 'vi' ? '🏋️ Khóa PT 1-kèm-1 theo số buổi' : '🏋️ PT 1-on-1 Packages',
    lang === 'vi' ? '🧘 Lớp Yoga, Zumba & Đo InBody 0đ' : '🧘 Yoga, Zumba & Free InBody'
  ];

  // Update initial greeting when user or language changes
  useEffect(() => {
    setMessages(prev => {
      const newGreeting = getPersonalizedGreeting(lang, effectiveUser);
      if (prev.length === 0) {
        return [{ id: 'initial', role: 'model', text: newGreeting }];
      }
      
      const newMessages = [...prev];
      if (newMessages[0].role === 'model') {
        newMessages[0].text = newGreeting;
      }
      return newMessages;
    });
  }, [lang, effectiveUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isConsultantTyping]);

  const sendMessageWithText = async (textToSend: string) => {
    if (!textToSend.trim() || isConsultantTyping) return;

    const userMessageText = textToSend.trim();
    const userMsgId = `user_${Date.now()}`;
    const userMessage: Message = { id: userMsgId, role: 'user', text: userMessageText };

    // Resolve honorific pronoun for customer
    const { pronoun } = getCustomerPronoun(effectiveUser?.gender, effectiveUser?.fullName);

    // Select marketing acknowledgment
    const ackPool = lang === 'vi' ? getAckMessagesVi(pronoun) : ACK_MARKETING_MESSAGES_EN;
    const ackText = ackPool[ackIndexRef.current % ackPool.length];
    ackIndexRef.current += 1;

    const ackMessage: Message = {
      id: `ack_${Date.now() + 1}`,
      role: 'model',
      text: ackText,
      isAck: true
    };

    // 1. Immediately post user message + marketing acknowledgment
    setMessages(prev => [...prev, userMessage, ackMessage]);
    setInput('');
    setIsConsultantTyping(true);

    try {
      // Build conversation history for Gemini (strictly user questions and real consultant replies, omitting marketing acks)
      const historyPayload = messages
        .filter(m => m.id !== 'initial' && !m.isAck)
        .map(m => ({ role: m.role, text: m.text }));

      // Add a brief human-like pause (500ms) before hitting API or displaying answer
      const startTime = Date.now();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessageText,
          history: historyPayload,
          memberInfo: effectiveUser ? {
            fullName: effectiveUser.fullName,
            gender: effectiveUser.gender,
            memberCode: effectiveUser.memberCode,
            membershipTier: effectiveUser.membershipTier,
            phone: effectiveUser.phone,
            email: effectiveUser.email
          } : null
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch from API');
      }

      const data = await response.json();
      const cleanReply = formatBotResponse(data.text || '');

      // Guarantee at least 600ms total typing feeling so it feels genuinely crafted by a person
      const elapsed = Date.now() - startTime;
      if (elapsed < 600) {
        await new Promise(res => setTimeout(res, 600 - elapsed));
      }

      const consultantMessage: Message = { 
        id: `consultant_${Date.now()}`, 
        role: 'model', 
        text: cleanReply || (lang === 'vi' ? `Dạ em đây ạ! ${pronoun} cần em hỗ trợ thêm thông tin gì về phòng tập không ạ?` : 'Here to help! Do you need any more details?') 
      };

      setMessages((prev) => [...prev, consultantMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = { 
        id: `err_${Date.now()}`, 
        role: 'model', 
        text: lang === 'vi' 
          ? `Dạ em xin lỗi ${pronoun}, đường truyền bị gián đoạn đôi chút. ${pronoun} có thể gọi trực tiếp hotline 0946 293 593 để em hỗ trợ ngay nhé ạ!` 
          : 'I apologize, the connection was interrupted. Please reach our hotline at 0946 293 593 for immediate assistance!' 
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsConsultantTyping(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessageWithText(input);
  };

  const handleResetChat = () => {
    setMessages([
      { 
        id: 'initial', 
        role: 'model', 
        text: getPersonalizedGreeting(lang, effectiveUser)
      }
    ]);
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 bg-brand-orange text-white rounded-full shadow-2xl hover:bg-orange-600 focus:outline-hidden focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 z-40 transition-transform cursor-pointer flex items-center justify-center ${isOpen ? 'scale-0' : 'scale-100'}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open The Shine Fitness Concierge"
      >
        <div className="relative">
          <MessageSquare size={26} />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full ring-2 ring-white animate-pulse" />
        </div>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 w-[calc(100vw-1.5rem)] sm:w-[420px] h-[580px] sm:h-[630px] max-h-[90vh] bg-white dark:bg-[#151515] rounded-3xl shadow-2xl flex flex-col overflow-hidden z-50 border border-slate-200 dark:border-white/10"
          >
            {/* Header with Real Consultant Persona */}
            <div className="bg-slate-950 text-white p-4 shrink-0 border-b border-white/10">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-orange to-orange-600 flex items-center justify-center font-heading font-bold text-white shadow-md italic text-lg shrink-0">
                      TS
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-slate-950"></span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-heading font-bold uppercase tracking-wide leading-tight text-white text-sm sm:text-base">
                        {t.title}
                      </h3>
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-1.5 py-0.2 rounded-md uppercase tracking-wider">
                        Online
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1">
                      <ShieldCheck size={12} className="text-emerald-400" />
                      <span>{t.subtitle}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {/* Reset History */}
                  <button 
                    type="button"
                    onClick={handleResetChat}
                    title={lang === 'vi' ? 'Làm mới cuộc trò chuyện' : 'Reset Conversation'}
                    className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-xl hover:bg-white/10 cursor-pointer"
                  >
                    <RotateCcw size={16} />
                  </button>

                  {/* Close Window */}
                  <button 
                    type="button"
                    onClick={() => setIsOpen(false)}
                    aria-label="Close Chat"
                    className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-xl hover:bg-white/10 cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Status Bar */}
              <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-white/5 pt-1.5">
                <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  {effectiveUser ? (
                    <span className="text-amber-400 font-bold">
                      {lang === 'vi' ? 'Hội viên: ' : 'Member: '} {effectiveUser.fullName}
                    </span>
                  ) : (
                    <span>{lang === 'vi' ? 'Tư vấn viên trực tuyến' : 'Live Fitness Consultant'}</span>
                  )}
                </span>
                <span className="text-brand-orange font-semibold">
                  0946 293 593
                </span>
              </div>
            </div>

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-[#121212] flex flex-col gap-3">
              
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[92%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-brand-orange text-white rounded-tr-xs font-medium shadow-sm' 
                        : 'bg-white dark:bg-[#1c1c1c] text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 rounded-tl-xs shadow-xs whitespace-pre-wrap'
                    }`}
                  >
                    {/* Render message with clean typography and styled formula boxes */}
                    {msg.text.split('【').map((part, index) => {
                      if (index === 0) {
                        return <span key={index}>{part}</span>;
                      }
                      const [formula, ...rest] = part.split('】');
                      return (
                        <React.Fragment key={index}>
                          <div className="my-2 p-2.5 rounded-xl bg-orange-100/60 dark:bg-brand-orange/15 border border-brand-orange/40 text-center font-mono font-bold text-slate-900 dark:text-orange-200 text-xs shadow-xs select-all">
                            📐 {formula.trim()}
                          </div>
                          {rest.join('】')}
                        </React.Fragment>
                      );
                    })}

                    {/* Interactive Trial Pass Voucher Card */}
                    {msg.role === 'model' && (msg.id === 'initial' || msg.text.includes('SHINE-TRIAL-FREE')) && (
                      <div className="mt-3 p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-300 dark:border-amber-700/50 shadow-xs">
                        <div className="flex flex-col gap-2 mb-3">
                          <div className="flex items-start gap-1.5 text-amber-800 dark:text-amber-300 font-bold text-[13px] leading-snug">
                            <Gift size={16} className="text-brand-orange shrink-0 mt-0.5" />
                            <span>Voucher 03 ngày trải nghiệm phòng tập 5 sao VIP</span>
                          </div>
                          <div className="pl-5 mt-0.5">
                            <span className="inline-block text-sm font-black px-3 py-1.5 rounded-full bg-brand-orange text-white shadow-md whitespace-nowrap uppercase tracking-wide">
                              Trị giá 350K
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 text-[11px] text-slate-600 dark:text-slate-300 space-y-2">
                          <p className="flex items-center gap-1.5">
                            <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                            <span>Tập Gym 24/7, xông hơi, giữ xe MIỄN PHÍ</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                            <span>Tặng 01 buổi đo InBody định kỳ cùng HLV.</span>
                          </p>
                        </div>

                        {onOpenTrialModal && (
                          <button
                            type="button"
                            onClick={onOpenTrialModal}
                            className="mt-3 w-full py-2 px-3 rounded-lg bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer active:scale-98"
                          >
                            <Calendar size={13} />
                            <span>Nhận Voucher và Giữ chỗ ngay</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Social media links attached to the acknowledgment message */}
                    {msg.isAck && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-white/10">
                        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2">
                          {t.socialChannelsTitle || (lang === 'vi' ? 'Kênh kết nối chính thức của The Shine:' : 'Official The Shine Channels:')}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <a
                            href="https://maps.app.goo.gl/Hyn5UHxdnvFDETjc6"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800/40 text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            <MapPin size={13} className="text-red-500 shrink-0" />
                            <span>{t.mapsLabel || 'Google Maps'}</span>
                            <ExternalLink size={10} className="opacity-60 shrink-0" />
                          </a>
                          <a
                            href="https://www.facebook.com/theshinefitness"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-[#1877F2] dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            <Facebook size={13} className="text-[#1877F2] shrink-0" />
                            <span>{t.facebookLabel || 'Facebook'}</span>
                            <ExternalLink size={10} className="opacity-60 shrink-0" />
                          </a>
                          <a
                            href="https://www.tiktok.com/@the.shine.fitness"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            <Music2 size={13} className="text-pink-500 shrink-0" />
                            <span>{t.tiktokLabel || 'TikTok'}</span>
                            <ExternalLink size={10} className="opacity-60 shrink-0" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Realistic Typing Indicator */}
              {isConsultantTyping && (
                <div className="flex justify-start animate-fadeIn">
                  <div className="bg-white dark:bg-[#1c1c1c] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 rounded-2xl rounded-tl-xs px-4 py-2.5 shadow-xs flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-bounce"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-bounce [animation-delay:0.4s]"></span>
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      {t.typingText || (lang === 'vi' ? 'Tư vấn viên The Shine đang phản hồi...' : 'Consultant is typing...')}
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions Chips */}
            {messages.length <= 4 && !isConsultantTyping && (
              <div className="px-3 pt-2 pb-1.5 bg-white dark:bg-[#151515] border-t border-slate-100 dark:border-white/5 flex flex-wrap gap-1.5 shrink-0">
                {quickSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => sendMessageWithText(item)}
                    className="text-[10px] sm:text-[11px] bg-slate-100 hover:bg-brand-orange hover:text-white dark:bg-white/10 dark:hover:bg-brand-orange text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full transition-colors cursor-pointer border border-slate-200 dark:border-white/5 whitespace-nowrap active:scale-95"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}

            {/* Input Form Area */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-[#151515] border-t border-slate-200 dark:border-white/10 shrink-0">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t.placeholder || (lang === 'vi' ? 'Nhắn tin cho tư vấn viên The Shine...' : 'Type your question...')}
                  className="w-full pl-4 pr-12 py-3 bg-slate-100 dark:bg-[#202020] border border-slate-200 dark:border-white/10 rounded-full focus:outline-hidden focus:ring-2 focus:ring-brand-orange text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs sm:text-sm transition-all"
                  disabled={isConsultantTyping}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isConsultantTyping}
                  aria-label="Send"
                  className="absolute right-1.5 p-2 bg-brand-orange text-white rounded-full disabled:opacity-50 hover:bg-orange-600 transition-colors shadow-xs cursor-pointer active:scale-95"
                >
                  <Send size={16} className="-ml-0.5" />
                </button>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-2 px-1">
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={11} className="text-emerald-500" />
                  <span>{lang === 'vi' ? 'Tư vấn viên trực tiếp' : 'Direct Consultant'}</span>
                </span>
                <span className="text-slate-400">154 Hoàng Hoa Thám, Tân Bình</span>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
