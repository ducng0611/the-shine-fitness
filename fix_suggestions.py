import re

with open('src/components/Chatbot.tsx', 'r') as f:
    content = f.read()

# Remove the horizontal chips block completely
chips_regex = r'\{\/\* Quick Suggestions Chips \*\/.*?\}\)\}'
content = re.sub(chips_regex, '', content, flags=re.DOTALL)

# Update the vertical stack container to stretch full width
content = content.replace(
    'className="flex flex-col gap-2 mt-1 mb-2 animate-fadeIn max-w-[85%] self-start"',
    'className="flex flex-col gap-2 mt-1 mb-2 animate-fadeIn w-full px-2"'
)

with open('src/components/Chatbot.tsx', 'w') as f:
    f.write(content)
