with open('src/App.tsx', 'r') as f:
    content = f.read()

idx = content.find('navLinks.map')
if idx != -1:
    print(content[idx:idx+500])
