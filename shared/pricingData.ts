/**
 * Single Source of Truth for The Shine Fitness & Yoga Pricing, Hours & Contact Information
 * Shared across client and server.
 */

export interface GymPackagePricing {
  id: string;
  name: string;
  shortName: string;
  originalPrice: number;
  discountPrice: number;
  originalPriceFormatted: string;
  discountPriceFormatted: string;
  originalPriceShort: string;
  discountPriceShort: string;
  description: string;
  badge?: string;
  features: string[];
}

export const PRICING = {
  basic: {
    id: 'gym_boxing',
    name: 'Gói Bứt Phá Năng Lượng (Gym & Boxing)',
    shortName: 'Gói Gym & Boxing',
    originalPrice: 549000,
    discountPrice: 349000,
    originalPriceFormatted: '549.000đ',
    discountPriceFormatted: '349.000đ',
    originalPriceShort: '549k',
    discountPriceShort: '349k',
    description: 'Áp dụng trọn vẹn cho cả 2 bộ môn Gym & Boxing, hỗ trợ HLV 1:1 ban đầu.',
    badge: 'Tiết kiệm 36%',
    features: [
      'Áp dụng trọn vẹn cho cả 2 bộ môn Gym & Boxing',
      'HLV hỗ trợ 1:1 kỹ thuật và set up máy trong những ngày đầu',
      'Hỗ trợ xuyên suốt kỹ thuật tập luyện và cách dùng máy',
      'Tặng 7 ngày tập thử miễn phí trải nghiệm toàn bộ tiện ích',
      'Đóng theo tháng linh hoạt (lấy 349k × số tháng mong muốn)'
    ]
  },
  premium: {
    id: 'yoga_special',
    name: 'Gói Thân Tâm An Lạc (Yoga Chuyên Sâu)',
    shortName: 'Gói Yoga Chuyên Sâu',
    originalPrice: 700000,
    discountPrice: 549000,
    originalPriceFormatted: '700.000đ',
    discountPriceFormatted: '549.000đ',
    originalPriceShort: '700k',
    discountPriceShort: '549k',
    description: 'Tham gia các lớp Yoga chuyên sâu theo lịch tập hàng tuần.',
    badge: 'Tiết kiệm 21%',
    features: [
      'Tham gia các lớp Yoga chuyên sâu theo lịch tập hàng tuần',
      'Giáo viên hướng dẫn tận tâm, chỉnh sửa tư thế chu đáo',
      'Đóng tiền theo từng tháng tự do, không bắt buộc hợp đồng dài hạn',
      'Phòng studio Yoga thoáng mát, thảm tập và đạo cụ đầy đủ',
      'Tủ đồ locker an toàn, phòng tắm nóng lạnh & gửi xe miễn phí'
    ]
  },
  vip: {
    id: 'all_in_one',
    name: 'Gói Đỉnh Cao Thể Lực (All-In-One Yoga & Gym)',
    shortName: 'Gói All-In-One Yoga & Gym',
    originalPrice: 950000,
    discountPrice: 699000,
    originalPriceFormatted: '950.000đ',
    discountPriceFormatted: '699.000đ',
    originalPriceShort: '950k',
    discountPriceShort: '699k',
    description: 'Không giới hạn Yoga, Gym & Boxing, tặng 02 buổi tập riêng 1:1 cùng PT.',
    badge: 'Tiết kiệm 26%',
    features: [
      'Không giới hạn các lớp Yoga theo khung giờ cùng Master Yoga',
      'Toàn bộ quyền lợi tập Gym & Boxing không giới hạn khung giờ',
      'Tặng 02 buổi tập riêng 1:1 cùng Huấn luyện viên cá nhân (PT)',
      'Giảm thêm 20% khi xuất trình thẻ Học sinh - Sinh viên (HSSV)',
      'Hỗ trợ trả góp 0% lãi suất qua thẻ tín dụng'
    ]
  },
  dayPass: {
    id: 'day_pass',
    name: 'Vé Ngày Day Pass',
    shortName: 'Day Pass',
    price: 100000,
    priceFormatted: '100.000đ',
    priceShort: '100k',
    description: '100.000đ/ngày - Trải nghiệm Gym, Boxing, locker, phòng tắm nóng lạnh.'
  },
  discounts: {
    studentDiscountPercent: 20,
    studentDiscountDescription: 'Giảm thêm 20% cho Học sinh - Sinh viên khi xuất trình thẻ HSSV.',
    installment: 'Hỗ trợ trả góp 0% qua thẻ tín dụng.'
  }
};

export const OPENING_HOURS = {
  weekdays: '06:00 – 21:00 (Thứ 2 đến Thứ 7)',
  sunday: '06:00 – 20:30 (Chủ Nhật)',
  fullTextVi: '06:00 – 21:00 từ Thứ 2 đến Thứ 7, riêng Chủ Nhật mở cửa từ 06:00 – 20:30.',
  fullTextEn: '06:00 AM – 09:00 PM Monday through Saturday, and 06:00 AM – 08:30 PM on Sundays.'
};

export const ADDRESS = '154 Hoàng Hoa Thám, Phường Bảy Hiền (Phường 12 cũ), Quận Tân Bình, TP. Hồ Chí Minh';
export const HOTLINE = '0946 293 593';
