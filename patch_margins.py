import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# For any paragraph that is just "text-justify text-pretty" with standard leading-relaxed (usually section subtitles)
# We add `max-w-3xl mx-auto px-4 sm:px-6` to ensure it has padding and max-width.
# Let's inspect the lines manually first.
