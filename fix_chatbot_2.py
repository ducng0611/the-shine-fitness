with open('src/components/Chatbot.tsx', 'r') as f:
    content = f.read()

# Make sure we use Minus instead of X
content = content.replace("<X className", "<Minus className")
content = content.replace("setMessages([", "// setMessages([") # Wait, they asked not to clear history! Let's find clear history logic.

# In setIsOpen(false), does it clear history?
