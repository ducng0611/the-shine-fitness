import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add Instagram and Tiktok icons to the imports if missing
if "Instagram," not in content:
    content = content.replace("Facebook,", "Facebook, Instagram, MessageCircle as ZaloIcon,")
else:
    # try to add ZaloIcon just in case
    pass

# 1. Floating Social Bar
floating_bar = """
      {/* Floating Social Bar */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2 p-2">
        <a href="https://www.facebook.com/theshinefitness" target="_blank" rel="noreferrer" className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
          <Facebook size={20} />
        </a>
        <a href="https://www.tiktok.com/@the.shine.fitness" target="_blank" rel="noreferrer" className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
        </a>
        <a href="https://zalo.me/0946293593" target="_blank" rel="noreferrer" className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
          <span className="font-bold text-xs">Zalo</span>
        </a>
      </div>
"""

if "Floating Social Bar" not in content:
    content = content.replace("<ScrollToTop />", floating_bar + "\n      <ScrollToTop />")

# 2. Add Social Icons to Footer
footer_socials = """
              <div className="pt-4 flex items-center gap-4 text-slate-400">
                <a href="https://www.facebook.com/theshinefitness" target="_blank" rel="noreferrer" className="hover:text-brand-orange transition-colors"><Facebook size={20} /></a>
                <a href="https://www.tiktok.com/@the.shine.fitness" target="_blank" rel="noreferrer" className="hover:text-brand-orange transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
                </a>
                <a href="https://zalo.me/0946293593" target="_blank" rel="noreferrer" className="hover:text-brand-orange transition-colors font-bold text-sm">Zalo</a>
              </div>
"""
if "pt-4 flex items-center gap-4 text-slate-400" not in content:
    content = content.replace("0946 293 593\n                </a>\n              </div>", "0946 293 593\n                </a>\n              </div>" + footer_socials)


# 3. Reorder Sections
# Find the sections using precise substring searches if possible.
import re

def extract_section(section_id, text):
    start = text.find(f'<section id="{section_id}"')
    if start == -1: return None, text
    # Find matching closing section
    end = text.find('</section>', start) + 10
    sec_content = text[start:end]
    new_text = text[:start] + text[end:]
    return sec_content, new_text

services_sec, content = extract_section("services", content)
why_us_sec, content = extract_section("why-us", content)
specials_sec, content = extract_section("specials", content)

# Current remaining order is Header -> Reviews -> Tiktok -> Location
# Let's find the insertion point, which is right after </header>
header_end = content.find('</header>') + 9

# New order: why_us -> services -> specials
# wait, why-us is good to establish problem/trust, then services, then specials
insertion = "\n" + why_us_sec + "\n" + services_sec + "\n" + specials_sec + "\n"
content = content[:header_end] + insertion + content[header_end:]

with open('src/App.tsx', 'w') as f:
    f.write(content)

