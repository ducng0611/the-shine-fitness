const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Desktop Nav update
const desktopNavTarget = `<div className="hidden xl:flex flex-1 items-center justify-center space-x-2 2xl:space-x-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap px-2">
              <a href="#services" className="px-2 py-1 text-slate-700 dark:text-slate-300 hover:text-brand-orange transition-colors whitespace-nowrap">
                {t.nav.services}
              </a>
              <a href="#specials" className="px-2 py-1 text-slate-700 dark:text-slate-300 hover:text-brand-orange transition-colors whitespace-nowrap">
                {t.nav.specials}
              </a>
              <a href="#health-calculator" className="px-2 py-1 text-slate-700 dark:text-slate-300 hover:text-brand-orange transition-colors whitespace-nowrap flex items-center gap-1">
                <Activity size={13} className="text-brand-orange shrink-0" />
                <span className="whitespace-nowrap">{t.nav.bmiCalc}</span>
              </a>
              <a href="#blogs" className="px-2 py-1 text-slate-700 dark:text-slate-300 hover:text-brand-orange transition-colors whitespace-nowrap flex items-center gap-1">
                <BookOpen size={13} className="text-brand-orange shrink-0" />
                <span className="whitespace-nowrap">{t.nav.blogs}</span>
              </a>
              <a href="#why-us" className="px-2 py-1 text-slate-700 dark:text-slate-300 hover:text-brand-orange transition-colors whitespace-nowrap">
                {t.nav.whyUs}
              </a>
              <a href="#reviews" className="px-2 py-1 text-slate-700 dark:text-slate-300 hover:text-brand-orange transition-colors whitespace-nowrap">
                {t.nav.reviews}
              </a>
              <a href="#location" className="px-2 py-1 text-slate-700 dark:text-slate-300 hover:text-brand-orange transition-colors whitespace-nowrap">
                {t.nav.contact}
              </a>
            </div>`;

const desktopNavReplacement = `<div className="hidden xl:flex flex-1 items-center justify-center space-x-2 2xl:space-x-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap px-2">
              <a href="#services" className="px-2 py-1 text-slate-700 dark:text-slate-300 hover:text-brand-orange transition-colors whitespace-nowrap">
                {t.nav.services}
              </a>
              <a href="#specials" className="px-2 py-1 text-slate-700 dark:text-slate-300 hover:text-brand-orange transition-colors whitespace-nowrap">
                {t.nav.specials}
              </a>
              <a href="#health-calculator" className="px-2 py-1 text-slate-700 dark:text-slate-300 hover:text-brand-orange transition-colors whitespace-nowrap flex items-center gap-1">
                <Activity size={13} className="text-brand-orange shrink-0" />
                <span className="whitespace-nowrap">{t.nav.bmiCalc}</span>
              </a>
              <a href="#blogs" className="px-2 py-1 text-slate-700 dark:text-slate-300 hover:text-brand-orange transition-colors whitespace-nowrap flex items-center gap-1">
                <BookOpen size={13} className="text-brand-orange shrink-0" />
                <span className="whitespace-nowrap">{t.nav.blogs}</span>
              </a>
              <a href="#reviews" className="px-2 py-1 text-slate-700 dark:text-slate-300 hover:text-brand-orange transition-colors whitespace-nowrap">
                {t.nav.reviews}
              </a>
              <a href="#location" className="px-2 py-1 text-slate-700 dark:text-slate-300 hover:text-brand-orange transition-colors whitespace-nowrap">
                {t.nav.contact}
              </a>
            </div>`;

code = code.replace(desktopNavTarget, desktopNavReplacement);

// 2. Mobile Nav Update
const mobileNavTarget = `<div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-heading font-bold text-xs uppercase italic">
              <a 
                href="#services" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 hover:text-brand-orange hover:bg-slate-100 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
              >
                <Dumbbell size={15} className="text-brand-orange shrink-0" />
                <span className="whitespace-nowrap">{t.nav.services}</span>
              </a>
              <a 
                href="#specials" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 hover:text-brand-orange hover:bg-slate-100 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
              >
                <Gift size={15} className="text-brand-orange shrink-0" />
                <span className="whitespace-nowrap">{t.nav.specials}</span>
              </a>
              <a 
                href="#health-calculator" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-brand-orange bg-brand-orange/10 hover:bg-brand-orange/15 transition-colors whitespace-nowrap"
              >
                <Activity size={15} className="text-brand-orange shrink-0" />
                <span className="whitespace-nowrap">{t.nav.bmiCalc}</span>
              </a>
              <a 
                href="#blogs" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 hover:text-brand-orange hover:bg-slate-100 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
              >
                <BookOpen size={15} className="text-brand-orange shrink-0" />
                <span className="whitespace-nowrap">{t.nav.blogs}</span>
              </a>
              <a 
                href="#why-us" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 hover:text-brand-orange hover:bg-slate-100 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
              >
                <ShieldCheck size={15} className="text-brand-orange shrink-0" />
                <span className="whitespace-nowrap">{t.nav.whyUs}</span>
              </a>
              <a 
                href="#reviews" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 hover:text-brand-orange hover:bg-slate-100 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
              >
                <Star size={15} className="text-amber-500 shrink-0" />
                <span className="whitespace-nowrap">{t.nav.reviews}</span>
              </a>
              <a 
                href="#location" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 hover:text-brand-orange hover:bg-slate-100 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
              >
                <MapPin size={15} className="text-brand-orange shrink-0" />
                <span className="whitespace-nowrap">{t.nav.contact}</span>
              </a>
            </div>`;

const mobileNavReplacement = `<div className="grid grid-cols-1 gap-1.5 font-heading font-bold text-xs uppercase italic">
              <a 
                href="#services" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 hover:text-brand-orange hover:bg-slate-100 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
              >
                <Dumbbell size={15} className="text-brand-orange shrink-0" />
                <span className="whitespace-nowrap">{t.nav.services}</span>
              </a>
              <a 
                href="#specials" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 hover:text-brand-orange hover:bg-slate-100 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
              >
                <Gift size={15} className="text-brand-orange shrink-0" />
                <span className="whitespace-nowrap">{t.nav.specials}</span>
              </a>
              <a 
                href="#health-calculator" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-brand-orange bg-brand-orange/10 hover:bg-brand-orange/15 transition-colors whitespace-nowrap"
              >
                <Activity size={15} className="text-brand-orange shrink-0" />
                <span className="whitespace-nowrap">{t.nav.bmiCalc}</span>
              </a>
              <a 
                href="#blogs" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 hover:text-brand-orange hover:bg-slate-100 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
              >
                <BookOpen size={15} className="text-brand-orange shrink-0" />
                <span className="whitespace-nowrap">{t.nav.blogs}</span>
              </a>
              <a 
                href="#reviews" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 hover:text-brand-orange hover:bg-slate-100 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
              >
                <Star size={15} className="text-amber-500 shrink-0" />
                <span className="whitespace-nowrap">{t.nav.reviews}</span>
              </a>
              <a 
                href="#location" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-slate-800 dark:text-slate-200 hover:text-brand-orange hover:bg-slate-100 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
              >
                <MapPin size={15} className="text-brand-orange shrink-0" />
                <span className="whitespace-nowrap">{t.nav.contact}</span>
              </a>
            </div>`;

code = code.replace(mobileNavTarget, mobileNavReplacement);

// 3. Mobile Nav Buttons Update
const mobileBtnsTarget = `<div className="pt-4 mt-4 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row gap-3">`;
const mobileBtnsReplacement = `<div className="pt-4 mt-4 border-t border-slate-200 dark:border-white/10 flex flex-col gap-3">`;

code = code.replace(mobileBtnsTarget, mobileBtnsReplacement);

// 4. Update Footer Links to remove Why Us
code = code.replace(/<li><a href="#why-us" className="hover:text-brand-orange transition-colors">\{t\.nav\.whyUs\}<\/a><\/li>/g, '');

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx nav adapted.');
