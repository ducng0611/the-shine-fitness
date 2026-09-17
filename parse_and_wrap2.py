import re

with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if line.startswith("import React, {"):
        lines.insert(i, "import { FadeIn } from './components/FadeIn';\n")
        break

out = []
i = 0
while i < len(lines):
    line = lines[i]
    if line.startswith("      <section") and "id=" in line or line.startswith("      {/* 3. HERO SPECIAL OFFER SECTION"):
        # We are at a section!
        # wait, the indentation is 6 spaces. Let's find `<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">`
        pass
        
    out.append(line)
    i += 1

