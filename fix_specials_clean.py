with open('src/pages/SpecialsPage.tsx', 'r') as f:
    content = f.read()

# Replace the messy ending
idx = content.find('{/* 4. SERVICES SECTION')
if idx != -1:
    proper_end = """
    </div>
  );
};
"""
    new_content = content[:idx] + proper_end
    with open('src/pages/SpecialsPage.tsx', 'w') as f:
        f.write(new_content)
