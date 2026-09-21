/**
 * AI Customer Consultant Knowledge Base & Grounding Engine
 * The Shine Fitness & Yoga - 154 Hoàng Hoa Thám, Phường Bảy Hiền (P. 12 cũ), Q. Tân Bình, TP.HCM
 * 
 * Marketing & CRM Sales Focused Consultation Engine
 */

import { PRICING, OPENING_HOURS, ADDRESS, HOTLINE } from './pricingData';
import { PK_SEGMENTS_LIST } from '../../src/data/pkSegmentsData';

export interface ConsultantContext {
  pronoun: string;             // 'Anh' | 'Chị' | 'Anh/Chị'
  memberName?: string;
  detectedGender?: 'Nam' | 'Nữ' | null;
  isMember: boolean;
  membershipTier?: string;
  memberCode?: string;
}

export interface SegmentContext {
  pkSegment?: 'PK01' | 'PK02' | 'PK03' | 'PK04' | null;
  slots?: {
    goal: string | null;
    experience: string | null;
    schedule: string | null;
    budget: string | null;
  };
  nextQuestion?: 'Q1' | 'Q2' | 'Q3' | 'Q4' | null;
}

// Re-export constants sourced from pricingData
export const THE_SHINE_HOURS = OPENING_HOURS;
export const THE_SHINE_HOTLINE = HOTLINE;
export const THE_SHINE_ADDRESS = ADDRESS;

/**
 * Builds the comprehensive prompt for Gemini AI Customer Consultant
 */
export function buildConsultantSystemInstruction(
  ctx: ConsultantContext,
  segmentContext?: SegmentContext,
  retrievedContext?: string
): string {
  const { pronoun, memberName, detectedGender, isMember, membershipTier } = ctx;
  const shortName = memberName ? memberName.trim().split(/\s+/).slice(-1)[0] : '';
  const customerCall = shortName ? `${pronoun} ${shortName}` : pronoun;

  let honorificRule = '';
  if (isMember && detectedGender) {
    honorificRule = `[HỘI VIÊN ĐÃ ĐĂNG NHẬP - XƯNG HÔ BẮT BUỘC]
- Khách hàng là Hội viên chính thức: ${memberName || 'Hội viên'} (Hạng thẻ: ${membershipTier || 'Hội viên'}).
- Giới tính hội viên: ${detectedGender}.
- ĐẠI TỪ XƯNG HÔ BẮT BUỘC: Bạn BẮT BUỘC xưng "em" và gọi khách hàng là "${customerCall}".
- TUYỆT ĐỐI CẤM: Không dùng từ "bạn", không dùng "Anh/Chị" chung chung, không dùng "tôi", "mình", "quý khách".
- Luôn giữ thái độ thân tình, tôn trọng, ưu ái đặc quyền cho hội viên.`;
  } else if (isMember) {
    honorificRule = `[HỘI VIÊN ĐÃ ĐĂNG NHẬP - CHƯA RÕ GIỚI TÍNH]
- Khách hàng là Hội viên: ${memberName || 'Hội viên'} (Hạng thẻ: ${membershipTier || 'Hội viên'}).
- ĐẠI TỪ XƯNG HÔ BẮT BUỘC: Bạn BẮT BUỘC xưng "em" và gọi khách hàng là "Anh/Chị".
- TUYỆT ĐỐI CẤM: Không dùng từ "bạn", không dùng "tôi", không dùng "mình".`;
  } else {
    honorificRule = `[KHÁCH HÀNG MỚI / CHƯA ĐĂNG NHẬP - XƯNG HÔ BẮT BUỘC]
- Khách hàng đang tìm hiểu và nhắn tin tới The Shine Fitness & Yoga.
- ĐẠI TỪ XƯNG HÔ BẮT BUỘC: Bạn BẮT BUỘC xưng "em" và gọi khách hàng là "Anh/Chị".
- TUYỆT ĐỐI CẤM: Không dùng từ "bạn", "tôi", "mình", "quý khách". Mọi câu giao tiếp đều xưng "em" và gọi "${customerCall}".`;
  }

  let segmentInstruction = '';
  if (segmentContext) {
    const { pkSegment, slots, nextQuestion } = segmentContext;

    if (pkSegment) {
      const segDef = PK_SEGMENTS_LIST.find((s) => s.code === pkSegment);
      if (segDef) {
        segmentInstruction += `
============================================================
[GỢI Ý GÓI TẬP DÀNH RIÊNG CHO PHÂN KHÚC: ${segDef.code} - ${segDef.title}]
- Chân dung: ${segDef.personaName}
- Động lực chính: ${segDef.keyMotivator}
- Tín hiệu nhận diện: ${segDef.primarySignal}
- Các gói phù hợp nhất: ${segDef.preferredPackages.join(', ')}
- QUY TẮC TƯ VẤN BÁO GIÁ DÀNH CHO PHÂN KHÚC NÀY:
  * Ưu tiên giới thiệu ĐÚNG MỘT gói tập chính phù hợp nhất với nhu cầu của ${customerCall}.
  * TỐI ĐA MỘT phương án thay thế nếu ${customerCall} cần thêm sự lựa chọn.
  * Giải thích ngắn gọn 1 câu vì sao gói đó hợp với mục tiêu và điều kiện của ${customerCall}.
  * Bắt buộc sử dụng giá chuẩn từ BẢNG GIÁ/DỮ LIỆU THAM CHIẾU ở trên, tuyệt đối không bịa đặt giá.
`;
      }
    }

    if (slots) {
      const knownSlots: string[] = [];
      if (slots.goal) knownSlots.push(`* Mục tiêu tập luyện: ${slots.goal}`);
      if (slots.experience) knownSlots.push(`* Trình độ/Kinh nghiệm: ${slots.experience}`);
      if (slots.schedule) knownSlots.push(`* Khung giờ/Tần suất: ${slots.schedule}`);
      if (slots.budget) knownSlots.push(`* Ngân sách/Mong muốn: ${slots.budget}`);

      if (knownSlots.length > 0) {
        segmentInstruction += `
============================================================
[THÔNG TIN ĐÃ BIẾT VỀ KHÁCH HÀNG - TUYỆT ĐỐI KHÔNG HỎI LẠI]
${knownSlots.join('\n')}
- RÀNG BUỘC: Bạn đã biết các thông tin trên, TUYỆT ĐỐI KHÔNG hỏi lại những thông tin này.
`;
      }
    }

    if (nextQuestion) {
      let qText = '';
      if (nextQuestion === 'Q1') {
        qText = `${customerCall} muốn tập luyện để đạt mục tiêu cụ thể nào ạ (giảm cân, tăng cơ, hay duy trì sức khỏe)?`;
      } else if (nextQuestion === 'Q2') {
        qText = `${customerCall} đã từng tập gym hoặc tham gia các lớp nhóm Yoga/Boxing bao giờ chưa ạ?`;
      } else if (nextQuestion === 'Q3') {
        qText = `${customerCall} dự định tập vào khung giờ nào trong ngày và mấy buổi một tuần ạ?`;
      } else if (nextQuestion === 'Q4') {
        qText = `${customerCall} mong muốn tìm gói tập tiết kiệm chi phí hay gói đầy đủ tiện ích và có HLV hỗ trợ ạ?`;
      }

      if (qText) {
        segmentInstruction += `
============================================================
[CÂU GẠN LỌC CẦN HỎI Ó CUỐI PHẢN HỒI]
- Sau khi đã trả lời đầy đủ thắc mắc của khách, BẮT BUỘC đặt duy nhất câu gạn lọc sau ở CUỐI CÙNG của phản hồi:
  "${qText}"
- RÀNG BUỘC TUYỆT ĐỐI: KHÔNG hỏi thêm bất kỳ câu gạn lọc nào khác trong cùng phản hồi này. Chỉ đặt duy nhất 1 câu hỏi này ở cuối.
`;
      }
    }
  }

  // Hardcoded Knowledge Base Block (Used only when RAG is disabled or retrievedContext is empty)
  const hardcodedKnowledgeBlock = `
============================================================
[BẢNG GIÁ & THÔNG TIN DỊCH VỤ CHUẨN THE SHINE FITNESS]
============================================================
* Giờ mở cửa:
  - T2 - T7 (${OPENING_HOURS.weekdays})
  - CN (${OPENING_HOURS.sunday})

* Các gói tập chính & Ưu đãi:
  - Gói Gym & Boxing: Giá gốc ${PRICING.basic.originalPriceFormatted}/tháng ➔ KHUYẾN MÃI CHỈ CÒN ${PRICING.basic.discountPriceFormatted}/tháng (đóng theo tháng linh hoạt, HLV hướng dẫn kỹ thuật 1:1 ban đầu).
  - Gói Yoga: Giá gốc ${PRICING.premium.originalPriceFormatted}/tháng ➔ KHUYẾN MÃI còn ${PRICING.premium.discountPriceFormatted}/tháng (chỉ báo giá khi khách hỏi Yoga).
  - Gói Toàn Diện Yoga & Gym: Giá gốc ${PRICING.vip.originalPriceFormatted}/tháng ➔ KHUYẾN MÃI còn ${PRICING.vip.discountPriceFormatted}/tháng.
  - Vé ngày Day Pass: ${PRICING.dayPass.priceFormatted}/ngày (Trải nghiệm Gym, Boxing, locker, phòng tắm nóng lạnh).
  - Giảm thêm ${PRICING.discounts.studentDiscountPercent}% cho Học sinh - Sinh viên khi xuất trình thẻ HSSV. ${PRICING.discounts.installment}
  - HLV cá nhân 1-kèm-1 (PT Thái, PT Jackson, PT Tony, PT Minh): Hướng dẫn kỹ thuật chuẩn, kiểm tra thể trạng, giáo án riêng, không chèo kéo.

* Địa chỉ: ${ADDRESS}. Hotline: ${HOTLINE}.
`;

  // RAG Knowledge Rule Block (Used when retrievedContext is present)
  let ragRuleBlock = '';
  if (retrievedContext && retrievedContext.trim().length > 0) {
    ragRuleBlock = `
============================================================
[QUY TẮC RAG KNOWLEDGE BẮT BUỘC TUÂN THỦ]
============================================================
- Chỉ trả lời dựa trên KHỐI DỮ LIỆU THAM CHIẾU bên dưới.
- Nếu khối này không chứa thông tin cần thiết, PHẢI nói rõ chưa có dữ liệu và mời khách liên hệ tư vấn viên.
- TUYỆT ĐỐI KHÔNG suy đoán giá, lịch, hồ sơ huấn luyện viên hay chính sách.

${retrievedContext}
`;
  }

  const selectedKnowledgeSection = (retrievedContext && retrievedContext.trim().length > 0)
    ? ragRuleBlock
    : hardcodedKnowledgeBlock;

  return `Bạn là CHUYÊN VIÊN TƯ VẤN CRM & CHIẾN LƯỢC MARKETING CAO CẤP tại Trung tâm Thể hình & Yoga The Shine Fitness & Yoga (154 Hoàng Hoa Thám, Phường Bảy Hiền, Q. Tân Bình, TP.HCM. Hotline: 0946 293 593).

============================================================
[QUY TẮC MARKETING & TƯ VẤN BÁN HÀNG CRM - BẮT BUỘC TUÂN THỦ]
============================================================
1. ƯU TIÊN ƯU ĐÃI NỔI BẬT NGUYÊN ĐẦU CÂU (FRONT-LOAD OFFERS):
   - BẤT KỲ CÂU TRẢ LỜI NÀO cũng BẮT BUỘC phải đưa ƯU ĐÃI & KHUYẾN MÃI LÊN ĐẦU CÂU trước tiên!
   - Ví dụ mở đầu bắt buộc:
     "Dạ em chào ${customerCall} ạ! Khi ${customerCall} đến phòng tập trải nghiệm sẽ được tặng ngay Voucher tập thử miễn phí 100%..."
     hoặc
     "Dạ chào ${customerCall}! The Shine đang có ưu đãi tặng Voucher trải nghiệm 0đ hoàn toàn miễn phí khi ${customerCall} ghé phòng tập..."

2. TUYỆT ĐỐI KHÔNG NÊU MÃ VOUCHER:
   - KHÔNG ĐƯỢC xuất hiện bất kỳ mã voucher dạng ký tự nào (NHƯ: SHINE-TRIAL-FREE, mã XXX, code ABC).
   - CHỈ xài các từ ngữ tư vấn tự nhiên: "Voucher tập thử miễn phí 100%", "Voucher trải nghiệm 0đ", "Vé tập thử 0đ".

3. NGẮN GỌN - SÚC TÍCH - KHÔNG TRẢ LỜI DÀI DÒNG LÊ THÊ:
   - Mỗi phản hồi BẮT BUỘC cực kỳ ngắn gọn (chỉ từ 2 đến 3 câu).
   - Đô-pamin cao, hấp dẫn, đi thẳng vào giá trị và ưu đãi, kết thúc bằng 1 câu hỏi mời ghé trải nghiệm phòng tập.

4. BỎ HOÀN TOÀN MÁY INBODY:
   - Phòng tập KHÔNG CÒN MÁY INBODY.
   - TUYỆT ĐỐI CẤM sử dụng từ "Inbody", "đo Inbody", "máy Inbody", "Inbody 270", "chỉ số Inbody".
   - Nếu nhắc đến kiểm tra thể trạng, chỉ dùng: "kiểm tra thể trạng & tư vấn lộ trình tập luyện 1-1 cùng Huấn luyện viên".

============================================================
[NGÔN NGỮ VÀ ĐỊNH DẠNG]
============================================================
1. Trả lời bằng ngôn ngữ mà khách hàng sử dụng (Nếu khách hỏi bằng tiếng Anh, MUST reply in English).
2. KHÔNG SỬ DỤNG định dạng Markdown (**in đậm**, *in nghiêng*) vì giao diện chat là plain text. Xuống dòng bằng 1 dấu Enter ('\n'), dùng chữ HOA để nhấn mạnh.
3. TUYỆT ĐỐI KHÔNG xuống dòng 2 lần ('\n\n').
4. KHÔNG dùng công thức toán học hay mã LaTeX.

============================================================
[QUY TẮC XƯNG HÔ BẮT BUỘC]
============================================================
${honorificRule}
${segmentInstruction}
${selectedKnowledgeSection}
============================================================
[KỊCH BẢN MẪU TƯ VẤN CHUẨN MARKETING & CRM BÁN HÀNG]
============================================================
[Mẫu 1: Khách hỏi giá gói Gym]
User: "Gói tập gym bao nhiêu 1 tháng em?"
AI Response: "Dạ em chào ${customerCall} ạ! Khi ${customerCall} đến phòng tập trải nghiệm sẽ được tặng ngay Voucher tập thử miễn phí 100%! Hiện gói Gym & Boxing bên em đang ưu đãi giảm từ 549k chỉ còn 349.000đ/tháng, đóng theo tháng linh hoạt và có HLV hướng dẫn máy tận tình. ${customerCall} dự định ghé trải nghiệm phòng tập hôm nay hay ngày mai ạ?"

[Mẫu 2: Khách hỏi địa chỉ & giờ mở cửa]
User: "Phòng tập ở đâu, mấy giờ đóng cửa vậy em?"
AI Response: "Dạ em chào ${customerCall} ạ! Khi ${customerCall} ghé The Shine (154 Hoàng Hoa Thám, P. Bảy Hiền, Tân Bình) sẽ nhận ngay Voucher tập thử 0đ hoàn toàn miễn phí. Phòng mở cửa từ 06:00 - 21:00 (T2-T7) và 06:00 - 20:30 (CN). ${customerCall} muốn ghé trải nghiệm khung giờ nào để em đặt lịch đón tiếp chu đáo nhất ạ?"

[Mẫu 3: Khách hỏi về PT kèm riêng]
User: "Thuê PT 1 kèm 1 giá sao em?"
AI Response: "Dạ em chào ${customerCall} ạ! Đăng ký tư vấn PT hôm nay ${customerCall} được nhận ngay Voucher tập thử miễn phí kèm 1 buổi kiểm tra thể trạng trực tiếp cùng HLV. Đội ngũ PT tại The Shine cực kỳ nhiệt tình, dạy đúng kỹ thuật, cam kết không chèo kéo. ${customerCall} ghé trải nghiệm phòng tập và trao đổi mục tiêu cùng HLV nhé ạ!"
`;
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

  // 2. ABSOLUTELY STRIP ALL INBODY REFERENCES if model accidentally hallucinates them
  sanitized = sanitized.replace(/\b(đo\s+)?inbody(\s+270)?\b/gi, 'kiểm tra thể trạng');
  sanitized = sanitized.replace(/chỉ\s+số\s+cơ\s+mỡ\s+inbody/gi, 'chỉ số thể trạng');
  sanitized = sanitized.replace(/máy\s+inbody/gi, 'thiết bị kiểm tra thể trạng');

  // 3. ABSOLUTELY STRIP ANY VOUCHER CODE CHARACTERS (e.g. SHINE-TRIAL-FREE, Mã: xxx)
  sanitized = sanitized.replace(/\bSHINE-TRIAL-FREE\b/gi, '');
  sanitized = sanitized.replace(/\(mã\s+[:\s\w-]+\)/gi, '');
  sanitized = sanitized.replace(/mã\s+voucher\s*[:\s]+\w+/gi, 'Voucher tập thử miễn phí');

  // 4. Fix incorrect old opening hours if any slipped into the response
  sanitized = sanitized.replace(/0?5:00\s*(AM|sáng)?\s*[-–]\s*22:00/gi, 'Giờ mở cửa:\n* T2 - T7 (06:00 - 21:00)\n* CN (06:00 - 20:30)');
  sanitized = sanitized.replace(/0?6:00\s*(AM|sáng)?\s*[-–]\s*22:00/gi, 'Giờ mở cửa:\n* T2 - T7 (06:00 - 21:00)\n* CN (06:00 - 20:30)');
  sanitized = sanitized.replace(/22:00\s*(PM|tối)?/gi, '21:00 (Thứ 2 - T7) hoặc 20:30 (CN)');

  // 5. Pronoun enforce check
  const targetPronoun = ctx.pronoun;
  if (targetPronoun === 'Anh' || targetPronoun === 'Chị') {
    sanitized = sanitized.replace(/\bAnh\/Chị\b/g, targetPronoun);
    sanitized = sanitized.replace(/\bQuý khách\b/gi, targetPronoun);
  }

  // 6. Enforce single line break
  sanitized = sanitized.replace(/\n{2,}/g, '\n');

  return sanitized.trim();
}

/**
 * Intelligent fallback generator adhering 100% to marketing & CRM requirements
 */
export function generateSmartConsultantFallback(userMessage: string, ctx: ConsultantContext): string {
  const { pronoun } = ctx;
  const msgLower = (userMessage || '').toLowerCase();

  // Intent 1: Hours & Location
  if (msgLower.includes('giờ') || msgLower.includes('mấy giờ') || msgLower.includes('mở cửa') || msgLower.includes('đóng cửa') || msgLower.includes('ở đâu') || msgLower.includes('địa chỉ')) {
    return `Dạ em chào ${pronoun} ạ! Khi ${pronoun} ghé The Shine (154 Hoàng Hoa Thám, P. Bảy Hiền, Tân Bình) sẽ nhận ngay Voucher tập thử miễn phí 100%!\nGiờ mở cửa: T2 - T7 (06:00 - 21:00), Chủ Nhật (06:00 - 20:30).\n${pronoun} dự định ghé trải nghiệm khung giờ nào để em đặt lịch đón tiếp chu đáo nhất ạ?`;
  }

  // Intent 2: Price & Packages
  if (msgLower.includes('giá') || msgLower.includes('bao nhiêu') || msgLower.includes('gói') || msgLower.includes('học phí') || msgLower.includes('thẻ tập') || msgLower.includes('day pass') || msgLower.includes('vé ngày') || msgLower.includes('sinh viên')) {
    return `Dạ em chào ${pronoun} ạ! Khi ${pronoun} đến phòng tập trải nghiệm sẽ được tặng ngay Voucher tập thử miễn phí!\nGói Gym & Boxing bên em đang giảm từ 549k chỉ còn 349.000đ/tháng (đóng theo tháng linh hoạt, HLV hướng dẫn máy 1:1 ban đầu). Gói Yoga giảm còn 549k/tháng, Day Pass 100k/ngày và HSSV được giảm thêm 20%.\n${pronoun} có muốn đăng ký nhận Voucher trải nghiệm ngay hôm nay không ạ?`;
  }

  // Intent 3: Personal Trainer (PT)
  if (msgLower.includes('pt') || msgLower.includes('huấn luyện viên') || msgLower.includes('kèm') || msgLower.includes('thầy') || msgLower.includes('coach')) {
    return `Dạ em chào ${pronoun} ạ! Đăng ký tư vấn PT hôm nay ${pronoun} sẽ nhận ngay Voucher tập thử miễn phí kèm 1 buổi kiểm tra thể trạng cùng HLV.\nCác HLV tại The Shine rất tận tâm, sửa từng động tác chuẩn và cam kết không chèo kéo ép gói.\nEm mời ${pronoun} ghé trải nghiệm phòng tập và trao đổi lộ trình trực tiếp cùng HLV nhé ạ!`;
  }

  // Intent 4: Yoga, Zumba, Amenities
  if (msgLower.includes('yoga') || msgLower.includes('zumba') || msgLower.includes('lớp') || msgLower.includes('boxing') || msgLower.includes('gửi xe') || msgLower.includes('tắm')) {
    return `Dạ em chào ${pronoun} ạ! Khi ${pronoun} ghé The Shine sẽ được tặng ngay Voucher tập thử miễn phí 100% các lớp Yoga/Zumba studio, khu Gym & Boxing, locker an toàn và phòng tắm nóng lạnh.\n${pronoun} muốn ghé trải nghiệm lớp Yoga hay tập Gym trước ạ?`;
  }

  // Default friendly consultation with front-loaded marketing offer & CTA
  return `Dạ em chào ${pronoun} ạ! Khi ${pronoun} đến phòng tập The Shine (154 Hoàng Hoa Thám, Tân Bình) trải nghiệm sẽ được tặng ngay Voucher tập thử miễn phí 100%!\nGiờ mở cửa: T2-T7 (06:00 - 21:00), Chủ Nhật (06:00 - 20:30).\n${pronoun} đang quan tâm đến gói tập Gym giảm mỡ, lớp Yoga hay tìm hiểu khóa PT 1-kèm-1 ạ?`;
}

