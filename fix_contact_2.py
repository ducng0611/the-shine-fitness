import re

with open('src/pages/ContactPage.tsx', 'r') as f:
    content = f.read()

# Just remove the last 20 characters and append the proper tags
# "    </div>\n  );\n};\n" is 20 chars
content = re.sub(r'</div>\s*</div>\s*\);\s*};', '</div></div></div></FadeIn></section></div>);};', content)

with open('src/pages/ContactPage.tsx', 'w') as f:
    f.write(content)

