import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Change the title structure to have block spans
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
    '<div className="lg:col-span-12 text-center flex flex-col items-center">'
)

# Actually, if I make it col-span-12, the image will be pushed down. Let's see the layout:
# <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
# Left Content: lg:col-span-7
# Right Visual Image: lg:col-span-5
# If I just want to center the text WITHIN the left column, I'll remove `lg:text-left`, `lg:justify-start` etc.
# Wait, if they just want the title to be centered (like the screenshot), maybe I should just center the title?
# No, "luôn mặc định căn giữa và màu như hiện tại như sau" -> always default center aligned. The screenshot shows the location pill is also centered.
pass
