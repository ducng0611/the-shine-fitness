import re

with open('src/components/Chatbot.tsx', 'r') as f:
    content = f.read()

# Replace the quick suggestions container to be justify-center
container_regex = r'<div className="px-3 pt-2 pb-2 bg-white dark:bg-\[\#151515\] border-t border-slate-100 dark:border-white/5 flex flex-nowrap justify-start items-center gap-2 overflow-x-auto shrink-0 \[\&::\S+\]:hidden \[-ms-overflow-style:none\] \[scrollbar-width:none\]">'
new_container = '<div className="px-3 pt-2 pb-2 bg-white dark:bg-[#151515] border-t border-slate-100 dark:border-white/5 flex flex-nowrap justify-center items-center gap-2 overflow-x-auto shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full">'
content = re.sub(container_regex, new_container, content)

with open('src/components/Chatbot.tsx', 'w') as f:
    f.write(content)
