import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Apply `text-pretty` to <p> tags with leading-relaxed to avoid orphans.
# Also apply `text-justify` to standard paragraph descriptions so they are balanced.

# Helper to add classes safely
def add_classes(match, new_classes):
    class_attr = match.group(1)
    if new_classes not in class_attr:
        return f'<p className="{class_attr} {new_classes}">'
    return match.group(0)

def add_classes_h(match, new_classes):
    tag = match.group(1)
    class_attr = match.group(2)
    if new_classes not in class_attr:
        return f'<{tag} className="{class_attr} {new_classes}">'
    return match.group(0)

# 1. Update <p> tags
# Let's use `text-justify text-pretty` for long descriptive paragraphs to align text evenly and prevent orphans.
p_pattern = re.compile(r'<p className="([^"]*leading-relaxed[^"]*)">')
content = p_pattern.sub(lambda m: add_classes(m, 'text-justify text-pretty'), content)

# 2. Update <h> tags
# Apply `text-balance` to h1, h2, h3 to balance title lines automatically.
h_pattern = re.compile(r'<(h[1-4]) className="([^"]*)">')
content = h_pattern.sub(lambda m: add_classes_h(m, 'text-balance'), content)

with open('src/App.tsx', 'w') as f:
    f.write(content)

