import re

with open('src/components/HealthCalculator.tsx', 'r') as f:
    content = f.read()

# Change title
old_title = "{isVi ? 'Trạm Đo Chỉ Số BMI & Thể Hình Chuẩn 5 Sao' : 'Smart BMI & Health Assessment Station'}"
new_title = "{isVi ? 'ĐO BMI & THỂ HÌNH CHUẨN 5 SAO' : 'Smart BMI & Health Assessment Station'}"
content = content.replace(old_title, new_title)

# Change paragraph to justify
old_p = '<p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm md:text-base leading-relaxed">'
new_p = '<p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm md:text-base leading-relaxed text-justify text-pretty px-4 sm:px-8 max-w-3xl mx-auto">'
content = content.replace(old_p, new_p)

with open('src/components/HealthCalculator.tsx', 'w') as f:
    f.write(content)

