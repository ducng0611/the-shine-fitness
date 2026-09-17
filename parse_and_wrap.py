import os

def process_app_tsx():
    with open('src/App.tsx', 'r') as f:
        lines = f.readlines()

    # Add import
    for i, line in enumerate(lines):
        if line.startswith("import React, {"):
            lines.insert(i, "import { FadeIn } from './components/FadeIn';\n")
            break

    # Now let's wrap the children of <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> inside sections
    # Wait, the easiest is to just find that line, and since it's a div, wrap it!
    # Let's find every occurrence of:
    # <section ...>
    #   <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    # Let's just wrap the <div className="max-w-7xl..."> with <FadeIn direction="up">
    
    out_lines = []
    stack = []
    
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Check if this line has the max-w-7xl div
        if '<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">' in line:
            # check if it's inside a section (just a heuristic: previous non-empty line has <section or <header)
            # Actually, the header and all sections have it. Fading in everything is perfectly fine.
            # Except maybe the header navigation shouldn't fade in on scroll, it should just be there.
            
            # Let's skip the first one which is likely the header/navbar!
            # The first max-w-7xl is line 356 (Navbar) -> skip
            pass
            
        out_lines.append(line)
        i += 1

    # Let's try string replacement instead for the specific sections
    pass

if __name__ == '__main__':
    process_app_tsx()
