export interface GoogleReviewItem {
  authorName: string;
  rating: number;
  textVi: string;
  textEn: string;
  timeVi: string;
  timeEn: string;
  authorPhoto?: string | null;
}

export interface FacebookReviewItem {
  author: string;
  textVi: string;
  textEn: string;
  dateVi?: string;
  dateEn?: string;
}

// Dictionary of verified Google Reviews mapped bi-directionally between Vietnamese and English
export const GOOGLE_REVIEWS_BILINGUAL: GoogleReviewItem[] = [
  {
    authorName: 'Linh Vu',
    rating: 5,
    textVi: 'Bất ngờ là phòng tập rất tốt! Giá cả hợp lý, có cả vé tập theo ngày nữa. Đánh giá 5/5 sao!',
    textEn: 'Surprisingly good! Fair price, has daily pass as well. 5/5!',
    timeVi: '5 tháng trước',
    timeEn: '5 months ago'
  },
  {
    authorName: 'Duy Huỳnh Văn',
    rating: 5,
    textVi: 'Mình có trải nghiệm tuyệt vời tại không gian phòng tập rất đẹp này. Lần đầu tiên đến nhưng nhân viên luôn niềm nở hỗ trợ. Huấn luyện viên PT rất chuyên nghiệp, giàu kinh nghiệm và thân thiện. Bạn mình giới thiệu phòng này, quả thực hoàn toàn xứng đáng!',
    textEn: 'I had a wonderful experience with the beautiful place right there. This is the first time I came here, but the staff always help with pleasure. The PT coach is really professional, experienced and friendly as well. My mate recommended this place for me that is absolutely worthy.',
    timeVi: '1 năm trước',
    timeEn: 'a year ago'
  },
  {
    authorName: 'Vu Dang Khoa',
    rating: 5,
    textVi: 'Phòng tập cực kỳ sạch sẽ, cơ sở vật chất đẹp và dịch vụ chăm sóc hội viên rất chu đáo!',
    textEn: "It's so clean, beautiful and good service to me!",
    timeVi: '1 năm trước',
    timeEn: 'a year ago'
  },
  {
    authorName: 'Thảo Nguyễn',
    rating: 5,
    textVi: 'Một vài thành quả nhỏ sau 4 tháng tập luyện tại The Shine: mình giảm từ 52kg xuống 49kg, vòng eo thon gọn và cơ lưng vai săn chắc hơn. Không chỉ thể lực cải thiện mà mình còn hình thành thói quen vận động mỗi ngày, người nhẹ nhõm, tự tin hơn hẳn. Cảm ơn PT Thái và Tony đã luôn tận tâm hỗ trợ!',
    textEn: 'Here are some of my small successes after 4 months of training here: I went from 52kg to 49kg, waist circumference decreased by 2cm, back and shoulders are more defined. My fitness improved and I formed regular workout habits. Huge thanks to PT Thai and Tony for continuous support!',
    timeVi: '2 tháng trước',
    timeEn: '2 months ago'
  },
  {
    authorName: 'Vũ Lâm',
    rating: 5,
    textVi: 'Phòng ốc tuyệt vời, dịch vụ xuất sắc và trang thiết bị hiện đại. Các bạn nhân viên rất nhiệt tình hỗ trợ, bạn tiếp tân Trâm vừa dễ thương vừa chu đáo. Đánh giá 10/10!',
    textEn: 'The rooms are great, the service is excellent, and the equipment is fantastic. The staff are very helpful, and there is a lovely, enthusiastic receptionist named Tram. Overall, 10 out of 10.',
    timeVi: '1 tháng trước',
    timeEn: 'a month ago'
  },
  {
    authorName: 'Huyền Nguyễn',
    rating: 5,
    textVi: 'Mình giảm từ 59kg xuống 52kg sau khi tập với anh Thái. Rất đáng đồng tiền khi chọn đúng HLV đồng hành, tăng cơ giảm mỡ chuẩn khoa học!',
    textEn: 'I went from 59kg to 52kg after training with Mr. Thai. It was totally worth choosing the right training partner. I gained muscle and lost fat the right way!',
    timeVi: '5 tháng trước',
    timeEn: '5 months ago'
  },
  {
    authorName: 'Jack McCaughan',
    rating: 5,
    textVi: 'Thật tuyệt vời vì có thể mua vé tập theo ngày và phòng tập có đầy đủ mọi thiết bị bạn cần.',
    textEn: 'Great that you can pay in for a day pass and really has everything you need.',
    timeVi: '1 tháng trước',
    timeEn: 'a month ago'
  },
  {
    authorName: 'Doan Dac Thien',
    rating: 5,
    textVi: 'Mình tập ở đây được 4 tháng rồi. Nhìn chung phòng tập trang bị đầy đủ, rộng rãi và sạch sẽ. Huấn luyện viên thân thiện, đặc biệt bạn Phương tư vấn rất có tâm, vui vẻ và nhiệt tình.',
    textEn: "I've been working out here for 4 months now. Overall, the gym is well-equipped, spacious, and clean. The personal trainers are friendly, and especially Ms. Phuong is very dedicated, cheerful, and supportive.",
    timeVi: '4 tháng trước',
    timeEn: '4 months ago'
  },
  {
    authorName: 'Lăng Nguyễn Đức Đinh',
    rating: 5,
    textVi: 'Phòng tập rất ổn, không gian sạch sẽ, máy móc đầy đủ từ giàn tạ tự do đến máy cardio. Huấn luyện viên nhiệt tình, hỗ trợ chỉnh sửa kỹ thuật động tác tỉ mỉ. Đáng để gắn bó lâu dài rèn luyện sức khỏe.',
    textEn: 'The gym is great, the space is clean, and the equipment is complete, from the weight racks to the cardio machines, everything is good. The trainers are enthusiastic, guiding form thoroughly. Definitely a place worth sticking with long-term.',
    timeVi: '4 tháng trước',
    timeEn: '4 months ago'
  },
  {
    authorName: 'Hiếu Trương Trọng',
    rating: 5,
    textVi: 'Phòng tập sạch sẽ, nhân viên rất thân thiện, tạo thêm nhiều động lực để đến tập luyện mỗi ngày.',
    textEn: 'The gym is clean, and the staff are very friendly, which enhances the motivation to work out.',
    timeVi: '1 tháng trước',
    timeEn: 'a month ago'
  },
  {
    authorName: 'Alex Nguyễn',
    rating: 5,
    textVi: 'Phòng tập rộng rãi, máy lạnh mát mẻ, có đầy đủ trang thiết bị tập Boxing. Các bạn HLV chuyên môn cao.',
    textEn: 'The gym is spacious and air-conditioned, with full boxing equipment. The personal trainers are highly qualified.',
    timeVi: '4 tháng trước',
    timeEn: '4 months ago'
  },
  {
    authorName: 'Phương Anh Hoàng',
    rating: 5,
    textVi: 'Không gian tập đẹp, mình đăng ký gói 12 tháng luôn, bạn Phương tư vấn rất dễ thương và hỗ trợ nhiệt tình.',
    textEn: 'The space is nice, I signed up for a 12-month package, Ms. Phuong was lovely and provided enthusiastic support.',
    timeVi: '3 tháng trước',
    timeEn: '3 months ago'
  }
];

// Dictionary of verified Facebook Reviews mapped bi-directionally
export const FACEBOOK_REVIEWS_BILINGUAL: FacebookReviewItem[] = [
  {
    author: 'Ngan Pham',
    textVi: 'PT Thái quá tuyệt vời! Tập ở đây rất hiệu quả nha mn',
    textEn: 'Coach Thai is absolutely fantastic! Training here is super effective, highly recommend to everyone!',
    dateVi: '2 Tháng 4, 2025',
    dateEn: 'April 2, 2025'
  },
  {
    author: 'Hoàng Phúc Lê',
    textVi: 'Phòng tập thoáng mát, rộng rãi, tập luyện thoải mái và vui',
    textEn: 'Spacious, well-ventilated gym, workouts feel comfortable and energetic!',
    dateVi: '2 Tháng 10, 2024',
    dateEn: 'October 2, 2024'
  },
  {
    author: 'Đặng Quang',
    textVi: 'Phòng tập sạch sẽ thoáng mát, đội ngũ HLV nhiệt tình',
    textEn: 'Super clean and airy gym, the coaching team is enthusiastic and dedicated!',
    dateVi: '2 Tháng 10, 2024',
    dateEn: 'October 2, 2024'
  },
  {
    author: 'Lê Tuyết Nhi',
    textVi: 'Phòng tập có rất nhiều các bạn nữ như mình, nhiều khi đi ngay ngày nam tập nhiều tưởng bị bơ vơ hihi',
    textEn: 'Lots of female members like me, friendly vibe and no feeling awkward even during busy gym hours haha',
    dateVi: '2 Tháng 10, 2024',
    dateEn: 'October 2, 2024'
  },
  {
    author: 'Lê Minh',
    textVi: 'Nhân viên thân thiện, trải nghiệm tập luyện rất tốt',
    textEn: 'Friendly staff and wonderful overall training experience!',
    dateVi: '11 Tháng 7, 2024',
    dateEn: 'July 11, 2024'
  }
];

// Helper to translate Google Review text based on language
export function getGoogleReviewText(rev: any, lang: 'vi' | 'en'): string {
  if (!rev) return '';

  // 1. If review already has explicit bilingual properties
  if (lang === 'vi' && rev.textVi) return rev.textVi;
  if (lang === 'en' && rev.textEn) return rev.textEn;

  // 2. Search matched entry by author
  const match = GOOGLE_REVIEWS_BILINGUAL.find(
    b => b.authorName.toLowerCase() === (rev.authorName || rev.author || '').toLowerCase()
  );
  if (match) {
    return lang === 'vi' ? match.textVi : match.textEn;
  }

  // 3. Fallback translation of common phrases
  const raw = rev.text || '';
  if (lang === 'vi') {
    if (/clean gym/i.test(raw)) return 'Phòng tập sạch sẽ, máy móc tốt';
    if (/good/i.test(raw) && raw.length < 10) return 'Tốt, chất lượng ổn định';
    if (/ok/i.test(raw) && raw.length < 5) return 'Phòng tập ổn áp, hài lòng';
    if (/ifbb pro/i.test(raw)) return 'Chuẩn phong cách VĐV IFBB Pro';
    return rev.textVi || raw;
  } else {
    return rev.textEn || raw;
  }
}

// Helper to translate Google Review relative time
export function getGoogleReviewTime(timeStr: string | undefined, lang: 'vi' | 'en'): string {
  if (!timeStr) return lang === 'vi' ? 'Hội viên đã xác thực' : 'Verified Member';
  
  if (lang === 'en') {
    return timeStr
      .replace(/tháng trước/gi, 'months ago')
      .replace(/1 tháng trước/gi, 'a month ago')
      .replace(/năm trước/gi, 'years ago')
      .replace(/1 năm trước/gi, 'a year ago')
      .replace(/tuần trước/gi, 'weeks ago')
      .replace(/1 tuần trước/gi, 'a week ago')
      .replace(/ngày trước/gi, 'days ago')
      .replace(/Đã xác thực/gi, 'Verified Member')
      .replace(/Hội viên đã xác thực/gi, 'Verified Member');
  } else {
    return timeStr
      .replace(/a month ago/gi, '1 tháng trước')
      .replace(/(\d+)\s+months ago/gi, '$1 tháng trước')
      .replace(/a year ago/gi, '1 năm trước')
      .replace(/(\d+)\s+years ago/gi, '$1 năm trước')
      .replace(/a week ago/gi, '1 tuần trước')
      .replace(/(\d+)\s+weeks ago/gi, '$1 tuần trước')
      .replace(/(\d+)\s+days ago/gi, '$1 ngày trước')
      .replace(/Verified Member/gi, 'Hội viên đã xác thực')
      .replace(/Edited a year ago/gi, 'Đã chỉnh sửa 1 năm trước');
  }
}

// Helper to translate Facebook Review text based on language
export function getFacebookReviewText(rev: any, lang: 'vi' | 'en'): string {
  if (!rev) return '';

  if (lang === 'vi' && rev.textVi) return rev.textVi;
  if (lang === 'en' && rev.textEn) return rev.textEn;

  const match = FACEBOOK_REVIEWS_BILINGUAL.find(
    b => b.author.toLowerCase() === (rev.author || '').toLowerCase()
  );
  if (match) {
    return lang === 'vi' ? match.textVi : match.textEn;
  }

  const raw = rev.text || '';
  if (lang === 'en') {
    if (/PT Thái quá tuyệt vời/i.test(raw)) {
      return 'Coach Thai is absolutely fantastic! Training here is super effective, highly recommend!';
    }
    if (/thoáng mát.*rộng rãi/i.test(raw)) {
      return 'Spacious, well-ventilated gym, workouts feel very comfortable and energetic!';
    }
    if (/sạch sẽ.*nhiệt tình/i.test(raw)) {
      return 'Clean and airy gym, the coaching team is very enthusiastic!';
    }
    if (/rất nhiều các bạn nữ/i.test(raw)) {
      return 'Lots of female members like me, very welcoming and fun environment!';
    }
    if (/thân thiện.*trải nghiệm tốt/i.test(raw)) {
      return 'Friendly staff, excellent training experience!';
    }
    return rev.textEn || raw;
  } else {
    return rev.textVi || raw;
  }
}

// Helper for Facebook author display name
export function getFacebookAuthor(author: string | undefined, lang: 'vi' | 'en'): string {
  if (!author || author === 'Hội viên Facebook' || author === 'Facebook Member') {
    return lang === 'vi' ? 'Hội viên Facebook' : 'Facebook Member';
  }
  return author;
}
