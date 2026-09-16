/**
 * Server-side Gender & Pronoun Resolver for The Shine Fitness & Yoga
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

export function resolveMemberPronoun(memberInfo?: {
  fullName?: string;
  gender?: string;
  memberCode?: string;
  membershipTier?: string;
} | null): {
  pronoun: 'Anh' | 'Chị' | 'Anh/Chị';
  detectedGender: 'Nam' | 'Nữ' | null;
  memberName: string;
  isMember: boolean;
} {
  if (!memberInfo) {
    return {
      pronoun: 'Anh/Chị',
      detectedGender: null,
      memberName: '',
      isMember: false
    };
  }

  const memberName = (memberInfo.fullName || '').trim();
  const rawGender = (memberInfo.gender || '').trim().toLowerCase();

  let detectedGender: 'Nam' | 'Nữ' | null = null;
  if (rawGender === 'nam' || rawGender === 'male') {
    detectedGender = 'Nam';
  } else if (rawGender === 'nữ' || rawGender === 'nu' || rawGender === 'female') {
    detectedGender = 'Nữ';
  } else if (memberName) {
    detectedGender = inferGenderFromName(memberName);
  }

  let pronoun: 'Anh' | 'Chị' | 'Anh/Chị' = 'Anh/Chị';
  if (detectedGender === 'Nam') {
    pronoun = 'Anh';
  } else if (detectedGender === 'Nữ') {
    pronoun = 'Chị';
  }

  return {
    pronoun,
    detectedGender,
    memberName,
    isMember: true
  };
}
