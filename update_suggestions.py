import re

with open('src/components/Chatbot.tsx', 'r') as f:
    content = f.read()

# First, remove the existing quick suggestions block below the messages thread
old_block_regex = r'\{\/\* Quick Suggestions Chips \*\/.*?\}\)\}'
content = re.sub(old_block_regex, '', content, flags=re.DOTALL)

# Now, insert the new vertical quick suggestions inside the messages thread
# We want to put it right before <div ref={messagesEndRef} />
new_block = """
              {/* Quick Suggestions (Vertical Stack) */}
              {messages.length <= 4 && !isConsultantTyping && (
                <div className="flex flex-col gap-2 w-full mt-2 animate-fadeIn max-w-[92%] self-start">
                  {quickSuggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => sendMessageWithText(item)}
                      className="w-full text-center text-sm font-medium bg-slate-100 hover:bg-brand-orange hover:text-white dark:bg-white/10 dark:hover:bg-brand-orange text-slate-800 dark:text-slate-200 py-2.5 px-4 rounded-xl transition-colors cursor-pointer border border-slate-200 dark:border-white/10 active:scale-95 shadow-sm"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
"""

content = content.replace('<div ref={messagesEndRef} />', new_block + '\n              <div ref={messagesEndRef} />')

with open('src/components/Chatbot.tsx', 'w') as f:
    f.write(content)

