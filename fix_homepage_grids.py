import re

with open('src/pages/HomePage.tsx', 'r') as f:
    content = f.read()

# Change grids
content = content.replace(
    '<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">',
    '<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">'
)
content = content.replace(
    '<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center flex-col-reverse lg:flex-row-reverse">',
    '<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">'
) # Wait, the flex-col-reverse doesn't work well with grid-cols-12 if we just change the wrapper, but wait, grid-cols-12 doesn't reverse automatically.
# Let's fix A2 specifically.

