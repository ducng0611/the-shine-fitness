import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter, chunkDocument, programRagAllowed } from '../../../shared/ragDocument';
import { normalizeSafetyText } from '../../../shared/programSafety';
import type { BuddyCitation, BuddyLanguage } from '../../../shared/buddyChat';
import { digest } from './state';

export interface KnowledgeAnswer {text:string;citations:BuddyCitation[];revision:string}
interface EducationCard {id:string;title:string;url:string;vi:string;en:string}
interface EducationFile {version:string;checkedAt:string;expiresAt:string;cards:EducationCard[]}
/** A shared topic word is not evidence that a canned definition answers the question. */
export function educationCardMatches(topic:string|null,message:string):boolean {
  const q=normalizeSafetyText(message);
  const definition=/\b(la gi|nghia la|what is|what are|definition|dinh nghia|khai niem)\b/.test(q);
  if(topic==='protein'||topic==='whey'){
    if(/\b(benh|gout|than|ung thu|cancer|kidney|harm|co hai|gay|tac dung phu|bao nhieu|how much|lieu|dose)\b/.test(q))return false;
    return definition||/^(protein|whey)[?.!\s]*$/.test(q)||/\b(nguon|thuc pham giau dam|food sources|protein foods|whey khac|difference.*whey)\b/.test(q);
  }
  if(topic==='energy_terms')return definition||(/\b(tdee)\b/.test(q)&&/\b(bmr)\b/.test(q));
  if(topic==='diabetes_concept')return definition&&!/\b(type 1|bien chung|symptoms|trieu chung|complications|chua|dieu tri|treatment)\b/.test(q);
  if(topic==='creatine_concept')return definition&&!/\b(lieu|dose|bao nhieu|kidney|benh|than)\b/.test(q);
  if(topic==='progressive_overload')return definition||/\b(nguyen tac|principle|giai thich)\b/.test(q);
  if(topic==='warmup')return definition||/\b(tai sao|vi sao|muc dich|why|purpose)\b/.test(q);
  if(topic==='meal_before'||topic==='meal_after')return !/\b(bao nhieu|how much|calo|kcal|gram|di ung|allerg|benh|dieu tri)\b/.test(q);
  if(topic==='hydration')return !/\b(bao nhieu|how much|lit|ml|lieu|benh|suy)\b/.test(q);
  if(topic==='sleep')return definition||/\b(vai tro|tam quan trong|why|importance)\b/.test(q);
  return topic==='fitness_general'&&/^(fitness|van dong)[?.!\s]*$/.test(q);
}
export class BuddyKnowledge {
  constructor(private readonly root=process.cwd(),private readonly now:()=>number=Date.now){}
  private educationFile():EducationFile|null {
    try{
      const parsed=JSON.parse(fs.readFileSync(path.join(this.root,'data/education/buddy-concepts.json'),'utf8')) as EducationFile;
      if(!parsed||!Array.isArray(parsed.cards)||!parsed.version||!/^\d{4}-\d{2}-\d{2}$/.test(parsed.expiresAt)||parsed.expiresAt<=new Date(this.now()).toISOString().slice(0,10))return null;
      return parsed;
    }catch{return null;}
  }
  education(topic:string|null,message:string,lang:BuddyLanguage):KnowledgeAnswer|null {
    const file=this.educationFile();if(!file)return null;
    const key=topic==='protein'&&/\bwhey\b/i.test(message)?'whey':topic;
    if(!educationCardMatches(key,message))return null;
    const c=file.cards.find(c=>c.id===key);
    if(!c||typeof c[lang]!=='string'||!/^https:\/\//.test(c.url))return null;
    return {text:c[lang],citations:[{id:`education:${c.id}`,title:c.title,url:c.url,checkedAt:file.checkedAt,scope:'education'}],revision:digest(JSON.stringify(c)+file.version+file.expiresAt)};
  }
  /** Local retrieval needs no query embedding. It never reads historical/private archives. */
  business(message:string,lang:BuddyLanguage):KnowledgeAnswer|null {
    const text=normalizeSafetyText(message),today=new Date(this.now()).toISOString().slice(0,10);
    const category=/\b(gia|bao nhieu tien|chi phi|goi|price|cost|fee)\b/.test(text)?'PRICE':
      /\b(lich|gio|mo cua|dong cua|opening|schedule|hours)\b/.test(text)?'SCHEDULE':
      /\b(bao luu|hoan tien|chinh sach|refund|policy)\b/.test(text)?'POLICY':
      /\b(tap thu|trial)\b/.test(text)?'TRIAL':/\b(huan luyen vien|trainer|pt)\b/.test(text)?'TRAINER':'FACILITY';
    const folder=path.join(this.root,'data/knowledge');
    const files=fs.existsSync(folder)?fs.readdirSync(folder).filter(f=>/^0[1-6]_[a-z_]+\.md$/.test(f)):[];
    const candidates:{text:string;citation:BuddyCitation;score:number;fingerprint:string}[]=[];
    const tokens=text.split(/[^a-z0-9]+/).filter(t=>t.length>2&&!['the','toi','cho','anh','chi','shine','gym','coi','please','what'].includes(t));
    for(const filename of files){
      try{
        const raw=fs.readFileSync(path.join(folder,filename),'utf8'),{metadata,body}=parseFrontmatter(raw,filename);
        if(metadata.category!==category||!programRagAllowed(metadata)||metadata.expiry_date<=today||metadata.effective_date>today||metadata.content_scope==='historical_reference'||metadata.review_status==='needs_review')continue;
        for(const chunk of chunkDocument(body)){
          if(chunk.length<80||chunk.length>2000)continue;
          const normalized=normalizeSafetyText(chunk),score=tokens.reduce((s,t)=>s+(normalized.includes(t)?1:0),0);
          candidates.push({text:chunk,citation:{id:metadata.id,title:metadata.title,scope:'business'},score,fingerprint:digest(raw)});
        }
      }catch{}
    }
    candidates.sort((a,b)=>b.score-a.score);
    const first=candidates[0];if(!first||first.score<1)return null;
    const lead=lang==='vi'?'Thông tin trong nguồn The Shine hiện có:':'The current The Shine source states (original wording):';
    return {text:`${lead}\n\n${first.text}`,citations:[first.citation],revision:first.fingerprint};
  }
  fallbackEducation(lang:BuddyLanguage):KnowledgeAnswer|null{return this.education('fitness_general','fitness',lang);}
}
