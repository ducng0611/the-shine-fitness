import React from 'react';
import { FadeIn } from '../components/FadeIn';
import { Search, MessageCircle, CheckCircle, Heart, Bot, ArrowRight, Star, ShieldCheck, Zap } from 'lucide-react';

interface Props {
  openRegistration: (pkg?: string) => void;
  lang: 'vi' | 'en';
  t: any;
}

export const HomePage: React.FC<Props> = ({ openRegistration, lang, t }) => {
  return (
    <div className="w-full">
      {/* 5A Journey Hero */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 bg-slate-50 dark:bg-[#121212] overflow-hidden transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn>
            <div className="text-center max-w-4xl mx-auto">
              
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-heading font-black uppercase italic leading-tight mb-8">
                <span className="text-slate-900 dark:text-white">{t.journey.hero_title_1}</span><br/>
                <span className="text-brand-orange">{t.journey.hero_title_2}</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl mx-auto mb-10 text-justify text-pretty px-4 sm:px-8">
                {t.journey.hero_desc}
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
                  {t.journey.a1_title}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed text-justify text-pretty mb-6">
                  {t.journey.a1_desc}
                </p>
                <ul className="space-y-4">
                  {[
                    t.journey.a1_item1,
                    t.journey.a1_item2,
                    t.journey.a1_item3
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
                  {t.journey.a2_title}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed text-justify text-pretty mb-6">
                  {t.journey.a2_desc}
                </p>
                <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
                  <h4 className="font-heading font-bold text-slate-900 dark:text-white mb-2 italic">{t.journey.a2_box_title}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{t.journey.a2_box_desc}</p>
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
                  {t.journey.a3_title}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed text-justify text-pretty mb-6">
                  {t.journey.a3_desc}
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    onClick={() => openRegistration('Tập thử trải nghiệm')}
                    className="bg-brand-orange hover:bg-orange-600 text-white px-8 py-4 rounded-full font-heading font-bold uppercase italic shadow-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Zap size={20} />
                    {t.journey.a3_btn}
                  </button>
                  <a
                    href="/khach-hang"
                    className="px-6 py-4 rounded-full font-heading font-bold uppercase italic text-slate-800 dark:text-white hover:text-brand-orange dark:hover:text-brand-orange border border-slate-300 dark:border-white/20 hover:border-brand-orange transition-all flex items-center gap-2 text-sm"
                  >
                    {lang === 'vi' ? 'Khám Phá Sơ Đồ Phòng' : 'View Floor Plan'}
                    <ArrowRight size={16} />
                  </a>
                </div>
              </div>
              <div className="lg:col-span-5 relative aspect-square sm:aspect-video lg:aspect-square rounded-3xl overflow-hidden shadow-2xl">
                <img src="https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1000&q=80" alt="Act Phase" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* A4: Advocate & AI */}
      <section className="py-20 sm:py-28 bg-slate-50 dark:bg-[#121212] transition-colors text-slate-900 dark:text-white">
        <FadeIn>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black uppercase italic text-brand-orange leading-tight mb-6">
                {t.journey.a4_title}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed text-justify text-pretty px-4">
                {t.journey.a4_desc}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none p-8 rounded-3xl flex flex-col items-center text-center">
                <Heart className="text-brand-orange mb-6" size={48} />
                <h3 className="text-2xl sm:text-3xl font-heading font-black italic mb-4">{t.journey.a4_card1_title}</h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed text-justify text-pretty">
                  {t.journey.a4_card1_desc}
                </p>
              </div>
              <div className="bg-orange-50 dark:bg-white/5 backdrop-blur-md border border-brand-orange/30 shadow-xl dark:shadow-none p-8 rounded-3xl flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/20 blur-[50px] rounded-full"></div>
                <Bot className="text-brand-orange mb-6" size={48} />
                <h3 className="text-2xl sm:text-3xl font-heading font-black italic mb-4">{t.journey.a4_card2_title}</h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed text-justify text-pretty">
                  {t.journey.a4_card2_desc}
                </p>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>
    </div>
  );
};
