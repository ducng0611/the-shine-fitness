/**
 * Chuyển giao bảo thủ cho nhu cầu tư thế, không chẩn đoán bằng từ khóa.
 * Các hàm nhận chuỗi đã chuẩn hóa bởi normalizeSafetyText của shared policy.
 */
export const POSTURE_HEALTH_TERMS_VI = [
 'thoát vị đĩa đệm','tê bì chân tay','tê bì tay chân','tê bàn tay','tê ngón tay','tê ngón chân',
 'đau thần kinh tọa','trượt đốt sống','vẹo cột sống','viêm cột sống dính khớp',
 'thoái hóa cột sống','đau lan xuống chân','đau lan xuống tay','đau lưng','đau cổ','đau vai',
 'đau mỏi thắt lưng','tê vùng yên ngựa','bí tiểu','mất kiểm soát tiểu tiện','mất kiểm soát đại tiện'
];
export const POSTURE_HEALTH_TERMS_EN = [
 'sciatica','spondylolisthesis','scoliosis','ankylosing spondylitis','herniated disc','herniated disk',
 'radicular pain','tingling hands','numb fingers','numb toes','back pain','neck pain',
 'saddle numbness','urinary retention','bladder control','bowel control'
];
function phrase(text:string,term:string):boolean {
 const esc=term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 return new RegExp(`(?:^|[^a-z0-9])${esc}(?=$|[^a-z0-9])`).test(text);
}
/** Giảm nhận nhầm phủ định rõ; đây không phải bộ phân tích ngữ cảnh lâm sàng đầy đủ. */
function active(text:string,term:string):boolean {
 const esc=term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 for(const m of text.matchAll(new RegExp(`(?:^|[^a-z0-9])(${esc})(?=$|[^a-z0-9])`,'g'))) {
  const start=m.index!+m[0].length-m[1].length;
  const prefix=text.slice(Math.max(0,start-50),start);
  if(!/\b(?:khong|chua|khong con|no|without|not)\s*(?:bi\s+|co\s+|have\s+)?$/.test(prefix))return true;
 }
 return false;
}
export function detectAcutePostureWarning(text:string):boolean {
 const has=(terms:string[])=>terms.some(k=>active(text,k));
 const spine=has(['dau lung','dau than kinh toa','back pain','sciatica','dau lan xuong chan']);
 const saddle=has(['te vung yen ngua','mat cam giac vung sinh duc','te quanh hau mon','saddle numbness']);
 const bladder=has(['bi tieu','khong tieu duoc','mat kiem soat tieu tien','tieu khong tu chu','urinary retention','loss of bladder control']);
 const bowel=has(['mat kiem soat dai tien','dai tien khong tu chu','loss of bowel control']);
 const bilateral=has(['yeu ca hai chan','te ca hai chan','weakness in both legs','numbness in both legs']);
 const severity=has(['tang dan','nang hon','dot ngot','ngay cang','severe','worsening','progressive']);
 return saddle || (spine&&(bladder||bowel)) || (bilateral&&severity);
}
export function postureNeedsReview(texts:string[],normalizedVietnamese:string[]):boolean {
 return texts.some(text=>[...normalizedVietnamese,...POSTURE_HEALTH_TERMS_EN].some(t=>phrase(text,t))||
   /\b(?:l4\s*-\s*l5|l5\s*-\s*s1|c5\s*-\s*c6)\b/.test(text));
}
export function acutePostureReply():string {
 return 'Nếu các dấu hiệu tê vùng yên ngựa, rối loạn tiểu tiện/đại tiện hoặc yếu hai chân nặng đang xảy ra, anh/chị hãy dừng tập và đến cấp cứu ngay, nhờ người gần đó hỗ trợ. Gọi 115 tại Việt Nam hoặc cấp cứu địa phương khi cần; không chờ tư vấn viên và không tự lái xe khi không an toàn. Em không chẩn đoán nguyên nhân và chưa gọi cấp cứu thay anh/chị.';
}
export function postureReviewReply():string {
 return 'Dạ, em không chẩn đoán hội chứng cột sống hoặc chọn bài phục hồi qua chat khi có đau, tê bì hay bệnh lý đã được đề cập. Anh/chị cần được bác sĩ hoặc chuyên gia phục hồi chức năng/vật lý trị liệu phù hợp đánh giá trực tiếp. Em xin chuyển yêu cầu chuyên môn; chưa thể lấy ba giáo án tham chiếu làm bài tập điều trị hoặc cam kết hết đau.';
}
