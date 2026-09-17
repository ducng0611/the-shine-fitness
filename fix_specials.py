with open('src/pages/SpecialsPage.tsx', 'r') as f:
    content = f.read()

content = content.replace("    </div>\n  );\n};", "  </div></div>\n  );\n};")

with open('src/pages/SpecialsPage.tsx', 'w') as f:
    f.write(content)
