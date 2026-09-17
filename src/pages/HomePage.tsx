import React from 'react';
import { FadeIn } from '../components/FadeIn';
import { Search, MessageCircle, CheckCircle, Heart, Bot, ArrowRight, Star, ShieldCheck, Zap } from 'lucide-react';

interface Props {
  openRegistration: (pkg?: string) => void;
}

export const HomePage: React.FC<Props> = ({ openRegistration }) => {
  return (
    <div className="w-full">
      {/* 5A Journey Hero */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 bg-slate-50 dark:bg-[#121212] overflow-hidden transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn>
            <div className="text-center max-w-4xl mx-auto">
              
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-heading font-black uppercase italic leading-tight mb-8">
                <span className="text-slate-900 dark:text-white">ĐỘT PHÁ VÓC DÁNG</span><br/>
                <span className="text-brand-orange">TỎA SÁNG CÙNG THE SHINE</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl mx-auto mb-10 text-justify text-pretty px-4 sm:px-8">
                Tại The Shine, chúng tôi không chỉ cung cấp không gian tập luyện chuẩn 5 sao, mà còn đồng hành cùng bạn qua từng bước của hành trình thay đổi bản thân.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* A1: Aware & Appeal */}
      <section className="py-20 sm:py-28 bg-white dark:bg-[#181818] border-y border-slate-200 dark:border-white/10 transition-colors">
        <FadeIn>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-7">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 dark:bg-orange-500/15 flex items-center justify-center mb-6">
                  <Search className="text-brand-orange" size={24} />
                </div>
                <h2 className="text-[28px] sm:text-[32px] xl:text-[40px] tracking-tight font-heading font-black uppercase italic text-brand-orange mb-6 leading-tight whitespace-pre-wrap sm:whitespace-nowrap lg:whitespace-normal xl:whitespace-nowrap">
                  Khởi Nguồn Đam Mê
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed text-justify text-pretty mb-6">
                  Hành trình bắt đầu khi bạn nhận ra nhu cầu thay đổi vóc dáng và sức khỏe. Dù bạn vô tình lướt thấy video hướng dẫn tập luyện trên TikTok, đọc một bài đăng trên Facebook, hay đi ngang qua cơ sở hiện đại của The Shine tại Tân Bình, điều đọng lại luôn là sự chuyên nghiệp của đội ngũ HLV và không gian tập luyện đẳng cấp.
                </p>
                <ul className="space-y-4">
                  {[
                    'Vị trí thuận tiện, dễ dàng tiếp cận.',
                    'Hình ảnh thực tế không gian 5 sao hiện đại.',
                    'Đội ngũ HLV/PT giàu kinh nghiệm, truyền cảm hứng.'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Star className="text-brand-orange shrink-0 mt-1" size={18} />
                      <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="lg:col-span-5 relative aspect-square sm:aspect-video lg:aspect-square rounded-3xl overflow-hidden shadow-2xl">
                <img src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=80" alt="Awareness" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* A2: Ask */}
      <section className="py-20 sm:py-28 bg-slate-50 dark:bg-[#121212] transition-colors">
        <FadeIn>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-7 lg:order-last">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 dark:bg-orange-500/15 flex items-center justify-center mb-6">
                  <MessageCircle className="text-brand-orange" size={24} />
                </div>
                <h2 className="text-[28px] sm:text-[32px] xl:text-[40px] tracking-tight font-heading font-black uppercase italic text-brand-orange mb-6 leading-tight whitespace-pre-wrap sm:whitespace-nowrap lg:whitespace-normal xl:whitespace-nowrap">
                  Giải Pháp Từ Chuyên Gia
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed text-justify text-pretty mb-6">
                  Khi bạn bắt đầu chủ động nhắn tin qua Fanpage, Zalo hoặc đến trực tiếp để hỏi về bảng giá, lịch tập hay thông tin HLV. Tại The Shine, chúng tôi hiểu rằng "sự chờ đợi" là điều gây khó chịu nhất. Vì vậy, hệ thống tư vấn đa kênh kết hợp cùng Trợ lý ảo AI luôn sẵn sàng giải đáp minh bạch, rõ ràng mọi thắc mắc của bạn chỉ trong vài giây.
                </p>
                <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
                  <h4 className="font-heading font-bold text-slate-900 dark:text-white mb-2 italic">Không chèo kéo, báo giá minh bạch</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Cam kết cung cấp đầy đủ thông tin để bạn tự do quyết định, không áp lực sales.</p>
                </div>
              </div>
              <div className="lg:col-span-5 lg:order-first relative aspect-square sm:aspect-video lg:aspect-square rounded-3xl overflow-hidden shadow-2xl">
                <img src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1000&q=80" alt="Ask Phase" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* A3: Act */}
      <section className="py-20 sm:py-28 bg-white dark:bg-[#181818] border-y border-slate-200 dark:border-white/10 transition-colors">
        <FadeIn>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-7">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 dark:bg-orange-500/15 flex items-center justify-center mb-6">
                  <CheckCircle className="text-brand-orange" size={24} />
                </div>
                <h2 className="text-[28px] sm:text-[32px] xl:text-[40px] tracking-tight font-heading font-black uppercase italic text-brand-orange mb-6 leading-tight whitespace-pre-wrap sm:whitespace-nowrap lg:whitespace-normal xl:whitespace-nowrap">
                  Trải Nghiệm Tập Luyện Đỉnh Cao
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed text-justify text-pretty mb-6">
                  Hành động mạnh mẽ nhất là khi bạn bước chân vào phòng tập. Ấn tượng từ buổi tập thử đầu tiên, sự tiện lợi khi đặt lịch, mức giá hợp lý và đặc biệt là sự tận tình của HLV sẽ là những yếu tố quyết định. Bạn sẽ cảm nhận được sự thay đổi ngay từ những giọt mồ hôi đầu tiên.
                </p>
                <button
                  onClick={() => openRegistration('Tập thử trải nghiệm')}
                  className="bg-brand-orange hover:bg-orange-600 text-white px-8 py-4 rounded-full font-heading font-bold uppercase italic shadow-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                >
                  <Zap size={20} />
                  Bắt Đầu Hành Trình Của Bạn
                </button>
              </div>
              <div className="lg:col-span-5 relative aspect-square sm:aspect-video lg:aspect-square rounded-3xl overflow-hidden shadow-2xl">
                <img src="https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1000&q=80" alt="Act Phase" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* A4: Advocate & AI */}
      <section className="py-20 sm:py-28 bg-slate-900 transition-colors text-white">
        <FadeIn>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black uppercase italic text-brand-orange leading-tight mb-6">
                Cộng Đồng Khỏe Đẹp & Trợ Lý AI
              </h2>
              <p className="text-slate-400 text-base leading-relaxed text-justify text-pretty px-4">
                Sự hài lòng không dừng lại ở kết quả tập luyện, mà còn ở cách chúng tôi chăm sóc bạn mỗi ngày. Sự tiện lợi trong việc gia hạn, đặt lịch PT và giải quyết khiếu nại giúp The Shine trở thành người bạn đồng hành tin cậy.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl flex flex-col items-center text-center">
                <Heart className="text-brand-orange mb-6" size={48} />
                <h3 className="text-xl font-heading font-bold italic mb-4">GẮN BÓ & ỦNG HỘ</h3>
                <p className="text-sm text-slate-400 leading-relaxed text-justify text-pretty">
                  Sự thay đổi tích cực về sức khỏe và vóc dáng của bạn là minh chứng sống động nhất. Bạn tự tin giới thiệu The Shine cho bạn bè và người thân vì bạn đã thực sự trải nghiệm dịch vụ chất lượng, minh bạch và tận tâm.
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-brand-orange/30 p-8 rounded-3xl flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/20 blur-[50px] rounded-full"></div>
                <Bot className="text-brand-orange mb-6" size={48} />
                <h3 className="text-xl font-heading font-bold italic mb-4">TÍCH HỢP TRỢ LÝ CÔNG NGHỆ</h3>
                <p className="text-sm text-slate-400 leading-relaxed text-justify text-pretty">
                  Luôn sẵn sàng 24/7 để báo giá, xếp lịch và trả lời câu hỏi cơ bản một cách chính xác, minh bạch. Khi bạn cần thương lượng giá hay phản ánh dịch vụ, hệ thống lập tức kết nối bạn với Quản lý (người thật) để xử lý thấu đáo nhất.
                </p>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>
    </div>
  );
};
