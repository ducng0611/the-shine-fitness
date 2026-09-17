import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add padding to hero subtitle
old_hero_p = '<p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed mx-auto text-center text-pretty">'
new_hero_p = '<p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed mx-auto text-center text-pretty px-4 sm:px-8">'
content = content.replace(old_hero_p, new_hero_p)

# Also check CTA section
old_cta_p = '<p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto text-center text-pretty">'
new_cta_p = '<p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto text-center text-pretty px-4 sm:px-8">'
content = content.replace(old_cta_p, new_cta_p)

with open('src/App.tsx', 'w') as f:
    f.write(content)

