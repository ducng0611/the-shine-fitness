/**
 * Chính sách chuyển giao bảo thủ của sản phẩm, không phải bộ chẩn đoán y khoa.
 * Chỉ đọc lời người dùng; nội dung bot, tài liệu RAG và con số số hiệp không xác nhận tuổi.
 */
export type ProgramSafetyAudience = 'minor' | 'parent' | 'health';
export interface ProgramSafetyDecision {
  tag: 'HEALTH_RISK';
  audience: ProgramSafetyAudience;
  reason: string;
  replyText: string;
}
export function normalizeSafetyText(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
}
const HEALTH_TERMS_VI = [
  'tiểu đường', 'bệnh thận', 'hen suyễn', 'động kinh', 'tim bẩm sinh', 'vẹo cột sống',
  'rối loạn nội tiết', 'tuyến giáp', 'cho con bú', 'thuốc dài hạn', 'dùng thuốc dài hạn',
  'rối loạn ăn uống', 'chán ăn tâm thần', 'cuồng ăn', 'sữa tăng cân', 'thực phẩm chức năng',
  'thực phẩm bổ sung', 'thuốc giảm cân', 'kê đơn', 'liều thuốc', 'chấn thương',
  'đang điều trị', 'phẫu thuật', 'tim mạch', 'huyết áp', 'mang thai',
  'thuốc tăng cân', 'chán ăn', 'sụt cân', 'nội tiết', 'đĩa đệm', 'thoát vị',
  'bệnh tiêu hóa',
  'giảm cân cho bé', 'bé thừa cân', 'con béo', 'bé mập', 'ăn kiêng', 'nhịn ăn',
  'đếm calo', 'bao nhiêu calo', 'cao thêm', 'tăng chiều cao cho bé',
  'thuốc tăng chiều cao', 'canxi cho bé', 'dậy thì sớm', 'sụn tăng trưởng',
];
const MINOR_TERMS_VI = [
  'dưới 18 tuổi', 'chưa đủ 18', 'con tôi', 'con em', 'bé nhà', 'học sinh',
  'học lớp', 'cấp 1', 'cấp 2', 'cấp 3', 'tiểu học', 'trung học',
  'vị thành niên', 'trẻ em',
];
// Giữ cả bản có dấu và không dấu theo hợp đồng tích hợp; so khớp chuẩn hóa bên dưới.
export const HEALTH_RISK_KEYWORDS = [...new Set([
  ...HEALTH_TERMS_VI, ...MINOR_TERMS_VI,
  ...HEALTH_TERMS_VI.map(normalizeSafetyText), ...MINOR_TERMS_VI.map(normalizeSafetyText),
  'mass gainer', 'whey', 'creatine', 'supplement', 'supplements',
  'diabetes', 'asthma', 'epilepsy', 'hypertension', 'pregnant', 'breastfeeding',
  'eating disorder', 'unintentional weight loss', 'unexplained weight loss', 'loss of appetite', 'weight gain pills', 'height growth pills', 'growth plates', 'early puberty', 'grow taller', 'under 18', 'underage', 'minor', 'my child', 'my son', 'my daughter'
])];
const health = [...HEALTH_TERMS_VI.map(normalizeSafetyText),
  'mass gainer', 'whey', 'creatine', 'supplement', 'supplements', 'diabetes', 'asthma',
  'epilepsy', 'hypertension', 'pregnant', 'breastfeeding', 'eating disorder', 'unintentional weight loss', 'unexplained weight loss', 'loss of appetite', 'weight gain pills', 'height growth pills', 'growth plates', 'early puberty', 'grow taller'];
const youth = ['duoi 18 tuoi','chua du 18','hoc sinh','hoc lop','cap 1','cap 2','cap 3',
  'tieu hoc','trung hoc','vi thanh nien','tre em','under 18','underage','minor','middle school','high school'];

/** Giới hạn sản phẩm cho nội dung cân nặng/ăn uống của trẻ, không phải chẩn đoán. */
const MINOR_BODY_TERMS = ['giam can','giam mo','an kieng','nhin an','calo','calorie','calories','dem nang luong',
  'bao nhieu nang luong','weight loss','diet','whey','creatine','supplement','canxi','thuc pham bo sung','sua tang can','thuoc'];
const HEIGHT_TERMS = ['tang chieu cao','cao them','grow taller','height growth','growth plates','sun tang truong'];
function minorBodyReply(audience: ProgramSafetyAudience): string {
  const lead=audience==='parent'?'Dạ, em không tư vấn giảm cân, ăn kiêng, mục tiêu năng lượng hay thực phẩm bổ sung cho trẻ qua chat.':
    'Em không tư vấn giảm cân, ăn kiêng, mục tiêu năng lượng hay thực phẩm bổ sung cho người dưới 18 tuổi qua chat.';
  return `${lead} Nội dung cân nặng, thành phần cơ thể và ăn uống cần bác sĩ nhi khoa hoặc chuyên gia dinh dưỡng nhi đánh giá cùng người giám hộ. Em xin chuyển yêu cầu chuyên môn; không đưa bài tập hoặc thực đơn từ hồ sơ tham chiếu để thay cho đánh giá đó.`;
}
function heightReply(audience: ProgramSafetyAudience): string {
  const guardian=audience==='minor'?' Bạn hãy nhờ bố mẹ hoặc người giám hộ liên hệ.':'';
  return `Dạ, em không cam kết cao thêm bao nhiêu centimet hoặc khẳng định giáo án làm tăng chiều cao. Thay đổi tư thế, thành tích nhảy hoặc treo xà không đồng nghĩa chiều cao cơ thể tăng. Nội dung tăng trưởng cần bác sĩ nhi khoa hoặc chuyên gia y tế phù hợp đánh giá; bài tập cụ thể cần người phụ trách đánh giá trực tiếp.${guardian} Em xin chuyển yêu cầu chuyên môn, chưa thể thiết kế lịch hoặc mức tạ qua chat.`;
}

function containsPhrase(text: string, phrase: string): boolean {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`).test(text);
}
function audienceIn(text: string): ProgramSafetyAudience | null {
  if (/\b(con (?:toi|em|minh)|be nha|my (?:child|son|daughter)|phu huynh|bo me hoi)\b/.test(text)) return 'parent';
  if (/\btre\s+(tap|nang|an kieng|giam can)\b/.test(text)) return 'minor';
  if (/\b(?:be thua can|be map|giam can cho be|tang chieu cao cho be|canxi cho be)\b/.test(text)) return 'minor';
  if (/\bcon beo\b/.test(text)) return 'parent';
  const ages = [...text.matchAll(/\b(\d{1,2})\s*(?:tuoi|years?\s*old|y\/o|yo)\b/g)];
  if (ages.some(m => Number(m[1]) < 18 && Number(m[1]) > 0)) return 'minor';
  const shortAge = text.match(/\b(?:i am|i'm|im)\s+(\d{1,2})(?:\s|$|[.,!?])/);
  if (shortAge && Number(shortAge[1]) > 0 && Number(shortAge[1]) < 18) return 'minor';
  if (/\b(?:muoi(?: mot| hai| ba| bon| lam| sau| bay)?|chin|tam|bay|sau)\s+tuoi\b/.test(text)) return 'minor';
  if (/\b(?:lop|grade)\s*(?:1[0-2]|[1-9])\b/.test(text)) return 'minor';
  if (youth.some(k => containsPhrase(text, k))) return 'minor';
  return null;
}
export function programSafetyReply(audience: ProgramSafetyAudience): string {
  if (audience === 'minor') return 'Em chưa thể thiết kế giáo án, chọn mức tạ, hướng dẫn ăn kiêng hoặc thực phẩm bổ sung cho người dưới 18 tuổi qua chat. Bạn hãy nhờ bố mẹ hoặc người giám hộ liên hệ phòng tập để được đánh giá trực tiếp và xác nhận hình thức giám sát phù hợp. Em xin chuyển yêu cầu tới bộ phận chuyên môn; không nên tự tập theo giáo án tham chiếu.';
  if (audience === 'parent') return 'Dạ, với câu hỏi tập luyện cho con, em chỉ trao đổi ở mức định hướng và quy trình đánh giá. Anh/chị vui lòng liên hệ cùng con để bộ phận chuyên môn xác nhận khả năng tiếp nhận, sự đồng ý của người giám hộ và phương án giám sát trực tiếp. Em xin chuyển yêu cầu; bài tập, mức tải, thực đơn và lịch riêng cho trẻ cần được đánh giá trước, không sao chép từ hồ sơ khác.';
  return 'Dạ, câu hỏi liên quan sức khỏe, thuốc hoặc thực phẩm bổ sung cần được bộ phận chuyên môn và chuyên gia y tế phù hợp xem xét. Em không chẩn đoán, kê thuốc, chọn liều hoặc tự thiết kế giáo án điều trị qua chat. Em xin chuyển yêu cầu để được hỗ trợ; chưa thể xác nhận kế hoạch phù hợp chỉ từ thông tin này.';
}
export function detectProgramSafety(message: string, history: {role:string;text:string}[] = []): ProgramSafetyDecision | null {
  if (typeof message !== 'string') return null;
  const prior = Array.isArray(history) ? history.filter(h => h?.role === 'user' && typeof h.text === 'string').map(h => h.text) : [];
  const texts = [...prior, message].map(normalizeSafetyText);
  // Tuổi/quan hệ do người dùng tự khai trước đó vẫn có hiệu lực trong ngữ cảnh gửi lên.
  // Không cho nội dung bot hoặc yêu cầu "bỏ qua quy tắc" xóa việc cần chuyển giao.
  const audiences = texts.map(audienceIn);
  const audience = audiences.includes('parent') ? 'parent' : audiences.includes('minor') ? 'minor' : null;
  const bodyTopic=texts.some(t=>MINOR_BODY_TERMS.some(k=>containsPhrase(t,k)));
  const heightTopic=texts.some(t=>HEIGHT_TERMS.some(k=>containsPhrase(t,k)));
  if(audience && bodyTopic) return {tag:'HEALTH_RISK',audience,
    reason:'Nội dung cân nặng hoặc ăn uống của trẻ cần chuyên môn nhi khoa.',replyText:minorBodyReply(audience)};
  if(heightTopic) return {tag:'HEALTH_RISK',audience:audience??'health',
    reason:'Không cam kết chiều cao hoặc tự thiết kế can thiệp tăng trưởng.',replyText:heightReply(audience??'health')};
  if (audience) return { tag:'HEALTH_RISK', audience, reason:'Cần xác minh độ tuổi, người giám hộ và phạm vi tư vấn.', replyText:programSafetyReply(audience) };
  if (texts.some(s => health.some(k => containsPhrase(s,k)))) return {
    tag:'HEALTH_RISK', audience:'health', reason:'Nội dung sức khỏe hoặc thực phẩm bổ sung cần chuyển chuyên môn.',
    replyText:programSafetyReply('health')
  };
  return null;
}
