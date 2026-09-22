import express from 'express';
import { createServer as createViteServer } from 'vite';
import react from '@vitejs/plugin-react';
import { createBuddyRouter } from '../../server/src/buddy/router';
import { BuddyKnowledge } from '../../server/src/buddy/knowledge';
import { emptySummary } from '../../server/src/companion/training/context';
import type { TrainingContextResponse } from '../../shared/training';
if(process.env.NODE_ENV!=='test')throw new Error('This harness runs only under NODE_ENV=test on loopback.');
const now=()=>Date.parse('2026-09-23T05:00:00Z');
const app=express();let aborted=0;
app.get('/__test/status',(_req,res)=>res.json({aborted}));
app.use('/api/companion/training/buddy',createBuddyRouter({enabled:()=>true,memberContextEnabled:()=>true,adminEmails:()=>[],rateLimit:1000,now,
  knowledge:new BuddyKnowledge(process.cwd(),now),
  verifyToken:async token=>{if(!['test-a','test-b'].includes(token))throw Error('test identity');return {uid:token,email_verified:true};},
  entitled:async uid=>['test-a','test-b'].includes(uid),
  readContext:async uid=>({profile:{uid,nickname:uid,age:25,adultConfirmed:true,consent:true,goal:uid==='test-a'?'hypertrophy':'mobility',experience:'beginner',preferredMinutes:35,timezone:'Asia/Ho_Chi_Minh',heightCm:null,weightKg:null,preferences:[],avoidedExerciseIds:[],healthReviewNeeded:false,includeLegacyHistory:false,style:'gentle',revision:1,createdAt:'2026-09-22T00:00:00Z',updatedAt:'2026-09-22T00:00:00Z',consentVersion:'training-v1'},profileRevision:1,historyRevision:0,readiness:null,openPlans:[],summary:emptySummary(),recentSessions:[],progress:{points:[],changeKg:null,explanation:'not_enough'},legacyDays:[],warnings:[]} as TrainingContextResponse),
  provider:{hasFallback:false,async *stream(input){input.onCall();yield 'Đây là phần đầu của giải thích tổng hợp. ';await new Promise<void>((resolve,reject)=>{const timer=setTimeout(resolve,1800);input.signal.addEventListener('abort',()=>{clearTimeout(timer);aborted++;reject(Error('aborted'));},{once:true});});yield 'Đây là phần cuối của giải thích tổng hợp.';}}
}));
const vite=await createViteServer({configFile:false,plugins:[react()],server:{middlewareMode:true},appType:'mpa'});
app.use(vite.middlewares);
app.listen(4175,'127.0.0.1',()=>console.log('Synthetic buddy harness listening on loopback:4175'));
