import { CustomerRecord, JourneyStage, CustomerPersona } from '../types';

export interface TouchpointItem {
  n: number;
  label: string;
  stage: JourneyStage;
  stageName: string;
  stageIndex: number;
  channel: 'Owned' | 'Shared' | 'Earned' | 'Paid';
  emoDefault: number; // -2 to +2
  emoMinh: number;
  emoTuan: number;
  emoHuong: number;
  description: string;
  painPoint: string;
  solution: string;
  isMoT?: boolean;
  motLabel?: string;
}

export interface StageMeta {
  id: JourneyStage;
  key: 'A' | 'C' | 'C' | 'S' | 'R';
  title: string;
  titleVi: string;
  stepNum: string;
  color: string;
  bgLight: string;
  bgDark: string;
  borderClass: string;
  description: string;
  touchpointNumbers: number[];
  mainPainPoint: string;
  strategicOpportunity: string;
  conversionGoal: string;
}

export interface PersonaProfile {
  id: CustomerPersona;
  name: string;
  age: number;
  role: string;
  badge: string;
  color: string;
  colorHex: string;
  avatarLetter: string;
  quote: string;
  context: string;
  story: string;
  timeline: { when: string; text: string }[];
  goals: string[];
  painPoints: string[];
  expectations: string[];
  preferredChannels: string[];
  budgetRange: string;
  recommendedPackage: string;
  preferredWorkoutTime: string;
  workoutPlan: { phase: string; detail: string }[];
}

export const JOURNEY_STAGES: StageMeta[] = [
  {
    id: 'awareness',
    key: 'A',
    title: 'Awareness',
    titleVi: 'Nhận Thức',
    stepNum: 'Giai đoạn 1 / 5',
    color: '#FF7A1A',
    bgLight: 'bg-orange-50 text-orange-600 border-orange-200',
    bgDark: 'dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20',
    borderClass: 'border-orange-500',
    description: 'Khách hàng tiếp cận thương hiệu qua quảng cáo mạng xã hội hoặc nhìn thấy bảng hiệu 154 Hoàng Hoa Thám.',
    touchpointNumbers: [1, 2],
    mainPainPoint: 'Nghi ngờ chi phí ẩn, "giá mồi" khi quảng cáo 299K/tháng không nêu rõ điều kiện.',
    strategicOpportunity: 'Minh bạch giá, nhắm quảng cáo theo bán kính di chuyển giờ tan làm, retarget người tương tác.',
    conversionGoal: 'Tăng lượng Lead đăng ký nhận vé tập thử 3 ngày & đo InBody 0đ.'
  },
  {
    id: 'consideration',
    key: 'C',
    title: 'Consideration',
    titleVi: 'Suy Xét',
    stepNum: 'Giai đoạn 2 / 5',
    color: '#FFB05C',
    bgLight: 'bg-amber-50 text-amber-600 border-amber-200',
    bgDark: 'dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    borderClass: 'border-amber-500',
    description: 'Đọc review Google Maps 5.0★/199, so sánh với S\'Life 126 HHT & Bluesky, nhắn tin hỏi lịch hoặc đặt hẹn đo InBody.',
    touchpointNumbers: [3, 4, 5],
    mainPainPoint: 'Phản hồi inbox chậm ngoài giờ hành chính; sốc chỉ số mỡ nội tạng khi đo InBody nếu không được giải thích.',
    strategicOpportunity: 'Chatbot tư vấn 24/7, SLA < 15 phút giờ mở cửa; HLV diễn giải InBody thành lộ trình 90 ngày rõ ràng.',
    conversionGoal: 'Tỷ lệ khách đến tập thử & đo InBody đạt trên 65% tổng Lead.'
  },
  {
    id: 'conversion',
    key: 'C',
    title: 'Conversion',
    titleVi: 'Chuyển Đổi',
    stepNum: 'Giai đoạn 3 / 5',
    color: '#E4573D',
    bgLight: 'bg-rose-50 text-rose-600 border-rose-200',
    bgDark: 'dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
    borderClass: 'border-rose-500',
    description: 'Bàn tư vấn: Báo giá, tư vấn theo mục tiêu, chọn gói tập (1 tháng / PT / 12 tháng), ký hợp đồng & thanh toán.',
    touchpointNumbers: [6],
    mainPainPoint: 'Áp lực bàn chốt sale, sợ bị ép mua gói dài hạn hoặc PT đắt đỏ, điều khoản bảo lưu mập mờ.',
    strategicOpportunity: 'Bảng giá 1 trang chuẩn hóa, cam kết "không phí ẩn", giữ ưu đãi 48h suy nghĩ, cung cấp gói thử nghiệm ngắn.',
    conversionGoal: 'Tỷ lệ chốt gói sau buổi tập thử đạt > 40%.'
  },
  {
    id: 'service',
    key: 'S',
    title: 'Service',
    titleVi: 'Chăm Sóc & Trải Nghiệm',
    stepNum: 'Giai đoạn 4 / 5',
    color: '#7AC88F',
    bgLight: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    bgDark: 'dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    borderClass: 'border-emerald-500',
    description: 'Hội viên bước vào 30 ngày tập đầu tiên: Buổi tập định hướng, lịch lớp Yoga/Boxing, vượt qua tuần 3-4 chững cân.',
    touchpointNumbers: [7, 8, 9, 10],
    mainPainPoint: 'Quá tải giờ cao điểm 18h–20h (khu tạ kẹt); tuần 3-4 mất lửa và chững cân dẫn đến nguy cơ ngủ đông.',
    strategicOpportunity: 'Thông báo mật độ từng khu thời gian thực qua Zalo; kịch bản Onboarding 4 tuần và check-in cuối tuần.',
    conversionGoal: 'Giảm tỷ lệ hội viên ngủ đông (0 buổi / 14 ngày) xuống dưới 12%.'
  },
  {
    id: 'retention',
    key: 'R',
    title: 'Retention',
    titleVi: 'Giữ Chân & Giới Thiệu',
    stepNum: 'Giai đoạn 5 / 5',
    color: '#38BDF8',
    bgLight: 'bg-sky-50 text-sky-600 border-sky-200',
    bgDark: 'dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20',
    borderClass: 'border-sky-500',
    description: 'Đo lại chỉ số InBody sau 60–90 ngày, vinh danh kết quả tiến bộ, gia hạn hợp đồng và biến hội viên thành đại sứ.',
    touchpointNumbers: [11, 12],
    mainPainPoint: 'Không ai chủ động nhắc đo lại InBody; nhắc gia hạn bị động sát ngày như "đòi tiền".',
    strategicOpportunity: 'Nghi thức đo InBody định kỳ kèm báo cáo tiến bộ trước-sau; ưu đãi gia hạn sớm 30 ngày + tặng quà giới thiệu bạn.',
    conversionGoal: 'Tỷ lệ gia hạn hợp đồng kỳ đầu đạt > 60%; 25% hội viên mới đến từ giới thiệu.'
  }
];

export const TOUCHPOINTS_LIST: TouchpointItem[] = [
  {
    n: 1,
    label: 'Quảng cáo FB/TikTok "299K/tháng"',
    stage: 'awareness',
    stageName: 'Awareness',
    stageIndex: 0,
    channel: 'Paid',
    emoDefault: 1.0,
    emoMinh: 1.0,
    emoTuan: 0.6,
    emoHuong: 0.8,
    description: 'Thấy quảng cáo video/ảnh cơ sở vật chất phòng gym với mức giá ưu đãi đầu phễu 299k/tháng.',
    painPoint: 'Nghi ngờ quảng cáo "giá mồi", chi phí phát sinh hoặc địa chỉ không thuận đường.',
    solution: 'Nêu rõ vị trí 154 Hoàng Hoa Thám, bảng giá trọn gói không phụ phí, tặng vé tập thử 3 ngày.'
  },
  {
    n: 2,
    label: 'Đi ngang bảng hiệu 154 Hoàng Hoa Thám',
    stage: 'awareness',
    stageName: 'Awareness',
    stageIndex: 0,
    channel: 'Owned',
    emoDefault: 0.5,
    emoMinh: 0.6,
    emoTuan: 0.3,
    emoHuong: 0.4,
    description: 'Đi ngang qua mặt tiền nổi bật với tông màu đen - cam, nhận diện hiện đại tại Tân Bình.',
    painPoint: 'Mặt bằng trông hiện đại có thể làm khách ngại giá đắt hoặc chưa biết gửi xe ở đâu.',
    solution: 'Biển hiệu chỉ dẫn rõ giữ xe miễn phí, số hotline Zalo tư vấn nhanh, QR code đăng ký tập thử.'
  },
  {
    n: 3,
    label: 'Đọc review Google & chờ phản hồi inbox',
    stage: 'consideration',
    stageName: 'Consideration',
    stageIndex: 1,
    channel: 'Earned',
    emoDefault: -0.8,
    emoMinh: -1.4,
    emoTuan: -0.5,
    emoHuong: -0.6,
    description: 'So sánh review 4.9★/199 của The Shine với đối thủ S\'Life (4.1★) cùng đường; nhắn tin hỏi giá.',
    painPoint: 'Phản hồi tin nhắn chậm ngoài giờ hành chính khiến khách sốt ruột và tìm sang đối thủ cạnh tranh.',
    solution: 'Chatbot AI trực 24/7 trả lời báo giá ngay và đặt lịch tập thử tức thì, SLA nhân viên < 15 phút.'
  },
  {
    n: 4,
    label: 'Buổi tập thử trải nghiệm thực tế',
    stage: 'consideration',
    stageName: 'Consideration',
    stageIndex: 1,
    channel: 'Owned',
    emoDefault: 1.5,
    emoMinh: 1.3,
    emoTuan: 1.2,
    emoHuong: 1.2,
    description: 'Khách đến phòng tập trải nghiệm máy Life Fitness, studio Yoga, xông hơi và dịch vụ tiện ích.',
    painPoint: 'Cảm giác bỡ ngỡ "gymtimidation", sợ không biết dùng máy hoặc bị phán xét hình thể.',
    solution: 'Kịch bản đón tiếp theo persona: Tour 10 phút, HLV hướng dẫn kỹ thuật cơ bản, không khí thân thiện.'
  },
  {
    n: 5,
    label: 'Đo InBody miễn phí & tư vấn chỉ số',
    stage: 'consideration',
    stageName: 'Consideration',
    stageIndex: 1,
    channel: 'Owned',
    emoDefault: 2.0,
    emoMinh: 1.6,
    emoTuan: 2.0,
    emoHuong: 1.0,
    description: 'Kiểm tra tỷ lệ mỡ, cơ xương, mỡ nội tạng trên máy InBody 270 chuyên dụng.',
    painPoint: 'Khách hàng có thể bị sốc tâm lý nếu chỉ số xấu mà không có người động viên định hướng.',
    solution: 'HLV diễn giải chỉ số thành mục tiêu 90 ngày tích cực, biến lo lắng thành động lực hành động.',
    isMoT: true,
    motLabel: 'MoT 01: Khoảnh khắc Chuyển Đổi'
  },
  {
    n: 6,
    label: 'Bàn tư vấn: Báo giá & ký hợp đồng',
    stage: 'conversion',
    stageName: 'Conversion',
    stageIndex: 2,
    channel: 'Owned',
    emoDefault: -1.6,
    emoMinh: -0.6,
    emoTuan: -2.0,
    emoHuong: -1.0,
    description: 'Thảo luận gói tập dài hạn, gói PT cá nhân, chính sách thanh toán và cam kết quyền lợi.',
    painPoint: 'Đáy cảm xúc sâu nhất: Áp lực bị ép ký gói dài hạn, sợ phí tiền nếu bận rộn bỏ dở.',
    solution: 'Bảng giá 1 trang minh bạch, gói linh hoạt 1-3 tháng, giữ ưu đãi 48h không ép chốt tại chỗ.',
    isMoT: true,
    motLabel: 'MoT 01: Điểm Nút Quyết Định Mua'
  },
  {
    n: 7,
    label: 'Buổi tập đầu tiên có định hướng',
    stage: 'service',
    stageName: 'Service',
    stageIndex: 3,
    channel: 'Owned',
    emoDefault: 1.5,
    emoMinh: 1.4,
    emoTuan: 1.6,
    emoHuong: 1.3,
    description: 'Hội viên chính thức check-in QR code, nhận tủ locker và được PT hướng dẫn giáo án tuần đầu.',
    painPoint: 'Thiếu định hướng bài tập cụ thể dẫn đến lúng túng khi tự tập một mình.',
    solution: 'Tặng giáo án 4 tuần in sẵn hoặc gửi qua Zalo, nhân viên lễ tân chào hỏi thân mật bằng tên.'
  },
  {
    n: 8,
    label: 'Tập luyện khung giờ cao điểm 18h–20h',
    stage: 'service',
    stageName: 'Service',
    stageIndex: 3,
    channel: 'Owned',
    emoDefault: -0.5,
    emoMinh: -1.6,
    emoTuan: -0.4,
    emoHuong: 0.2,
    description: 'Thời điểm đông đúc nhất trong ngày, khu tạ tập trung 95% công suất.',
    painPoint: 'Phải chờ máy tập tạ, không gian ~200m² cảm giác chật chội sau một ngày làm việc mệt mỏi.',
    solution: 'Cảnh báo Zalo mật độ từng khu (tạ 95%, cardio 30%), gợi ý đổi thứ tự bài tập hoặc giãn khung giờ.'
  },
  {
    n: 9,
    label: 'Tham gia lớp Yoga / Boxing & tiện ích',
    stage: 'service',
    stageName: 'Service',
    stageIndex: 3,
    channel: 'Owned',
    emoDefault: 1.0,
    emoMinh: 0.8,
    emoTuan: 0.6,
    emoHuong: 0.9,
    description: 'Thư giãn với phòng xông hơi thảo dược, lớp Yoga phục hồi, Boxing xả stress tràn năng lượng.',
    painPoint: 'Lớp quá đông hoặc giáo viên không theo sát từng học viên mới bắt đầu.',
    solution: 'Giới hạn sĩ số lớp 12-15 người, HLV hỗ trợ chỉnh tư thế an toàn, duy trì không gian sạch sẽ thơm mát.'
  },
  {
    n: 10,
    label: 'Tuần thứ 3–4: Tự tập & mất động lực',
    stage: 'service',
    stageName: 'Service',
    stageIndex: 3,
    channel: 'Owned',
    emoDefault: -0.9,
    emoMinh: -0.3,
    emoTuan: -1.8,
    emoHuong: -0.7,
    description: 'Hưng phấn ban đầu giảm sút, cơ thể mệt mỏi hoặc hiện tượng chững cân sinh lý xuất hiện.',
    painPoint: 'Không ai hỏi han, cảm giác cô đơn tự bơi dễ dẫn đến bỏ cuộc và ngủ đông thẻ tập.',
    solution: 'Zalo check-in tuần 3 tự động giải thích hiện tượng chững cân, PT gọi điện động viên và chỉnh giáo án.',
    isMoT: true,
    motLabel: 'MoT 02: Khoảnh khắc Chăm Sóc Chống Churn'
  },
  {
    n: 11,
    label: 'Nghi thức đo lại InBody sau 60–90 ngày',
    stage: 'retention',
    stageName: 'Retention',
    stageIndex: 4,
    channel: 'Owned',
    emoDefault: 1.2,
    emoMinh: 1.0,
    emoTuan: 1.6,
    emoHuong: 1.0,
    description: 'Kiểm tra lại toàn bộ chỉ số mỡ, cơ, cân nặng để so sánh với báo cáo InBody ngày đầu tiên.',
    painPoint: 'Nếu hội viên không thấy rõ sự tiến bộ bằng con số, họ sẽ cảm thấy thời gian tập không hiệu quả.',
    solution: 'Xuất biểu đồ so sánh trước-sau trực quan, vinh danh cột mốc đạt được và đặt mục tiêu giai đoạn mới.',
    isMoT: true,
    motLabel: 'MoT 03: Khoảnh khắc Giữ Chân Bằng Chứng'
  },
  {
    n: 12,
    label: 'Gia hạn thẻ & giới thiệu bạn bè',
    stage: 'retention',
    stageName: 'Retention',
    stageIndex: 4,
    channel: 'Shared',
    emoDefault: 2.0,
    emoMinh: 1.8,
    emoTuan: 2.0,
    emoHuong: 1.6,
    description: 'Hội viên hài lòng ký gia hạn hợp đồng mới và lan tỏa giới thiệu The Shine cho đồng nghiệp/người thân.',
    painPoint: 'Nhắc gia hạn bị động sát ngày hết hạn gây cảm giác phiền phức như đòi nợ.',
    solution: 'Chương trình Early Bird giảm 15% gia hạn trước 30 ngày + tặng voucher 01 tháng cho bạn bè giới thiệu.'
  }
];

export const PERSONA_PROFILES: Record<CustomerPersona, PersonaProfile> = {
  minh: {
    id: 'minh',
    name: 'Ngọc Minh',
    age: 27,
    role: 'Nhân viên văn phòng logistics (Tân Bình / Sân Bay)',
    badge: 'Dân Văn Phòng · Tốc Độ & Tiện Lợi',
    color: 'orange',
    colorHex: '#FF7A1A',
    avatarLetter: 'M',
    quote: 'Tan làm 6 giờ, mình chỉ cần chỗ nào tiện đường, không phải chờ máy, tập xong xông hơi rồi về.',
    context: 'Ngồi máy tính 8h/ngày, đau mỏi vai gáy, stress công việc. Quỹ thời gian eo hẹp trong khung 18h–20h.',
    story: 'Minh làm chuyên viên xuất nhập khẩu, thường xuyên ngồi máy tính liên tục 8–9 tiếng. Cơn đau vai gáy tái phát khiến anh quyết tâm tìm phòng gym tiện đường về nhà. Minh ghét nhất là cảnh chen chúc chờ máy và các thủ tục chào mời rườm rà.',
    timeline: [
      { when: '6 tháng trước', text: 'Bị đau mỏi vai gáy nặng, bác sĩ khuyên tập thể dục đều đặn thay vì lạm dụng thuốc.' },
      { when: '2 tháng trước', text: 'Tự tập theo video YouTube tại nhà nhưng bỏ cuộc sau 2 tuần vì thiếu thiết bị và động lực.' },
      { when: 'Tuần này', text: 'Thấy quảng cáo The Shine trên Facebook lúc nghỉ trưa, tiện đường Hoàng Hoa Thám nên ghé thử.' }
    ],
    goals: [
      'Giải tỏa đau mỏi cổ vai gáy, duy trì vóc dáng săn chắc.',
      'Phòng tập sạch sẽ, riêng tư, tiện đường về nhà không kẹt xe.',
      'Được xông hơi thảo dược thư giãn sau giờ làm.'
    ],
    painPoints: [
      'Giờ cao điểm 18h–20h khu tạ quá tải phải đứng chờ.',
      'Sợ đăng ký gói 1–2 năm rồi lười bỏ dở phí tiền.',
      'Phản hồi tin nhắn chậm ngoài giờ hành chính lúc anh rảnh.'
    ],
    expectations: [
      'Biết trước tình trạng mật độ phòng tập để chủ động giờ đến.',
      'Thủ tục nhanh gọn, ký gói 1 tháng linh hoạt.',
      'Nhân viên nhớ tên và biết thói quen tập luyện của mình.'
    ],
    preferredChannels: ['Facebook Ads', 'Zalo OA', 'Google Maps'],
    budgetRange: '300.000 – 600.000 VNĐ / tháng',
    recommendedPackage: 'Gói Hội Viên 1 Tháng (299k Khuyến Mãi) hoặc 3 Tháng Tiện Lợi',
    preferredWorkoutTime: '18h30 – 20h00 các ngày trong tuần',
    workoutPlan: [
      { phase: 'Khởi động', detail: '15 phút chạy treadmill dốc nhẹ làm nóng cơ thể.' },
      { phase: 'Tập luyện', detail: '30 phút bài tập kéo xà, tạ tay cho nhóm cơ lưng xô & vai gáy.' },
      { phase: 'Phục hồi', detail: '15 phút xông hơi thảo dược giải tỏa căng thẳng toàn thân.' }
    ]
  },
  tuan: {
    id: 'tuan',
    name: 'Quốc Tuấn',
    age: 32,
    role: 'Kỹ sư phần mềm / Người mới bắt đầu giảm cân',
    badge: 'Người Mới Bắt Đầu · Bằng Chứng & Niềm Tin',
    color: 'amber',
    colorHex: '#FFB05C',
    avatarLetter: 'T',
    quote: 'Mình cần ai đó chỉ cho từ số 0 — và bằng chứng là mình sẽ giảm được, chứ không phải lời hứa suông.',
    context: 'Thừa cân 10kg (92kg), mỡ nội tạng cao, chưa từng tập gym nghiêm túc, tự ti về vóc dáng trước đám đông.',
    story: 'Tuấn tăng cân liên tục trong 3 năm do ăn uống thất thường và thức đêm viết code. Sau buổi họp lớp nhìn thấy bạn cũ giảm 12kg ngoạn mục, anh quyết tâm tìm phòng gym có huấn luyện viên kèm 1-1 và đo lường được bằng số liệu khoa học.',
    timeline: [
      { when: '3 năm qua', text: 'Tăng gần 12kg, sức khỏe suy giảm, thường xuyên khó thở khi leo cầu thang.' },
      { when: '1 tháng trước', text: 'Họp lớp gặp lại bạn thân giảm cân thành công — nhận được động lực mạnh mẽ.' },
      { when: 'Tuần này', text: 'Tìm kiếm phòng gym giảm cân uy tín quanh Tân Bình, đặt hẹn đo InBody tại The Shine.' }
    ],
    goals: [
      'Giảm 10kg mỡ thừa trong 90 ngày (từ 92kg về 82kg).',
      'Được PT hướng dẫn từng động tác chuẩn xác từ số 0.',
      'Có số liệu InBody định kỳ chứng minh kết quả thực tế.'
    ],
    painPoints: [
      'Sốc tâm lý khi lần đầu nhìn thấy chỉ số mỡ nội tạng mức 14.',
      'Sợ bị ép mua gói PT đắt đỏ tiền triệu khi chưa tin tưởng.',
      'Dễ nản lòng và bỏ cuộc khi gặp giai đoạn chững cân tuần 3-4.'
    ],
    expectations: [
      'HLV diễn giải chỉ số thành lộ trình 12 tuần khoa học.',
      'Được thử nghiệm 3 buổi PT trải nghiệm trước khi ký hợp đồng dài.',
      'Được đồng hành, giải thích cặn kẽ khi cân nặng đứng yên.'
    ],
    preferredChannels: ['TikTok Review', 'Google Maps 5.0★', 'Bạn bè giới thiệu'],
    budgetRange: 'Sẵn sàng chi 5.000.000 – 15.000.000 VNĐ cho gói PT nếu có cam kết số liệu',
    recommendedPackage: 'Gói PT Cá Nhân 12 Tuần Transformation + Hội Viên VIP',
    preferredWorkoutTime: '19h00 – 20h30 (Thứ 2, 4, 6)',
    workoutPlan: [
      { phase: 'Tuần 1–2', detail: 'Làm quen nhịp tim, kỹ thuật Squat/Deadlift cơ bản với tạ nhẹ.' },
      { phase: 'Tuần 3–8', detail: 'Tăng kháng lực tạ + 20 phút Boxing HIIT đốt mỡ cao độ.' },
      { phase: 'Tuần 9–12', detail: 'Siết cơ toàn diện, điều chỉnh dinh dưỡng chuẩn bị đo lại InBody.' }
    ]
  },
  huong: {
    id: 'huong',
    name: 'Thu Hương',
    age: 30,
    role: 'Phụ nữ sau sinh 6 tháng / Giáo viên tiếng Anh',
    badge: 'Phụ Nữ Sau Sinh · An Toàn & Cảm Thông',
    color: 'emerald',
    colorHex: '#7AC88F',
    avatarLetter: 'H',
    quote: 'Mình không cần tập nặng — mình cần một nơi an toàn, hiểu cơ thể sau sinh, và thông cảm khi mình phải dời lịch vì con.',
    context: 'Sinh em bé được 6 tháng, tăng 14kg sau thai kỳ, đau lưng dưới do bế con. Quỹ thời gian phụ thuộc hoàn toàn vào giấc ngủ của bé.',
    story: 'Hương từng thử một phòng tập chuỗi lớn nhưng cảm thấy lạc lõng giữa tiếng nhạc đinh tai và bài tập quá nặng. Được bạn trong hội mẹ bỉm sữa chia sẻ về lớp Yoga phục hồi sáng sớm tại The Shine, cô muốn tìm một không gian ấm cúng, an tâm.',
    timeline: [
      { when: '6 tháng trước', text: 'Sinh con đầu lòng, cơ sàn chậu yếu và đau lưng dưới kéo dài.' },
      { when: '2 tháng trước', text: 'Thử tập ở phòng gym lớn nhưng bị đau cơ khớp và lịch học cố định không theo được.' },
      { when: 'Tuần này', text: 'Được bạn trong hội mẹ bỉm giới thiệu lớp Yoga phục hồi buổi sáng của The Shine.' }
    ],
    goals: [
      'Phục hồi cơ sàn chậu và cơ lõi (core), giảm đau thắt lưng sau sinh.',
      'Không gian tập luyện yên tĩnh, ánh sáng dịu nhẹ buổi sáng.',
      'HLV nữ có chứng chỉ am hiểu thể trạng phụ nữ sau sinh.'
    ],
    painPoints: [
      'Lịch tập bất định vì con có thể ốm hoặc quấy khóc đột xuất.',
      'Sợ mất tiền buổi tập nếu không được bảo lưu hoặc dời buổi.',
      'Ngại tập chung với các lớp nhạc sàn sôi động ồn ào.'
    ],
    expectations: [
      'Chính sách dời lịch linh hoạt báo trước 2 giờ không phạt phí.',
      'HLV nữ theo sát chỉnh sửa từng động tác hít thở.',
      'Ưu đãi theo nhóm bạn mẹ bỉm sữa cùng đăng ký.'
    ],
    preferredChannels: ['Hội Mẹ Bỉm Sữa', 'Zalo / Messenger', 'Fanpage Community'],
    budgetRange: '800.000 – 1.500.000 VNĐ / tháng (Gói lớp Yoga chuyên sâu)',
    recommendedPackage: 'Gói Yoga & Phục Hồi Sau Sinh 6 Tháng (Kèm Quyền Bảo Lưu Linh Hoạt)',
    preferredWorkoutTime: '06h00 – 07h15 Sáng sớm (khi bé còn ngủ)',
    workoutPlan: [
      { phase: 'Tuần 1–2', detail: 'Bài tập hít thở cơ hoành, kích hoạt nhẹ nhàng cơ sàn chậu.' },
      { phase: 'Tuần 3–4', detail: 'Tư thế Cat-Cow, cây cầu (Bridge) kéo giãn giải tỏa đau lưng.' },
      { phase: 'Tuần 5+', detail: 'Tăng dần sức mạnh cơ lõi với tư thế chiến binh và thăng bằng.' }
    ]
  },
  general: {
    id: 'general',
    name: 'Khách Hàng Tổng Thể',
    age: 29,
    role: 'Hội viên tiêu chuẩn The Shine Fitness',
    badge: 'Toàn Cảnh Hành Trình ACCSR',
    color: 'sky',
    colorHex: '#38BDF8',
    avatarLetter: 'S',
    quote: 'Trải nghiệm thể hình hiện đại, tiện ích toàn diện từ Gym, Yoga, Boxing đến Xông hơi thảo dược.',
    context: 'Cư dân và nhân viên văn phòng trong bán kính 3km quanh 154 Hoàng Hoa Thám, Tân Bình.',
    story: 'Hành trình tổng quan của khách hàng đại chúng từ lúc biết đến qua mạng xã hội đến khi trở thành hội viên trung thành.',
    timeline: [
      { when: 'Awareness', text: 'Biết đến thương hiệu qua quảng cáo và bảng hiệu mặt tiền.' },
      { when: 'Consideration', text: 'So sánh review, hỏi giá, trải nghiệm tập thử và đo InBody.' },
      { when: 'Conversion -> Retention', text: 'Ký hợp đồng, gắn bó 90 ngày và gia hạn thẻ tập định kỳ.' }
    ],
    goals: ['Cải thiện sức khỏe thể chất', 'Giữ gìn vóc dáng', 'Thư giãn xả stress hàng ngày'],
    painPoints: ['Chờ đợi phản hồi tư vấn', 'Áp lực chốt hợp đồng', 'Quá tải giờ cao điểm'],
    expectations: ['Minh bạch chi phí', 'Dịch vụ tận tâm chuyên nghiệp', 'Cơ sở vật chất luôn sạch sẽ'],
    preferredChannels: ['Facebook', 'Google Maps', 'Zalo OA', 'Truyền miệng'],
    budgetRange: '299.000 – 1.500.000 VNĐ / tháng',
    recommendedPackage: 'Hội Viên Trọn Gói Classic / Premium',
    preferredWorkoutTime: 'Sáng 06h00 - 08h00 hoặc Chiều 18h00 - 20h30',
    workoutPlan: [
      { phase: 'Giai đoạn 1', detail: 'Làm quen thói quen vận động 3 buổi/tuần.' },
      { phase: 'Giai đoạn 2', detail: 'Đa dạng hóa bộ môn: Gym phối hợp Yoga/Boxing.' },
      { phase: 'Giai đoạn 3', detail: 'Nâng cao thể lực và duy trì phong cách sống tích cực.' }
    ]
  }
};

// 5W1H Matrix
export const FIVE_W1H_MATRIX: Record<CustomerPersona, { letter: string; word: string; q: string; a: string }[]> = {
  minh: [
    { letter: 'W', word: 'WHAT', q: 'Minh đang tìm kiếm điều gì?', a: 'Phòng gym tiện đường tan làm, nhanh gọn 45 phút, có phòng xông hơi thảo dược xả stress không cần chờ máy.' },
    { letter: 'W', word: 'WHO', q: 'Minh là ai?', a: 'Nhân viên văn phòng 27 tuổi tại Tân Bình, ngồi máy tính 8h/ngày, đau cổ vai gáy, quỹ thời gian buổi tối rất hẹp.' },
    { letter: 'W', word: 'WHEN', q: 'Minh tương tác lúc nào?', a: 'Lướt tin giờ nghỉ trưa (12h–13h) và đến tập ngay sau khi tan sở (18h30–20h00) — đúng khung giờ cao điểm nhất.' },
    { letter: 'W', word: 'WHERE', q: 'Minh ra quyết định ở đâu?', a: 'Trên điện thoại qua Facebook & Google Maps; ký hợp đồng nhanh tại quầy lễ tân chứ không ngồi tư vấn lâu.' },
    { letter: 'W', word: 'WHY', q: 'Động lực sâu xa của Minh?', a: 'Muốn cắt đứt cơn đau mỏi vai gáy, giải tỏa áp lực công việc, tìm lại sự linh hoạt của cơ thể.' },
    { letter: 'H', word: 'HOW', q: 'Minh trải nghiệm như thế nào?', a: 'Thấy quảng cáo FB -> xem Google Maps -> ghé kiosk ký gói 1 tháng -> xem cảnh báo mật độ Zalo để tập Cardio trước.' }
  ],
  tuan: [
    { letter: 'W', word: 'WHAT', q: 'Tuấn đang tìm kiếm điều gì?', a: 'Lộ trình giảm 10kg mỡ thừa có HLV kèm 1-1, số liệu InBody đo lường khoa học, không phải lời hứa suông.' },
    { letter: 'W', word: 'WHO', q: 'Tuấn là ai?', a: 'Kỹ sư công nghệ 32 tuổi, nặng 92kg, tự ti về hình thể, từng nhiều lần thất bại khi tự tập ở nhà.' },
    { letter: 'W', word: 'WHEN', q: 'Tuấn tương tác lúc nào?', a: 'Nửa đêm lúc lướt TikTok tìm động lực; đến tập vào các buổi tối 19h00 thứ 2, 4, 6.' },
    { letter: 'W', word: 'WHERE', q: 'Tuấn ra quyết định ở đâu?', a: 'Bắt đầu từ video TikTok -> trải nghiệm máy InBody -> chốt giáo án 12 tuần tại phòng tư vấn The Shine.' },
    { letter: 'W', word: 'WHY', q: 'Động lực sâu xa của Tuấn?', a: 'Cú sốc họp lớp khi thấy bạn bè thon gọn, mong muốn lấy lại sự tự tin và cải thiện sức khỏe lâu dài.' },
    { letter: 'H', word: 'HOW', q: 'Tuấn trải nghiệm như thế nào?', a: 'Xem TikTok before-after -> đo InBody sốc mức mỡ 14 -> HLV lên giáo án 12 tuần -> tập tạ & Boxing -> đo lại giảm 10.5kg.' }
  ],
  huong: [
    { letter: 'W', word: 'WHAT', q: 'Hương đang tìm kiếm điều gì?', a: 'Lớp Yoga phục hồi sau sinh nhẹ nhàng, không gian yên tĩnh sáng sớm, chính sách dời lịch linh hoạt khi con ốm.' },
    { letter: 'W', word: 'WHO', q: 'Hương là ai?', a: 'Mẹ bỉm sữa 30 tuổi có bé 6 tháng, bị đau thắt lưng sau sinh, ưu tiên sự an toàn và đồng cảm hơn giá cả.' },
    { letter: 'W', word: 'WHEN', q: 'Hương tương tác lúc nào?', a: 'Sáng sớm 6h00–7h15 khi bé còn ngủ say — thời gian hiếm hoi duy nhất trong ngày dành cho bản thân.' },
    { letter: 'W', word: 'WHERE', q: 'Hương ra quyết định ở đâu?', a: 'Từ nhóm chat Messenger hội mẹ bỉm -> hỏi kỹ lễ tân về hồ sơ HLV và chính sách dời lịch -> phòng tập Yoga sáng.' },
    { letter: 'W', word: 'WHY', q: 'Động lực sâu xa của Hương?', a: 'Hồi phục thể trạng cốt lõi sau sinh, tìm lại vóc dáng và sự cân bằng tinh thần để chăm sóc con tốt hơn.' },
    { letter: 'H', word: 'HOW', q: 'Hương trải nghiệm như thế nào?', a: 'Nhận link hội mẹ bỉm -> hỏi kỹ điều khoản dời lịch -> tập lớp Yoga phục hồi 6h sáng -> gia hạn và rủ bạn cùng tập.' }
  ],
  general: [
    { letter: 'W', word: 'WHAT', q: 'Khách hàng tìm kiếm gì?', a: 'Phòng tập thể hình cao cấp với đầy đủ bộ môn Gym, Yoga, Boxing, tiện ích nước uống, xông hơi, đo InBody 0đ.' },
    { letter: 'W', word: 'WHO', q: 'Khách hàng là ai?', a: 'Đại chúng cư dân, sinh viên và dân văn phòng khu vực Tân Bình, Phú Nhuận, Tân Phú.' },
    { letter: 'W', word: 'WHEN', q: 'Thời gian tập phổ biến?', a: 'Khung giờ sáng sớm 6h00–8h00 và tan sở 17h30–20h30.' },
    { letter: 'W', word: 'WHERE', q: 'Địa điểm trải nghiệm?', a: 'Tòa nhà 154 Hoàng Hoa Thám, Phường Bảy Hiền (Phường 12 cũ), Quận Tân Bình.' },
    { letter: 'W', word: 'WHY', q: 'Lý do lựa chọn The Shine?', a: 'Định vị Shine On – Sweat On: Hiện đại, riêng tư, sạch sẽ, máy móc Life Fitness chuẩn quốc tế.' },
    { letter: 'H', word: 'HOW', q: 'Phương thức chuyển đổi?', a: 'Phễu 5 bước ACCSR từ Nhận thức -> Suy xét -> Chuyển đổi -> Chăm sóc -> Giữ chân bền vững.' }
  ]
};

// Moments of Truth Details
export const MOMENTS_OF_TRUTH = [
  {
    code: '01',
    phase: 'Chuyển Đổi (Conversion)',
    touchpoint: 'Điểm chạm ④–⑤ ➔ ⑥ (Tập thử, đo InBody ➔ Bàn tư vấn)',
    title: 'Buổi Tập Thử + Đo InBody Đầu Tiên',
    why: 'Lần đầu tiên khách hàng cảm nhận cơ sở vật chất, thái độ HLV và nhìn thấy sự thật về chỉ số cơ thể mình. Đây là nơi quyết định 70% khả năng xuống tiền.',
    actions: {
      experience: 'Kịch bản đón tiếp chuẩn: Tour 10 phút, HLV kèm bài tập thử nghiệm, đọc kết quả InBody thành lộ trình 90 ngày.',
      conversion: 'Bảng giá 1 trang chuẩn hóa, cam kết "không phí ẩn", tặng voucher 48h giữ ưu đãi thay vì ép chốt ép mua.',
      kpi: 'Tỷ lệ tập thử chuyển đổi thành hợp đồng > 40%; khảo sát NPS sau buổi thử đạt > 9.0 điểm.'
    }
  },
  {
    code: '02',
    phase: 'Chăm Sóc (Service)',
    touchpoint: 'Điểm chạm ⑦–⑩ (Buổi đầu ➔ Tuần 3-4 chững cân & mất lửa)',
    title: '30 Ngày Đầu Làm Hội Viên & Vượt Chững Cân',
    why: 'Ngành fitness mất khách nhiều nhất trong tháng đầu tiên do chưa tạo thành thói quen. Tuần 3-4 là "vực thẳm cô đơn" dễ khiến hội viên ngủ đông.',
    actions: {
      experience: 'Lộ trình Onboarding 4 tuần có mục tiêu rõ ràng từng buổi; Zalo cảnh báo mật độ từng khu tránh bức xúc giờ kẹt máy.',
      conversion: 'Zalo check-in cuối tuần tự động; cảnh báo hệ thống khi hội viên vắng > 7 ngày để PT liên hệ động viên kịp thời.',
      kpi: 'Tỷ lệ hội viên duy trì tập > 3 buổi/tuần trong tháng đầu đạt > 75%; tỷ lệ ngủ đông < 12%.'
    }
  },
  {
    code: '03',
    phase: 'Giữ Chân (Retention)',
    touchpoint: 'Điểm chạm ⑪–⑫ (Đo lại InBody 90 ngày ➔ Gia hạn hợp đồng)',
    title: 'Nghi Thức Đo Lại InBody & Kêu Gọi Gia Hạn Sớm',
    why: 'Khách hàng chỉ gắn bó khi họ nhìn thấy thành quả nỗ lực của chính mình bằng con số thực tế, biến giá trị vô hình thành hữu hình.',
    actions: {
      experience: 'Chủ động gửi tin nhắn mời đo lại InBody; in báo cáo so sánh trước - sau và gửi tặng lời chúc mừng thành tích.',
      conversion: 'Chương trình Early Bird giảm 15% trước ngày hết hạn 30 ngày + tặng voucher 01 tháng cho bạn bè giới thiệu.',
      kpi: 'Tỷ lệ gia hạn hợp đồng kỳ đầu > 60%; đóng góp doanh thu từ hội viên giới thiệu đạt > 25%.'
    }
  }
];

// Helper: Auto-match CustomerRecord to Persona & Journey Stage
export function enrichCustomerWithJourney(customer: CustomerRecord): {
  stage: JourneyStage;
  persona: CustomerPersona;
  motAlert?: string;
  stageName: string;
} {
  // 1. Determine Journey Stage
  let stage: JourneyStage = 'awareness';
  const status = customer.status;
  const memStatus = customer.membershipStatus;
  const checkins = customer.checkinCount || 0;
  const daysSinceCheckin = customer.daysSinceLastCheckin || 0;

  if (status === 'new' || customer.customerSegment === 'Khách mới' || customer.hadTrial === 'Chưa') {
    stage = 'awareness';
  } else if (status === 'contacted' || status === 'trial_active' || customer.hadTrial === 'Có' && customer.trialConverted !== 'Có') {
    stage = 'consideration';
  } else if (status === 'member' && checkins <= 3) {
    stage = 'conversion';
  } else if (status === 'member' && (memStatus === 'Đang hoạt động' || checkins > 3) && (customer.renewalCount || 0) === 0) {
    stage = 'service';
  } else if (memStatus === 'Sắp hết hạn' || (customer.renewalCount || 0) > 0 || (customer.totalSpent || 0) > 10000000) {
    stage = 'retention';
  } else if (status === 'expired' || memStatus === 'Hết hạn') {
    stage = 'retention';
  } else {
    stage = 'service';
  }

  // 2. Determine Persona Match
  let persona: CustomerPersona = 'general';
  const occ = (customer.occupation || '').toLowerCase();
  const goal = (customer.trainingGoal || '').toLowerCase();
  const extra = (customer.extraServices || '').toLowerCase();
  const gender = (customer.gender || '').toLowerCase();
  const age = customer.birthYear ? 2026 - customer.birthYear : 28;

  if (
    occ.includes('văn phòng') || 
    occ.includes('logistics') || 
    occ.includes('kế toán') || 
    occ.includes('kinh doanh') || 
    occ.includes('ngân hàng') || 
    occ.includes('marketing') ||
    goal.includes('giảm stress') ||
    goal.includes('vai gáy')
  ) {
    persona = 'minh';
  } else if (
    goal.includes('giảm cân') || 
    goal.includes('giảm mỡ') || 
    goal.includes('tăng cơ') || 
    occ.includes('it') || 
    occ.includes('kỹ sư') || 
    occ.includes('lập trình') ||
    (customer.ptSessions && customer.ptSessions > 0)
  ) {
    persona = 'tuan';
  } else if (
    gender === 'nữ' && (
      extra.includes('yoga') || 
      goal.includes('yoga') || 
      goal.includes('phục hồi') || 
      occ.includes('nội trợ') || 
      occ.includes('giáo viên') ||
      (age >= 25 && age <= 36)
    )
  ) {
    persona = 'huong';
  }

  // 3. MoT Intervention Alerts
  let motAlert: string | undefined = undefined;
  if (stage === 'service' && daysSinceCheckin >= 7 && daysSinceCheckin <= 21) {
    motAlert = 'Cảnh báo nguy cơ mất lửa tuần 3: Khách đã vắng tập ' + daysSinceCheckin + ' ngày! Cần kích hoạt Zalo check-in MoT 02.';
  } else if (stage === 'consideration') {
    motAlert = 'MoT 01: Khách đang ở giai đoạn tập thử / đo InBody, cần gửi kịch bản tư vấn lộ trình không áp lực.';
  } else if (stage === 'retention' || memStatus === 'Sắp hết hạn') {
    motAlert = 'MoT 03: Chuẩn bị đến hạn gia hạn thẻ, gửi lịch mời đo lại InBody 90 ngày kèm ưu đãi Early Bird.';
  }

  const stageNames: Record<JourneyStage, string> = {
    awareness: '1. Nhận Thức (Awareness)',
    consideration: '2. Suy Xét (Consideration)',
    conversion: '3. Chuyển Đổi (Conversion)',
    service: '4. Chăm Sóc (Service)',
    retention: '5. Giữ Chân (Retention)'
  };

  return {
    stage,
    persona,
    motAlert,
    stageName: stageNames[stage]
  };
}
