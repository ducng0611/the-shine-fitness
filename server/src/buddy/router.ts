import { Router, json, type Request, type Response, type NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { performance } from 'node:perf_hooks';
import { BuddyError, BUDDY_VERSION, parseBuddyRequest, emptyTimings, type BuddyIdentity, type BuddyReply, type BuddyEvent, type BuddyRequest, type BuddyTimings, type BuddyLanguage } from '../../../shared/buddyChat';
import { routeBuddy, BUDDY_POLICY_VERSION, type BuddyDecision, type BuddyMemory } from '../../../shared/buddyPolicy';
import { normalizeSafetyText } from '../../../shared/programSafety';
import type { TrainingContextResponse } from '../../../shared/training';
import { ConversationStore, PublicAnswerCache, BuddyMetrics, digest, type Conversation } from './state';
import { BuddyKnowledge } from './knowledge';
import { acceptableEducationOutput, nextWithSignal, transientProviderError, type BuddyProvider } from './provider';
import { isOwnSafetyReport } from './freshness';

export interface BuddyRouterOptions {
  // Explicit server injection for a separate local entrypoint. Never read from body.
  resolveIdentity?:(request:Request)=>Promise<BuddyIdentity>;
  safetyContext?:(identity:BuddyIdentity,request:Request)=>Partial<BuddyMemory>;
  describeContext?:(context:TrainingContextResponse,message:string,lang:BuddyLanguage,now:number)=>Promise<string>;
  verifyToken:(token:string)=>Promise<{uid:string;email?:string;email_verified?:boolean}>;
  enabled:()=>boolean; memberContextEnabled:()=>boolean; adminEmails:()=>string[];
  entitled:(uid:string)=>Promise<boolean>;
  readContext:(uid:string)=>Promise<TrainingContextResponse>;
  onOwnSafetyReport?:(uid:string)=>Promise<boolean>;
  knowledge?:BuddyKnowledge; provider?:BuddyProvider|null;
  sessions?:ConversationStore; cache?:PublicAnswerCache; metrics?:BuddyMetrics;
  now?:()=>number; timeoutMs?:number; rateLimit?:number;
}
const words=(lang:BuddyLanguage,vi:string,en:string)=>lang==='vi'?vi:en;
function replyFor(input:BuddyRequest,row:Conversation,identity:BuddyIdentity,decision:BuddyDecision,timings:BuddyTimings):BuddyReply {
  return {version:BUDDY_VERSION,requestId:input.requestId,conversationId:row.id,sessionId:row.id,revision:row.revision+1,
    mode:identity.uid?'authenticated_user':'guest',task:decision.task,text:'',citations:[],missingFields:[],reasonCodes:[decision.reason],
    action:null,handover:false,handoverTag:null,handoverStatus:'not_requested',saved:false,timings};
}
function publicContextHistory(row:Conversation) {
  return row.turns.filter(t=>t.scope==='public').slice(-6).map(t=>({role:t.role,text:t.text.slice(0,1500)}));
}
export function contextText(context:TrainingContextResponse,message:string,lang:BuddyLanguage,now:number):string {
  if(!context.profile)return words(lang,'Bạn chưa có hồ sơ tập luyện được xác nhận trong module training.','No confirmed training profile is available.');
  const query=normalizeSafetyText(message);
  if(/\b(ho so|muc tieu|profile|goal)\b/.test(query))return words(lang,
    `Mục tiêu được lưu: ${context.profile.goal}. Kinh nghiệm: ${context.profile.experience}. Thời lượng ưa thích: ${context.profile.preferredMinutes} phút. Đây là dữ kiện tự báo trong hồ sơ, không phải đánh giá sức khỏe.`,
    `Recorded goal: ${context.profile.goal}; experience: ${context.profile.experience}; preferred duration: ${context.profile.preferredMinutes} minutes. These are self-reported profile facts, not a health assessment.`);
  const zone=context.profile.timezone;
  const day=(s:string)=>new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(s));
  const today=day(new Date(now).toISOString()),date=new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate()-(date.getUTCDay()+6)%7);
  const previous=/\b(tuan truoc|last week)\b/.test(query);
  const end=previous?date.toISOString().slice(0,10):today;
  if(previous)date.setUTCDate(date.getUTCDate()-7);
  const start=date.toISOString().slice(0,10);
  const records=context.recentSessions.filter(s=>s.uid===context.profile!.uid&&s.confirmed&&['completed','partial'].includes(s.status)&&Number.isFinite(Date.parse(s.performedAt))&&Date.parse(s.performedAt)<=now&&day(s.performedAt)>=start&&(previous?day(s.performedAt)<end:day(s.performedAt)<=end));
  const sets=records.reduce((n,s)=>n+s.exercises.filter(e=>!e.skipped).reduce((m,e)=>m+e.sets.length,0),0);
  const last=records.map(s=>day(s.performedAt)).sort().at(-1);
  return words(lang,
    `Từ ${start} ${previous?'đến trước':'đến'} ${end} (${zone}), nhật ký đã xác nhận có ${records.length} buổi và ${sets} hiệp thực tế.${last?` Lần ghi gần nhất trong khoảng này: ${last}.`:''} Kế hoạch dự kiến không được tính thành buổi đã tập. Thiếu nhật ký không chứng minh bạn đã nghỉ tập.${context.summary.truncated?' Nguồn bị giới hạn số bản ghi; kết quả có thể chưa đầy đủ.':''}`,
    `From ${start} ${previous?'until before':'through'} ${end} (${zone}), confirmed logs contain ${records.length} sessions and ${sets} actual sets.${last?` Latest recorded date in this window: ${last}.`:''} Proposed plans are not completed workouts. Missing logs do not prove inactivity.${context.summary.truncated?' The source is truncated, so this may be incomplete.':''}`);
}

export function createBuddyRouter(options:BuddyRouterOptions):Router {
  const router=Router(),now=options.now??Date.now;
  const sessions=options.sessions??new ConversationStore(now),cache=options.cache??new PublicAnswerCache(now),metrics=options.metrics??new BuddyMetrics();
  const knowledge=options.knowledge??new BuddyKnowledge(process.cwd(),now);
  router.use((_req,res,next)=>{res.setHeader('Cache-Control','no-store');res.setHeader('Vary','Authorization, X-Buddy-Guest');res.setHeader('X-Content-Type-Options','nosniff');next();});
  router.use(rateLimit({windowMs:60_000,limit:options.rateLimit??40,standardHeaders:true,legacyHeaders:false}));
  router.use(json({limit:'16kb'}));
  const identity=async(req:Request):Promise<BuddyIdentity>=>{
    if(options.resolveIdentity)return options.resolveIdentity(req);
    const h=req.headers.authorization;
    if(h===undefined)return {uid:null,emailVerified:false,admin:false};
    if(typeof h!=='string'||!/^Bearer [^\s]+$/.test(h)||h.length>16_500)throw new BuddyError('invalid_token','Phiên đăng nhập không hợp lệ. Hãy đăng nhập lại.',401);
    let token;
    try{token=await options.verifyToken(h.slice(7));}catch{throw new BuddyError('invalid_token','Phiên đăng nhập hết hạn hoặc đã bị thu hồi. Hãy đăng nhập lại.',401);}
    if(typeof token.uid!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(token.uid))throw new BuddyError('invalid_identity','Định danh không hợp lệ.',401);
    return {uid:token.uid,emailVerified:token.email_verified===true,admin:token.email_verified===true&&options.adminEmails().map(x=>x.trim().toLowerCase()).includes((token.email??'').trim().toLowerCase())};
  };
  const guest=(req:Request)=>typeof req.headers['x-buddy-guest']==='string'?req.headers['x-buddy-guest']:undefined;
  const enabled=()=>{if(!options.enabled())throw new BuddyError('chat_disabled','AI Gym Buddy mới chưa được bật tại môi trường này.',503);};
  const fail=(error:unknown,res:Response)=>{
    const e=error instanceof BuddyError?error:new BuddyError('service_unavailable','Không thể hoàn tất yêu cầu. Chưa xác nhận bất kỳ thay đổi dữ liệu nào.',503);
    if(!res.headersSent)res.status(e.status).json({error:e.message,code:e.code,saved:false});
    else if(!res.writableEnded){res.write(`data: ${JSON.stringify({type:'error',code:e.code,message:e.message})}\n\n`);res.end();}
  };
  router.post('/sessions',async(req,res)=>{
    try{enabled();const who=await identity(req);if(!req.body||Array.isArray(req.body)||Object.keys(req.body).length)throw new BuddyError('unexpected_fields','Tạo phiên không nhận hồ sơ hoặc lịch sử.');res.status(201).json(sessions.create(who.uid));}catch(e){fail(e,res);}
  });
  router.get('/sessions/:id',async(req,res)=>{try{const who=await identity(req);res.json(sessions.describe(sessions.get(req.params.id,who.uid,guest(req))));}catch(e){fail(e,res);}});
  router.delete('/sessions/:id',async(req,res)=>{try{const who=await identity(req);sessions.remove(sessions.get(req.params.id,who.uid,guest(req)));res.json({deleted:true,scope:'ephemeral_conversation_only'});}catch(e){fail(e,res);}});
  router.get('/metrics',async(req,res)=>{try{const who=await identity(req);if(!who.admin)throw new BuddyError('admin_required','Cần quyền quản trị đã xác minh.',403);res.json(metrics.summary());}catch(e){fail(e,res);}});

  async function handle(req:Request,res:Response,stream:boolean) {
    const started=performance.now(),timings=emptyTimings();
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(new BuddyError('request_timeout','Yêu cầu quá thời gian. Không có thay đổi dữ liệu được xác nhận.',504)),Math.min(30_000,Math.max(2000,options.timeoutMs??12_000)));
    const disconnect=()=>{if(!res.writableEnded)controller.abort(new BuddyError('request_cancelled','Đã dừng phản hồi.',499));};
    req.once('aborted',disconnect);res.once('close',disconnect);
    let row:Conversation|undefined,input:BuddyRequest|undefined,reply:BuddyReply|null=null,finished=false,locked=false;
    const send=async(event:BuddyEvent)=>{
      controller.signal.throwIfAborted();if(!stream)return;
      if(!res.write(`data: ${JSON.stringify(event)}\n\n`))await nextWithSignal(new Promise<void>(resolve=>res.once('drain',resolve)),controller.signal);
    };
    const emit=async(text:string)=>{if(!text)return;controller.signal.throwIfAborted();if(timings.firstContentMs===null)timings.firstContentMs=performance.now()-started;await send({type:'delta',text});};
    try {
      enabled();input=parseBuddyRequest(req.body);
      const authStart=performance.now(),who=await nextWithSignal(identity(req),controller.signal);timings.authMs=performance.now()-authStart;
      row=sessions.get(input.conversationId,who.uid,guest(req));sessions.begin(row,input.requestId,input.expectedRevision);locked=true;
      const routeStart=performance.now();
      const constrained=options.safetyContext?.(who,req);
      if(constrained){row.memory.minorConcern ||= constrained.minorConcern===true;row.memory.healthConcern ||= constrained.healthConcern===true;row.memory.allergyConcern ||= constrained.allergyConcern===true;}
      const decision=routeBuddy(input.message,row.memory);row.memory=decision.memory;timings.routeMs=performance.now()-routeStart;
      reply=replyFor(input,row,who,decision,timings);
      if(stream){res.status(200).setHeader('Content-Type','text/event-stream; charset=utf-8');res.setHeader('X-Accel-Buffering','no');res.flushHeaders();await send({type:'meta',requestId:input.requestId,conversationId:row.id});}
      const lang=input.lang,choose=(vi:string,en:string)=>words(lang,vi,en);
      if(decision.task==='URGENT_SAFETY') {
        reply.handover=true;reply.handoverTag='HEALTH_RISK';reply.handoverStatus='suggested';
        reply.text=choose('Nếu dấu hiệu cảnh báo bạn mô tả đang xảy ra, hãy dừng tập, nhờ người gần đó hỗ trợ và liên hệ cấp cứu địa phương ngay. Đừng chờ phòng tập phản hồi hoặc tự tập tiếp để kiểm tra. Em không chẩn đoán nguyên nhân và chưa gọi cấp cứu thay bạn.',
          'If the warning signs you describe are happening now, stop exercising, ask someone nearby for help and contact local emergency services immediately. Do not wait for the gym or continue exercising to test the symptoms. I have not diagnosed the cause or called on your behalf.');
      } else if(decision.task==='PROFESSIONAL_REVIEW') {
        reply.handover=true;reply.handoverTag='HEALTH_RISK';reply.handoverStatus='suggested';
        reply.text=choose('Yêu cầu này cần được chuyên gia y tế hoặc người phụ trách phù hợp xem xét riêng. Em không chọn thuốc, liều dùng, mục tiêu ăn kiêng hay giáo án điều trị từ các mẫu tham chiếu. Với người dưới 18 tuổi, cần người giám hộ phối hợp. Đây mới là đề nghị chuyển giao; chưa tạo lịch hẹn hoặc gửi hồ sơ.',
          'This personal request needs review by an appropriate healthcare or qualified professional. I will not select medication, doses, dietary targets or therapeutic workouts from sample records. A guardian should be involved for under-18s. This is a suggested referral, not a booking or a transmitted record.');
      } else if(decision.privateRequest) {
        if(!who.uid){reply.missingFields=['verified_sign_in'];reply.text=choose('Bạn vẫn có thể hỏi kiến thức chung. Để xem hồ sơ hoặc nhật ký riêng, cần đăng nhập đúng phương thức của ứng dụng; thông tin tên hay hạng thẻ từ trình duyệt không cấp quyền truy cập.','General questions remain available. An authenticated sign-in is needed for private records; browser names or membership labels do not grant access.');}
        else if(!options.memberContextEnabled()){reply.reasonCodes.push('member_context_disabled');reply.text=choose('Bạn đã đăng nhập, nhưng khả năng đọc ngữ cảnh hội viên qua chat chưa được mở tại môi trường này. Hỏi đáp kiến thức chung vẫn hoạt động.','You are signed in, but member-context access is not enabled here. General education remains available.');}
        else {
          const contextStart=performance.now();
          const admitted=(who.privateCredentialVerified===true||who.emailVerified)&&await nextWithSignal(options.entitled(who.uid),controller.signal);
          if(!admitted){reply.reasonCodes.push('member_access_required');reply.text=choose('Tài khoản đã đăng nhập nhưng chưa có quyền đọc dữ liệu tập qua AI Gym Buddy. Hãy nhờ quản trị xác nhận quyền pilot; bạn vẫn hỏi kiến thức chung bình thường.','Your account is signed in but not admitted to member-context access. Ask an administrator about pilot access; general questions remain available.');}
          else {
            const context=await nextWithSignal(options.readContext(who.uid),controller.signal);
            if(!context.profile||context.profile.uid!==who.uid||context.profile.consent!==true){reply.reasonCodes.push('profile_or_consent_required');reply.text=choose('Cần hoàn tất hồ sơ và đồng ý sử dụng dữ liệu trong Training trước khi đọc ngữ cảnh cá nhân.','Complete the training profile and data consent before using personal context.');}
            else {
              reply.mode='authorized_member';
              if(decision.task==='MEMBER_CONTEXT_QA') {
                if(/meal|thuc don|ghi chu|pt giao|pt ghi/i.test(normalizeSafetyText(input.message)))reply.text=choose('Luồng này chưa có bộ đọc meal plan hoặc ghi chú PT được gán cho bạn. Em không lấy mẫu của người khác để thay thế. Hiện có thể xem hồ sơ tập và nhật ký đã xác nhận.','Assigned meal plans and PT notes are not connected to this reader. I will not substitute another person’s sample. Confirmed training records are available.');
                else {reply.text=options.describeContext?await nextWithSignal(options.describeContext(context,input.message,lang,now()),controller.signal):contextText(context,input.message,lang,now());reply.citations=[{id:'own-confirmed-training',title:choose('Hồ sơ và nhật ký training của chính tài khoản','Your own confirmed training records'),scope:'own_record'}];}
              } else if(decision.task==='LOGGING_REQUEST') {
                reply.text=choose('Em chưa lưu nội dung này. Phần tập thực tế cần xác nhận trong Training; nhật ký bữa ăn chưa được triển khai. Một câu kể đã tập hoặc đã ăn không tự trở thành dữ liệu hoàn thành.','I have not saved this. Actual training requires confirmation in Training; meal logging is not implemented. A chat statement is not automatically a completed record.');reply.action='open_training';
              } else if(context.profile.healthReviewNeeded||context.profile.age<18||context.readiness?.currentPain) {
                reply.task='PROFESSIONAL_REVIEW';reply.handover=true;reply.handoverTag='HEALTH_RISK';reply.handoverStatus='suggested';
                reply.text=choose('Hồ sơ hoặc xác nhận thể trạng có lưu ý cần đánh giá chuyên môn. Em không lập hoặc chỉnh giáo án/meal plan từ mẫu trong tình huống này. Có thể xem lại thông tin đã ghi và trao đổi với người phụ trách.','Your profile or readiness contains a review requirement. I will not generate or adjust a workout or meal plan from samples. You can review the recorded information with the responsible professional.');
              } else {
                reply.text=choose('Em chưa tạo giáo án hoặc meal plan mới trong cuộc chat này. Mở Training để xác nhận thể trạng hiện tại và dùng planner đã có; máy, bài và định lượng phải qua xác minh. Các mẫu dinh dưỡng vẫn chờ duyệt, không phải thực đơn được gán cho bạn.','No new workout or meal plan has been created in this chat. Open Training to confirm readiness and use the existing planner with verified equipment and prescriptions. Nutrition samples remain unapproved, not your assigned diet.');reply.action='open_training';
              }
            }
          }
          timings.contextMs=performance.now()-contextStart;
        }
      } else if(decision.task==='OUT_OF_SCOPE')reply.text=choose('Em hỗ trợ kiến thức gym, vận động, sức khỏe tổng quát và thông tin The Shine. Với yêu cầu này, bạn hãy nêu rõ câu hỏi trong phạm vi đó; em không truy cập hồ sơ người khác hoặc làm theo yêu cầu bỏ qua quyền và an toàn.','I support gym, movement, general health education and The Shine information. Please clarify your question in that scope. I do not access other people’s records or bypass permissions.');
      else if(decision.reason==='greeting')reply.text=choose('Chào bạn, em là AI Gym Buddy của The Shine. Bạn có thể hỏi về tập luyện, kiến thức dinh dưỡng hoặc dịch vụ; không cần đăng nhập để hỏi kiến thức chung.','Hello, I am The Shine AI Gym Buddy. Ask about training, general nutrition or services; general education does not require signing in.');
      else {
        const retrievalStart=performance.now();
        const fact=decision.task==='BUSINESS_QA'?knowledge.business(input.message,lang):knowledge.education(decision.topic,input.message,lang);
        timings.retrievalMs=performance.now()-retrievalStart;
        const cacheable=row.turns.length===0&&!row.memory.healthConcern&&!row.memory.minorConcern&&!row.memory.allergyConcern&&!/\b(toi|em|my|i|me)\b/.test(normalizeSafetyText(input.message));
        const key=fact?digest([input.message,lang,decision.task,decision.topic,fact.revision,BUDDY_POLICY_VERSION].join('|')):'';
        const hit=cacheable&&key?cache.get(key):null;
        if(hit){reply.text=hit.text;reply.citations=hit.citations;timings.cacheHit=true;}
        else if(fact){reply.text=fact.text;reply.citations=fact.citations;if(cacheable)cache.set(key,{text:fact.text,citations:fact.citations,task:decision.task});}
        else if(decision.task==='BUSINESS_QA')reply.text=choose('Nguồn The Shine hiện không có thông tin còn hiệu lực và đủ cụ thể cho câu hỏi này. Em không suy đoán giá, lịch, máy tập hoặc vị trí; cần bộ phận phòng tập xác nhận.','No sufficiently specific, current The Shine source is available for this question. I will not guess prices, schedules, equipment or locations.');
        else if(!decision.generationAllowed||!options.provider)reply.text=choose('Em chưa có nguồn giáo dục đủ cụ thể để trả lời phần này một cách chắc chắn. Bạn muốn làm rõ khái niệm hay đang cần gợi ý riêng cho tình trạng của mình? Em sẽ không dùng meal plan hoặc hồ sơ lịch sử thay thế.','I do not yet have sufficiently specific educational evidence for that detail. Are you asking about a concept or an individual situation? I will not substitute historical meal plans or private records.');
        else {
          const modelStart=performance.now(),provider=options.provider;
          const wholeAnswerGate=decision.task==='HEALTH_EDUCATION'||decision.task==='NUTRITION_EDUCATION';
          let produced='',pending='';
          const generate=async(fallback:boolean)=>{
            const iterator=provider.stream({message:input!.message,history:publicContextHistory(row!),lang,evidence:'No matched source for this exact detail. Explain only general educational concepts; explicitly acknowledge unsupported specifics. Do not invent citations, personal plans or gym facts.',signal:controller.signal,onCall:()=>{timings.modelCalls++;}},fallback)[Symbol.asyncIterator]();
            try {
              while(true){
                const next=await nextWithSignal(iterator.next(),controller.signal);if(next.done)break;
                pending+=next.value;
                if(!acceptableEducationOutput(produced+pending))throw new BuddyError('unsafe_model_output','Phản hồi không vượt qua kiểm tra nội dung. Không tiếp tục hiển thị.',502);
                if(!wholeAnswerGate){
                  let match:RegExpExecArray|null;
                  while((match=/^[\s\S]*?[.!?\n](?:\s|$)/.exec(pending))){const piece=match[0];pending=pending.slice(piece.length);produced+=piece;await emit(piece);}
                }
              }
            } finally {if(iterator.return)void iterator.return().catch(()=>{});}
          };
          try {await generate(false);}catch(e){if(produced||!provider.hasFallback||controller.signal.aborted||!transientProviderError(e))throw e;pending='';timings.fallback=true;await generate(true);}
          if(pending){if(!acceptableEducationOutput(produced+pending))throw new BuddyError('unsafe_model_output','Phản hồi không đạt kiểm tra.',502);produced+=pending;await emit(pending);}
          if(!produced.trim())throw new BuddyError('empty_model_output','Chưa có phản hồi hữu ích. Hãy thử diễn đạt lại câu hỏi.',502);
          reply.text=produced;reply.reasonCodes.push('general_model_knowledge_not_source_verified');timings.modelMs=performance.now()-modelStart;
        }
      }
      // Preserve the existing Training safety invariant across the new chat entrypoint.
      // This only removes old readiness; it never confirms symptoms, creates readiness
      // or records a workout. Emit controlled urgent guidance before any storage wait.
      if(options.onOwnSafetyReport&&who.uid&&(who.privateCredentialVerified===true||who.emailVerified)&&options.memberContextEnabled()&&isOwnSafetyReport(input.message)){
        if(timings.firstContentMs===null)await emit(reply.text);
        const safetyStart=performance.now();
        if(await nextWithSignal(options.entitled(who.uid),controller.signal)){
          const invalidated=await nextWithSignal(options.onOwnSafetyReport(who.uid),controller.signal);
          if(invalidated){
            reply.reasonCodes.push('previous_readiness_invalidated');
            const notice=choose('\n\nXác nhận thể trạng cũ đã được vô hiệu hóa. Bạn cần trả lời lại trong Training trước khi bắt đầu kế hoạch cũ; không có chẩn đoán hay buổi tập nào được tự ghi thêm.','\n\nYour previous readiness was invalidated. Confirm your current state in Training before starting an old plan; no diagnosis or completed workout was created.');
            reply.text+=notice;await emit(notice);
          }
        }
        timings.contextMs+=performance.now()-safetyStart;
      }
      if(timings.firstContentMs===null)await emit(reply.text);
      controller.signal.throwIfAborted();
      sessions.finish(row,input.message,reply);finished=true;reply.revision=row.revision;timings.totalMs=performance.now()-started;
      metrics.add(reply.task,reply.mode,timings,'success');
      if(stream){await send({type:'done',reply});res.end();}else res.json(reply);
    } catch(error) {
      if(row&&input&&locked&&!finished)sessions.finish(row,input.message,null);
      timings.totalMs=performance.now()-started;
      metrics.add(reply?.task??'OUT_OF_SCOPE',reply?.mode??'guest',timings,controller.signal.aborted?'cancelled':'error');
      if(!res.destroyed)fail(controller.signal.aborted?controller.signal.reason:error,res);
    } finally {clearTimeout(timer);req.removeListener('aborted',disconnect);res.removeListener('close',disconnect);}
  }
  router.post('/chat',(req,res)=>{void handle(req,res,false);});
  router.post('/chat/stream',(req,res)=>{void handle(req,res,true);});
  router.use((error:unknown,_req:Request,res:Response,_next:NextFunction)=>{
    const type=(error as {type?:string})?.type;
    if(type==='entity.parse.failed'||type==='entity.too.large')return fail(new BuddyError('invalid_request','Nội dung JSON không hợp lệ hoặc vượt giới hạn.',type==='entity.too.large'?413:400),res);
    fail(error,res);
  });
  return router;
}
