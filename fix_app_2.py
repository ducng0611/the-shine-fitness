import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace("element={<ContactPage lang={lang} t={t} />}", "element={<ContactPage lang={lang} t={t} openRegistration={openRegistration} />}")

with open('src/App.tsx', 'w') as f:
    f.write(content)
