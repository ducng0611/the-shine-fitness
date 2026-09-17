import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace the navLinks
old_navLinks = """  const navLinks = [
    { id: 'services', labelVi: 'Dịch vụ', labelEn: 'Services' },
    { id: 'specials', labelVi: 'Khuyến mãi', labelEn: 'Offers' },
    { id: 'reviews', labelVi: 'Khách hàng', labelEn: 'Reviews' },
    { id: 'blogs', labelVi: 'Tin tức', labelEn: 'News' },
    { id: 'location', labelVi: 'Liên hệ', labelEn: 'Contact' }
  ];"""

new_navLinks = """  const navLinks = [
    { id: 'services', path: '/dich-vu', labelVi: 'Dịch vụ', labelEn: 'Services' },
    { id: 'specials', path: '/khuyen-mai', labelVi: 'Khuyến mãi', labelEn: 'Offers' },
    { id: 'reviews', path: '/khach-hang', labelVi: 'Khách hàng', labelEn: 'Reviews' },
    { id: 'blogs', path: '/tin-tuc', labelVi: 'Tin tức', labelEn: 'News' },
    { id: 'location', path: '/lien-he', labelVi: 'Liên hệ', labelEn: 'Contact' }
  ];"""
content = content.replace(old_navLinks, new_navLinks)

# Replace navigation and <a> tags
# We will import Link from react-router-dom
content = "import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';\n" + content

# Import the new pages
new_imports = """
import { HomePage } from './pages/HomePage';
import { ServicesPage } from './pages/ServicesPage';
import { SpecialsPage } from './pages/SpecialsPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { NewsPage } from './pages/NewsPage';
import { ContactPage } from './pages/ContactPage';
"""
content = content.replace("import { Toast } from './components/Toast';", "import { Toast } from './components/Toast';\n" + new_imports)

with open('src/App.tsx', 'w') as f:
    f.write(content)

