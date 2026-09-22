import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { BuddyError, type BuddySession, type BuddyReply, type BuddyTimings, type BuddyTask, type BuddyMode } from '../../../shared/buddyChat';
import { newBuddyMemory, type BuddyMemory } from '../../../shared/buddyPolicy';

export interface BuddyTurn { role:'user'|'model'; text:string; scope:'public'|'private' }
export interface Conversation { id:string;uid:string|null;guestHash:string|null;createdAt:number;expiresAt:number;revision:number;busy:boolean;memory:BuddyMemory;turns:BuddyTurn[];requestIds:Set<string> }
export const digest=(s:string):string=>createHash('sha256').update(s).digest('hex');
/** Single-process pilot store; no transcript on disk, in the database or in logs. */
export class ConversationStore {
  private readonly rows=new Map<string,Conversation>();
  constructor(private readonly now:()=>number=Date.now,private readonly capacity=512,private readonly ttlMs=20*60_000){}
  private prune(){for(const [key,row] of this.rows)if(row.expiresAt<=this.now()&&!row.busy)this.rows.delete(key);}
  create(uid:string|null):BuddySession {
    this.prune();if(this.rows.size>=this.capacity)throw new BuddyError('session_capacity','Hệ thống đang bận. Vui lòng thử lại sau.',503);
    const token=uid?undefined:randomBytes(32).toString('base64url');
    const row:Conversation={id:randomUUID(),uid,guestHash:token?digest(token):null,createdAt:this.now(),expiresAt:this.now()+this.ttlMs,revision:0,busy:false,memory:newBuddyMemory(),turns:[],requestIds:new Set()};
    this.rows.set(row.id,row);return {...this.describe(row),...(token?{guestToken:token}:{})};
  }
  describe(row:Conversation):BuddySession{return {conversationId:row.id,revision:row.revision,expiresAt:new Date(row.expiresAt).toISOString(),mode:row.uid?'authenticated_user':'guest'};}
  get(id:string,uid:string|null,guestToken?:string):Conversation {
    this.prune();const r=this.rows.get(id);let owner=!!r&&r.uid===uid;
    if(owner&&uid===null){const h=guestToken&&/^[A-Za-z0-9_-]{43}$/.test(guestToken)?digest(guestToken):'';owner=!!r?.guestHash&&h.length===r.guestHash.length&&timingSafeEqual(Buffer.from(h),Buffer.from(r.guestHash));}
    if(!r||!owner||r.expiresAt<=this.now())throw new BuddyError('conversation_unavailable','Phiên không còn khả dụng. Hãy mở cuộc trò chuyện mới.',404);
    return r;
  }
  begin(row:Conversation,requestId:string,revision:number){
    if(row.busy)throw new BuddyError('conversation_busy','Hãy chờ hoặc dừng phản hồi đang chạy.',409);
    if(row.revision!==revision)throw new BuddyError('conversation_changed','Phiên đã thay đổi. Tải lại trạng thái trước khi gửi.',409);
    if(row.requestIds.has(requestId))throw new BuddyError('request_already_used','Yêu cầu này đã được xử lý hoặc hủy; không tự gửi lại.',409);
    if(row.requestIds.size>=120)throw new BuddyError('conversation_limit','Đã đạt giới hạn phiên. Hãy mở cuộc trò chuyện mới.',409);
    row.busy=true;row.requestIds.add(requestId);
  }
  finish(row:Conversation,message:string,reply:BuddyReply|null){
    // Self-reported concerns survive only as bounded caution flags, not raw health
    // narratives in the later education-model context. This does not prevent
    // answering general education: lastTopic retains non-identifying context.
    const sensitive=row.memory.healthConcern||row.memory.minorConcern||row.memory.allergyConcern;
    const publicTurn=reply&&!sensitive&&['BUSINESS_QA','FITNESS_EDUCATION','HEALTH_EDUCATION','NUTRITION_EDUCATION'].includes(reply.task);
    row.turns.push({role:'user',text:publicTurn?message:'[Yêu cầu riêng hoặc an toàn; không gửi hồ sơ vào mô hình.]',scope:publicTurn?'public':'private'});
    if(reply)row.turns.push({role:'model',text:publicTurn?reply.text:'[Đã hiển thị phản hồi riêng; phải kiểm tra quyền và đọc lại khi cần.]',scope:publicTurn?'public':'private'});
    row.turns=row.turns.slice(-12);while(row.turns.reduce((sum,t)=>sum+t.text.length,0)>12_000)row.turns.shift();
    row.revision++;row.busy=false;row.expiresAt=Math.min(this.now()+this.ttlMs,row.createdAt+2*60*60_000);
  }
  remove(row:Conversation){if(row.busy)throw new BuddyError('conversation_busy','Dừng phản hồi trước khi xóa phiên.',409);this.rows.delete(row.id);}
  get size(){this.prune();return this.rows.size;}
}
export interface CachedAnswer {text:string;citations:BuddyReply['citations'];task:BuddyTask}
export class PublicAnswerCache {
  private rows=new Map<string,{expires:number;value:CachedAnswer}>();
  constructor(private readonly now:()=>number=Date.now,private readonly ttlMs=5*60_000,private readonly capacity=128){}
  get(key:string):CachedAnswer|null{const item=this.rows.get(key);if(!item)return null;this.rows.delete(key);if(item.expires<=this.now())return null;this.rows.set(key,item);return structuredClone(item.value);}
  set(key:string,value:CachedAnswer){this.rows.delete(key);while(this.rows.size>=this.capacity)this.rows.delete(this.rows.keys().next().value!);this.rows.set(key,{expires:this.now()+this.ttlMs,value:structuredClone(value)});}
}
/** Accept only typed stage counters, never IDs, transcript snippets or free-form labels. */
export class BuddyMetrics {
  private samples:{task:BuddyTask;mode:BuddyMode;timings:BuddyTimings;outcome:'success'|'cancelled'|'error'}[]=[];
  add(task:BuddyTask,mode:BuddyMode,timings:BuddyTimings,outcome:'success'|'cancelled'|'error'){this.samples.push({task,mode,timings:{...timings},outcome});this.samples=this.samples.slice(-500);}
  summary(){
    const percentile=(values:number[],p:number)=>{const sorted=values.filter(Number.isFinite).sort((a,b)=>a-b);return sorted.length?sorted[Math.max(0,Math.ceil(sorted.length*p)-1)]:null;};
    const successes=this.samples.filter(s=>s.outcome==='success');
    const timingKeys=['authMs','routeMs','contextMs','retrievalMs','modelMs','firstContentMs','totalMs'] as const;
    return {scope:'single_process_last_500_no_transcripts',count:this.samples.length,successCount:successes.length,
      timings:Object.fromEntries(timingKeys.map(k=>[k,{p50:percentile(successes.map(s=>s.timings[k]).filter((x):x is number=>x!==null),.5),p95:percentile(successes.map(s=>s.timings[k]).filter((x):x is number=>x!==null),.95)}])),
      intents:Object.fromEntries([...new Set(this.samples.map(s=>s.task))].map(task=>[task,this.samples.filter(s=>s.task===task).length])),
      modelCalls:this.samples.reduce((n,s)=>n+s.timings.modelCalls,0),cacheHits:successes.filter(s=>s.timings.cacheHit).length};
  }
}
