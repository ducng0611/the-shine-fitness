import React from 'react';
import { FadeIn } from '../components/FadeIn';
import { Dumbbell, ArrowRight, CheckCircle2, Flame, Calendar, Users, Target, Activity, HeartPulse, Award, Sparkles } from 'lucide-react';
import { HealthCalculator } from '../components/HealthCalculator';

export const ServicesPage = ({ lang, t, openRegistration, isServicesLoading, icons }) => {
  return (
    <div className="pt-20">
<section id="why-us" className="py-20 sm:py-28 bg-slate-50 dark:bg-[#121212] transition-colors duration-200">
        <FadeIn>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
            <span className="text-brand-orange font-bold text-xs uppercase tracking-widest block mb-2">
              {t.whyUs.eyebrow}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black uppercase italic text-slate-900 dark:text-white leading-tight text-balance">
              {t.whyUs.heading}
            </h2>
            <div className="w-20 h-1 bg-brand-orange mx-auto my-4 rounded-full" />
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed text-justify text-pretty max-w-3xl mx-auto px-6 sm:px-12 md:px-16">
              {t.whyUs.sub}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {t.whyUs.pillars.map((pillar, i) => {
              const icons = [
                <Award key="1" size={32} className="text-brand-orange" />,
                <Dumbbell key="2" size={32} className="text-brand-orange" />,
                <Sparkles key="3" size={32} className="text-brand-orange" />,
                <Users key="4" size={32} className="text-brand-orange" />
              ];

              return (
                <div 
                  key={i}
                  className="bg-white dark:bg-[#1a1a1a] p-8 rounded-3xl border border-slate-200 dark:border-white/10 text-center flex flex-col items-center group hover:border-brand-orange/50 transition-all shadow-xs"
                >
                  <div className="w-20 h-20 rounded-full bg-orange-500/10 dark:bg-orange-500/15 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    {icons[i % icons.length]}
                  </div>
                  <h3 className="text-lg sm:text-xl font-heading font-bold uppercase italic text-slate-900 dark:text-white mb-3 text-balance">
                    {pillar.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed text-justify text-pretty">
                    {pillar.desc}
                  </p>
                </div>
              );
            })}
          </div>

        </div>
        </FadeIn>
      </section>
<section id="services" className="py-20 sm:py-28 bg-slate-50 dark:bg-[#121212] transition-colors duration-200">
        <FadeIn>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
            <span className="text-brand-orange font-bold text-xs uppercase tracking-widest block mb-2">
              {t.services.eyebrow}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black uppercase italic text-slate-900 dark:text-white leading-tight text-balance">
              {t.services.heading}
            </h2>
            <div className="w-20 h-1 bg-brand-orange mx-auto my-4 rounded-full" />
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed text-justify text-pretty max-w-3xl mx-auto px-6 sm:px-12 md:px-16">
              {t.services.sub}
            </p>
          </div>

          {/* Services Grid (6 cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
            {isServicesLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="bg-white dark:bg-[#1a1a1a] p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between animate-pulse h-full">
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-700/50 mb-5 sm:mb-6" />
                    <div className="w-3/4 h-6 bg-slate-200 dark:bg-slate-700/50 rounded-md mb-4" />
                    <div className="w-full h-4 bg-slate-200 dark:bg-slate-700/50 rounded-md mb-2" />
                    <div className="w-5/6 h-4 bg-slate-200 dark:bg-slate-700/50 rounded-md mb-5 sm:mb-6" />
                  </div>
                  <div className="w-1/3 h-4 bg-slate-200 dark:bg-slate-700/50 rounded-md" />
                </div>
              ))
            ) : (
              t.services.items.map((item, index) => {
              const icons = [
                <Dumbbell key="1" size={28} className="text-brand-orange" />,
                <HeartPulse key="2" size={28} className="text-brand-orange" />,
                <Activity key="3" size={28} className="text-brand-orange" />,
                <Users key="4" size={28} className="text-brand-orange" />,
                <Sparkles key="5" size={28} className="text-brand-orange" />,
                <Target key="6" size={28} className="text-brand-orange" />
              ];

              return (
                <div 
                  key={item.id || index}
                  className="bg-white dark:bg-[#1a1a1a] p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-white/10 hover:border-brand-orange/60 dark:hover:border-brand-orange/50 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-orange-500/10 dark:bg-orange-500/15 flex items-center justify-center mb-5 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                      {icons[index % icons.length]}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-heading font-bold uppercase italic text-slate-900 dark:text-white mb-3 text-balance">
                      {item.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-5 sm:mb-6 text-justify text-pretty">
                      {item.desc}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => openRegistration(`Dịch vụ: ${item.title}`)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-orange hover:text-orange-600 cursor-pointer pt-2 group/btn"
                  >
                    <span>{t.services.learnMore}</span>
                    <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              );
            }))}
          </div>

        </div>
        </FadeIn>
      </section>

      <HealthCalculator lang={lang} onOpenBooking={openRegistration} />
    </div>
  );
};
