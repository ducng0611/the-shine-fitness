import re

with open('src/components/BlogSection.tsx', 'r') as f:
    content = f.read()

# Make the initial state include mockCrawledFeed
content = content.replace("useState<BlogPost[]>(initialBlogPosts);", "useState<BlogPost[]>([...initialBlogPosts, ...mockCrawledFeed]);")

with open('src/components/BlogSection.tsx', 'w') as f:
    f.write(content)

