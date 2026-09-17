import re

def process():
    with open('src/App.tsx', 'r') as f:
        content = f.read()

    # Add import
    if "import { FadeIn }" not in content:
        content = content.replace("import React, {", "import { FadeIn } from './components/FadeIn';\nimport React, {", 1)

    # We want to replace:
    # <section ...>
    #   <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    # with:
    # <section ...>
    #   <FadeIn>
    #     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    
    # And we need to find the matching closing </div> to add </FadeIn>
    
    def find_closing_tag(text, start_idx):
        stack = 0
        tag_pattern = re.compile(r'<\s*(/?)\s*div[^>]*>')
        for match in tag_pattern.finditer(text, start_idx):
            is_closing = match.group(1) == '/'
            if not is_closing:
                stack += 1
            else:
                stack -= 1
                if stack == 0:
                    return match.end()
        return -1

    # Find all <section> tags
    section_pattern = re.compile(r'<section[^>]*>')
    offset = 0
    while True:
        match = section_pattern.search(content, offset)
        if not match:
            break
            
        section_end = match.end()
        div_pattern = re.compile(r'\s*<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">')
        div_match = div_pattern.match(content, section_end)
        
        if div_match:
            div_start = div_match.start()
            closing_idx = find_closing_tag(content, section_end + div_match.end() - div_match.start() - 1)
            
            if closing_idx != -1:
                # Insert </FadeIn> after closing_idx
                # We need to calculate exact indices
                # wait, find_closing_tag logic:
                pass
        offset = section_end

if __name__ == '__main__':
    process()
