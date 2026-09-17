import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace('href={`#${link.id}`}', 'href={link.path}')
content = content.replace("href=\"#\"", "href=\"/\" onClick={(e) => { e.preventDefault(); navigateTo('/'); }}")

with open('src/App.tsx', 'w') as f:
    f.write(content)
