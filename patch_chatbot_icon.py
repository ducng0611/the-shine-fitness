import re

with open('src/components/Chatbot.tsx', 'r') as f:
    content = f.read()

# Replace import X with Minus (if it's not already imported, let's just add it)
content = content.replace('  X,', '  X,\n  Minus,')

# Replace <X size={18} /> with <Minus size={18} />
content = content.replace('<X size={18} />', '<Minus size={20} />')

with open('src/components/Chatbot.tsx', 'w') as f:
    f.write(content)

