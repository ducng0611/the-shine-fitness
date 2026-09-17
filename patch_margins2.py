import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace the common subtitle paragraphs to include max-w-3xl, mx-auto, and horizontal padding.
old_p = '<p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed text-justify text-pretty">'
new_p = '<p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed text-justify text-pretty max-w-4xl mx-auto px-4 sm:px-8">'

content = content.replace(old_p, new_p)

# Also fix the one with mb-6
old_p2 = '<p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed mb-6 text-justify text-pretty">'
new_p2 = '<p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed mb-6 text-justify text-pretty max-w-4xl mx-auto px-4 sm:px-8">'

content = content.replace(old_p2, new_p2)

with open('src/App.tsx', 'w') as f:
    f.write(content)
