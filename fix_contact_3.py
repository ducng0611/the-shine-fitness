with open('src/pages/ContactPage.tsx', 'r') as f:
    content = f.read()

# Add one more </div>
content = content.replace("</section></div>);};", "</div></section></div>);};")

with open('src/pages/ContactPage.tsx', 'w') as f:
    f.write(content)
