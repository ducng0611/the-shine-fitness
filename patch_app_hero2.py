import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Change the title structure to have block spans and always centered
title_old = """              <h1 className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-heading font-black tracking-tight uppercase italic leading-[1.05] text-slate-900 dark:text-white">
                {t.hero.title1}
                <span className="text-brand-orange">{t.hero.title2}</span>
              </h1>"""

title_new = """              <h1 className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-heading font-black tracking-tight uppercase italic leading-[1.05] text-slate-900 dark:text-white text-center">
                <span className="block">{t.hero.title1}</span>
                <span className="block text-brand-orange">{t.hero.title2}</span>
              </h1>"""
content = content.replace(title_old, title_new)

# 2. Make the container always centered
content = content.replace(
    '<div className="lg:col-span-7 text-center lg:text-left">',
    '<div className="lg:col-span-7 flex flex-col items-center text-center">'
)

# 3. Subtitle center
content = content.replace(
    '<p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed mx-auto lg:mx-0">',
    '<p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed mx-auto">'
)

# 4. Buttons center
content = content.replace(
    '<div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">',
    '<div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full">'
)

# 5. Trust badge center
content = content.replace(
    '<div className="mt-8 flex items-center justify-center lg:justify-start gap-4 text-sm text-slate-600 dark:text-slate-400">',
    '<div className="mt-8 flex items-center justify-center gap-4 text-sm text-slate-600 dark:text-slate-400">'
)

# 6. Phone center
content = content.replace(
    '<div className="mt-6 flex items-center justify-center lg:justify-start gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">',
    '<div className="mt-6 flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">'
)

with open('src/App.tsx', 'w') as f:
    f.write(content)
