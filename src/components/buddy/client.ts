import { BUDDY_BASE, BUDDY_VERSION, BuddyError, type BuddyEvent, type BuddyReply, type BuddySession, type BuddyLanguage } from '../../../shared/buddyChat';

/** Parses chunked SSE without splitting Vietnamese UTF-8 code points. No HTML/eval. */
export async function consumeBuddyStream(response:Response,onEvent:(event:BuddyEvent)=>void,signal:AbortSignal):Promise<BuddyReply> {
  if(!response.body)throw new BuddyError('stream_unavailable','Trình duyệt không nhận được luồng phản hồi.',502);
  const reader=response.body.getReader(),decoder=new TextDecoder('utf-8',{fatal:true});
  let buffer='',text='',done:BuddyReply|null=null,frames=0;
  const abort=()=>{void reader.cancel().catch(()=>{});};signal.addEventListener('abort',abort,{once:true});
  const frame=(raw:string)=>{
    if(!raw.trim())return;
    const lines=raw.split('\n').filter(x=>x.startsWith('data:')).map(x=>x.slice(5).trimStart());
    if(!lines.length)return;
    if(++frames>1500)throw new BuddyError('invalid_stream','Quá nhiều khung phản hồi.',502);
    const event=JSON.parse(lines.join('\n')) as BuddyEvent;
    if(!event||typeof event!=='object')throw new BuddyError('invalid_stream','Khung phản hồi không hợp lệ.',502);
    if(done)throw new BuddyError('invalid_stream','Có dữ liệu sau khi kết thúc phản hồi.',502);
    if(event.type==='delta'){
      if(typeof event.text!=='string'||event.text.length>12_000||text.length+event.text.length>14_000)throw new BuddyError('invalid_stream','Nội dung phản hồi vượt giới hạn.',502);
      text+=event.text;
    }else if(event.type==='done'){
      if(!event.reply||event.reply.version!==BUDDY_VERSION||typeof event.reply.text!=='string'||event.reply.text!==text||!Number.isSafeInteger(event.reply.revision)||!Array.isArray(event.reply.citations))throw new BuddyError('invalid_stream','Phản hồi cuối không khớp dữ liệu đã nhận.',502);
      done=event.reply;
    }else if(event.type==='error'){
      throw new BuddyError(typeof event.code==='string'?event.code:'request_failed',typeof event.message==='string'?event.message:'Không thể hoàn tất phản hồi.',502);
    }else if(event.type!=='meta')throw new BuddyError('invalid_stream','Loại khung không được hỗ trợ.',502);
    signal.throwIfAborted();onEvent(event);
  };
  try{
    while(true){
      signal.throwIfAborted();const part=await reader.read();signal.throwIfAborted();
      buffer+=decoder.decode(part.value,{stream:!part.done});buffer=buffer.replace(/\r\n/g,'\n');
      if(buffer.length>64_000)throw new BuddyError('invalid_stream','Khung quá lớn.',502);
      let cut:number;while((cut=buffer.indexOf('\n\n'))>=0){const raw=buffer.slice(0,cut);buffer=buffer.slice(cut+2);frame(raw);}
      if(part.done)break;
    }
    if(buffer.trim())frame(buffer);
    if(!done)throw new BuddyError('stream_interrupted','Phản hồi bị ngắt và chưa được xác nhận hoàn tất.',502);
    return done;
  }finally{signal.removeEventListener('abort',abort);void reader.cancel().catch(()=>{});reader.releaseLock();}
}
export interface BuddyClientOptions {getToken:()=>Promise<string|null>;isCurrent:()=>boolean;fetcher?:typeof fetch;base?:string}
export class BuddyClient {
  private session:BuddySession|null=null;
  private controller:AbortController|null=null;
  private disposed=false;
  private dirty=false;
  private readonly fetcher:typeof fetch;
  private readonly base:string;
  constructor(private readonly options:BuddyClientOptions){
    // Native Window.fetch needs the Window receiver. A method copied onto this
    // client works in Node mocks but otherwise throws "Illegal invocation".
    this.fetcher=options.fetcher??globalThis.fetch.bind(globalThis);
    this.base=options.base??BUDDY_BASE;
  }
  private check(){if(this.disposed||!this.options.isCurrent())throw new BuddyError('identity_changed','Danh tính đã thay đổi; phản hồi cũ bị hủy.',401);}
  private async headers():Promise<Record<string,string>>{
    this.check();let token:string|null;
    try{token=await this.options.getToken();}catch{throw new BuddyError('authentication_required','Không thể xác minh đăng nhập; không chuyển sang chế độ khách.',401);}
    this.check();return {'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`} :{}),...(this.session?.guestToken?{'X-Buddy-Guest':this.session.guestToken}:{})};
  }
  private async request(path:string,method:string,body:unknown,signal:AbortSignal):Promise<Response>{
    const headers=await this.headers();this.check();signal.throwIfAborted();
    const response=await this.fetcher(this.base+path,{method,headers,cache:'no-store',credentials:'omit',signal,...(body===undefined?{}:{body:JSON.stringify(body)})});
    this.check();signal.throwIfAborted();
    if(!response.ok){let detail:any;try{detail=await response.json();}catch{}
      throw new BuddyError(typeof detail?.code==='string'?detail.code:'request_failed',typeof detail?.error==='string'?detail.error:'Yêu cầu không hoàn tất.',response.status);}
    return response;
  }
  async send(message:string,lang:BuddyLanguage,onEvent:(event:BuddyEvent)=>void):Promise<BuddyReply>{
    this.check();if(this.controller)throw new BuddyError('request_busy','Đang có phản hồi.');
    const controller=new AbortController();this.controller=controller;
    const timeout=setTimeout(()=>controller.abort(),35_000);
    try{
      if(!this.session){const res=await this.request('/sessions','POST',{},controller.signal);this.session=await res.json();this.check();}
      if(!this.session?.conversationId)throw new BuddyError('invalid_session','Không tạo được phiên.',502);
      if(this.dirty){const res=await this.request(`/sessions/${this.session.conversationId}`,'GET',undefined,controller.signal);const current=await res.json() as BuddySession;this.check();this.session={...current,guestToken:this.session.guestToken};this.dirty=false;}
      const requestId=crypto.randomUUID(),conversationId=this.session.conversationId;
      const response=await this.request('/chat/stream','POST',{message,lang,requestId,conversationId,expectedRevision:this.session.revision},controller.signal);
      const reply=await consumeBuddyStream(response,event=>{
        this.check();
        if(event.type==='meta'&&(event.requestId!==requestId||event.conversationId!==conversationId))throw new BuddyError('invalid_stream','Phiên phản hồi không khớp.',502);
        if(event.type==='done'&&(event.reply.requestId!==requestId||event.reply.conversationId!==conversationId))throw new BuddyError('invalid_stream','Phản hồi cuối không khớp phiên.',502);
        onEvent(event);
      },controller.signal);
      this.check();this.session.revision=reply.revision;return reply;
    }catch(e){this.dirty=true;throw e;}
    finally{clearTimeout(timeout);if(this.controller===controller)this.controller=null;}
  }
  cancel(){this.controller?.abort();this.dirty=true;}
  async reset(){
    this.cancel();const previous=this.session;
    if(previous&&!this.disposed){try{await this.request(`/sessions/${previous.conversationId}`,'DELETE',undefined,AbortSignal.timeout(2500));}catch{}}
    this.session=null;this.dirty=false;
  }
  dispose(){this.disposed=true;this.cancel();this.session=null;}
}
