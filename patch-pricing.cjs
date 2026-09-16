const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Basic Package
const basicTarget = `<div className="flex items-center justify-between mt-2 mb-1">
                  <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white uppercase italic">
                    {t.specials.basic.name}
                  </h3>
                  {(t.specials.basic as any).badge && (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      {(t.specials.basic as any).badge}
                    </span>
                  )}
                </div>`;
const basicReplacement = `<div className="flex items-start justify-between gap-3 min-h-[56px] mt-2 mb-1">
                  <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white uppercase italic leading-tight">
                    {t.specials.basic.name}
                  </h3>
                  {(t.specials.basic as any).badge && (
                    <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 shrink-0 whitespace-nowrap mt-0.5">
                      {(t.specials.basic as any).badge}
                    </span>
                  )}
                </div>`;

// 2. Premium Package
const premiumTarget = `<div className="flex items-center justify-between mb-1">
                  <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white uppercase italic">
                    {t.specials.premium.name}
                  </h3>
                  {(t.specials.premium as any).badge && (
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10 px-2.5 py-0.5 rounded-full">
                      {(t.specials.premium as any).badge}
                    </span>
                  )}
                </div>`;
const premiumReplacement = `<div className="flex items-start justify-between gap-3 min-h-[56px] mt-2 mb-1">
                  <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white uppercase italic leading-tight">
                    {t.specials.premium.name}
                  </h3>
                  {(t.specials.premium as any).badge && (
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10 px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap mt-0.5">
                      {(t.specials.premium as any).badge}
                    </span>
                  )}
                </div>`;

// 3. VIP Package
const vipTarget = `<div className="flex items-center justify-between mb-1">
                  <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white uppercase italic">
                    {t.specials.vip.name}
                  </h3>
                  {(t.specials.vip as any).badge && (
                    <span className="text-[11px] font-bold text-brand-orange bg-brand-orange/10 px-2.5 py-0.5 rounded-full border border-brand-orange/20">
                      {(t.specials.vip as any).badge}
                    </span>
                  )}
                </div>`;
const vipReplacement = `<div className="flex items-start justify-between gap-3 min-h-[56px] mt-2 mb-1">
                  <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white uppercase italic leading-tight">
                    {t.specials.vip.name}
                  </h3>
                  {(t.specials.vip as any).badge && (
                    <span className="text-[10px] sm:text-[11px] font-bold text-brand-orange bg-brand-orange/10 px-2.5 py-1 rounded-full border border-brand-orange/20 shrink-0 whitespace-nowrap mt-0.5">
                      {(t.specials.vip as any).badge}
                    </span>
                  )}
                </div>`;

code = code.replace(basicTarget, basicReplacement);
code = code.replace(premiumTarget, premiumReplacement);
code = code.replace(vipTarget, vipReplacement);
fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx pricing patched.');
