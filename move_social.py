import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

old_string = 'className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2 p-2"'
new_string = 'className="fixed left-3 sm:left-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3 p-2"'

content = content.replace(old_string, new_string)

with open('src/App.tsx', 'w') as f:
    f.write(content)
