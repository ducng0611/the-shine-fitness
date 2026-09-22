/**
 * Đọc nguồn RAG bằng quy tắc. PROGRAM tách bản lưu tham chiếu khỏi nội dung tổng quan đã duyệt.
 */
export const REQUIRED_METADATA_KEYS = ['id','title','source','version','effective_date','expiry_date','owner','category'] as const;
export const VALID_CATEGORIES = ['PRICE','SCHEDULE','TRAINER','FACILITY','POLICY','TRIAL','PROGRAM'] as const;
export interface DocMetadata {
  id:string; title:string; source:string; version:string; effective_date:string;
  expiry_date:string; owner:string; category:string;
  review_status?:string; content_scope?:string;
}
export function parseFrontmatter(content:string, filePath='document'): {metadata:DocMetadata; body:string} {
  const parts=content.split(/^---\r?$/m);
  if(parts.length<3) throw new Error(`Tệp ${filePath} thiếu YAML frontmatter.`);
  const values:Record<string,string>={};
  for(const line of parts[1].split(/\r?\n/)) {
    const t=line.trim(); if(!t || t.startsWith('#')) continue;
    const i=t.indexOf(':'); if(i<0) continue;
    const key=t.slice(0,i).trim(); let v=t.slice(i+1).trim();
    if((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v=v.slice(1,-1);
    if(key in values) throw new Error(`Tệp ${filePath} có trường lặp: ${key}.`);
    values[key]=v;
  }
  for(const key of REQUIRED_METADATA_KEYS) if(!values[key]) throw new Error(`Tệp ${filePath} thiếu ${key}.`);
  if(!(VALID_CATEGORIES as readonly string[]).includes(values.category)) throw new Error(`Danh mục không hợp lệ: ${values.category}.`);
  for(const key of ['effective_date','expiry_date']) {
    const value=values[key];
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)) || new Date(value).toISOString().slice(0,10)!==value)
      throw new Error(`Ngày không hợp lệ: ${key}.`);
  }
  if(values.effective_date>=values.expiry_date) throw new Error('Ngày hết hạn phải sau ngày hiệu lực.');
  return {metadata:values as unknown as DocMetadata, body:parts.slice(2).join('---').trim()};
}
/** Giữ đúng thuật toán chia tại heading 1-3 và đoạn văn của bộ lập chỉ mục cũ. */
export function chunkDocument(body:string):string[] {
  const chunks:string[]=[];
  for(const section of body.split(/(?=\n#{1,3}\s)/)) {
    const t=section.trim(); if(!t)continue;
    if(t.length<=1500){chunks.push(t);continue;}
    let current='';
    for(const para of t.split(/\n\s*\n/)){
      if((current+'\n\n'+para).length>1500 && current){chunks.push(current.trim());current=para;}
      else current=current?current+'\n\n'+para:para;
    }
    if(current.trim())chunks.push(current.trim());
  }
  return chunks;
}
/** Hồ sơ lịch sử không trở thành chỉ định cho người mới chỉ vì đã tạo embedding. */
export function programRagAllowed(meta:Pick<DocMetadata,'category'|'review_status'|'content_scope'> & {id?:string}):boolean {
  if(meta.id==='kb-program-fatloss-metabolic-001'||meta.id==='kb-program-posture-correction-001')return false;
  return meta.category!=='PROGRAM' || (meta.review_status==='verified' && meta.content_scope==='public_overview');
}
