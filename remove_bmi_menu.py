import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Remove Desktop BMI link
desktop_regex = r'<a href="/dich-vu" onClick=\{\(e\) => \{ e\.preventDefault\(\); setMobileMenuOpen\(false\); navigateTo\("/dich-vu"\); \}\} className="px-2 py-1 text-slate-700 dark:text-slate-300 hover:text-brand-orange transition-colors whitespace-nowrap flex items-center gap-1">\s*<Activity size=\{13\} className="text-brand-orange shrink-0" />\s*<span className="whitespace-nowrap">\{t\.nav\.bmiCalc\}</span>\s*</a>'
content = re.sub(desktop_regex, '', content, flags=re.DOTALL)

# 2. Remove Mobile BMI link
mobile_regex = r'<a \s*href="/dich-vu" onClick=\{\(e\) => \{ e\.preventDefault\(\); setMobileMenuOpen\(false\); navigateTo\("/dich-vu"\); \}\}\s*className="flex items-center gap-2\.5 px-3\.5 py-2\.5 rounded-xl text-brand-orange bg-brand-orange/10 hover:bg-brand-orange/15 transition-colors whitespace-nowrap"\s*>\s*<Activity size=\{15\} className="text-brand-orange shrink-0" />\s*<span className="whitespace-nowrap">\{t\.nav\.bmiCalc\}</span>\s*</a>'
content = re.sub(mobile_regex, '', content, flags=re.DOTALL)

with open('src/App.tsx', 'w') as f:
    f.write(content)
