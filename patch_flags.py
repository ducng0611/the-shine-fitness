import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

vn_flag = '<img src="https://flagcdn.com/w20/vn.png" srcSet="https://flagcdn.com/w40/vn.png 2x" width="20" alt="VN" className="rounded-sm shadow-sm" />'
us_flag = '<img src="https://flagcdn.com/w20/us.png" srcSet="https://flagcdn.com/w40/us.png 2x" width="20" alt="US" className="rounded-sm shadow-sm" />'

# Replace in the dropdown button
content = content.replace(
    '<span className="text-base leading-none">{lang === \'vi\' ? \'🇻🇳\' : \'🇬🇧\'}</span>',
    f'<span className="flex items-center justify-center w-5 h-4 overflow-hidden rounded-sm">{{lang === \'vi\' ? {vn_flag} : {us_flag}}}</span>'
)

# Replace in the options
content = content.replace(
    '<span className="text-base leading-none">🇻🇳</span>',
    f'<span className="flex items-center justify-center w-5 h-4 overflow-hidden rounded-sm">{vn_flag}</span>'
)

content = content.replace(
    '<span className="text-base leading-none">🇬🇧</span>',
    f'<span className="flex items-center justify-center w-5 h-4 overflow-hidden rounded-sm">{us_flag}</span>'
)

with open('src/App.tsx', 'w') as f:
    f.write(content)
