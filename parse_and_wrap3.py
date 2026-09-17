with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add import
if "import { FadeIn }" not in content:
    content = content.replace("import React, {", "import { FadeIn } from './components/FadeIn';\nimport React, {", 1)

lines = content.split('\n')
out = []
i = 0
while i < len(lines):
    line = lines[i]
    if line == '        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">':
        # Let's skip the first one in header if it's there
        # Wait, the first one is at line 356 inside <nav> which is not a section.
        # But wait, <nav> might have different indentation or we can check if we are inside a section.
        pass
    out.append(line)
    i += 1
