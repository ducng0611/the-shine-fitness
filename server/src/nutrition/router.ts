import { Router, json, type Request, type Response, type NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import fs from 'node:fs';
import path from 'node:path';
import { validateNutritionLibrary, type NutritionSourceBundle, type NutritionMapping, type NutritionLibrary } from '../../../shared/nutritionKnowledge';
import { evaluateNutritionReadiness, type NutritionContext } from '../../../shared/nutritionRouting';

export interface NutritionRouterOptions {
  verifyToken:(token:string)=>Promise<{uid:string;email?:string;email_verified?:boolean}>;
  adminEmails:()=>string[];
  enabled:()=>boolean;
  load?:()=>{source:NutritionSourceBundle;mapping:NutritionMapping;library:NutritionLibrary};
}
export function loadNutritionFiles() {
  const folder=path.join(process.cwd(),'data/nutrition');
  const read=(name:string)=>JSON.parse(fs.readFileSync(path.join(folder,name),'utf8'));
  return {source:read('source-documents.json') as NutritionSourceBundle,mapping:read('template-mapping.json') as NutritionMapping,library:read('meal-plan-library.json') as NutritionLibrary};
}
/** API chỉ đọc và xem trước. Không có thao tác duyệt y khoa, ghi nhật ký hoặc ghi hồ sơ hội viên. */
export function createNutritionRouter(options:NutritionRouterOptions):Router {
  const router=Router();
  router.use((_req,res,next)=>{res.setHeader('Cache-Control','no-store');res.setHeader('Vary','Authorization');next();});
  router.use(rateLimit({windowMs:60_000,limit:60,standardHeaders:true,legacyHeaders:false}));
  router.use(async(req,res,next)=>{
    const auth=req.headers.authorization;
    if(!auth?.startsWith('Bearer ')||auth.length>16500)return res.status(401).json({code:'authentication_required'});
    let identity;
    try { identity=await options.verifyToken(auth.slice(7)); }
    catch { return res.status(401).json({code:'invalid_token'}); }
    const allowed=options.adminEmails().map(x=>x.trim().toLowerCase()).filter(Boolean);
    if(!identity.uid||identity.email_verified!==true||!identity.email||!allowed.includes(identity.email.trim().toLowerCase()))return res.status(403).json({code:'admin_required'});
    if(!options.enabled())return res.status(503).json({code:'nutrition_source_review_disabled'});
    next();
  });
  router.use(json({limit:'16kb'}));
  const loaded=()=>{
    const value=(options.load??loadNutritionFiles)();
    const summary=validateNutritionLibrary(value.library,value.source,value.mapping);
    return {...value,summary};
  };
  router.get('/library',(_req,res,next)=>{
    try { const {library,summary}=loaded();res.json({scope:'source_review_only',library,summary}); }
    catch(e){next(e);}
  });
  router.post('/preview',(req,res,next)=>{
    if(!req.body||typeof req.body!=='object'||Array.isArray(req.body)||Object.keys(req.body).some(k=>k!=='context'))return res.status(400).json({code:'invalid_context'});
    let decision;
    try { decision=evaluateNutritionReadiness(req.body.context as NutritionContext); }
    catch { return res.status(400).json({code:'invalid_context'}); }
    try { const {summary}=loaded();res.json({scope:'admin_context_simulation_not_member_advice',decision,summary,saved:false,modelCalled:false}); }
    catch(e){next(e);}
  });
  router.use((_req,res)=>res.status(405).json({code:'source_review_only_no_mutations'}));
  router.use((err:unknown,_req:Request,res:Response,_next:NextFunction)=>{
    if((err as {type?:string})?.type==='entity.too.large')return res.status(413).json({code:'payload_too_large'});
    if((err as {type?:string})?.type==='entity.parse.failed')return res.status(400).json({code:'invalid_json'});
    return res.status(503).json({code:'nutrition_source_unavailable',error:'Không thể đọc hoặc kiểm tra nguồn dinh dưỡng. Không có khuyến nghị hay thao tác lưu thành công được xác nhận.'});
  });
  return router;
}