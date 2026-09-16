const fs = require('fs');
let code = fs.readFileSync('src/translations.ts', 'utf8');

// Vietnamese
code = code.replace(/specials: 'Ưu đãi & Bảng giá',/, "specials: 'Ưu đãi',");
code = code.replace(/bmiCalc: 'Đo Chỉ Số BMI',/, "bmiCalc: 'Đo BMI',");
code = code.replace(/blogs: 'Blog Thể Hình',/, "blogs: 'Tin tức',");
code = code.replace(/reviews: 'Đánh giá',/, "reviews: 'Trải nghiệm',");

// English
code = code.replace(/specials: 'Specials & Pricing',/, "specials: 'Offers',");
code = code.replace(/bmiCalc: 'BMI Calculator',/, "bmiCalc: 'BMI',");
code = code.replace(/blogs: 'Fitness Blog',/, "blogs: 'News',");
code = code.replace(/reviews: 'Reviews',/, "reviews: 'Experience',");

fs.writeFileSync('src/translations.ts', code);
console.log('translations.ts adapted.');
