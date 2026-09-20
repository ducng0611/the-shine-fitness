import { CustomerRecord } from '../types';

export type PKSegmentCode = 'PK01' | 'PK02' | 'PK03' | 'PK04';

export interface PKSegmentDefinition {
  code: PKSegmentCode;
  title: string;
  personaName: string; // Chân dung đề xuất
  primarySignal: string; // Tín hiệu chính
  description: string;
  demographics: string;
  preferredPackages: string[];
  keyMotivator: string;
  salesPlaybook: string;
  suggestedAction: string;
  colorHex: string;
  badgeBgLight: string;
  badgeBgDark: string;
  borderClass: string;
  iconName: 'MapPin' | 'UserCheck' | 'Users' | 'Zap';
}

export const PK_SEGMENTS_LIST: PKSegmentDefinition[] = [
  {
    code: 'PK01',
    title: 'Phân Khúc PK01',
    personaName: 'Người tập gần nhà, nhạy giá',
    primarySignal: 'Ưu tiên vị trí thuận tiện, chi phí hợp lý, mục tiêu cơ bản.',
    description: 'Khách hàng sống hoặc làm việc trong bán kính < 2km xung quanh 154 Hoàng Hoa Thám (Tân Bình). Ưu tiên tính tiện lợi di chuyển, ngân sách tối ưu và nhu cầu duy trì vóc dáng / sức khỏe cơ bản.',
    demographics: 'Dân văn phòng Tân Bình, cư dân căn hộ & nhà phố lân cận',
    preferredPackages: ['Gói 1 Tháng Khuyến Mãi (349k)', 'Gói 3 Tháng Tiện Lợi'],
    keyMotivator: 'Giá tốt, không chi phí ẩn, gửi xe miễn phí & đi lại chỉ 5 phút',
    salesPlaybook: 'Minh bạch báo giá 1 trang, retargeting theo bán kính 2km, tặng vé tập thử 3 ngày trải nghiệm giờ tan làm.',
    suggestedAction: 'Gửi Zalo OA ưu đãi vé tập thử 3 ngày + Mã giảm 10% khi đăng ký trong 48h.',
    colorHex: '#FF7A1A',
    badgeBgLight: 'bg-orange-50 text-orange-700 border-orange-200',
    badgeBgDark: 'dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20',
    borderClass: 'border-orange-500',
    iconName: 'MapPin'
  },
  {
    code: 'PK02',
    title: 'Phân Khúc PK02',
    personaName: 'Người mới cần được kèm',
    primarySignal: 'Chưa có kinh nghiệm, cần hướng dẫn và hỗ trợ HLV/PT.',
    description: 'Khách mới bắt đầu tập gym hoặc từng bỏ dở vì không biết dùng máy, sợ chấn thương. Cần số liệu đo InBody cụ thể và sự đồng hành, động lực từ HLV cá nhân (PT).',
    demographics: 'Người thừa cân, nhân viên IT/kinh doanh ít vận động, người mới tập gym từ số 0',
    preferredPackages: ['Gói PT 12 Tuần Transformation', 'Gói PT Kèm 1-1 Giảm Cân / Siết Cơ'],
    keyMotivator: 'Cam kết bằng chỉ số InBody (giảm 5-10kg mỡ), HLV sửa tư thế từng buổi',
    salesPlaybook: 'Buổi đo InBody 0đ, phân tích chỉ số mỡ nội tạng & cơ xương, tặng 3 buổi tập kèm trải nghiệm thực tế.',
    suggestedAction: 'Đặt hẹn tư vấn 1-1 với HLV chuyên môn & gửi lộ trình tập 90 ngày cá nhân hóa.',
    colorHex: '#FFB05C',
    badgeBgLight: 'bg-amber-50 text-amber-700 border-amber-200',
    badgeBgDark: 'dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    borderClass: 'border-amber-500',
    iconName: 'UserCheck'
  },
  {
    code: 'PK03',
    title: 'Phân Khúc PK03',
    personaName: 'Học viên lớp nhóm',
    primarySignal: 'Quan tâm Yoga/Boxing, lịch cố định và khung giờ.',
    description: 'Học viên yêu thích không gian tập luyện cộng đồng, tập trung vào bộ môn Yoga phục hồi, Boxing hoặc Group X. Cần khung giờ cố định và sự thông cảm linh hoạt lịch trình.',
    demographics: 'Phụ nữ sau sinh, giáo viên, nhân viên văn phòng yêu thích Yoga & Boxing',
    preferredPackages: ['Gói Yoga Pass Chuyên Sâu', 'Gói Combo Group X & Boxing'],
    keyMotivator: 'Lớp học không gian ấm cúng, HLV tận tâm, cộng đồng tập luyện tích cực',
    salesPlaybook: 'Cung cấp lịch lớp cố định theo tuần, chính sách dời buổi báo trước 2h không phạt, ưu đãi nhóm bạn bẻ khóa giá.',
    suggestedAction: 'Gửi lịch học Yoga/Boxing tuần mới & vé trải nghiệm lớp nhóm miễn phí.',
    colorHex: '#7AC88F',
    badgeBgLight: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    badgeBgDark: 'dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    borderClass: 'border-emerald-500',
    iconName: 'Users'
  },
  {
    code: 'PK04',
    title: 'Phân Khúc PK04',
    personaName: 'Khách tập nâng cao/linh hoạt',
    primarySignal: 'Có kinh nghiệm, quan tâm chất lượng, tiện ích và tính linh hoạt.',
    description: 'Hội viên đã có kinh nghiệm tập luyện lâu năm, tự lên giáo án cá nhân. Yêu cầu cao về chất lượng máy tạ Life Fitness, khu vực xông hơi thảo dược, locker VIP và thời gian check-in tự do.',
    demographics: 'Gymmer lâu năm, doanh nhân, quản lý cao cấp yêu cầu dịch vụ tiêu chuẩn cao',
    preferredPackages: ['Gói VIP All-Inclusive 12–24 Tháng', 'Gói Unlimited Freedom Pass'],
    keyMotivator: 'Máy móc hiện đại, phòng tập rộng thoáng, tiện ích xông hơi & locker riêng biệt',
    salesPlaybook: 'Trải nghiệm máy Life Fitness cao cấp, trải nghiệm dịch vụ xông hơi thảo dược, đặc quyền VIP không giới hạn giờ.',
    suggestedAction: 'Mời trải nghiệm gói VIP All-Inclusive & ưu đãi gia hạn dài hạn bảo lưu đặc quyền.',
    colorHex: '#3B82F6',
    badgeBgLight: 'bg-blue-50 text-blue-700 border-blue-200',
    badgeBgDark: 'dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
    borderClass: 'border-blue-500',
    iconName: 'Zap'
  }
];

/**
 * Auto-assign or retrieve PK Segment for a customer
 */
export function getCustomerPKSegment(c: CustomerRecord): PKSegmentCode {
  if (c.pkSegment && ['PK01', 'PK02', 'PK03', 'PK04'].includes(c.pkSegment)) {
    return c.pkSegment;
  }

  const text = `${c.trainingGoal || ''} ${c.extraServices || ''} ${c.packageInterested || ''} ${c.packageCode || ''} ${c.notes || ''} ${c.matchedPersona || ''}`.toLowerCase();

  // PK03: Lớp nhóm (Yoga, Boxing, Group X)
  if (text.includes('yoga') || text.includes('boxing') || text.includes('group') || text.includes('nhóm') || c.matchedPersona === 'huong') {
    return 'PK03';
  }

  // PK02: Cần được kèm HLV/PT, giảm cân, người mới
  if ((c.ptSessions && c.ptSessions > 0) || text.includes('pt') || text.includes('kèm') || text.includes('giảm cân') || text.includes('mới') || c.matchedPersona === 'tuan') {
    return 'PK02';
  }

  // PK04: Nâng cao / linh hoạt, VIP, 12T, 24T, 48T
  if (text.includes('vip') || text.includes('24t') || text.includes('48t') || text.includes('nâng cao') || (c.checkinCount && c.checkinCount > 30)) {
    return 'PK04';
  }

  // PK01: Gần nhà, nhạy giá, cơ bản
  return 'PK01';
}
