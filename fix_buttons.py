import re

with open('src/components/Chatbot.tsx', 'r') as f:
    content = f.read()

# Replace button styles
content = content.replace(
    'className="w-full text-center text-[13px] sm:text-sm font-semibold bg-white hover:bg-slate-50 dark:bg-[#2A2A2A] dark:hover:bg-[#333333] text-brand-orange dark:text-white py-2.5 px-4 rounded-2xl transition-colors cursor-pointer border border-slate-200 dark:border-white/5 active:scale-95 shadow-sm"',
    'className="w-fit text-left text-[13px] sm:text-sm font-semibold bg-white hover:bg-slate-50 dark:bg-[#2A2A2A] dark:hover:bg-[#333333] text-brand-orange dark:text-white py-2.5 px-4 rounded-2xl transition-colors cursor-pointer border border-slate-200 dark:border-white/5 active:scale-95 shadow-sm"'
)

# Replace container styles
content = content.replace(
    'className="flex flex-col gap-2 mt-1 mb-2 animate-fadeIn max-w-[92%] self-start px-2"',
    'className="flex flex-col gap-2 mt-1 mb-2 animate-fadeIn self-start items-start px-2"'
)

with open('src/components/Chatbot.tsx', 'w') as f:
    f.write(content)

