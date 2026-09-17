import re

def main():
    with open('src/App.tsx', 'r') as f:
        content = f.read()

    # Add import
    if "import { FadeIn }" not in content:
        content = content.replace("import React, {", "import { FadeIn } from './components/FadeIn';\nimport React, {", 1)

    # Find <section ...>
    # Inside each section, find <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    # Replace it with <FadeIn>\n<div ...>
    # Find the corresponding </div> using simple regex from the end of section: 
    # we know it ends with:
    #         </div>
    #       </section>
    
    sections = re.findall(r'(<section.*?</section>)', content, flags=re.DOTALL)
    for sec in sections:
        if '<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">' in sec:
            new_sec = sec.replace(
                '        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">',
                '        <FadeIn>\n        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">'
            )
            # Find the last </div> before </section>
            new_sec = re.sub(r'        </div>\n      </section>', '        </div>\n        </FadeIn>\n      </section>', new_sec)
            content = content.replace(sec, new_sec)

    with open('src/App.tsx', 'w') as f:
        f.write(content)
    print("Done")

if __name__ == '__main__':
    main()
