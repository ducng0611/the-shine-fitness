import { sanitizePii } from './chatLogStorage';

export type HandoverTag = 
  | 'REQUEST_HUMAN' 
  | 'HOT_LEAD_OR_NEGOTIATION' 
  | 'COMPLAINT' 
  | 'LOW_CONFIDENCE' 
  | 'HEALTH_RISK';

// Helper to remove Vietnamese diacritics for flexible keyword matching
export function removeDiacritics(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

// Normalized keywords mapping for each handover tag
const HEALTH_RISK_KEYWORDS = [
  'chan thuong', 'dau goi', 'dau lung', 'thoat vi', 'benh ly', 'mang thai', 
  'co thai', 'dang dieu tri', 'chua benh', 'phuc hoi chuc nang', 'mo khop',
  'dau vai', 'dau co', 'tim mach', 'huyet ap', 'chấn thương', 'đau gối', 
  'đau lưng', 'thoát vị', 'bệnh lý', 'mang thai', 'điều trị bệnh', 'chữa bệnh', 
  'phẫu thuật', 'mổ khớp', 'mổ dây chằng', 'bệnh tim', 'huyết áp', 'injury', 'pregnant', 'surgery'
];

const COMPLAINT_KEYWORDS = [
  'phan nan', 'khieu nai', 'buc xuc', 'te qua', 'phong tap ban', 'nhan vien thai do', 
  'phuc vu kem', 'mat do', 'lua dao', 'quang cao lao', 'khiếu nại', 'phàn nàn', 
  'bức xúc', 'tệ quá', 'phòng tập bẩn', 'thái độ kém', 'phục vụ quá kém', 
  'mất đồ', 'lừa đảo', 'quá tệ', 'quá kém', 'complaint', 'bad service', 'dirty', 'scam'
];

const REQUEST_HUMAN_KEYWORDS = [
  'gap nguoi that', 'gap tu van vien', 'so dien thoai nhan vien', 'noi chuyen truc tiep', 
  'cho xin so hotline', 'gap nhan vien', 'gap cskh', 'nguoi that tu van', 'cho gap nguoi',
  'gặp người thật', 'gặp tư vấn viên', 'số điện thoại nhân viên', 'nói chuyện trực tiếp', 
  'gặp nhân viên', 'gặp cskh', 'xin gặp hotline', 'talk to human', 'speak to agent', 'human agent',
  'nhan vien tu van', 'nhan vien ho tro', 'tu van truc tiep', 'gap truc tiep', 'chuyen cho nhan vien',
  'nhân viên tư vấn', 'nhân viên hỗ trợ', 'tư vấn trực tiếp', 'gặp trực tiếp', 'chuyển cho nhân viên'
];

const HOT_LEAD_KEYWORDS = [
  'dang ky chinh thuc', 'chot goi', 'thuong luong gia', 'giam gia them', 'giam them', 
  'xin giam gia', 'giu gia', 'giu cho', 'mua goi ngay', 'chuyen khoan giu cho', 
  'đăng ký chính thức', 'chốt gói', 'thương lượng giá', 'giảm thêm', 'xin giảm', 
  'giữ giá', 'giữ chỗ', 'mua gói ngay', 'chuyển khoản giữ chỗ', 'chuyen tien giu cho',
  'book package', 'negotiate price', 'reserve spot'
];

const LOW_CONFIDENCE_INDICATORS = [
  'khong co thong tin', 'chua ro', 'rat tiec', 'em chua nam', 'chua co du lieu', 
  'du lieu chua cap nhat', 'chua the phan hoi', 'không có thông tin', 'chưa rõ', 
  'rất tiếc', 'chưa nắm', 'chưa có dữ liệu'
];

/**
 * Detects whether a message or conversation history triggers a human handover.
 * 
 * PRIORITY ORDER:
 * 1. HEALTH_RISK
 * 2. COMPLAINT
 * 3. REQUEST_HUMAN
 * 4. HOT_LEAD_OR_NEGOTIATION
 * 5. LOW_CONFIDENCE
 * 
 * LÝ DO THỨ TỰ ƯU TIÊN: An toàn sức khỏe (HEALTH_RISK) và xử lý khiếu nại bức xúc (COMPLAINT) 
 * phải luôn được ưu tiên xử lý hàng đầu trước các nhu cầu gặp nhân viên (REQUEST_HUMAN), 
 * động cơ bán hàng (HOT_LEAD_OR_NEGOTIATION) hay hỗ trợ khi bot không rõ thông tin (LOW_CONFIDENCE).
 */
export function detectHandoverTrigger(
  message: string, 
  history: { role: string; text: string }[] = []
): { tag: HandoverTag | null; reason: string } {
  if (!message || typeof message !== 'string') {
    return { tag: null, reason: '' };
  }

  const rawLower = message.toLowerCase().trim();
  const normalizedMsg = removeDiacritics(message);

  // 1. HEALTH_RISK check
  for (const kw of HEALTH_RISK_KEYWORDS) {
    const normKw = removeDiacritics(kw);
    if (normalizedMsg.includes(normKw) || rawLower.includes(kw.toLowerCase())) {
      return {
        tag: 'HEALTH_RISK',
        reason: `Khách đề cập vấn đề sức khỏe/chấn thương: "${kw}"`
      };
    }
  }

  // 2. COMPLAINT check
  for (const kw of COMPLAINT_KEYWORDS) {
    const normKw = removeDiacritics(kw);
    if (normalizedMsg.includes(normKw) || rawLower.includes(kw.toLowerCase())) {
      return {
        tag: 'COMPLAINT',
        reason: `Khách phản ánh khiếu nại/bức xúc dịch vụ: "${kw}"`
      };
    }
  }

  // 3. REQUEST_HUMAN check
  for (const kw of REQUEST_HUMAN_KEYWORDS) {
    const normKw = removeDiacritics(kw);
    if (normalizedMsg.includes(normKw) || rawLower.includes(kw.toLowerCase())) {
      return {
        tag: 'REQUEST_HUMAN',
        reason: `Khách trực tiếp yêu cầu kết nối tư vấn viên/người thật: "${kw}"`
      };
    }
  }

  // 4. HOT_LEAD_OR_NEGOTIATION check
  for (const kw of HOT_LEAD_KEYWORDS) {
    const normKw = removeDiacritics(kw);
    if (normalizedMsg.includes(normKw) || rawLower.includes(kw.toLowerCase())) {
      return {
        tag: 'HOT_LEAD_OR_NEGOTIATION',
        reason: `Khách có nhu cầu chốt gói/thương lượng giá/giữ chỗ: "${kw}"`
      };
    }
  }

  // 5. LOW_CONFIDENCE check (derived from conversation history)
  if (history && Array.isArray(history) && history.length >= 2) {
    // Check last 2 bot responses in history
    const botReplies = history
      .filter(h => h.role === 'model' || h.role === 'assistant' || h.role === 'bot')
      .slice(-2);

    if (botReplies.length >= 2) {
      let lowConfCount = 0;
      for (const reply of botReplies) {
        const normReply = removeDiacritics(reply.text || '');
        if (LOW_CONFIDENCE_INDICATORS.some(ind => normReply.includes(removeDiacritics(ind)))) {
          lowConfCount++;
        }
      }
      if (lowConfCount >= 2) {
        return {
          tag: 'LOW_CONFIDENCE',
          reason: 'Bot không giải quyết được thắc mắc trong 2 lượt liên tiếp'
        };
      }
    }

    // Check if user repeated a similar question 3 times
    const userMessages = history
      .filter(h => h.role === 'user')
      .map(h => removeDiacritics(h.text || ''))
      .slice(-3);

    if (userMessages.length >= 2 && userMessages.includes(normalizedMsg)) {
      return {
        tag: 'LOW_CONFIDENCE',
        reason: 'Khách lặp lại thắc mắc tương tự nhiều lần mà chưa được phản hồi thỏa đáng'
      };
    }
  }

  return { tag: null, reason: '' };
}

/**
 * Generates initial Step 1 confirmation reply for customer.
 * - Vietnamese language, uses pronoun "em", addresses customer with provided pronoun.
 * - NO promotions, vouchers, prices, or gym visit invitations.
 * - HEALTH_RISK: NO diagnosis, NO exercise advice, recommends medical expert.
 */
export function getHandoverReply(tag: HandoverTag, pronoun: string = 'Anh/Chị'): string {
  const customerTitle = pronoun || 'Anh/Chị';

  switch (tag) {
    case 'HEALTH_RISK':
      return `Dạ em chào ${customerTitle}. Đối với các trường hợp có tiền sử chấn thương, bệnh lý hoặc tình trạng sức khỏe đặc biệt, em khuyến nghị ${customerTitle} nên tham khảo ý kiến chuyên gia y tế hoặc bác sĩ trước khi tập luyện. Em đã ghi nhận và chuyển thông tin của ${customerTitle} tới tư vấn viên chuyên môn để liên hệ hỗ trợ trực tiếp cho ${customerTitle} ạ.`;

    case 'COMPLAINT':
      return `Dạ em thành thật xin lỗi ${customerTitle} vì trải nghiệm chưa hoàn toàn như ý. Em đã ghi nhận phản ánh của ${customerTitle} và chuyển ngay tới Quản lý dịch vụ khách hàng của The Shine để kiểm tra và liên hệ hỗ trợ ${customerTitle} sớm nhất ạ.`;

    case 'REQUEST_HUMAN':
      return `Dạ em đã ghi nhận yêu cầu kết nối của ${customerTitle}. Em đang chuyển thông tin tới tư vấn viên trực ban để liên hệ hỗ trợ trực tiếp cho ${customerTitle} ngay ạ.`;

    case 'HOT_LEAD_OR_NEGOTIATION':
      return `Dạ em đã ghi nhận nhu cầu đăng ký và thông tin của ${customerTitle}. Em chuyển ngay cho chuyên viên tư vấn để liên hệ giữ chỗ và hỗ trợ phương án tối ưu nhất cho ${customerTitle} ạ.`;

    case 'LOW_CONFIDENCE':
      return `Dạ để thông tin cung cấp cho ${customerTitle} được chuẩn xác nhất, em xin phép chuyển thắc mắc của ${customerTitle} tới bộ phận chuyên môn để kiểm tra và hỗ trợ trực tiếp cho ${customerTitle} ạ.`;

    default:
      return `Dạ em đã ghi nhận thông tin của ${customerTitle} và chuyển tư vấn viên hỗ trợ ngay ạ.`;
  }
}

/**
 * Builds a plain text summary for handover queue records.
 * - Max 500 chars.
 * - Ends with line starting with "LÝ DO CHUYỂN GIAO:".
 * - PII (phone numbers and emails) sanitized.
 */
export function buildHandoverSummary(
  history: { role: string; text: string }[] = [],
  currentMessage: string = '',
  tag: HandoverTag,
  reason: string = ''
): string {
  const cleanMsg = sanitizePii(currentMessage || '');
  
  // Extract recent user queries from history (up to last 3)
  const recentQueries = history
    .filter(h => h.role === 'user')
    .slice(-3)
    .map(h => sanitizePii(h.text || ''))
    .join(' -> ');

  const contextStr = recentQueries ? `Lịch sử gần đây: ${recentQueries} | Câu mới nhất: ${cleanMsg}` : `Nhu cầu khách: ${cleanMsg}`;

  const summaryText = `${contextStr}\nLÝ DO CHUYỂN GIAO: [${tag}] ${reason}`;

  // Truncate to 500 characters max
  if (summaryText.length > 500) {
    const overflow = summaryText.length - 500;
    const truncatedContext = contextStr.slice(0, Math.max(20, contextStr.length - overflow - 10)) + '...';
    return `${truncatedContext}\nLÝ DO CHUYỂN GIAO: [${tag}] ${reason}`;
  }

  return summaryText;
}
