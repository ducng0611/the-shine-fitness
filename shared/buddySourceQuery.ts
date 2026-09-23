import { normalizeSafetyText } from './programSafety';
export type SourceQuery = 'profile'|'health'|'medications'|'clearance'|'notes'|'meal'|'program'|'equipment';
/** Requests for a new action are not documentary reads, even when phrased as a question. */
export function newPersonalAction(message:string):boolean {
  const q=normalizeSafetyText(message);
  return /\b(tap gi|an gi|chinh lieu|tang lieu|uong bao nhieu|lieu bao nhieu|co nen|nen tap|nen an|nen uong|tap .*duoc khong|co the (?:lam|tap)|chon .*bai|bai thay|thay the .*bai|cho (?:minh|toi|em) (?:mot )?(?:bai|giao an|thuc don|thuc hien|an|tap|lam)|(?:tap|lam) .*(?:luc nay|hom nay)|(?:tang|giam|doi) (?:ta|lieu|tai)|ke thuc don|len thuc don|thiet ke|ngung thuoc|bo thuoc|doi lieu|uong .*?(?:truoc|sau)|lap lich|goi y|de xuat|dieu chinh|ke don|should i|can i (?:do|train)|recommend|prescribe|adjust|replace.*exercise)\b/.test(q)
    || /^vay tap\b/.test(q);
}
/** Pure request intent. Never extracts UID, identity or clinical truth from a message. */
export function ownSourceQuery(message:string,priorTopic:string|null=null):SourceQuery|null {
  const q=normalizeSafetyText(message);
  if(newPersonalAction(message))return null;
  if(/\b(may|thiet bi|dung cu)\b/.test(q)&&/\b(danh sach|danh muc|phong|gym|o dau|nam dau|da cung cap|co trong|dang trong|vi tri|tang may|nam o)\b/.test(q))return 'equipment';
  const sourceFollowup=priorTopic?.startsWith('own_source:')&&/^(vay|con|the con|what about|and)\b/.test(q)&&q.length<180;
  const recorded=!!sourceFollowup||/\b(ho so|nguon|ban chep|chu mo|chu viet|khong ro|pt (?:giao|ghi)|da (?:giao|ghi|luu)|duoc (?:giao|gan)|ghi chu|my (?:record|profile)|assigned)\b/.test(q);
  const personal=/\b(cua (?:toi|em|minh)|cho toi|my|ho so)\b/.test(q);
  if(recorded&&/\b(thuoc|medication)\b/.test(q))return 'medications';
  if(recorded&&/\b(giay|du dieu kien|xac nhan.*van dong|clearance)\b/.test(q))return 'clearance';
  if(recorded&&/\b(benh|suc khoe|luu y|condition|health)\b/.test(q))return 'health';
  if(/\b(meal|thuc don)\b/.test(q)&&(recorded||personal))return 'meal';
  if(recorded&&/\b(ghi chu|pt ghi|notes)\b/.test(q))return 'notes';
  if(/\b(giao an|lo trinh|chuong trinh|buoi|program|session)\b/.test(q)&&(recorded||personal||/\b(so sanh|doi chieu|doc lai|xem|doc|tom tat|ghi gi|compare)\b/.test(q)))return 'program';
  if(/\b(ho so|my profile)\b/.test(q))return 'profile';
  return null;
}
