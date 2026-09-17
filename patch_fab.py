import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Current mobile FAB
old_fab = """      {/* Mobile Floating Action Button (FAB) */}
      <div className={`md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-[300px] transition-opacity duration-300 ${isChatbotOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
        <button
          onClick={() => openRegistration()}
          className="w-full bg-brand-orange hover:bg-orange-600 text-white py-3.5 px-6 rounded-full font-heading font-bold text-sm uppercase italic shadow-[0_4px_15px_rgba(249,115,22,0.5)] flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          <Calendar size={18} />
          {lang === 'vi' ? 'Đăng Ký Tập Thử' : 'Book Trial'}
        </button>
      </div>"""

# New mobile FAB: we position it to the left of the chatbot bubble
# Chatbot bubble usually stays at bottom-right (right-6 bottom-6 approx).
# If we want them side-by-side: We can put both the chatbot bubble and the booking button in the same container,
# OR we can just place this floating button at bottom-6, right-24 (which is to the left of a 56px chatbot bubble).
# Since the image shows them aligned right next to each other (Booking button -> Chat button), we'll do:
new_fab = """      {/* Mobile Floating Action Button (FAB) */}
      <div className={`md:hidden fixed bottom-6 right-[88px] z-40 w-[65%] max-w-[220px] transition-opacity duration-300 ${isChatbotOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
        <button
          onClick={() => openRegistration()}
          className="w-full bg-brand-orange hover:bg-orange-600 text-white py-3.5 px-4 rounded-[1.5rem] font-heading font-bold text-xs uppercase italic shadow-[0_4px_15px_rgba(249,115,22,0.5)] flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          <Calendar size={16} />
          {lang === 'vi' ? 'Đăng Ký Tập Thử' : 'Book Trial'}
        </button>
      </div>"""

content = content.replace(old_fab, new_fab)

with open('src/App.tsx', 'w') as f:
    f.write(content)
