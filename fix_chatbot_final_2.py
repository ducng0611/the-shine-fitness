import re

with open('src/components/Chatbot.tsx', 'r') as f:
    content = f.read()

# Exact removal of horizontal chips
to_remove = """            {/* Quick Suggestions Chips */}
            {messages.length <= 4 && !isConsultantTyping && (
              <div className="px-3 pt-2 pb-2 bg-white dark:bg-[#151515] border-t border-slate-100 dark:border-white/5 flex flex-nowrap justify-center items-center gap-2 overflow-x-auto shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full">
                {quickSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => sendMessageWithText(item)}
                    className="text-xs sm:text-sm bg-slate-100 hover:bg-brand-orange hover:text-white dark:bg-white/10 dark:hover:bg-brand-orange text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-full transition-colors cursor-pointer border border-slate-200 dark:border-white/10 whitespace-nowrap active:scale-95 shrink-0"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}"""

content = content.replace(to_remove, '')

with open('src/components/Chatbot.tsx', 'w') as f:
    f.write(content)
