import { POSTURE_HEALTH_TERMS_VI, POSTURE_HEALTH_TERMS_EN, detectAcutePostureWarning, postureNeedsReview, acutePostureReply, postureReviewReply } from './postureSafety';
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
const METABOLIC_TERMS_VI = ["đái tháo đường", "type 2", "insulin", "đường huyết", "hạ đường huyết", "HbA1c", "cao huyết áp", "tăng huyết áp", "huyết áp cao", "mỡ máu", "rối loạn lipid", "gan nhiễm mỡ", "gout", "béo phì", "thuốc huyết áp", "thuốc tiểu đường", "uống thuốc trước khi tập", "giấy khám sức khỏe", "bệnh nền", "bệnh chuyển hóa", "sulfonylurea", "metformin", "chẹn beta"];
const HEALTH_TERMS_VI = [
  ...POSTURE_HEALTH_TERMS_VI,
  ...METABOLIC_TERMS_VI,
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
  ...HEALTH_TERMS_VI, ...MINOR_TERMS_VI, ...POSTURE_HEALTH_TERMS_EN,
  ...HEALTH_TERMS_VI.map(normalizeSafetyText), ...MINOR_TERMS_VI.map(normalizeSafetyText),
  'type 2','insulin','hba1c','blood glucose','blood sugar','hypoglycemia','dyslipidemia','fatty liver','gout','obesity','beta blocker',
  'mass gainer', 'whey', 'creatine', 'supplement', 'supplements',
  'diabetes', 'asthma', 'epilepsy', 'hypertension', 'pregnant', 'breastfeeding',
  'eating disorder', 'unintentional weight loss', 'unexplained weight loss', 'loss of appetite', 'weight gain pills', 'height growth pills', 'growth plates', 'early puberty', 'grow taller', 'under 18', 'underage', 'minor', 'my child', 'my son', 'my daughter'
])];
const health = [...HEALTH_TERMS_VI.map(normalizeSafetyText),
  'type 2','insulin','hba1c','blood glucose','blood sugar','hypoglycemia','dyslipidemia','fatty liver','gout','obesity','beta blocker',
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

/** Dấu hiệu cảnh báo trong lời hiện tại, không chẩn đoán và không suy cấp cứu từ lời bot. */
export function detectAcuteMetabolicWarning(message: string): boolean {
  const text=normalizeSafetyText(message);
  const terms=['dau nguc','kho tho bat thuong','kho tho du doi','dau dau du doi','yeu mot ben','te mot ben',
    'yeu nua nguoi','te nua nguoi','bat tinh','co giat','ngat xiu','chest pain','severe shortness of breath','unconscious','seizure'];
  const active=(term:string)=>{
    const pos=text.indexOf(term);
    if(pos<0||!containsPhrase(text,term))return false;
    const prefix=text.slice(Math.max(0,pos-35),pos);
    // Câu phủ định hiện tại không tự xác nhận triệu chứng.
    return !/\b(?:khong|chua|khong con|no|without)\s*(?:bi\s+)?$/.test(prefix);
  };
  return terms.some(active) ||
    (active('mo hoi lanh')&&(active('run tay')||active('lu lan'))) ||
    (active('cold sweat')&&active('shaking'));
}
const METABOLIC_SERVICE_TERMS=['co nhan','nhan khach','tiep nhan','quy trinh','giay to','chuan bi','accept clients','accept people'];
function metabolicReply(message:string):string|null {
  const text=normalizeSafetyText(message);
  if(/\b(thuoc|insulin|sulfonylurea|metformin|chen beta|medication|medicine)\b/.test(text))
    return 'Dạ, em không hướng dẫn giờ uống, đổi liều hoặc ngưng thuốc trước hay sau tập. Anh/chị cần hỏi bác sĩ điều trị hoặc dược sĩ phụ trách đơn thuốc. Em xin chuyển yêu cầu chuyên môn; không đưa bài tập, thực đơn hay ngưỡng y khoa thay cho đánh giá trực tiếp.';
  if(/\b(duong huyet|huyet ap|blood glucose|blood sugar)\b/.test(text)&&/\b(bao nhieu|nguong|muc nao|how much|threshold|level)\b/.test(text))
    return 'Dạ, em không đặt ngưỡng đường huyết hoặc huyết áp để cho phép tập. Các ngưỡng và kế hoạch theo dõi phải do bác sĩ điều trị hướng dẫn riêng. Em xin chuyển yêu cầu chuyên môn, không chọn bài hoặc dùng số đo tự gửi để xác nhận đủ điều kiện vận động.';
  if(METABOLIC_SERVICE_TERMS.some(k=>containsPhrase(text,k)))
    return 'Dạ, em có thể tiếp nhận yêu cầu để bộ phận chuyên môn xác nhận khả năng hỗ trợ khách có bệnh nền. Quy trình đề nghị cần giấy bác sĩ xác nhận phạm vi vận động và danh sách thuốc qua kênh riêng, rồi đánh giá trực tiếp trước khi quyết định nhận tập. Em chưa xác nhận đủ điều kiện hoặc năng lực chuyên trách của nhân sự cho trường hợp này; em xin chuyển yêu cầu, không đưa giáo án qua chat.';
  return null;
}

export function detectProgramSafety(message: string, history: {role:string;text:string}[] = []): ProgramSafetyDecision | null {
  if (typeof message !== 'string') return null;
  if (detectAcuteMetabolicWarning(message)) return {tag:'HEALTH_RISK',audience:'health',
    reason:'Dấu hiệu có thể cần cấp cứu, không chờ hàng đợi tư vấn.',
    replyText:'Nếu những dấu hiệu này đang xảy ra, anh/chị hãy dừng tập, nhờ người gần đó hỗ trợ và gọi 115 ở Việt Nam hoặc cấp cứu địa phương ngay. Không chờ tư vấn viên phản hồi và không tự lái xe. Nếu bất tỉnh, co giật hoặc không nuốt an toàn, không cho ăn/uống; làm theo hướng dẫn của tổng đài. Em không chẩn đoán nguyên nhân và chưa gọi cấp cứu thay anh/chị.'};
  if (detectAcutePostureWarning(normalizeSafetyText(message))) return {tag:'HEALTH_RISK',audience:'health',
    reason:'Dấu hiệu thần kinh/cột sống có thể cần cấp cứu, không chờ hàng đợi tư vấn.',replyText:acutePostureReply()};
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
  if (postureNeedsReview(texts, POSTURE_HEALTH_TERMS_VI.map(normalizeSafetyText))) return {
    tag:'HEALTH_RISK',audience:'health',reason:'Nội dung cột sống hoặc triệu chứng cần đánh giá trực tiếp.',replyText:postureReviewReply()
  };
  if (texts.some(s => health.some(k => containsPhrase(s,k)))) return {
    tag:'HEALTH_RISK', audience:'health', reason:'Nội dung sức khỏe hoặc thực phẩm bổ sung cần chuyển chuyên môn.',
    replyText:metabolicReply(message) ?? programSafetyReply('health')
  };
  return null;
}
