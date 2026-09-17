import re

with open('src/components/Chatbot.tsx', 'r') as f:
    content = f.read()

# Make it look more like the user's screenshot: rounded-2xl, background matching the message bubble, self-start but slightly inset if we want, or just max-w-[85%]
content = content.replace(
    'className="flex flex-col gap-2 w-full mt-2 animate-fadeIn max-w-[92%] self-start"',
    'className="flex flex-col gap-2 mt-1 mb-2 animate-fadeIn max-w-[85%] self-start"'
)

content = content.replace(
    'className="w-full text-center text-sm font-medium bg-slate-100 hover:bg-brand-orange hover:text-white dark:bg-white/10 dark:hover:bg-brand-orange text-slate-800 dark:text-slate-200 py-2.5 px-4 rounded-xl transition-colors cursor-pointer border border-slate-200 dark:border-white/10 active:scale-95 shadow-sm"',
    'className="w-full text-center text-[13px] sm:text-sm font-semibold bg-white hover:bg-slate-50 dark:bg-[#2A2A2A] dark:hover:bg-[#333333] text-brand-orange dark:text-white py-2.5 px-4 rounded-2xl transition-colors cursor-pointer border border-slate-200 dark:border-white/5 active:scale-95 shadow-sm"'
)

with open('src/components/Chatbot.tsx', 'w') as f:
    f.write(content)
