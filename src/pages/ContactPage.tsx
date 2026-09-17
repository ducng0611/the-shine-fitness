import React from 'react';
import { FadeIn } from '../components/FadeIn';
import { MapPin, Phone, MessageCircle, Clock, ExternalLink, Calendar } from 'lucide-react';

export const ContactPage = ({ lang, t, openRegistration }) => {
  return (
    <div className="pt-20">
      <section id="location" className="py-20 sm:py-28 bg-slate-100 dark:bg-[#181818] border-t border-slate-200 dark:border-white/10 transition-colors duration-200">
        <FadeIn>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Contact Info */}
            <div className="lg:col-span-6 space-y-6">
              <div>
                <span className="text-brand-orange font-bold text-xs uppercase tracking-widest block mb-2">
                  {t.visitUs.eyebrow}
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black uppercase italic text-slate-900 dark:text-white leading-tight text-balance">
                  {t.visitUs.heading}
                </h2>
                <div className="w-20 h-1 bg-brand-orange my-4 rounded-full" />
                <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed text-justify text-pretty max-w-3xl mx-auto px-6 sm:px-12 md:px-16">
                  {t.visitUs.sub}
                </p>
              </div>

              <div className="space-y-4 pt-2">
                {/* Address */}
                <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10">
                  <MapPin size={22} className="text-brand-orange shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs uppercase font-bold text-slate-400">
                      {t.visitUs.addressTitle}
                    </div>
                    <div className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white mt-0.5 leading-snug md:leading-normal">
                      {t.visitUs.addressValue}
                    </div>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10">
                  <Clock size={22} className="text-brand-orange shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs uppercase font-bold text-slate-400">
                      {t.visitUs.hoursTitle}
                    </div>
                    <div className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white mt-0.5 leading-snug md:leading-normal">
                      {t.visitUs.hoursValue}
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10">
                  <Phone size={22} className="text-brand-orange shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs uppercase font-bold text-slate-400">
                      {t.visitUs.hotlineTitle}
                    </div>
                    <a 
                      href="tel:0946293593" 
                      className="text-lg sm:text-xl font-heading font-black text-brand-orange hover:underline block mt-0.5"
                    >
                      0946 293 593
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => openRegistration()}
                  className="w-full sm:w-auto px-6 py-4 justify-center bg-brand-orange hover:bg-orange-600 text-white font-heading font-bold text-base uppercase italic rounded-2xl shadow-lg transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Calendar size={18} />
                  {t.visitUs.bookAppointment}
                </button>
                <a
                  href="https://maps.app.goo.gl/Hyn5UHxdnvFDETjc6"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-6 py-4 justify-center bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-white border border-slate-300 dark:border-white/10 font-heading font-bold text-sm uppercase italic rounded-2xl transition-colors cursor-pointer flex items-center gap-2"
                >
                  <ExternalLink size={16} />
                  {t.visitUs.directions}
                </a>
              </div>
            </div>

            {/* Right Map Embed / Card */}
            <div className="lg:col-span-6">
              <div className="w-full h-[380px] sm:h-[440px] rounded-3xl overflow-hidden border-2 border-slate-200 dark:border-white/10 shadow-2xl relative bg-slate-900">
                <iframe
                  title="The Shine Fitness and Yoga Map Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.0596813417123!2d106.64544821116557!3d10.806741089299381!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317529001b03dc27%3A0xb330cd3c87756a6e!2sThe%20Shine%20Fitness%20and%20Yoga!5e0!3m2!1sen!2s!4v1789467523408!5m2!1sen!2s"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  className="w-full h-full filter contrast-105"
                                />
              </div>
            </div>
          </div>
        </div>
        </FadeIn>
      </section>
    </div>
  );
};