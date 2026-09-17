import re

with open('src/components/Chatbot.tsx', 'r') as f:
    content = f.read()

# Replace the quick suggestions container
container_regex = r'<div className="px-3 pt-2 pb-1\.5 bg-white dark:bg-\[\#151515\] border-t border-slate-100 dark:border-white/5 flex flex-wrap gap-1\.5 shrink-0">'
new_container = '<div className="px-3 pt-2 pb-2 bg-white dark:bg-[#151515] border-t border-slate-100 dark:border-white/5 flex flex-nowrap justify-start items-center gap-2 overflow-x-auto shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">'
content = re.sub(container_regex, new_container, content)

# Replace the chip button styles to make it look more like messenger and bigger text since they wanted short
chip_regex = r'className="text-\[10px\] sm:text-\[11px\] bg-slate-100 hover:bg-brand-orange hover:text-white dark:bg-white/10 dark:hover:bg-brand-orange text-slate-700 dark:text-slate-300 px-2\.5 py-1 rounded-full transition-colors cursor-pointer border border-slate-200 dark:border-white/5 whitespace-nowrap active:scale-95"'
new_chip = 'className="text-xs sm:text-sm bg-slate-100 hover:bg-brand-orange hover:text-white dark:bg-white/10 dark:hover:bg-brand-orange text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-full transition-colors cursor-pointer border border-slate-200 dark:border-white/10 whitespace-nowrap active:scale-95 shrink-0"'
content = re.sub(chip_regex, new_chip, content)


with open('src/components/Chatbot.tsx', 'w') as f:
    f.write(content)
