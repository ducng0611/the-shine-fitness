import re

with open('src/translations.ts', 'r') as f:
    content = f.read()

content = content.replace("title1: 'NÂNG TẦM SỨC KHỎE - ',", "title1: 'NÂNG TẦM SỨC KHỎE',")

with open('src/translations.ts', 'w') as f:
    f.write(content)
