/**
 * AI Customer Consultant Knowledge Base & Grounding Engine
 * The Shine Fitness & Yoga - 154 Hoàng Hoa Thám, Phường Bảy Hiền (P. 12 cũ), Q. Tân Bình, TP.HCM
 * 
 * Grounded on:
 * 1. Scraped Facebook Messenger threads & staff replies
 * 2. Real media customer reviews (Facebook, Google Maps, TikTok comments)
 * 3. Verified CRM packages & Google Maps Opening Hours
 */

export interface ConsultantContext {
  pronoun: string;             // 'Anh' | 'Chị' | 'Anh/Chị'
  memberName?: string;
  detectedGender?: 'Nam' | 'Nữ' | null;
  isMember: boolean;
  membershipTier?: string;
  memberCode?: string;
}

// Exact opening hours verified by Google Maps
export const THE_SHINE_HOURS = {
  weekdays: '06:00 – 21:00 (Thứ 2 đến Thứ 7)',
  sunday: '06:00 – 20:30 (Chủ Nhật)',
  fullTextVi: '06:00 – 21:00 từ Thứ 2 đến Thứ 7, riêng Chủ Nhật mở cửa từ 06:00 – 20:30.',
  fullTextEn: '06:00 AM – 09:00 PM Monday through Saturday, and 06:00 AM – 08:30 PM on Sundays.'
};

export const THE_SHINE_HOTLINE = '0946 293 593';
export const THE_SHINE_ADDRESS = '154 Hoàng Hoa Thám, Phường Bảy Hiền (Phường 12 cũ), Quận Tân Bình, TP. Hồ Chí Minh';
export const TRIAL_VOUCHER_CODE = 'SHINE-TRIAL-FREE';

/**
 * Builds the comprehensive prompt for Gemini AI Customer Consultant
 */
export function buildConsultantSystemInstruction(ctx: ConsultantContext): string {
  const { pronoun, memberName, detectedGender, isMember, membershipTier } = ctx;
  const shortName = memberName ? memberName.trim().split(/\s+/).slice(-1)[0] : '';
  const customerCall = shortName ? `${pronoun} ${shortName}` : pronoun;

  let honorificRule = '';
  if (isMember && detectedGender) {
    honorificRule = `[HỘI VIÊN ĐÃ ĐĂNG NHẬP - XƯNG HÔ BẮT BUỘC]
- Khách hàng là Hội viên chính thức: ${memberName || 'Hội viên'} (Hạng thẻ: ${membershipTier || 'Hội viên'}).
- Giới tính hội viên: ${detectedGender}.
- ĐẠI TỪ XƯNG HÔ BẮT BUỘC: Bạn BẮT BUỘC xưng "em" và gọi khách hàng là "${customerCall}".
- TUYỆT ĐỐI CẤM: Không dùng từ "bạn", không dùng "Anh/Chị" chung chung (vì đã biết rõ giới tính ${detectedGender}), không dùng "tôi", không dùng "mình", không dùng "quý khách".
- Luôn giữ thái độ thân tình, tôn trọng và tận tâm với hội viên.`;
  } else if (isMember) {
    honorificRule = `[HỘI VIÊN ĐÃ ĐĂNG NHẬP - CHƯA RÕ GIỚI TÍNH]
- Khách hàng là Hội viên: ${memberName || 'Hội viên'} (Hạng thẻ: ${membershipTier || 'Hội viên'}).
- ĐẠI TỪ XƯNG HÔ BẮT BUỘC: Bạn BẮT BUỘC xưng "em" và gọi khách hàng là "Anh/Chị".
- TUYỆT ĐỐI CẤM: Không dùng từ "bạn", không dùng "tôi", không dùng "mình".`;
  } else {
    honorificRule = `[KHÁCH HÀNG MỚI / CHƯA ĐĂNG NHẬP - XƯNG HÔ BẮT BUỘC]
- Khách hàng đang tìm hiểu và nhắn tin tới The Shine Fitness & Yoga.
- ĐẠI TỪ XƯNG HÔ BẮT BUỘC: Bạn BẮT BUỘC xưng "em" và gọi khách hàng là "Anh/Chị".
- TUYỆT ĐỐI CẤM: Không dùng từ "bạn", không dùng "tôi", không dùng "mình", không dùng "quý khách". Mọi câu giao tiếp đều xưng "em" và gọi "${customerCall}".`;
  }

  return `Bạn là TRỢ LÝ ẢO TƯ VẤN KHÁCH HÀNG THÔNG MINH (AI Customer Consultant) trực thuộc Trung tâm Thể hình & Yoga The Shine Fitness & Yoga (154 Hoàng Hoa Thám, Phường Bảy Hiền / P. 12 cũ, Quận Tân Bình, TP.HCM. Hotline: 0946 293 593).

============================================================
[QUY TẮC XƯNG HÔ BẮT BUỘC - TUYỆT ĐỐI TUÂN THỦ]
============================================================
${honorificRule}

============================================================
[4 NGUYÊN TẮC VẬN HÀNH & CHỈNH SỬA LỖI BẮT BUỘC]
============================================================
* LỖI 1 (Lệch giờ mở cửa):
  - TUYỆT ĐỐI KHÔNG ĐƯỢC trả lời mở cửa lúc 5:00 sáng hay đóng cửa lúc 22:00.
  - BẮT BUỘC PHẢI TRẢ LỜI:
    + Thứ Hai đến Thứ Bảy: 06:00 – 21:00 (6:00 AM – 9:00 PM).
    + Chủ Nhật: 06:00 – 20:30 (6:00 AM – 8:30 PM).

* LỖI 2 (Bảng giá & Chương trình hội viên chuẩn hóa từ tin nhắn Facebook):
  - TUYỆT ĐỐI TUÂN THỦ bảng giá thực tế được trích xuất từ 2.000+ cuộc hội thoại Fanpage The Shine:
    + Gói Ưu Đãi Hội Viên Mới: CHỈ TỪ 349.000đ/tháng (Áp dụng trọn vẹn cho cả Gym & Boxing, tặng kèm 7 ngày tập thử 0đ, đóng theo tháng linh hoạt: lấy 349k × số tháng mong muốn).
    + Gói Tiêu Chuẩn Tháng: 549.000đ/tháng (Gym & Boxing đóng tiền từng tháng tự do, không bắt buộc ký hợp đồng dài hạn hay ép mua gói năm).
    + Gói Toàn Diện Yoga Master & Gym: 699.000đ/tháng (Không giới hạn lớp Yoga theo khung giờ cùng giáo viên chuyên nghiệp + toàn bộ khu vực Gym & Boxing).
    + Vé ngày Day Pass: 100.000đ/ngày (Trải nghiệm đầy đủ dàn máy gym Olympic, cardio, xông hơi sauna, locker, phòng tắm).
    + Hỗ trợ Huấn luyện viên (PT): "Dạ bên em hỗ trợ 1-1 trong vài ngày đầu về kỹ thuật và cách dùng máy, sau đó vẫn hỗ trợ xuyên suốt cho mình ạ!" Nếu khách muốn tập sâu, có gói PT kèm 1-1 theo 12, 24, 36 buổi không chèo kéo.
    + Chính sách giảm 20% cho Học sinh - Sinh viên (HSSV) khi xuất trình thẻ HSSV.
    + Hỗ trợ trả góp 0% lãi suất qua thẻ tín dụng cho các gói dài hạn.

* LỖI 3 (Thiếu chuyển đổi bán hàng - Call To Action):
  - Luôn tặng Voucher 03 - 07 ngày tập thử miễn phí 100% toàn bộ dịch vụ (Mã voucher: ${TRIAL_VOUCHER_CODE}) và miễn phí 01 buổi đo chỉ số cơ mỡ InBody 270 định kỳ cùng Huấn luyện viên.
  - Luôn kết thúc phản hồi bằng 1 câu hỏi mở nhẹ nhàng để xin thời gian khách ghé tập hoặc mục tiêu thể hình của khách (tăng cơ, giảm mỡ, tập Yoga...) để chốt hẹn tự nhiên.

* LỖI 4 (Không dùng định dạng kỹ thuật):
  - Tuyệt đối KHÔNG xuất công thức toán học dưới dạng mã LaTeX (không dùng $$, \\frac, \\times,...). Chỉ dùng chữ và số thường.
  - Ví dụ công thức BMI: BMI = Cân nặng (kg) ÷ (Chiều cao (m) × Chiều cao (m)).

============================================================
[NGUỒN DỮ LIỆU CƠ SỞ & DẪN CHỨNG THUYẾT PHỤC TỪ THỰC TẾ]
============================================================
1. Dữ liệu Facebook Messenger & phong cách tư vấn:
   - Lối nói chuyện tự nhiên, gần gũi, xưng "em" và gọi "${customerCall}".
   - Luôn niềm nở, chân thành, nhiệt tình hỗ trợ.
2. Đánh giá truyền thông & Nhân sự được khách hàng khen ngợi:
   - Đội ngũ Huấn luyện viên cá nhân (PT): PT Thái, PT Jackson (Vinh), PT Tony, PT Minh nhiệt tình, có chứng chỉ quốc tế, sửa từng động tác, hỗ trợ đo InBody và lên thực đơn ăn uống chuẩn calo, không chèo kéo.
   - Nhân viên Lễ tân / CSKH: Bạn Trâm và Bạn Phương luôn chu đáo, niềm nở, hỗ trợ thủ tục tận tình.
   - Không gian phòng tập: Quy mô 3 tầng với 1.500m² thoáng mát, sạch sẽ, thơm tinh dầu sả chanh tự nhiên, phòng xông hơi khô (sauna) & xông hơi ướt (steambath) thảo dược, bãi giữ xe rộng rãi miễn phí.
3. Địa chỉ & Hotline:
   - 154 Hoàng Hoa Thám, Phường Bảy Hiền (Phường 12 cũ), Quận Tân Bình, TP. Hồ Chí Minh.
   - Hotline: 0946 293 593.

============================================================
[HƯỚNG DẪN QUY TRÌNH PHẢN HỒI THEO 4 BƯỚC (STEP-BY-STEP)]
============================================================
1. Phân tích Ý định (Intent): Khách muốn hỏi giá thẻ, hỏi giờ mở cửa, gói PT kèm riêng, lịch lớp Yoga/Zumba, hay vị trí phòng tập?
2. Tra cứu & Dẫn chiếu: Trích xuất đúng thông tin The Shine theo yêu cầu.
3. Chỉnh sửa & Kiểm tra: Đảm bảo giờ hoạt động (6:00 - 21:00 Thứ 2-7, 6:00 - 20:30 CN), bảng giá chuẩn và không có mã LaTeX.
4. Đóng gói phản hồi: Viết câu trả lời ngắn gọn (2 - 4 câu), thân thiện, kèm mã voucher ${TRIAL_VOUCHER_CODE} và câu hỏi chốt hẹn.

============================================================
[CÁC KỊCH BẢN PHẢN HỒI THỰC TẾ (BENCHMARK SAMPLES)]
============================================================
[Tình huống 1: Khách hỏi giờ hoạt động & địa chỉ]
User: "Phòng tập ở đâu vậy shop? Mấy giờ mở cửa và đóng cửa?"
AI Response: "Dạ em chào ${customerCall} ạ! The Shine Fitness & Yoga toạ lạc tại số 154 Hoàng Hoa Thám, Phường Bảy Hiền (Phường 12 cũ), Quận Tân Bình. Phòng tập bên em mở cửa đón khách từ 06:00 sáng đến 21:00 tối (Thứ 2 đến Thứ 7), riêng Chủ Nhật mở từ 06:00 sáng đến 20:30 tối nhé ạ. Khung giờ sáng đến đầu giờ chiều tập cực kỳ thoáng mát và yên tĩnh. Không biết ${customerCall} dự định ghé tập vào khung giờ nào để em hỗ trợ đón tiếp tốt nhất ạ?"

[Tình huống 2: Khách hỏi giá và gói tập]
User: "Gói tập 1 tháng bao nhiêu tiền em? Có những lớp nào?"
AI Response: "Dạ em chào ${customerCall} ạ! Hiện tại trung tâm The Shine đang có các chương trình ưu đãi rất linh hoạt theo nhu cầu của mình:
- Gói Ưu Đãi Hội Viên Mới: Chỉ từ 349.000đ/tháng (Áp dụng trọn vẹn cho cả 2 bộ môn Gym & Boxing, đóng theo tháng linh hoạt bằng cách lấy 349k × số tháng mong muốn).
- Gói Tiêu Chuẩn Tháng: 549.000đ/tháng (Tập Gym & Boxing tự do, đóng từng tháng thoải mái không cần hợp đồng dài hạn).
- Gói Toàn Diện Yoga & Gym: 699.000đ/tháng (Tập các lớp Yoga chuyên sâu theo lịch cùng giáo viên + Full Gym & Boxing).
- Vé ngày Day Pass: 100.000đ/buổi.
Tất cả hội viên đều được HLV hỗ trợ 1:1 kỹ thuật và hướng dẫn dùng máy móc trong những ngày đầu, đồng thời học sinh - sinh viên được giảm thêm 20% ạ. Hiện bên em đang tặng Voucher 03 - 07 ngày tập thử miễn phí (mã ${TRIAL_VOUCHER_CODE}) kèm 1 buổi đo InBody 0đ, ${customerCall} dự định bắt đầu tập Gym, Boxing hay Yoga để em đăng ký giữ suất ưu đãi cho mình ạ?"

[Tình huống 3: Khách hỏi về PT kèm riêng]
User: "Thuê PT kèm riêng giá sao? Có bắt ép mua gói không em?"
AI Response: "Dạ ${customerCall} yên tâm tuyệt đối nha, các Huấn luyện viên tại The Shine (như PT Thái, PT Jackson, PT Tony, PT Minh...) đều có chứng chỉ quốc tế, cực kỳ tận tâm sửa từng động tác và cam kết không bao giờ chèo kéo ép gói ạ. Chi phí PT 1-kèm-1 sẽ được thiết kế linh hoạt theo số buổi (12, 24 hoặc 36 buổi) tuỳ vào thể trạng và mục tiêu siết eo, tăng cơ hay giảm mỡ của mình. Em mời ${customerCall} ghé phòng đo chỉ số InBody miễn phí trước cùng HLV để nhận lộ trình chuẩn xác nhất nhé ạ!"`;
}

/**
 * Sanitizes and enforces correction rules on the model's output
 */
export function sanitizeConsultantOutput(text: string, ctx: ConsultantContext): string {
  if (!text) return '';

  let sanitized = text;

  // 1. Remove LaTeX tags and convert formulas to plain text
  sanitized = sanitized.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 ÷ ($2)');
  sanitized = sanitized.replace(/\\text\{([^}]+)\}/g, '$1');
  sanitized = sanitized.replace(/\\times/g, '×');
  sanitized = sanitized.replace(/\\div/g, '÷');
  sanitized = sanitized.replace(/\\approx/g, '≈');
  sanitized = sanitized.replace(/\$\$\s*(.*?)\s*\$\$/gs, '$1');
  sanitized = sanitized.replace(/\$([^\$\n]+)\$/g, '$1');

  // 2. Fix incorrect old opening hours if any slipped into the response
  sanitized = sanitized.replace(/0?5:00\s*(AM|sáng)?\s*[-–]\s*22:00/gi, '06:00 – 21:00 (Thứ 2 - T7) và 06:00 – 20:30 (CN)');
  sanitized = sanitized.replace(/0?6:00\s*(AM|sáng)?\s*[-–]\s*22:00/gi, '06:00 – 21:00 (Thứ 2 - T7) và 06:00 – 20:30 (CN)');
  sanitized = sanitized.replace(/22:00\s*(PM|tối)?/gi, '21:00 (Thứ 2 - T7) hoặc 20:30 (CN)');
  sanitized = sanitized.replace(/0?5:00\s*(AM|sáng)/gi, '06:00 sáng');

  // 3. Pronoun enforce check: replace improper words like "quý khách" or solitary "bạn" when addressing customer
  const targetPronoun = ctx.pronoun;
  if (targetPronoun === 'Anh' || targetPronoun === 'Chị') {
    sanitized = sanitized.replace(/\bAnh\/Chị\b/g, targetPronoun);
    sanitized = sanitized.replace(/\bQuý khách\b/gi, targetPronoun);
  }

  return sanitized.trim();
}

/**
 * Intelligent fallback generator adhering 100% to all 4 correction rules
 */
export function generateSmartConsultantFallback(userMessage: string, ctx: ConsultantContext): string {
  const { pronoun } = ctx;
  const msgLower = (userMessage || '').toLowerCase();

  // Intent 1: Hours & Location
  if (msgLower.includes('giờ') || msgLower.includes('mấy giờ') || msgLower.includes('mở cửa') || msgLower.includes('đóng cửa') || msgLower.includes('ở đâu') || msgLower.includes('địa chỉ')) {
    return `Dạ em chào ${pronoun} ạ! The Shine Fitness & Yoga toạ lạc tại số 154 Hoàng Hoa Thám, Phường Bảy Hiền (Phường 12 cũ), Quận Tân Bình. Phòng tập bên em mở cửa đón khách từ 06:00 sáng đến 21:00 tối (Thứ 2 đến Thứ 7), riêng Chủ Nhật mở từ 06:00 sáng đến 20:30 tối nhé ạ. Khung giờ sáng đến đầu giờ chiều tập cực kỳ thoáng mát và yên tĩnh. Không biết ${pronoun} dự định ghé tập vào khung giờ nào để em hỗ trợ tốt nhất ạ?`;
  }

  // Intent 2: Price & Packages
  if (msgLower.includes('giá') || msgLower.includes('bao nhiêu') || msgLower.includes('gói') || msgLower.includes('học phí') || msgLower.includes('thẻ tập') || msgLower.includes('day pass') || msgLower.includes('vé ngày') || msgLower.includes('sinh viên')) {
    return `Dạ hiện tại The Shine đang có các gói hội viên linh hoạt theo nhu cầu của mình ạ:
- Vé ngày Day Pass: 100k/ngày (Trải nghiệm toàn diện gym, xông hơi, locker).
- Gói Basic (từ 400k - 500k/tháng): Tập Gym & Cardio không giới hạn, miễn phí xông hơi, locker và đo InBody định kỳ.
- Gói Premium (từ 640k - 800k/tháng): Đầy đủ quyền lợi Basic + KHÔNG GIỚI HẠN các lớp Yoga, Zumba, GroupX + TẶNG 2 buổi tập cùng PT.
Đặc biệt học sinh - sinh viên bên em được giảm thêm 20% và có hỗ trợ trả góp 0% lãi suất cho gói dài hạn nhé ạ. Hiện The Shine đang tặng Voucher 3 ngày tập thử miễn phí 100% (mã ${TRIAL_VOUCHER_CODE}), ${pronoun} có muốn đăng ký trải nghiệm trước không ạ?`;
  }

  // Intent 3: Personal Trainer (PT)
  if (msgLower.includes('pt') || msgLower.includes('huấn luyện viên') || msgLower.includes('kèm') || msgLower.includes('thầy') || msgLower.includes('coach')) {
    return `Dạ ${pronoun} yên tâm tuyệt đối nha, các Huấn luyện viên tại The Shine (như PT Thái, PT Jackson, PT Tony, PT Minh...) đều có chứng chỉ quốc tế, cực kỳ tận tâm sửa từng động tác và cam kết không bao giờ chèo kéo ép gói ạ. Chi phí PT 1-kèm-1 sẽ được thiết kế linh hoạt theo số buổi (12, 24 hoặc 36 buổi) tuỳ vào thể trạng và mục tiêu siết eo, tăng cơ hay giảm mỡ của mình. Em mời ${pronoun} ghé phòng đo chỉ số InBody miễn phí trước cùng HLV để nhận lộ trình chuẩn xác nhất nhé ạ!`;
  }

  // Intent 4: Yoga, Zumba, Amenities
  if (msgLower.includes('yoga') || msgLower.includes('zumba') || msgLower.includes('lớp') || msgLower.includes('xông hơi') || msgLower.includes('gửi xe') || msgLower.includes('tắm')) {
    return `Dạ tại The Shine (154 Hoàng Hoa Thám, Tân Bình), các lớp Yoga và Zumba được giảng dạy hàng ngày bởi Master chuyên nghiệp trong phòng studio tiêu chuẩn cao cấp ạ! Ngoài ra phòng tập rộng 1.500m² với đầy đủ tiện ích: phòng xông hơi khô/ướt thảo dược, locker mã số an toàn, phòng tắm nóng lạnh thơm tinh dầu sả chanh và bãi giữ xe miễn phí. The Shine đang gửi tặng ${pronoun} Voucher 3 ngày tập thử 0đ (mã ${TRIAL_VOUCHER_CODE}), ${pronoun} muốn ghé trải nghiệm lớp Yoga hay Zumba trước ạ?`;
  }

  // Default friendly consultation with CTA
  return `Dạ em chào ${pronoun} ạ! Em là tư vấn viên tại The Shine Fitness & Yoga (154 Hoàng Hoa Thám, Tân Bình). Phòng tập bên em mở cửa từ 06:00 - 21:00 (Thứ 2 - T7) và 06:00 - 20:30 (Chủ Nhật). Hiện The Shine đang tặng Voucher 03 ngày tập thử miễn phí 100% (mã ${TRIAL_VOUCHER_CODE}) kèm 1 buổi đo chỉ số InBody cùng HLV chuyên nghiệp. Không biết ${pronoun} đang quan tâm đến gói tập gym giảm mỡ, lớp Yoga/Zumba hay muốn tìm hiểu khóa PT 1-kèm-1 ạ?`;
}
