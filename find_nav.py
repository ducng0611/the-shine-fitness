with open('src/App.tsx', 'r') as f:
    content = f.read()

start = content.find('<nav')
end = content.find('</nav>', start)
if start != -1:
    print(content[start:end+6])
