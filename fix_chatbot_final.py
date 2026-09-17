import re

with open('src/components/Chatbot.tsx', 'r') as f:
    content = f.read()

# 1. Remove the old chips block exactly
chips_block_pattern = r'\{\/\* Quick Suggestions Chips \*\/.*?\}\)\}'
content = re.sub(chips_block_pattern, '', content, flags=re.DOTALL)


# 2. Fix the vertical stack to be max-w-[92%] to match the bubble
stack_pattern = r'\{\/\* Quick Suggestions \(Vertical Stack\) \*\/.*?\<div className="flex flex-col gap-2 mt-1 mb-2 animate-fadeIn w-full px-2"\>'
new_stack_header = """{/* Quick Suggestions (Vertical Stack) */}
              {messages.length <= 4 && !isConsultantTyping && (
                <div className="flex flex-col gap-2 mt-1 mb-2 animate-fadeIn max-w-[92%] self-start px-2">"""
content = re.sub(stack_pattern, new_stack_header, content, flags=re.DOTALL)


# 3. Add resize capabilities to the main container
container_regex = r'className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 w-\[calc\(100vw-1\.5rem\)\] sm:w-\[420px\] h-\[580px\] sm:h-\[630px\] max-h-\[90vh\] bg-white dark:bg-\[\#151515\] rounded-3xl shadow-2xl flex flex-col overflow-hidden z-50 border border-slate-200 dark:border-white/10"'
new_container = 'className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 w-[calc(100vw-1.5rem)] sm:w-[380px] sm:min-w-[320px] sm:max-w-full h-[550px] sm:min-h-[400px] max-h-[90vh] bg-white dark:bg-[#151515] rounded-3xl shadow-2xl flex flex-col overflow-hidden sm:resize z-50 border border-slate-200 dark:border-white/10"'
content = content.replace(container_regex, new_container)

with open('src/components/Chatbot.tsx', 'w') as f:
    f.write(content)

