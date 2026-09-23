import { MemberSourceReader } from './sourceMemory';
import express, { type Request, type Response, type NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { timingSafeEqual } from 'node:crypto';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { PilotDatabase, SQLiteTrainingStore } from './sqlite';
import { LocalAuth, COOKIE, cookieValue, viewVersion, digest, type LocalSession } from './auth';
import { BuddyError, type BuddyIdentity } from '../../../shared/buddyChat';
import { createBuddyRouter, contextText } from '../buddy/router';
import { ConversationStore } from '../buddy/state';
import { BuddyKnowledge } from '../buddy/knowledge';
import { invalidateOwnTrainingReadiness } from '../buddy/freshness';
import type { BuddyProvider } from '../buddy/provider';
import { TrainingService } from '../companion/training/service';
import { TrainingError } from '../companion/training/validation';
import { normalizeSafetyText } from '../../../shared/programSafety';

export const LOCAL_BUDDY_BASE='/api/local/buddy';
export interface LocalAppOptions { database:PilotDatabase; root:string; allowedOrigins:()=>string[]; now?:()=>number; provider?:BuddyProvider|null; loginLimit?:number }
const same=(a:string,b:string)=>Buffer.byteLength(a)===Buffer.byteLength(b)&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
export function createLocalApp(options:LocalAppOptions) {
  const app=express(),now=options.now??Date.now,store=new SQLiteTrainingStore(options.database);
  const auth=new LocalAuth(options.database,now),training=new TrainingService(store,now),sessions=new ConversationStore(now);
  const sourceReader=new MemberSourceReader(options.database);
  const identities=new WeakMap<Request,LocalSession|null>();
  app.disable('x-powered-by');app.set('trust proxy',false);
  app.use((req,res,next)=>{
    const origins=options.allowedOrigins();
    if(!origins.length||origins.some(o=>{const u=new URL(o);return u.protocol!=='http:'||!['localhost','127.0.0.1'].includes(u.hostname)||u.pathname!=='/';}))return res.status(503).json({code:'local_configuration_required'});
    // Exact Host and Origin checks prevent LAN exposure and DNS-rebinding access.
    if(!origins.some(o=>new URL(o).host===req.headers.host))return res.status(403).json({code:'host_not_allowed'});
    if(req.headers['sec-fetch-site']==='cross-site'||(req.headers.origin&&!origins.includes(String(req.headers.origin))))return res.status(403).json({code:'origin_not_allowed'});
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    next();
  });
  app.use('/api',express.json({limit:'40kb'}));
  app.use('/api',async(req,res,next)=>{
    try{
      if(req.headers.authorization)throw new BuddyError('local_auth_only','Ch\u1ebf \u0111\u1ed9 n\u00e0y ch\u1ec9 nh\u1eadn phi\u00ean local, kh\u00f4ng nh\u1eadn Bearer token.',400);
      const state=await auth.resolve(cookieValue(req.headers.cookie));identities.set(req,state);
      if(!['/local/status','/local/auth/session','/local/auth/login'].includes(req.path)){
        const expected=state?viewVersion(state.hash):'guest';
        if(req.headers['x-local-context']!==expected)throw new BuddyError('identity_changed','Danh t\u00ednh \u0111\u00e3 thay \u0111\u1ed5i. T\u1ea3i l\u1ea1i phi\u00ean.',409);
      }
      if(!['GET','HEAD','OPTIONS'].includes(req.method)){
        if(!options.allowedOrigins().includes(String(req.headers.origin??''))||req.headers['x-local-request']!=='1'||!req.is('application/json'))throw new BuddyError('csrf_required','Y\u00eau c\u1ea7u c\u1ea7n \u0111\u00fang ngu\u1ed3n v\u00e0 m\u00e3 b\u1ea3o v\u1ec7.',403);
        if(state&&!same(String(req.headers['x-csrf-token']??''),state.csrf))throw new BuddyError('csrf_invalid','M\u00e3 b\u1ea3o v\u1ec7 h\u1ebft hi\u1ec7u l\u1ef1c. T\u1ea3i l\u1ea1i phi\u00ean.',403);
      }
      next();
    }catch(e){if(e instanceof BuddyError&&e.status===401)res.clearCookie(COOKIE,{path:'/',httpOnly:true,sameSite:'strict'});next(e);}
  });
  const state=(req:Request)=>identities.get(req)??null;
  const requireUser=(req:Request)=>{const s=state(req);if(!s)throw new BuddyError('sign_in_required','Vui l\u00f2ng \u0111\u0103ng nh\u1eadp t\u00e0i kho\u1ea3n local.',401);return s.user;};
  const handler=(fn:(req:Request,res:Response)=>Promise<unknown>)=>(req:Request,res:Response,next:NextFunction)=>{void fn(req,res).catch(next);};
  const identity=async(req:Request):Promise<BuddyIdentity>=>{
    const s=state(req);
    // Provisioned QA credential, NOT an email verification or a Firebase token.
    return {uid:s?.user.uid??null,emailVerified:false,privateCredentialVerified:!!s,admin:false,authProvider:'local'};
  };
  const entitled=async(uid:string)=>{
    const access=await store.get(`training_access/${uid}`);
    return access?.enabled===true&&typeof access.expiresAt==='string'&&Date.parse(access.expiresAt)>now();
  };
  app.get('/api/local/status',(_req,res)=>res.json({mode:'local-pilot',storage:'sqlite',firebase:false,modelEnabled:!!options.provider}));
  app.get('/api/local/auth/session',(req,res)=>{const s=state(req);res.json(s?{user:LocalAuth.publicUser(s.user),csrf:s.csrf,sessionVersion:viewVersion(s.hash),expiresAt:s.expiresAt}:{user:null,csrf:null,sessionVersion:'guest'});});
  const attempts=rateLimit({windowMs:15*60_000,limit:options.loginLimit??20,standardHeaders:true,legacyHeaders:false,message:{code:'login_rate_limited',error:'Qu\u00e1 nhi\u1ec1u l\u1ea7n \u0111\u0103ng nh\u1eadp. Vui l\u00f2ng ch\u1edd.'}});
  app.post('/api/local/auth/login',attempts,handler(async(req,res)=>{
    const b=req.body;
    if(!b||Array.isArray(b)||Object.keys(b).some(k=>!['email','password'].includes(k))||typeof b.email!=='string'||b.email.length>254||typeof b.password!=='string'||b.password.length<1||b.password.length>128)throw new BuddyError('invalid_login','Ki\u1ec3m tra email v\u00e0 m\u1eadt kh\u1ea9u.');
    const result=await auth.login(b.email,b.password,cookieValue(req.headers.cookie));
    // HTTP is intentional and only allowed on loopback. Never expose this profile over a tunnel.
    res.cookie(COOKIE,result.token,{httpOnly:true,sameSite:'strict',secure:false,path:'/',maxAge:8*60*60_000});
    res.json({user:LocalAuth.publicUser(result.user),csrf:result.csrf,sessionVersion:viewVersion(digest(result.token)),expiresAt:result.expiresAt});
  }));
  app.post('/api/local/auth/logout',handler(async(req,res)=>{
    const u=state(req);if(u)await auth.logout(cookieValue(req.headers.cookie)!);
    res.clearCookie(COOKIE,{path:'/',httpOnly:true,sameSite:'strict'});res.json({signedOut:true});
  }));
  app.get('/api/local/source',handler(async(req,res)=>{
    const u=requireUser(req),snap=await sourceReader.snapshot(u.uid);
    const p=snap?.program;
    res.json({source:u.source,reference:p?{id:p.id,name:p.name,reviewStatus:p.reviewStatus,verified:p.verified,referenceSessionCount:p.referenceSessions.length}:null,
      sourceMemory:snap?{revision:snap.receipt.revision,importedAt:snap.receipt.importedAt,fields:snap.memory.fields,counts:snap.receipt.counts}:null,
      assignedProgramId:null,mealPlanAssignment:null,readOnly:true,confirmedHistoryIsSeparate:true});
  }));
  app.use(LOCAL_BUDDY_BASE,(req,res,next)=>{const s=state(req);if(s&&req.method==='POST'&&req.path.startsWith('/chat'))auth.watch(s,res);next();});
  app.use(LOCAL_BUDDY_BASE,createBuddyRouter({
    resolveIdentity:identity,
    verifyToken:async()=>{throw new Error('Firebase token verifier must never be invoked in local mode');},
    enabled:()=>true,memberContextEnabled:()=>true,adminEmails:()=>[],entitled,
    safetyContext:(_who,req)=>({minorConcern:state(req)?.user.minor===true,healthConcern:state(req)?.user.needsReview===true}),
    sourceReadAllowed:uid=>options.database.access(sql=>!!sql.prepare('SELECT uid FROM local_users WHERE uid=? AND disabled=0').get(uid)),
    readReviewContext:(uid,lang)=>sourceReader.reviewContext(uid,lang),
    readOwnSources:(uid,message,lang,topic)=>sourceReader.answer(uid,message,lang,topic),
    readContext:uid=>training.context(uid),
    describeContext:async(context,message,lang,timestamp)=>{
      const basic=contextText(context,message,lang,timestamp);
      if(!context.profile||!/(ho so|muc tieu|profile|goal)/.test(normalizeSafetyText(message)))return basic;
      const intake=await store.get(`training_members/${context.profile.uid}/qa_sources/intake`);
      if(!intake)return basic;
      return basic+(lang==='vi'?`\n\nB\u1ea3n tham chi\u1ebfu QA: ${intake.ageAtSource} tu\u1ed5i t\u1ea1i ngu\u1ed3n, ${intake.heightCm} cm, ${intake.weightKg} kg. \u0110\u00e2y kh\u00f4ng ph\u1ea3i s\u1ed1 \u0111o hi\u1ec7n t\u1ea1i. L\u1ed9 tr\u00ecnh ngu\u1ed3n ${intake.programId} ch\u01b0a \u0111\u01b0\u1ee3c g\u00e1n th\u00e0nh k\u1ebf ho\u1ea1ch th\u1ef1c thi; ch\u01b0a c\u00f3 meal plan \u0111\u01b0\u1ee3c g\u00e1n.`:'\n\nThe source snapshot is a QA reference, not a current measurement or assigned meal/workout plan.');
    },
    onOwnSafetyReport:uid=>invalidateOwnTrainingReadiness(store,uid),
    sessions,knowledge:new BuddyKnowledge(options.root,now),provider:options.provider??null,now,rateLimit:120
  }));
  app.use('/api/local/training',(req,res,next)=>{
    void (async()=>{const u=requireUser(req);if(u.minor)throw new BuddyError('minor_training_blocked','H\u1ed3 s\u01a1 thi\u1ebfu ni\u00ean kh\u00f4ng \u0111\u01b0\u1ee3c d\u00f9ng planner ng\u01b0\u1eddi l\u1edbn.',403);if(!await entitled(u.uid))throw new BuddyError('pilot_access_expired','Quy\u1ec1n QA h\u1ebft h\u1ea1n.',403);next();})().catch(next);
  });
  // Dedicated local routes: no Firebase/legacy auth or synthetic bearer tokens.
  const t=express.Router();
  t.get('/context',handler(async(req,res)=>res.json(await training.context(requireUser(req).uid))));
  t.put('/readiness',handler(async(req,res)=>res.json({readiness:await training.saveReadiness(requireUser(req).uid,req.body)})));
  t.post('/plans',handler(async(req,res)=>res.json(await training.plan(requireUser(req).uid,req.body))));
  t.get('/plans/:id',handler(async(req,res)=>res.json({plan:await training.getPlan(requireUser(req).uid,req.params.id)})));
  t.post('/plans/:id/start',handler(async(req,res)=>res.json({plan:await training.start(requireUser(req).uid,req.params.id,req.body?.confirmed)})));
  t.post('/plans/:id/complete',handler(async(req,res)=>res.json(await training.complete(requireUser(req).uid,req.params.id,req.body))));
  app.use('/api/local/training',t);
  app.use('/api',(_req,res)=>res.status(404).json({code:'local_route_not_found'}));
  app.use((error:unknown,_req:Request,res:Response,_next:NextFunction)=>{
    if(res.headersSent){res.end();return;}
    const known=error instanceof BuddyError||error instanceof TrainingError;
    const syntax=(error as {type?:string})?.type;
    res.status(known?error.status:syntax==='entity.too.large'?413:syntax==='entity.parse.failed'?400:503).json({code:known?error.code:'local_request_failed',error:known?error.message:'Kh\u00f4ng th\u1ec3 ho\u00e0n t\u1ea5t y\u00eau c\u1ea7u local.',saved:false});
  });
  return {app,auth,store,training,sessions};
}
