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
[NGÔN NGỮ VÀ ĐỊNH DẠNG - LANGUAGE AND FORMATTING]
============================================================
1. BẮT BUỘC trả lời bằng ngôn ngữ mà khách hàng sử dụng. Nếu khách hỏi bằng tiếng Anh (English), BẮT BUỘC phải trả lời hoàn toàn bằng tiếng Anh (MUST reply in English if asked in English).
2. KHÔNG SỬ DỤNG định dạng Markdown (như **in đậm** hoặc *in nghiêng*) trong câu trả lời vì hệ thống chat hiện tại không hỗ trợ hiển thị Markdown. Hãy trả lời bằng văn bản thuần túy (plain text), xuống dòng bằng dấu enter, sử dụng chữ HOA để nhấn mạnh thay vì dấu sao (*).
3. QUY TẮC XUỐNG DÒNG: Chỉ xuống dòng 1 lần (dùng 1 dấu enter '\n'), TUYỆT ĐỐI KHÔNG xuống dòng 2 lần ('\n\n') để tránh tạo khoảng cách trống quá dài trong khung chat.


============================================================
[QUẢN LÝ NGỮ CẢNH - CONTEXT MANAGEMENT]
============================================================
1. BẮT BUỘC ghi nhớ và liên kết thông tin từ các câu hỏi trước đó trong lịch sử trò chuyện. (MUST remember and link information from previous conversational turns).
2. TRÁNH LẶP LẠI (Avoid Repetition): Không giới thiệu lại bản thân, không lặp lại mức giá hoặc thông tin đã giải thích ở các câu trước trừ khi khách hàng hỏi lại. Hãy phản hồi như một cuộc trò chuyện tự nhiên, liên tục.
3. Nếu khách hàng hỏi những câu ngắn (ví dụ: "còn gói nào khác không?", "giá bao nhiêu?"), hãy dựa vào ngữ cảnh trước đó để hiểu họ đang nói về dịch vụ nào.

============================================================
[QUY TẮC XƯNG HÔ BẮT BUỘC - TUYỆT ĐỐI TUÂN THỦ]
============================================================
${honorificRule}

============================================================
[4 NGUYÊN TẮC VẬN HÀNH & CHỈNH SỬA LỖI BẮT BUỘC]
============================================================
* LỖI 1 (Lệch giờ mở cửa):
  - TUYỆT ĐỐI KHÔNG ĐƯỢC trả lời mở cửa lúc 5:00 sáng hay đóng cửa lúc 22:00.
  - BẮT BUỘC PHẢI TRẢ LỜI ĐÚNG ĐỊNH DẠNG:
    Giờ mở cửa:
    * T2 - T7 (06:00 - 21:00)
    * CN (06:00 - 20:30)

* LỖI 2 (Bảng giá & Chương trình hội viên chuẩn xác):
  - TUYỆT ĐỐI TUÂN THỦ bảng giá thực tế:
    + Gói Hội Viên Gym: Gốc 549.000đ/tháng, chương trình KM đang chạy CHỈ CÒN 349.000đ/tháng (Áp dụng trọn vẹn cho cả Gym & Boxing, HLV hỗ trợ 1:1 kỹ thuật và hướng dẫn dùng máy trong những ngày đầu, đóng theo tháng linh hoạt: lấy 349k × số tháng mong muốn).
    + Gói Hội Viên Yoga: Gốc 700.000đ/tháng, khuyến mãi còn 549.000đ/tháng (Lưu ý quan trọng: Khách inbox hỏi mới báo giá vì phòng không tập trung cho bộ môn Yoga lắm. Không chủ động báo giá Yoga nếu khách chỉ hỏi Gym).
    + Gói Toàn Diện Yoga & Gym: Gốc 950.000đ/tháng, khuyến mãi còn 699.000đ/tháng (Tương tự như Yoga, khách inbox hỏi mới báo giá. Gói này bao gồm tập Yoga không giới hạn theo lịch + Full Gym & Boxing).
    + Vé ngày Day Pass: 100.000đ/ngày (Trải nghiệm máy Gym, Cardio, Boxing, tủ locker an toàn, phòng tắm nóng lạnh).
    + Không có dịch vụ xông hơi hay đo Inbody miễn phí ở gói Gym thường.
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
   - Không gian phòng tập: Quy mô thoáng mát, sạch sẽ, thơm tinh dầu sả chanh tự nhiên, khu tập máy và khu Boxing chuyên dụng, tủ đồ locker an toàn, phòng tắm nóng lạnh và bãi giữ xe rộng rãi miễn phí.
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
AI Response: "Dạ em chào ${customerCall} ạ! The Shine Fitness & Yoga toạ lạc tại số 154 Hoàng Hoa Thám, Phường Bảy Hiền (Phường 12 cũ), Quận Tân Bình.
Giờ mở cửa:
* T2 - T7 (06:00 - 21:00)
* CN (06:00 - 20:30)
Khung giờ sáng đến đầu giờ chiều tập cực kỳ thoáng mát và yên tĩnh. Không biết ${customerCall} dự định ghé tập vào khung giờ nào để em hỗ trợ đón tiếp tốt nhất ạ?"

[Tình huống 2: Khách hỏi giá và gói tập Gym]
User: "Gói tập gym 1 tháng bao nhiêu tiền em?"
AI Response: "Dạ em chào ${customerCall} ạ! Hiện tại gói Hội Viên Gym bên em có giá gốc 549.000đ/tháng, nhưng đang có chương trình khuyến mãi giảm chỉ còn 349.000đ/tháng thôi ạ (áp dụng trọn vẹn cho cả Gym & Boxing, đóng tiền theo tháng linh hoạt). Đặc biệt trong những ngày đầu, các bạn HLV sẽ hỗ trợ 1:1 kỹ thuật và chỉ dẫn máy móc tận tình cho mình. Hiện The Shine đang tặng Voucher 3 ngày tập thử miễn phí (mã ${TRIAL_VOUCHER_CODE}), ${customerCall} có muốn đăng ký trải nghiệm trước không ạ?"

[Tình huống 3: Khách hỏi giá gói Yoga hoặc Full Yoga & Gym]
User: "Bên mình có gói Yoga không em, giá thế nào?"
AI Response: "Dạ em chào ${customerCall} ạ! Bên em có lớp Yoga với Master chuyên nghiệp. Gói Hội Viên Yoga giá gốc 700.000đ/tháng, khuyến mãi còn 549.000đ/tháng; còn gói Toàn Diện cả Yoga & Gym giá gốc 950.000đ/tháng, khuyến mãi chỉ 699.000đ/tháng ạ. ${customerCall} dự định tập khung giờ sáng hay chiều tối để em gửi lịch lớp chi tiết cho mình nhé ạ!"

[Tình huống 4: Khách hỏi về PT kèm riêng]
User: "Thuê PT kèm riêng giá sao? Có bắt ép mua gói không em?"
AI Response: "Dạ ${customerCall} yên tâm tuyệt đối nha, các Huấn luyện viên tại The Shine (như PT Thái, PT Jackson, PT Tony, PT Minh...) đều có chứng chỉ chuyên môn, cực kỳ tận tâm sửa từng động tác và cam kết không bao giờ chèo kéo ép gói ạ. Chi phí PT 1-kèm-1 sẽ được thiết kế linh hoạt theo số buổi (12, 24 hoặc 36 buổi) tuỳ vào thể trạng và mục tiêu của mình. Em mời ${customerCall} ghé trải nghiệm phòng tập và trao đổi cùng HLV nhé ạ!"`;
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
  sanitized = sanitized.replace(/0?5:00\s*(AM|sáng)?\s*[-–]\s*22:00/gi, 'Giờ mở cửa:\n* T2 - T7 (06:00 - 21:00)\n* CN (06:00 - 20:30)');
  sanitized = sanitized.replace(/0?6:00\s*(AM|sáng)?\s*[-–]\s*22:00/gi, 'Giờ mở cửa:\n* T2 - T7 (06:00 - 21:00)\n* CN (06:00 - 20:30)');
  sanitized = sanitized.replace(/22:00\s*(PM|tối)?/gi, '21:00 (Thứ 2 - T7) hoặc 20:30 (CN)');
  sanitized = sanitized.replace(/0?5:00\s*(AM|sáng)/gi, '06:00 sáng');

  // 3. Pronoun enforce check: replace improper words like "quý khách" or solitary "bạn" when addressing customer
  const targetPronoun = ctx.pronoun;
  if (targetPronoun === 'Anh' || targetPronoun === 'Chị') {
    sanitized = sanitized.replace(/\bAnh\/Chị\b/g, targetPronoun);
    sanitized = sanitized.replace(/\bQuý khách\b/gi, targetPronoun);
  }

  // 4. Enforce single line break (collapse multiple newlines into single line break)
  sanitized = sanitized.replace(/\n{2,}/g, '\n');

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
    return `Dạ em chào ${pronoun} ạ! The Shine Fitness & Yoga toạ lạc tại số 154 Hoàng Hoa Thám, Phường Bảy Hiền (Phường 12 cũ), Quận Tân Bình.\nGiờ mở cửa:\n* T2 - T7 (06:00 - 21:00)\n* CN (06:00 - 20:30)\nKhung giờ sáng đến đầu giờ chiều tập cực kỳ thoáng mát và yên tĩnh. Không biết ${pronoun} dự định ghé tập vào khung giờ nào để em hỗ trợ tốt nhất ạ?`;
  }

  // Intent 2: Price & Packages
  if (msgLower.includes('giá') || msgLower.includes('bao nhiêu') || msgLower.includes('gói') || msgLower.includes('học phí') || msgLower.includes('thẻ tập') || msgLower.includes('day pass') || msgLower.includes('vé ngày') || msgLower.includes('sinh viên')) {
    return `Dạ hiện tại The Shine đang có các chương trình ưu đãi rất tốt theo nhu cầu của mình ạ:
- Gói Hội Viên Gym: Gốc 549k/tháng, chương trình KM đang chạy chỉ còn 349k/tháng (áp dụng cho cả Gym & Boxing, đóng theo tháng linh hoạt, HLV hỗ trợ 1:1 kỹ thuật máy ban đầu).
- Gói Hội Viên Yoga: Gốc 700k/tháng, KM còn 549k/tháng (tham gia các lớp Yoga theo lịch hàng tuần).
- Gói Toàn Diện Yoga & Gym: Gốc 950k/tháng, KM còn 699k/tháng (không giới hạn Yoga & Gym).
- Vé ngày Day Pass: 100k/ngày (trải nghiệm tự do máy gym, cardio, boxing, tủ locker và tắm nóng lạnh).
Đặc biệt học sinh - sinh viên được giảm thêm 20% khi xuất trình thẻ HSSV và có hỗ trợ trả góp 0% qua thẻ tín dụng nhé ạ. Hiện The Shine đang tặng Voucher 3 ngày tập thử miễn phí 100% (mã ${TRIAL_VOUCHER_CODE}), ${pronoun} có muốn đăng ký trải nghiệm trước không ạ?`;
  }

  // Intent 3: Personal Trainer (PT)
  if (msgLower.includes('pt') || msgLower.includes('huấn luyện viên') || msgLower.includes('kèm') || msgLower.includes('thầy') || msgLower.includes('coach')) {
    return `Dạ ${pronoun} yên tâm tuyệt đối nha, các Huấn luyện viên tại The Shine (như PT Thái, PT Jackson, PT Tony, PT Minh...) đều có chứng chỉ chuyên môn, cực kỳ tận tâm sửa từng động tác và cam kết không bao giờ chèo kéo ép gói ạ. Chi phí PT 1-kèm-1 sẽ được thiết kế linh hoạt theo số buổi (12, 24 hoặc 36 buổi) tuỳ vào thể trạng và mục tiêu của mình. Em mời ${pronoun} ghé trải nghiệm phòng tập và nhận tư vấn trực tiếp cùng HLV nhé ạ!`;
  }

  // Intent 4: Yoga, Zumba, Amenities
  if (msgLower.includes('yoga') || msgLower.includes('zumba') || msgLower.includes('lớp') || msgLower.includes('boxing') || msgLower.includes('gửi xe') || msgLower.includes('tắm')) {
    return `Dạ tại The Shine (154 Hoàng Hoa Thám, Tân Bình), các lớp Yoga và Zumba được giảng dạy bài bản trong phòng studio thoáng mát với thảm và dụng cụ đầy đủ ạ! Ngoài ra phòng tập có khu Boxing năng động, dàn máy tập hiện đại, locker an toàn, phòng tắm nóng lạnh tiện nghi và bãi giữ xe rộng rãi miễn phí. The Shine đang gửi tặng ${pronoun} Voucher 3 ngày tập thử 0đ (mã ${TRIAL_VOUCHER_CODE}), ${pronoun} muốn ghé trải nghiệm lớp Yoga hay tập Gym/Boxing trước ạ?`;
  }

  // Default friendly consultation with CTA
  return `Dạ em chào ${pronoun} ạ! Em là tư vấn viên tại The Shine Fitness & Yoga (154 Hoàng Hoa Thám, Tân Bình).\nGiờ mở cửa:\n* T2 - T7 (06:00 - 21:00)\n* CN (06:00 - 20:30)\nHiện The Shine đang tặng Voucher 03 ngày tập thử miễn phí 100% (mã ${TRIAL_VOUCHER_CODE}). Không biết ${pronoun} đang quan tâm đến gói tập gym giảm mỡ, lớp Yoga/Zumba hay muốn tìm hiểu khóa PT 1-kèm-1 ạ?`;
}
