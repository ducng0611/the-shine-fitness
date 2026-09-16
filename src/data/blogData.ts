import { BlogPost } from '../types';

export const initialBlogPosts: BlogPost[] = [
  {
    id: 'blog-1',
    title: 'Chế độ ăn High-Protein chuẩn khoa học cho người tập Gym & Yoga tăng cơ giảm mỡ',
    excerpt: 'Tìm hiểu tỷ lệ phân bổ đạm (protein), tinh bột phức và chất béo tốt theo từng bữa ăn trong ngày giúp tối ưu hóa phục hồi cơ bắp.',
    category: 'Dinh Dưỡng',
    readTime: '5 phút đọc',
    publishedAt: '14/09/2026',
    author: {
      name: 'HLV Tuấn Anh',
      role: 'Chuyên gia Dinh dưỡng Thể hình The Shine',
      avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=150&q=80'
    },
    imageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80',
    tags: ['Protein', 'Dinh Dưỡng Gym', 'Tăng Cơ', 'Thực Đơn'],
    source: 'The Shine Fitness Editorial',
    content: [
      'Protein là viên gạch nền móng xây dựng các mô cơ bắp sau những giờ tập luyện với cường độ cao tại phòng gym. Tuy nhiên, việc bổ sung đạm cần tuân thủ nguyên tắc khoa học về liều lượng và thời điểm hấp thụ.',
      '1. Liều lượng khuyến nghị: Người tập gym vận động cường độ vừa đến cao nên nạp từ 1.6g - 2.2g protein trên mỗi kg trọng lượng cơ thể mỗi ngày.',
      '2. Thời điểm vàng: Không cần phải uống whey ngay trong vòng 5 phút sau tập, mà hãy đảm bảo dàn đều lượng protein qua 3-4 bữa ăn chính và phụ trong ngày, cách nhau 3-4 tiếng.',
      '3. Nguồn thực phẩm ưu tiên: Ức gà bỏ da, thịt bò nạc, cá hồi, trứng gà, đậu phụ, sữa chua Hy Lạp và các loại hạt hạnh nhân, hạt chia.',
      '4. Đừng quên nước và chất xơ: Bổ sung nhiều đạm đòi hỏi gan và thận làm việc tích cực hơn. Hãy uống đủ ít nhất 2.5 - 3 lít nước mỗi ngày kèm rau xanh lá đậm.'
    ]
  },
  {
    id: 'blog-2',
    title: '5 sai lầm phổ biến khi tập Squat & Deadlift gây đau lưng và cách khắc phục',
    excerpt: 'Hướng dẫn chuẩn xác kỹ thuật siết bụng (Bracing), vị trí đặt chân và chuyển động bản lề hông (Hip Hinge) an toàn cho cột sống.',
    category: 'Tập Luyện',
    readTime: '6 phút đọc',
    publishedAt: '12/09/2026',
    author: {
      name: 'Master Trainer Alex',
      role: 'Head Coach The Shine Fitness',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
    },
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    tags: ['Squat', 'Deadlift', 'Kỹ Thuật Chuẩn', 'Phòng Ngừa Chấn Thương'],
    source: 'The Shine Coaching Team',
    content: [
      'Squat và Deadlift là hai bài tập tổng hợp (Compound) tuyệt vời nhất giúp kích thích cơ đùi, mông và nhóm cơ lõi. Thế nhưng việc sai tư thế rất dễ tạo áp lực tiêu cực lên đĩa đệm cột sống thắt lưng.',
      'Sai lầm 1: Cong lưng dưới (Butt Wink hoặc Rounding Back). Khắc phục: Không cố hạ quá sâu nếu độ linh hoạt cổ chân và khớp hông chưa đủ; duy trì đường cong sinh lý tự nhiên của cột sống.',
      'Sai lầm 2: Thiếu kỹ thuật thở siết bụng (Valsalva Maneuver / Bracing). Khắc phục: Hít sâu bằng cơ hoành, nén khí vào khoang bụng như một chiếc đai bảo vệ tự nhiên trước khi hạ tạ.',
      'Sai lầm 3: Đầu gối bị chụm vào trong (Knee Valgus). Khắc phục: Xoay nhẹ mũi chân ra ngoài 15-30 độ, luôn chủ động mở gối hướng theo mũi chân khi ngồi xổm.',
      'Lời khuyên từ HLV: Hãy hạ mức tạ xuống để làm chủ chuyển động trước khi tăng tải trọng (Progressive Overload).'
    ]
  },
  {
    id: 'blog-3',
    title: 'Tối ưu hóa vùng nhịp tim (Zone 2) để đốt cháy mỡ thừa và nâng cao sức bền tim mạch',
    excerpt: 'Tại sao chạy nhanh hụt hơi lại không đốt nhiều mỡ bằng việc duy trì nhịp tim Zone 2 ổn định trên máy chạy bộ hay đạp xe?',
    category: 'Giảm Cân',
    readTime: '4 phút đọc',
    publishedAt: '10/09/2026',
    author: {
      name: 'HLV Lan Hương',
      role: 'Chuyên viên GroupX & Cardio',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80'
    },
    imageUrl: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=800&q=80',
    tags: ['Cardio', 'Zone 2', 'Đốt Mỡ Thừa', 'Tim Mạch'],
    source: 'Sports Science Daily',
    content: [
      'Nhiều người lầm tưởng tập luyện càng thở dốc, càng kiệt sức thì mỡ thừa tiêu hao càng nhiều. Nhưng khoa học thể thao chứng minh vùng Zone 2 mới là môi trường lý tưởng nhất để ty thể sử dụng axit béo làm nguồn nhiên liệu chính.',
      '1. Zone 2 là gì? Đó là mức nhịp tim dao động từ 60% - 70% nhịp tim tối đa (Max Heart Rate = 220 - Tuổi).',
      '2. Dấu hiệu nhận biết: Bạn vẫn có thể nói chuyện thành câu hoàn chỉnh nhưng không thể hát, hơi thở có nhịp điệu đều đặn.',
      '3. Thời lượng tối ưu: 35 đến 45 phút mỗi buổi, từ 2 đến 3 buổi mỗi tuần trên máy chạy dốc nhẹ, máy chèo thuyền hoặc đạp xe tại The Shine.',
      '4. Lợi ích kép: Vừa tiêu hao mỡ tạng cứng đầu, vừa tăng sinh mật độ ty thể giúp cơ thể bền bỉ hơn trong công việc hàng ngày.'
    ]
  },
  {
    id: 'blog-4',
    title: 'Lợi ích của Yin Yoga và giãn cơ sâu đối với việc phục hồi cơ sau buổi tập tạ',
    excerpt: 'Khám phá cách thức giữ thế tĩnh từ 3-5 phút giúp tái tạo màng cơ (fascia), giải phóng axit lactic và giúp giấc ngủ sâu hơn.',
    category: 'Yoga & Sức Khỏe',
    readTime: '5 phút đọc',
    publishedAt: '08/09/2026',
    author: {
      name: 'Yogi Mai Chi',
      role: 'Master Yoga Teacher 500H RYT',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80'
    },
    imageUrl: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=800&q=80',
    tags: ['Yin Yoga', 'Giãn Cơ', 'Phục Hồi', 'Giảm Căng Thẳng'],
    source: 'Yoga Wellness International',
    content: [
      'Sau những buổi nâng tạ nặng, các sợi cơ li ti bị tổn thương và tạo ra các nút thắt cơ (knots). Nếu không được giãn cơ đúng cách, biên độ chuyển động (ROM) sẽ bị thu hẹp đáng kể.',
      'Yin Yoga tác động sâu vào các mô liên kết dày đặc như dây chằng, khớp xương và lớp màng cơ (fascia) bao bọc quanh cơ bắp.',
      'Bằng cách giữ tư thế thụ động từ 3-5 phút trong trạng thái thư giãn hoàn toàn, cơ thể kích hoạt hệ thần kinh phó giao cảm (Parasympathetic), giúp hạ hormone cortisol và cải thiện lưu thông máu đến các cơ mỏi.',
      'Các lớp Yin Yoga vào buổi tối tại The Shine là sự kết hợp hoàn hảo để cân bằng lại năng lượng sau những giờ tập gym bùng nổ.'
    ]
  }
];

export const mockCrawledFeed: BlogPost[] = [
  {
    id: 'blog-5',
    title: 'Nước ép cần tây và detox: Sự thật khoa học hay trào lưu quảng cáo?',
    excerpt: 'Phân tích từ góc độ y khoa về khả năng tự thải độc của gan thận và cách bổ sung rau củ đúng cách nhất.',
    category: 'Dinh Dưỡng',
    readTime: '4 phút đọc',
    publishedAt: 'Hôm nay',
    author: {
      name: 'Bác sĩ Thể Thao Minh Nhật',
      role: 'Cố vấn Y học Thể thao',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
    },
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    tags: ['Detox', 'Khoa Học', 'Dinh Dưỡng'],
    source: 'Healthline & ACSM',
    content: [
      'Cần tây giàu chất xơ, vitamin K và kali, nhưng không có phép màu nào biến một ly nước ép thành cỗ máy đốt mỡ tức thì.',
      'Cơ thể con người đã có hệ thống giải độc hoàn hảo gồm gan, thận, phổi và da. Cách tốt nhất để detox là uống đủ 2-3 lít nước lọc, ngủ đủ 7-8 tiếng và ăn chế độ giàu chất xơ từ rau củ tươi nguyên trái.'
    ]
  },
  {
    id: 'blog-6',
    title: 'Bí quyết tăng cơ bắp vượt trội cho người gầy khó tăng cân (Hardgainer)',
    excerpt: 'Cách bổ sung calo thặng dư thông minh và chiến lược tập trung vào các bài tập đa khớp nặng.',
    category: 'Tập Luyện',
    readTime: '6 phút đọc',
    publishedAt: 'Hôm qua',
    author: {
      name: 'HLV Tuấn Anh',
      role: 'Chuyên gia Thể hình The Shine',
      avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=150&q=80'
    },
    imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80',
    tags: ['Tăng Cân', 'Hardgainer', 'Tăng Cơ', 'Calo Thặng Dư'],
    source: 'Men’s Health Fitness',
    content: [
      'Đối với tạng người Ectomorph (khó tăng cân), việc chỉ ăn nhiều cơm không mang lại cơ bắp mà dễ gây mỡ bụng. Bạn cần tăng từ 300 - 500 kcal thặng dư mỗi ngày từ các nguồn thực phẩm đậm đặc calo lành mạnh như bơ đậu phộng, dầu ô liu, yến mạch và các loại hạt.',
      'Hãy ưu tiên các bài tập Bench Press, Squat, Overhead Press với số rep từ 6-10 và thời gian nghỉ giữa hiệp đủ 2-3 phút.'
    ]
  }
];
