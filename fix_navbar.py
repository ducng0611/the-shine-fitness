import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Desktop Navigation (if any)
# I don't see desktop navigation in the snippet except "Hamburger Button for < xl screens"
# Wait, let me check the snippet again. It's cut off.

# But for mobile nav:
content = content.replace('href="#services"', 'href="/dich-vu" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigateTo("/dich-vu"); }}')
content = content.replace('href="#specials"', 'href="/khuyen-mai" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigateTo("/khuyen-mai"); }}')
content = content.replace('href="#health-calculator"', 'href="/dich-vu" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigateTo("/dich-vu"); }}')
content = content.replace('href="#blogs"', 'href="/tin-tuc" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigateTo("/tin-tuc"); }}')
content = content.replace('href="#reviews"', 'href="/khach-hang" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigateTo("/khach-hang"); }}')
content = content.replace('href="#location"', 'href="/lien-he" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigateTo("/lien-he"); }}')

# For Desktop, it seems there's another block that I missed. Let me check if there's any `href="#services"` left.
content = content.replace('onClick={() => setMobileMenuOpen(false)}', '')

with open('src/App.tsx', 'w') as f:
    f.write(content)

