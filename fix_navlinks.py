import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace the navLinks using regex
content = re.sub(
    r"const navLinks = \[.*?\];",
    """const navLinks = [
    { id: 'services', path: '/dich-vu', labelVi: 'Dịch vụ', labelEn: 'Services' },
    { id: 'specials', path: '/khuyen-mai', labelVi: 'Khuyến mãi', labelEn: 'Offers' },
    { id: 'reviews', path: '/khach-hang', labelVi: 'Khách hàng', labelEn: 'Reviews' },
    { id: 'blogs', path: '/tin-tuc', labelVi: 'Tin tức', labelEn: 'News' },
    { id: 'location', path: '/lien-he', labelVi: 'Liên hệ', labelEn: 'Contact' }
  ];""",
    content,
    flags=re.DOTALL
)

with open('src/App.tsx', 'w') as f:
    f.write(content)

