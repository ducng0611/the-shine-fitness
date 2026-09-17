import re

with open('src/translations.ts', 'r') as f:
    content = f.read()

# Change 'Hãy Đến & Cảm Nhận Ngay Hôm Nay' to something marketing-focused
content = content.replace("heading: 'Hãy Đến & Cảm Nhận Ngay Hôm Nay',", "heading: 'Bắt Đầu Hành Trình Thay Đổi Vóc Dáng Ngay Hôm Nay',")

with open('src/translations.ts', 'w') as f:
    f.write(content)

