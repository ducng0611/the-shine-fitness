import { normalizeSafetyText } from './programSafety';
import type { BuddyTask } from './buddyChat';
export const BUDDY_POLICY_VERSION = 'context-policy-v2';
export interface BuddyMemory { minorConcern:boolean; healthConcern:boolean; allergyConcern:boolean; lastTopic:string|null }
export const newBuddyMemory=():BuddyMemory=>({minorConcern:false,healthConcern:false,allergyConcern:false,lastTopic:null});
export interface BuddyDecision { task:BuddyTask; topic:string|null; reason:string; memory:BuddyMemory; privateRequest:boolean; generationAllowed:boolean }
const n=normalizeSafetyText;
const conceptPattern=/\b(la gi|nghia la|giai thich|phan biet|khac nhau|khac gi|khac.*the nao|vi sao|tai sao|what (?:is|are)|difference|explain|why)\b/;
const selfPattern=/\b(toi|minh|em|anh|chi|con toi|con em|be nha|i|i'm|my|me)\b/;
const healthPattern=/\b(tieu duong|dai thao duong|type 2|huyet ap|tim mach|benh than|suy than|gan nhiem mo|gout|mo mau|hen suyen|dong kinh|thoat vi|dia dem|chan thuong|phau thuat|mang thai|cho con bu|noi tiet|tuyen giap|sut can|chan an|roi loan an uong|diabetes|hypertension|asthma|kidney|pregnant|breastfeeding|injury|surgery|eating disorder)\b/;
const symptomPattern=/\b(dau|te bi|chong mat|choang|kho tho|run tay|pain|hurt|dizzy|numb|faint)\b/;
const clinicalPattern=/\b(thuoc|insulin|metformin|sulfonylurea|whey|creatine|thuc pham bo sung|thuc pham chuc nang|lieu|medication|medicine|dose|supplement|calcium|oresol)\b/;
const nutritionPattern=/\b(protein|whey|creatine|bmr|tdee|calo|kcal|macros?|dinh duong|thuc don|meal\s*plan|nutrition|an gi|an uong|bua an|khau phan|uong nuoc|hydrat\w*|carbs?|chat beo|chat dam|chat xo|vitamin|khoang chat|an kieng|nhin an|diet|food|calories?|before workout|after workout|truoc tap|sau tap)\b/;
const fitnessPattern=/\b(gym|tap|giao an|bai tap|co bap|suc ben|the luc|linh hoat|khoi dong|gian co|phuc hoi|ngu|yoga|pilates|boxing|plank|squat|deadlift|bench|rpe|rir|tang co|tang can|giam mo|giam can|progressive overload|workout|exercise|fitness|muscle|recovery|sleep|mobility|posture|tang chieu cao|tu the)\b/;
const dietPattern=/\b(thuc don|meal\s*plan|giam can|giam mo|an kieng|nhin an|calo|kcal|calories?|diet|weight loss|dose|lieu|whey|creatine|thuc pham bo sung)\b/;
const personalPattern=/\b(cho toi|cho em|cho anh|cho chi|cho con|cua toi|cua em|toi nen|em nen|toi can|em can|toi muon|em muon|muon tap|hom nay|lich tap|ke thuc don|len thuc don|thiet ke|ke hoach|lap lich|tinh giup|tinh cho|uong bao nhieu|lieu bao nhieu|for me|for my|should i|i want|my plan|plan my|today|how much should i)\b/;
const negate=/\b(khong|chua|khong con|no|not|without|don't|dont|do not)\s*(?:(?:bi|co|have|having|suffer from)\s*)?$/;
export function nonQuotedSpeech(message:string):string {return message.replace(/```[\s\S]*?```|`[^`]*`|"[^"]*"|“[^”]*”/g,' ').replace(/<[^>]*>/g,' ');}
export function hasAffirmed(text:string,pattern:RegExp):boolean {for(const m of text.matchAll(new RegExp(pattern.source,'g'))){const start=m.index??0;if(!negate.test(text.slice(Math.max(0,start-55),start)))return true;}return false;}
function topicOf(text:string,last:string|null):string|null {
  if(/\b(tdee|bmr)\b/.test(text))return 'energy_terms';
  if(/\b(whey|protein|chat dam)\b/.test(text))return 'protein';
  if(/\b(tieu duong|dai thao duong|type 2|diabetes)\b/.test(text))return 'diabetes_concept';
  if(/\b(progressive overload|tang tien)\b/.test(text))return 'progressive_overload';
  if(/\b(kiet suc|that bai|rir|failure|reps in reserve)\b/.test(text))return 'training_effort';
  if(/\b(khoi dong|warm.?up)\b/.test(text))return 'warmup';
  if(/\b(sau tap|after workout|post.?workout)\b/.test(text)&&(nutritionPattern.test(text)||last?.startsWith('meal')||last==='protein'))return 'meal_after';
  if(/\b(truoc tap|before workout|pre.?workout)\b/.test(text))return 'meal_before';
  if(/\b(ngu|sleep)\b/.test(text))return 'sleep';
  if(/\b(uong nuoc|hydration|hydrate|water)\b/.test(text))return 'hydration';
  if(/\b(creatine)\b/.test(text))return 'creatine_concept';
  if(/\b(squat)\b/.test(text))return 'squat';
  if(/\b(keo gian|gian co|mobility|linh hoat)\b/.test(text))return 'mobility';
  if(/^(vay|con|the|what about|and)\b/.test(text)&&text.length<200)return last;
  return null;
}
/** Contextual product heuristic, not a diagnostic model. */
export function routeBuddy(message:string,prior:BuddyMemory=newBuddyMemory()):BuddyDecision {
  const text=n(message),speech=n(nonQuotedSpeech(message)),concept=conceptPattern.test(text);
  const hypothetical=/\b(vi du|gia su|neu mot nguoi|hypothetical|example|in a book)\b/.test(speech)&&!/\b(toi dang|em dang|i am now|right now)\b/.test(speech);
  const self=selfPattern.test(speech)&&!hypothetical;
  const ages=[...speech.matchAll(/\b(\d{1,2})\s*(tuoi|years? old|yo|y\/o)\b/g)].map(m=>Number(m[1]));
  const minor=!hypothetical&&((self&&ages.some(a=>a>0&&a<18))||/\b((?:hoc|dang hoc) lop (?:1[0-2]|[1-9])|hoc sinh|duoi 18|chua du 18|i am 1[0-7]|i'm 1[0-7])\b/.test(speech)||(self&&/\blop\s*(?:1[0-2]|[1-9])\b/.test(speech))||(/\b(con toi|con em|be nha|my child|my son|my daughter)\b/.test(speech)&&!ages.some(a=>a>=18)));
  const healthSelf=self&&hasAffirmed(speech,healthPattern)&&(!concept||/\b((?:toi|em|minh|i) (?:bi|mac|co benh|dang|have|suffer))\b/.test(speech));
  const allergy=self&&hasAffirmed(speech,/\b(di ung|khong dung nap|allerg(?:y|ic)|intolerance)\b/)&&(!concept||/\b(bi|have|am allergic)\b/.test(speech));
  const memory={...prior,minorConcern:prior.minorConcern||minor,healthConcern:prior.healthConcern||healthSelf,allergyConcern:prior.allergyConcern||allergy};
  const topic=topicOf(text,prior.lastTopic);
  const result=(task:BuddyTask,reason:string,privateRequest=false,generationAllowed=false):BuddyDecision=>({task,reason,topic,privateRequest,generationAllowed,memory:{...memory,lastTopic:topic??prior.lastTopic}});
  const acute=/\b(dau nguc|kho tho du doi|kho tho bat thuong|yeu mot ben|yeu nua nguoi|bat tinh|co giat|sung luoi|sung hong|chest pain|severe shortness of breath|unconscious|tongue swelling|throat swelling)\b/;
  const pastOnly=/\b(nam ngoai|truoc day|hoi truoc|last year|used to|in the past)\b/.test(speech)&&!/\b(dang|bay gio|hien tai|now|today)\b/.test(speech);
  if(!hypothetical&&!pastOnly&&(!concept||/\b(dang|bay gio|now|toi bi|em bi|i have)\b/.test(speech))&&hasAffirmed(speech,acute))return result('URGENT_SAFETY','possible_acute_warning');
  if(/\b(ignore.*instructions|bo qua.*quy tac|bo qua.*huong dan|system prompt|api key|firebase token|show.*private|xem ho so nguoi khac|lay ho so.*nguoi khac)\b/.test(text))return result('OUT_OF_SCOPE','untrusted_instruction');
  const wantsPlan=personalPattern.test(text)||(/\b(tap gi|an gi|ke hoach|meal plan|thuc don)\b/.test(text)&&!concept);
  const actionableMedication=/\b(lieu bao nhieu|lieu dung cho|nen uong|uong truoc|uong sau|doi lieu|ngung thuoc|bo thuoc|may muong|take before|take after|should i take|my dose|dose for me)\b/.test(text);
  const directClinical=clinicalPattern.test(text)&&((!concept&&/\b(thuoc|lieu|bao nhieu|uong|truoc|sau|take|dose|should|how much|prescribe)\b/.test(text))||actionableMedication);
  const thresholds=/\b(duong huyet|huyet ap|blood sugar|blood pressure)\b/.test(text)&&/\b(nguong|bao nhieu|muc nao|threshold|allowed|can i)\b/.test(text);
  if(directClinical||thresholds)return result('PROFESSIONAL_REVIEW','individual_medical_or_dose_request');
  if(memory.minorConcern&&(wantsPlan||dietPattern.test(text))&&!concept)return result('PROFESSIONAL_REVIEW','minor_personal_request');
  if((memory.healthConcern||memory.allergyConcern)&&wantsPlan)return result('PROFESSIONAL_REVIEW','contextual_health_restriction');
  if(!concept&&!hypothetical&&(healthSelf||allergy||(hasAffirmed(speech,symptomPattern)&&(self||wantsPlan))||(healthPattern.test(text)&&wantsPlan)))return result('PROFESSIONAL_REVIEW','individual_health_context');
  if(/\b(lieu|dose|may muong|bao nhieu gram|how many scoops)\b/.test(text)&&clinicalPattern.test(text)&&self)return result('PROFESSIONAL_REVIEW','individual_dose_request');
  if(/\b(gia|bao nhieu tien|chi phi|hoc phi|bang gia|price|cost|membership fee|goi tap)\b/.test(text))return result('BUSINESS_QA','business_price');
  if(/\b(tuan nay|tuan truoc|lich su|thanh tich|tien do|ho so|muc tieu cua|pt giao|pt ghi|this week|my history|my progress|my profile)\b/.test(text)&&self)return result('MEMBER_CONTEXT_QA','own_context',true);
  if(/\b(da an|vua an|an xong|vua tap|ghi lai|luu buoi|luu bua|i ate|i just trained|log my|save my)\b/.test(text))return result('LOGGING_REQUEST','confirmation_workflow_required',true);
  if(wantsPlan&&!concept&&(fitnessPattern.test(text)||nutritionPattern.test(text)))return result('PERSONAL_PLAN_REQUEST','personal_context_required',true);
  if(/\b(gio mo cua|mo cua|dong cua|dia chi|o dau|lich lop|bao luu|hoan tien|tap thu|huan luyen vien|gym co|phong co|the shine|opening|address|trial|refund|locker)\b/.test(text))return result('BUSINESS_QA','business_information');
  if(healthPattern.test(text)||(concept&&clinicalPattern.test(text)&&!nutritionPattern.test(text)))return result('HEALTH_EDUCATION','general_health_education',false,concept&&!healthSelf&&!allergy);
  if(nutritionPattern.test(text)||topic==='protein'||topic?.startsWith('meal'))return result('NUTRITION_EDUCATION','general_nutrition_education',false,!wantsPlan||concept);
  if(fitnessPattern.test(text)||topic)return result('FITNESS_EDUCATION','general_fitness_education',false,true);
  if(/^(chao|xin chao|hello|hi|cam on|thanks|thank you)[!.\s]*$/.test(text))return result('FITNESS_EDUCATION','greeting');
  return result('OUT_OF_SCOPE','scope_or_clarification_needed');
}
