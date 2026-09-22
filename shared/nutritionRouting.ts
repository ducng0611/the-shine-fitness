import { detectProgramSafety, normalizeSafetyText, type ProgramSafetyDecision } from './programSafety';
import type { NutritionGoal } from './nutritionKnowledge';

export const NUTRITION_REVIEW_TERMS = ['dị ứng','không dung nạp','oresol','bù điện giải','dầu cá','liều vitamin','suy thận','thai kỳ','đang cho con bú','allergy','allergic','intolerance'];
const norm = normalizeSafetyText;
const phrase = (s:string,p:string) => new RegExp(`(?:^|[^a-z0-9])${p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}(?=$|[^a-z0-9])`).test(s);
const userTexts = (message:string,history:Array<{role:string;text:string}>) => [...(Array.isArray(history)?history:[]).filter(x=>x?.role==='user'&&typeof x.text==='string').map(x=>x.text),message].map(norm);

/** Chỉ nhận dấu hiệu trong lời hiện tại. Đây không phải bộ chẩn đoán hoặc cấp cứu đã được thẩm định. */
export function detectNutritionSafety(message:string,history:Array<{role:string;text:string}>=[]): ProgramSafetyDecision|null {
  const current=norm(message);
  const active=(term:string)=>{
    const re=new RegExp(`(?:^|[^a-z0-9])${term}(?=$|[^a-z0-9])`,'g');
    return [...current.matchAll(re)].some(m=>!/(?:khong|chua|khong con|no|without)\s*(?:bi\s+)?$/.test(current.slice(Math.max(0,m.index!-25),m.index)));
  };
  // Nguồn ngoài chỉ cho quy tắc cảnh báo sản phẩm: NHS Food allergy / Anaphylaxis.
  // Không thay thế hay sửa nội dung dinh dưỡng trong hai DOCX.
  if(['sung luoi','sung hong','tongue swelling','throat swelling'].some(active) ||
     (['sung moi','sung mieng','swollen lips'].some(active)&&['kho tho','kho nuot','difficulty breathing'].some(active))) {
    return {tag:'HEALTH_RISK',audience:'health',reason:'Dấu hiệu có thể cần hỗ trợ khẩn cấp.',
      replyText:'Nếu sưng lưỡi/họng hoặc sưng môi kèm khó thở, khó nuốt đang xảy ra, anh/chị hãy nhờ người gần đó hỗ trợ và gọi cấp cứu địa phương ngay, không chờ tư vấn viên phản hồi. Em không chẩn đoán nguyên nhân và chưa gọi cấp cứu thay anh/chị.'};
  }
  if(userTexts(message,history).some(s=>NUTRITION_REVIEW_TERMS.some(k=>phrase(s,norm(k))))) return {
    tag:'HEALTH_RISK',audience:'health',reason:'Thành phần dị ứng, thuốc hoặc sản phẩm bổ sung cần xem xét riêng.',
    replyText:'Dạ, em chưa thể chọn món thay thế hoặc xác nhận món ăn an toàn với thông tin dị ứng, không dung nạp hay sản phẩm bổ sung qua chat. Nội dung này cần chuyên gia dinh dưỡng hoặc nhân viên y tế phù hợp xem xét; em không đề xuất liều, công thức bù nước hay thực đơn từ mẫu để thay cho đánh giá đó.'};
  return null;
}
export function isNutritionRequest(message:string):boolean {
  return /\b(meal\s*plan|mealplan|thuc don|dinh duong|an gi|an uong|bua an|khau phan|truoc tap.*an|sau tap.*an|an.*truoc tap|an.*sau tap|nutrition|pre.?workout meal|post.?workout meal|protein|macros?|tdee|bmr|kcal|calo|calories?|uong nuoc|da an|an xong)\b/.test(norm(message));
}
export interface NutritionContext {
  ageBand:'adult'|'minor'|'unknown'; goal:NutritionGoal;
  timing:'before_workout'|'after_workout'|'daily'|'unknown';
  allergyStatus:'none_reported'|'reported'|'unknown';
  clinicalReview:'not_reported'|'required'|'unknown';
  contextConfirmed:boolean;
}
export interface NutritionReadiness {
  status:'needs_input'|'needs_professional_review'|'insufficient_reviewed_nutrition_data';
  missingFields:string[]; reasonCodes:string[]; mealPlan:null; kcalTarget:null; canRecommend:false;
}
export function evaluateNutritionReadiness(c:NutritionContext):NutritionReadiness {
  const keys=['ageBand','goal','timing','allergyStatus','clinicalReview','contextConfirmed'];
  if(!c||Object.keys(c).some(k=>!keys.includes(k))||keys.some(k=>!(k in c))||
     !['adult','minor','unknown'].includes(c.ageBand)||!['weight_gain','fat_loss','fitness_flexibility','height_growth','medical_nutrition','unknown'].includes(c.goal)||
     !['before_workout','after_workout','daily','unknown'].includes(c.timing)||!['none_reported','reported','unknown'].includes(c.allergyStatus)||
     !['not_reported','required','unknown'].includes(c.clinicalReview)||typeof c.contextConfirmed!=='boolean') throw new Error('Ngữ cảnh dinh dưỡng không hợp lệ.');
  const base={mealPlan:null,kcalTarget:null,canRecommend:false as const};
  const reasons:string[]=[];
  if(c.ageBand==='minor'||c.goal==='height_growth')reasons.push('minor_or_growth_context');
  if(c.clinicalReview==='required'||c.goal==='medical_nutrition')reasons.push('clinical_review_required');
  if(c.allergyStatus==='reported')reasons.push('ingredient_safety_unverified');
  if(reasons.length)return {...base,status:'needs_professional_review',missingFields:[],reasonCodes:reasons};
  const missing=keys.filter(k=>k==='contextConfirmed'?!c.contextConfirmed:c[k as keyof NutritionContext]==='unknown');
  if(missing.length)return {...base,status:'needs_input',missingFields:missing,reasonCodes:['member_context_incomplete']};
  return {...base,status:'insufficient_reviewed_nutrition_data',missingFields:[],reasonCodes:['source_templates_are_not_approved_prescriptions']};
}
export interface NutritionChatDecision {
  text:string; handover:boolean; handoverTag:'HEALTH_RISK'|null; nutritionStatus:string;
  consumed:false; saved:false; computedKcal:null; mealPlan:null;
}
/** Kiểm soát trước mô hình/cache. Không sử dụng memberInfo phía client làm hồ sơ được xác thực. */
export function nutritionChatDecision(message:string,history:Array<{role:string;text:string}>=[]):NutritionChatDecision|null {
  const emergencyOrAllergy=detectNutritionSafety(message,history);
  const safety=emergencyOrAllergy ?? detectProgramSafety(message,history);
  if(safety && (emergencyOrAllergy || isNutritionRequest(message))) return {text:safety.replyText,handover:true,handoverTag:'HEALTH_RISK',nutritionStatus:'needs_professional_review',consumed:false,saved:false,computedKcal:null,mealPlan:null};
  if(!isNutritionRequest(message))return null;
  // Câu hỏi giá thực sự vẫn đi nhánh PRICE, không đổi chính sách dịch vụ.
  if(/\b(gia|bao nhieu tien|chi phi|hoc phi)\b/.test(norm(message)))return null;
  if(/\b(da an|an xong|ate|eaten|log my meal)\b/.test(norm(message)))return {
    text:'Em chưa lưu bữa này vào nhật ký và chưa tính năng lượng. Mẫu thực đơn không chứng minh anh/chị đã ăn đúng khẩu phần; cần xác nhận món, lượng thực tế, cách cân sống/chín và nguồn thành phần trước khi ghi nhận. Tính năng lưu nhật ký bữa ăn chưa được mở trong phiên bản này.',
    handover:false,handoverTag:null,nutritionStatus:'meal_log_not_enabled',consumed:false,saved:false,computedKcal:null,mealPlan:null};
  return {text:'Em đã có thư viện mẫu dinh dưỡng để bộ phận chuyên môn rà soát, nhưng chưa có thực đơn được duyệt để áp dụng riêng cho anh/chị. Các mức năng lượng trong mẫu không phải mục tiêu của anh/chị. Để chuẩn bị cá nhân hóa, cần xác nhận nhóm tuổi, mục tiêu, thời điểm tập, dị ứng hoặc kiêng thực phẩm và lưu ý sức khỏe trong hồ sơ được phép sử dụng. Hiện em chưa tự chọn thực đơn, quy đổi khẩu phần hoặc tính năng lượng từ ảnh.',
    handover:false,handoverTag:null,nutritionStatus:'insufficient_reviewed_nutrition_data',consumed:false,saved:false,computedKcal:null,mealPlan:null};
}