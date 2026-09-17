import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add import
import_stmt = "import { FadeIn } from './components/FadeIn';\n"
if "import { FadeIn }" not in content:
    content = content.replace("import React, {", import_stmt + "import React, {", 1)

# We want to wrap the <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> 
# inside sections with <FadeIn>

sections = re.finditer(r'<section[^>]*>', content)
for match in reversed(list(sections)):
    start_idx = match.end()
    # Find the next <div className="max-w-7xl
    div_match = re.search(r'\s*<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">', content[start_idx:])
    if div_match and div_match.start() < 100: # ensure it's right after the section
        div_start = start_idx + div_match.start()
        
        # We need to find the matching closing </div>
        # But this is hard with regex. 
        pass

