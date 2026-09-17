import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

fab_block = """
      {/* Mobile Floating Action Button (FAB) */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-[300px]">
        <button
          onClick={() => openRegistration()}
          className="w-full bg-brand-orange hover:bg-orange-600 text-white py-3.5 px-6 rounded-full font-heading font-bold text-sm uppercase italic shadow-[0_4px_15px_rgba(249,115,22,0.5)] flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          <Calendar size={18} />
          {lang === 'vi' ? 'Đăng Ký Tập Thử' : 'Book Trial'}
        </button>
      </div>
"""

if "Mobile Floating Action Button (FAB)" not in content:
    content = content.replace("      <ScrollToTop />", fab_block + "\n      <ScrollToTop />")

with open('src/App.tsx', 'w') as f:
    f.write(content)
