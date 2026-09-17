with open('src/App.tsx', 'r') as f:
    content = f.read()

# Check for const navLinks
idx = content.find('const navLinks')
if idx != -1:
    print(content[idx:idx+500])
