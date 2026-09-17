import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace any remaining text instances that aren't quite perfectly balanced
# Specifically, for text-justify + text-center in the hero, sometimes text-justify overrides center.
# Let's fix the Hero subtitle. It should be centered AND balanced, not justified.
# "căn đều ở content" means body content (paragraphs) should be justified, but headers/hero should be centered and balanced.
# Let's specifically fix the hero subtitle to be just text-center text-pretty
hero_p_old = '<p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed mx-auto text-justify text-pretty">'
hero_p_new = '<p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed mx-auto text-center text-pretty">'
content = content.replace(hero_p_old, hero_p_new)

# Similarly, CTA subtext in the CTA section should probably be center aligned.
cta_p_old = '<p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl text-justify text-pretty">'
cta_p_new = '<p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto text-center text-pretty">'
content = content.replace(cta_p_old, cta_p_new)


with open('src/App.tsx', 'w') as f:
    f.write(content)

