import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace max-w-4xl mx-auto px-4 sm:px-8 with max-w-3xl mx-auto px-6 sm:px-12 md:px-20
# This creates a very noticeable indentation for subtitles.
old_padding = 'max-w-4xl mx-auto px-4 sm:px-8'
new_padding = 'max-w-3xl mx-auto px-6 sm:px-12 md:px-16'

content = content.replace(old_padding, new_padding)

with open('src/App.tsx', 'w') as f:
    f.write(content)

