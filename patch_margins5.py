import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace hero padding
old_hero = '<p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed mx-auto text-center text-pretty px-4 sm:px-8">'
new_hero = '<p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed mx-auto text-center text-pretty px-6 sm:px-12 md:px-16">'
content = content.replace(old_hero, new_hero)

# Replace CTA padding
old_cta = '<p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto text-center text-pretty px-4 sm:px-8">'
new_cta = '<p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl mx-auto text-center text-pretty px-6 sm:px-12 md:px-16">'
content = content.replace(old_cta, new_cta)

with open('src/App.tsx', 'w') as f:
    f.write(content)

