import React from 'react';
import { FadeIn } from '../components/FadeIn';
import { GymFloorPlan } from '../components/GymFloorPlan';
import { Gift, Flame, ArrowRight, CheckCircle2, ChevronDown } from 'lucide-react';

export const SpecialsPage = ({ lang, t, openRegistration }) => {
  return (
    <div className="pt-20">
<section id="specials" className="py-20 sm:py-28 bg-slate-100 dark:bg-[#181818] border-y border-slate-200 dark:border-white/10 transition-colors duration-200">
        <FadeIn>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
            <span className="text-brand-orange font-bold text-xs uppercase tracking-widest block mb-2">
              {t.specials.eyebrow}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black uppercase italic text-slate-900 dark:text-white leading-tight text-balance">
              {t.specials.heading}
            </h2>
            <div className="w-20 h-1 bg-brand-orange mx-auto my-4 rounded-full" />
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed text-justify text-pretty max-w-3xl mx-auto px-6 sm:px-12 md:px-16">
              {t.specials.sub}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            
            {/* 1. Gói Ưu Đãi Hội Viên Mới (349k - Star Offer from Facebook) */}
            <div className="bg-white dark:bg-[#141414] rounded-3xl p-7 sm:p-8 border-2 border-brand-orange shadow-2xl relative md:-translate-y-2 flex flex-col justify-between">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-orange text-white px-4 py-1 text-xs font-bold uppercase tracking-widest rounded-full shadow-md whitespace-nowrap">
                {t.specials.popularTag}
              </div>
              <div>
                <div className="flex items-start justify-between gap-3 min-h-[56px] mt-2 mb-1">
                  <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white uppercase italic leading-tight text-balance">
                    {t.specials.basic.name}
                  </h3>
                  {(t.specials.basic as any).badge && (
                    <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 shrink-0 whitespace-nowrap mt-0.5">
                      {(t.specials.basic as any).badge}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl sm:text-5xl font-heading font-bold text-brand-orange">
                    {t.specials.basic.price}
                  </span>
                  <span className="text-slate-500 font-medium text-sm">
                    {t.specials.month}
                  </span>
                  {(t.specials.basic as any).originalPrice && (
                    <span className="text-xs text-slate-400 line-through">
                      {(t.specials.basic as any).originalPrice}{t.specials.month}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-brand-orange font-semibold mb-6">
                  {lang === 'vi' ? '★ Áp dụng cho cả Gym và Boxing' : '★ Valid for both Gym & Boxing'}
                </p>

                <ul className="space-y-3 mb-8">
                  {t.specials.basic.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                      <CheckCircle2 size={17} className="text-brand-orange shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => openRegistration(t.specials.basic.name)}
                className="w-full py-4 bg-brand-orange hover:bg-orange-600 text-white font-heading font-bold text-base uppercase italic rounded-2xl shadow-lg transition-all cursor-pointer"
              >
                {t.specials.selectPlan}
              </button>
            </div>

            {/* 2. Gói Tiêu Chuẩn Tháng (549k) */}
            <div className="bg-white dark:bg-[#141414] rounded-3xl p-7 sm:p-8 border border-slate-200 dark:border-white/10 shadow-sm hover:border-brand-orange/40 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 min-h-[56px] mt-2 mb-1">
                  <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white uppercase italic leading-tight text-balance">
                    {t.specials.premium.name}
                  </h3>
                  {(t.specials.premium as any).badge && (
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10 px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap mt-0.5">
                      {(t.specials.premium as any).badge}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl sm:text-5xl font-heading font-bold text-slate-900 dark:text-white">
                    {t.specials.premium.price}
                  </span>
                  <span className="text-slate-500 font-medium text-sm">
                    {t.specials.month}
                  </span>
                  {(t.specials.premium as any).originalPrice && (
                    <span className="text-xs text-slate-400 line-through">
                      {(t.specials.premium as any).originalPrice}{t.specials.month}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mb-6">
                  {lang === 'vi' ? '★ Đóng từng tháng tự do, không cam kết dài hạn' : '★ Month-to-month flexibility, zero contracts'}
                </p>

                <ul className="space-y-3 mb-8">
                  {t.specials.premium.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                      <CheckCircle2 size={17} className="text-brand-orange shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => openRegistration(t.specials.premium.name)}
                className="w-full py-4 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-900 dark:text-white font-heading font-bold text-base uppercase italic rounded-2xl transition-colors cursor-pointer"
              >
                {t.specials.selectPlan}
              </button>
            </div>

            {/* 3. Gói Toàn Diện Yoga & Gym (699k) */}
            <div className="bg-white dark:bg-[#141414] rounded-3xl p-7 sm:p-8 border border-slate-200 dark:border-white/10 shadow-sm hover:border-brand-orange/40 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 min-h-[56px] mt-2 mb-1">
                  <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white uppercase italic leading-tight text-balance">
                    {t.specials.vip.name}
                  </h3>
                  {(t.specials.vip as any).badge && (
                    <span className="text-[10px] sm:text-[11px] font-bold text-brand-orange bg-brand-orange/10 px-2.5 py-1 rounded-full border border-brand-orange/20 shrink-0 whitespace-nowrap mt-0.5">
                      {(t.specials.vip as any).badge}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl sm:text-5xl font-heading font-bold text-slate-900 dark:text-white">
                    {t.specials.vip.price}
                  </span>
                  <span className="text-slate-500 font-medium text-sm">
                    {t.specials.month}
                  </span>
                  {(t.specials.vip as any).originalPrice && (
                    <span className="text-xs text-slate-400 line-through">
                      {(t.specials.vip as any).originalPrice}{t.specials.month}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mb-6">
                  {lang === 'vi' ? '★ Không giới hạn Yoga theo lịch & Full Gym' : '★ Unlimited Yoga timetable & full gym access'}
                </p>

                <ul className="space-y-3 mb-8">
                  {t.specials.vip.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                      <CheckCircle2 size={17} className="text-brand-orange shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => openRegistration(t.specials.vip.name)}
                className="w-full py-4 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-900 dark:text-white font-heading font-bold text-base uppercase italic rounded-2xl transition-colors cursor-pointer"
              >
                {t.specials.selectPlan}
              </button>
            </div>

          </div>

          {/* Crawled Facebook Policy Highlights Strip */}
          <div className="mt-12 max-w-6xl mx-auto bg-slate-50 dark:bg-[#151515] p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-white/10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-start gap-3 p-3 bg-white dark:bg-black/30 rounded-2xl border border-slate-200/80 dark:border-white/5">
                <span className="text-2xl shrink-0">🎫</span>
                <div>
                  <h4 className="font-heading font-bold text-xs uppercase italic text-slate-900 dark:text-white text-balance">
                    {lang === 'vi' ? 'Vé Ngày Day Pass: 100k' : 'Day Pass: 100,000 VND'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {lang === 'vi' ? 'Trải nghiệm tự do máy Gym, Cardio, Xông hơi & Tủ locker trọn ngày.' : 'Full single-day pass including gym zones, sauna and digital lockers.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white dark:bg-black/30 rounded-2xl border border-slate-200/80 dark:border-white/5">
                <span className="text-2xl shrink-0">🎓</span>
                <div>
                  <h4 className="font-heading font-bold text-xs uppercase italic text-slate-900 dark:text-white text-balance">
                    {lang === 'vi' ? 'Giảm 20% Học Sinh - SV' : '20% Student Discount'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {lang === 'vi' ? 'Áp dụng trực tiếp khi xuất trình thẻ học sinh, sinh viên còn thời hạn.' : 'Instant discount when presenting valid student identification.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white dark:bg-black/30 rounded-2xl border border-slate-200/80 dark:border-white/5">
                <span className="text-2xl shrink-0">🎁</span>
                <div>
                  <h4 className="font-heading font-bold text-xs uppercase italic text-slate-900 dark:text-white text-balance">
                    {lang === 'vi' ? 'Voucher 3-7 Ngày 0đ' : '3-7 Day Free Pass'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {lang === 'vi' ? 'Tặng thẻ trải nghiệm 0đ & miễn phí đo InBody 270 cùng Huấn luyện viên.' : 'Complimentary trial days with full InBody body analysis.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white dark:bg-black/30 rounded-2xl border border-slate-200/80 dark:border-white/5">
                <span className="text-2xl shrink-0">🤝</span>
                <div>
                  <h4 className="font-heading font-bold text-xs uppercase italic text-slate-900 dark:text-white text-balance">
                    {lang === 'vi' ? 'Cam Kết 3 Không' : 'Our 3 Zero Promises'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {lang === 'vi' ? 'Không ép gói dài hạn, Không phụ phí ẩn, Không chèo kéo dịch vụ PT.' : 'Zero contract traps, zero hidden fees, zero aggressive upselling.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
        </FadeIn>
      </section>


      {/* 3. HERO SPECIAL OFFER SECTION (Mirroring lavina-nails.com `hero-offer-new-customer` banner) */}
      <section className="py-12 sm:py-16 bg-white dark:bg-[#171717] border-b border-slate-200 dark:border-white/10">
        <FadeIn>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl p-6 sm:p-10 lg:p-12 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent border-2 border-brand-orange/40 shadow-xl overflow-hidden">
            
            {/* Background Accent */}
            <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none text-brand-orange">
              <Gift size={200} />
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8">
              <div className="flex-1 text-center lg:text-left space-y-3">
                
                {/* Pill Tag */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-orange text-white text-xs font-bold uppercase tracking-wider shadow-sm">
                  <Flame size={14} />
                  <span>{t.heroOffer.tag}</span>
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-[2.1rem] xl:text-4xl font-heading font-black text-slate-900 dark:text-white uppercase italic leading-tight text-balance">
                  {t.heroOffer.headline}
                </h2>

                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl mx-auto text-justify text-pretty px-6 sm:px-12 md:px-16">
                  {t.heroOffer.sub}
                </p>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-1 text-xs font-semibold text-brand-orange">
                  <span className="bg-brand-orange/15 px-2.5 py-1 rounded-md border border-brand-orange/30">
                    💰 {t.heroOffer.value}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    • {t.heroOffer.support}
                  </span>
                </div>
              </div>

              {/* Offer CTA Button */}
              <div className="shrink-0 flex flex-col items-center sm:items-end gap-3 mt-4 lg:mt-0">
                <button
                  onClick={() => openRegistration('Tập thử miễn phí 3 ngày (Voucher)')}
                  className="w-full sm:w-[320px] px-8 py-5 bg-brand-orange hover:bg-orange-600 text-white font-heading font-bold text-lg sm:text-xl uppercase italic rounded-2xl shadow-xl transition-all hover:scale-105 hover:shadow-orange-500/25 cursor-pointer flex items-center justify-center gap-3"
                >
                  <Gift size={20} />
                  {t.heroOffer.bookNow}
                </button>
                <a
                  href="tel:0946293593"
                  className="text-sm sm:text-base font-bold text-slate-500 dark:text-slate-400 hover:text-brand-orange transition-colors mt-1"
                >
                  {t.heroOffer.orCall}
                </a>
              </div>
            </div>

          </div>
        </div>
        </FadeIn>
      </section>

      
    </div>
  );
};
