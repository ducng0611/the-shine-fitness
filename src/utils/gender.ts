/**
 * Gender and Pronoun Utilities for The Shine Fitness & Yoga
 * Ensures strict Vietnamese honorific conventions:
 * - Default: Always refer to customer as 'Anh/Chị' and refer to self as 'em'
 * - Logged-in Male Member: Always refer to as 'Anh' and refer to self as 'em'
 * - Logged-in Female Member: Always refer to as 'Chị' and refer to self as 'em'
 * - Never use 'bạn', 'tôi', or 'mình'
 */

export function inferGenderFromName(fullName?: string | null): 'Nam' | 'Nữ' | null {
  if (!fullName) return null;
  const clean = fullName.trim().toLowerCase();
  if (!clean) return null;

  const words = clean.split(/\s+/);

  // Female middle markers
  if (
    words.includes('thị') || 
    words.includes('thi') || 
    words.includes('ngọc') || 
    words.includes('mỹ') || 
    words.includes('diễm') || 
    words.includes('phương') || 
    words.includes('thùy') || 
    words.includes('thuỳ') || 
    words.includes('tuyết') || 
    words.includes('bích')
  ) {
    return 'Nữ';
  }

  // Male middle markers
  if (
    words.includes('văn') || 
    words.includes('van') || 
    words.includes('hữu') || 
    words.includes('đình') || 
    words.includes('quốc') || 
    words.includes('trọng') || 
    words.includes('mạnh')
  ) {
    return 'Nam';
  }

  const lastWord = words[words.length - 1];

  const femaleNames = new Set([
    'hoa', 'mai', 'lan', 'hương', 'huong', 'hường', 'trang', 'thảo', 'thao', 
    'linh', 'quỳnh', 'quynh', 'vy', 'yến', 'yen', 'ngân', 'ngan', 'trâm', 'tram', 
    'dung', 'hằng', 'hang', 'chi', 'nga', 'ly', 'huyền', 'huyen', 'loan', 'nhung', 
    'phượng', 'phuong', 'oanh', 'thư', 'thu', 'nhi', 'uyên', 'uyen', 'hiền', 'hien', 
    'châu', 'chau', 'liên', 'lien', 'vân', 'van', 'nguyệt', 'nguyet', 'my', 'trà', 'tra', 
    'đan', 'dan', 'thúy', 'thuy', 'thuý', 'bích', 'bich', 'quyên', 'quyen', 'hà', 'ha'
  ]);

  const maleNames = new Set([
    'đức', 'duc', 'tuấn', 'tuan', 'dũng', 'dung', 'hoàng', 'hoang', 'huy', 'thắng', 'thang', 
    'đạt', 'dat', 'phong', 'phúc', 'phuc', 'hải', 'hai', 'long', 'hùng', 'hung', 'nam', 
    'khoa', 'tùng', 'tung', 'kiên', 'kien', 'sơn', 'son', 'quân', 'quan', 'bảo', 'bao', 
    'hiếu', 'hieu', 'cường', 'cuong', 'duy', 'hậu', 'hau', 'bách', 'bach', 'nghĩa', 'nghia', 
    'thái', 'thai', 'tiến', 'tien', 'trung', 'toàn', 'toan', 'việt', 'viet', 'vinh', 
    'phát', 'phat', 'vũ', 'vu', 'trí', 'tri', 'thịnh', 'thinh', 'khôi', 'khoi', 'hưng', 'hung',
    'thành', 'thanh', 'bình', 'binh', 'nhật', 'nhat', 'khánh', 'khanh'
  ]);

  if (femaleNames.has(lastWord)) return 'Nữ';
  if (maleNames.has(lastWord)) return 'Nam';

  return null;
}

export function getCustomerPronoun(gender?: string | null, fullName?: string | null): {
  pronoun: 'Anh' | 'Chị' | 'Anh/Chị';
  detectedGender: 'Nam' | 'Nữ' | null;
  greetingTitle: string;
} {
  const g = (gender || '').trim().toLowerCase();
  if (g === 'nam' || g === 'male') {
    return { 
      pronoun: 'Anh', 
      detectedGender: 'Nam',
      greetingTitle: fullName ? `Anh ${fullName.trim().split(' ').slice(-1)[0]}` : 'Anh'
    };
  }
  if (g === 'nữ' || g === 'nu' || g === 'female') {
    return { 
      pronoun: 'Chị', 
      detectedGender: 'Nữ',
      greetingTitle: fullName ? `Chị ${fullName.trim().split(' ').slice(-1)[0]}` : 'Chị'
    };
  }

  if (fullName) {
    const inferred = inferGenderFromName(fullName);
    if (inferred === 'Nam') {
      return { 
        pronoun: 'Anh', 
        detectedGender: 'Nam',
        greetingTitle: `Anh ${fullName.trim().split(' ').slice(-1)[0]}`
      };
    }
    if (inferred === 'Nữ') {
      return { 
        pronoun: 'Chị', 
        detectedGender: 'Nữ',
        greetingTitle: `Chị ${fullName.trim().split(' ').slice(-1)[0]}`
      };
    }
  }

  return { 
    pronoun: 'Anh/Chị', 
    detectedGender: null,
    greetingTitle: 'Anh/Chị'
  };
}
