import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# We need to position it exactly relative to the chatbot bubble.
# Chatbot bubble has `bottom-6 right-6` and `p-4` (meaning it's 56px wide/tall).
# It's at right: 1.5rem (24px). Width is ~56px. Total width occupied is 80px.
# If we put our button at right: 88px, there will be 8px gap.
# Let's use `fixed bottom-6 right-20` (right: 5rem = 80px) or right-[84px]
# The image shows them right next to each other, so a small gap (8px - 12px) is good.

new_fab = """      {/* Mobile Floating Action Button (FAB) */}
      <div className={`md:hidden fixed bottom-6 right-[5.5rem] z-40 w-[60%] max-w-[200px] transition-opacity duration-300 ${isChatbotOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
        <button
          onClick={() => openRegistration()}
          className="w-full bg-brand-orange hover:bg-orange-600 text-white py-[14px] px-4 rounded-[2rem] font-heading font-bold text-xs uppercase italic shadow-[0_4px_15px_rgba(249,115,22,0.5)] flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          <Calendar size={16} />
          {lang === 'vi' ? 'Đăng Ký Tập Thử' : 'Book Trial'}
        </button>
      </div>"""

old_fab = """      {/* Mobile Floating Action Button (FAB) */}
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
