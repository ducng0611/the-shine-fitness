import re

with open('src/pages/HomePage.tsx', 'r') as f:
    content = f.read()

# Remove the eyebrow
content = re.sub(r'<span className="text-brand-orange font-bold text-xs uppercase tracking-widest block mb-4">\s*The Shine Fitness Journey\s*</span>', '', content)

# Change h1
h1_regex = r'<h1 className="text-4xl sm:text-5xl lg:text-7xl font-heading font-black uppercase italic text-slate-900 dark:text-white leading-tight mb-8">.*?</h1>'
h1_replacement = """<h1 className="text-4xl sm:text-5xl lg:text-7xl font-heading font-black uppercase italic leading-tight mb-8">
                <span className="text-slate-900 dark:text-white">ĐỘT PHÁ VÓC DÁNG</span><br/>
                <span className="text-brand-orange">TỎA SÁNG CÙNG THE SHINE</span>
              </h1>"""
content = re.sub(h1_regex, h1_replacement, content, flags=re.DOTALL)

# Remove (Mô hình 5A Customer Journey)
content = content.replace(" (Mô hình 5A Customer Journey)", "")

# Fix step 1
step1_regex = r'<h2 className="text-3xl sm:text-4xl font-heading font-black uppercase italic text-slate-900 dark:text-white mb-6">\s*1\. Aware & Appeal<br/>.*?<span className="text-brand-orange text-2xl sm:text-3xl">Khám Phá & Thu Hút</span>\s*</h2>'
step1_replacement = """<h2 className="text-3xl sm:text-4xl font-heading font-black uppercase italic text-brand-orange mb-6">
                  Khởi Nguồn Đam Mê
                </h2>"""
content = re.sub(step1_regex, step1_replacement, content, flags=re.DOTALL)

# Fix step 2
step2_regex = r'<h2 className="text-3xl sm:text-4xl font-heading font-black uppercase italic text-slate-900 dark:text-white mb-6">\s*2\. Ask<br/>.*?<span className="text-brand-orange text-2xl sm:text-3xl">Tìm Hiểu & Nhận Tư Vấn</span>\s*</h2>'
step2_replacement = """<h2 className="text-3xl sm:text-4xl font-heading font-black uppercase italic text-brand-orange mb-6">
                  Giải Pháp Từ Chuyên Gia
                </h2>"""
content = re.sub(step2_regex, step2_replacement, content, flags=re.DOTALL)

# Fix step 3
step3_regex = r'<h2 className="text-3xl sm:text-4xl font-heading font-black uppercase italic text-slate-900 dark:text-white mb-6">\s*3\. Act<br/>.*?<span className="text-brand-orange text-2xl sm:text-3xl">Trải Nghiệm & Quyết Định</span>\s*</h2>'
step3_replacement = """<h2 className="text-3xl sm:text-4xl font-heading font-black uppercase italic text-brand-orange mb-6">
                  Trải Nghiệm Tập Luyện Đỉnh Cao
                </h2>"""
content = re.sub(step3_regex, step3_replacement, content, flags=re.DOTALL)

# Fix step 4
step4_regex = r'<h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black uppercase italic leading-tight mb-6">\s*4\. Advocate & AI<br/>Gắn Bó, Lan Tỏa & Tiên Phong Công Nghệ\s*</h2>'
step4_replacement = """<h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black uppercase italic text-brand-orange leading-tight mb-6">
                Cộng Đồng Khỏe Đẹp & Trợ Lý AI
              </h2>"""
content = re.sub(step4_regex, step4_replacement, content, flags=re.DOTALL)

# Fix step 4 eyebrow
content = re.sub(r'<span className="text-brand-orange font-bold text-xs uppercase tracking-widest block mb-4">\s*Sự Gắn Kết Bền Vững\s*</span>', '', content)


with open('src/pages/HomePage.tsx', 'w') as f:
    f.write(content)
