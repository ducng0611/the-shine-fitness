import re

# 1. Update translations.ts
with open('src/translations.ts', 'r') as f:
    t_content = f.read()

# Fix TikTok views/likes/comments
t_content = t_content.replace("'Lượt xem (Views)'", "'Lượt xem'")
t_content = t_content.replace("'Thích (Likes)'", "'Lượt thích'")
t_content = t_content.replace("'Bình luận (Comments)'", "'Bình luận'")
t_content = t_content.replace("'Thẻ Hội Viên (Membership)'", "'Thẻ Hội Viên'")
t_content = t_content.replace("'Personal Training (PT 1 Kèm 1)'", "'Huấn Luyện Viên Cá Nhân (PT 1 Kèm 1)'")
t_content = t_content.replace("'Gói Thử Thể Hình 03 Ngày VIP (Voucher FREE-TRIAL)'", "'Gói Thử Thể Hình 03 Ngày VIP'")
with open('src/translations.ts', 'w') as f:
    f.write(t_content)


# 2. Update HomePage.tsx
with open('src/pages/HomePage.tsx', 'r') as f:
    hp_content = f.read()
hp_content = hp_content.replace("Sự Ủng Hộ (Advocate)", "Gắn Bó & Ủng Hộ")
hp_content = hp_content.replace("Tích Hợp Trợ Lý Ảo (AI)", "Tích Hợp Trợ Lý Công Nghệ")
with open('src/pages/HomePage.tsx', 'w') as f:
    f.write(hp_content)


# 3. Update BlogSection.tsx fonts
with open('src/components/BlogSection.tsx', 'r') as f:
    bs_content = f.read()

bs_content = bs_content.replace('text-xs uppercase tracking-widest', 'text-sm uppercase tracking-widest')
bs_content = bs_content.replace('text-sm sm:text-base leading-relaxed', 'text-base sm:text-lg leading-relaxed')
bs_content = bs_content.replace('text-xs font-bold uppercase', 'text-sm font-bold uppercase')
bs_content = bs_content.replace('text-xs sm:text-sm', 'text-sm sm:text-base')
bs_content = bs_content.replace('text-xs font-semibold', 'text-sm font-semibold')
bs_content = bs_content.replace('text-xs text-slate-400', 'text-sm text-slate-400')
bs_content = bs_content.replace('text-[10px] font-bold px-3 py-1', 'text-xs font-bold px-3 py-1')
bs_content = bs_content.replace('text-[10px] font-bold px-3 py-0.5', 'text-xs font-bold px-3 py-0.5')
with open('src/components/BlogSection.tsx', 'w') as f:
    f.write(bs_content)


# 4. Update ReviewsPage.tsx fonts
with open('src/pages/ReviewsPage.tsx', 'r') as f:
    rp_content = f.read()

rp_content = rp_content.replace('text-xs uppercase tracking-widest', 'text-sm uppercase tracking-widest')
rp_content = rp_content.replace('text-sm sm:text-base leading-relaxed', 'text-base sm:text-lg leading-relaxed')
rp_content = rp_content.replace('text-xs font-bold uppercase', 'text-sm font-bold uppercase')
rp_content = rp_content.replace('text-xs sm:text-sm', 'text-sm sm:text-base')
rp_content = rp_content.replace('text-[10px] font-bold px-3 py-1', 'text-xs font-bold px-3 py-1')
rp_content = rp_content.replace('text-xs leading-relaxed', 'text-sm leading-relaxed')
rp_content = rp_content.replace('text-sm leading-relaxed mb-6', 'text-base leading-relaxed mb-6')
rp_content = rp_content.replace('text-xs italic p-4', 'text-sm italic p-4')
with open('src/pages/ReviewsPage.tsx', 'w') as f:
    f.write(rp_content)


