import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add Check to imports
if "Check," not in content and "Check " not in content:
    content = content.replace("from 'lucide-react';", ", Check } from 'lucide-react';")

# Update Tiếng Việt button
vi_btn_old = """                  <button
                    onClick={() => setLang('vi')}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer ${lang === 'vi' ? 'text-brand-orange font-bold bg-orange-50/50 dark:bg-brand-orange/10' : 'text-slate-700 dark:text-slate-300'}`}
                  >
                    <span className="flex items-center justify-center w-5 h-4 overflow-hidden rounded-sm"><img src="https://flagcdn.com/w20/vn.png" srcSet="https://flagcdn.com/w40/vn.png 2x" width="20" alt="VN" className="rounded-sm shadow-sm" /></span>
                    <span>Tiếng Việt</span>
                  </button>"""

vi_btn_new = """                  <button
                    onClick={() => setLang('vi')}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer ${lang === 'vi' ? 'text-brand-orange font-bold bg-orange-50/50 dark:bg-brand-orange/10 border-l-2 border-brand-orange' : 'text-slate-700 dark:text-slate-300 border-l-2 border-transparent'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-4 overflow-hidden rounded-sm"><img src="https://flagcdn.com/w20/vn.png" srcSet="https://flagcdn.com/w40/vn.png 2x" width="20" alt="VN" className="rounded-sm shadow-sm" /></span>
                      <span>Tiếng Việt</span>
                    </div>
                    {lang === 'vi' && <Check size={16} className="text-brand-orange" />}
                  </button>"""
                  
content = content.replace(vi_btn_old, vi_btn_new)

# Update English button
en_btn_old = """                  <button
                    onClick={() => setLang('en')}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer ${lang === 'en' ? 'text-brand-orange font-bold bg-orange-50/50 dark:bg-brand-orange/10' : 'text-slate-700 dark:text-slate-300'}`}
                  >
                    <span className="flex items-center justify-center w-5 h-4 overflow-hidden rounded-sm"><img src="https://flagcdn.com/w20/us.png" srcSet="https://flagcdn.com/w40/us.png 2x" width="20" alt="US" className="rounded-sm shadow-sm" /></span>
                    <span>English</span>
                  </button>"""

en_btn_new = """                  <button
                    onClick={() => setLang('en')}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer ${lang === 'en' ? 'text-brand-orange font-bold bg-orange-50/50 dark:bg-brand-orange/10 border-l-2 border-brand-orange' : 'text-slate-700 dark:text-slate-300 border-l-2 border-transparent'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-4 overflow-hidden rounded-sm"><img src="https://flagcdn.com/w20/us.png" srcSet="https://flagcdn.com/w40/us.png 2x" width="20" alt="US" className="rounded-sm shadow-sm" /></span>
                      <span>English</span>
                    </div>
                    {lang === 'en' && <Check size={16} className="text-brand-orange" />}
                  </button>"""

content = content.replace(en_btn_old, en_btn_new)

with open('src/App.tsx', 'w') as f:
    f.write(content)
