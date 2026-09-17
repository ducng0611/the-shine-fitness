import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

old_fab = """      {/* Mobile Floating Action Button (FAB) */}
      <div className={`md:hidden fixed bottom-6 right-[5.5rem] z-40 w-[60%] max-w-[200px] transition-opacity duration-300 ${isChatbotOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
        <button
          onClick={() => openRegistration()}
          className="w-full bg-brand-orange hover:bg-orange-600 text-white py-[14px] px-4 rounded-[2rem] font-heading font-bold text-xs uppercase italic shadow-[0_4px_15px_rgba(249,115,22,0.5)] flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          <Calendar size={16} />
          {lang === 'vi' ? 'Đăng Ký Tập Thử' : 'Book Trial'}
        </button>
      </div>"""

new_fab = """      {/* Mobile Floating Action Button (FAB) */}
      <div className={`md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-fit min-w-[220px] transition-opacity duration-300 ${isChatbotOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
        <button
          onClick={() => openRegistration()}
          className="w-full h-[56px] bg-brand-orange hover:bg-orange-600 text-white px-6 rounded-full font-heading font-bold text-base uppercase italic shadow-[0_4px_15px_rgba(249,115,22,0.5)] flex items-center justify-center gap-2 transition-transform active:scale-95 whitespace-nowrap"
        >
          <Calendar size={20} />
          {lang === 'vi' ? 'Đăng Ký Tập Thử' : 'Book Trial'}
        </button>
      </div>"""

content = content.replace(old_fab, new_fab)

with open('src/App.tsx', 'w') as f:
    f.write(content)

