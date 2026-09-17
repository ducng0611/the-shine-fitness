import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

trust_badge = """
              {/* Trust Badge */}
              <div className="mt-8 flex items-center justify-center lg:justify-start gap-4 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex -space-x-2">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" className="w-8 h-8 rounded-full border-2 border-white dark:border-[#121212] object-cover" alt="Member" />
                  <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80" className="w-8 h-8 rounded-full border-2 border-white dark:border-[#121212] object-cover" alt="Member" />
                  <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&q=80" className="w-8 h-8 rounded-full border-2 border-white dark:border-[#121212] object-cover" alt="Member" />
                  <div className="w-8 h-8 rounded-full border-2 border-white dark:border-[#121212] bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    500+
                  </div>
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <div className="flex items-center text-amber-500">
                    <Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" />
                  </div>
                  <span className="font-medium text-xs mt-0.5">Hơn 500+ Hội viên đã thành công</span>
                </div>
              </div>
"""

# Let's find the closing div of the CTA
cta_block = """
                <a
                  href="#specials"
                  className="w-full sm:w-auto bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 px-7 py-4 rounded-2xl font-heading font-bold text-base uppercase italic transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer text-center"
                >
                  {t.hero.viewServices}
                </a>
              </div>
"""
if trust_badge not in content:
    content = content.replace(cta_block, cta_block + trust_badge)

with open('src/App.tsx', 'w') as f:
    f.write(content)
