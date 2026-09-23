import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { resolveBuddyClientIdentity } from '../../shared/buddyIdentity';
import { routeBuddy } from '../../shared/buddyPolicy';
import { ConversationStore } from '../../server/src/buddy/state';
import { emptyTimings, BUDDY_VERSION, type BuddyReply } from '../../shared/buddyChat';
import { randomUUID } from 'node:crypto';
const read=(p:string)=>fs.readFileSync(p,'utf8');
const gitBlob=(text:string)=>createHash('sha1').update(`blob ${Buffer.byteLength(text)}\0`).update(text).digest('hex');
test('legacy training and chat implementations are preserved byte-for-byte',()=>{
 assert.equal(gitBlob(read('server/src/companion/training/legacyRouter.ts')),'f7dfa959701324febbfc766730a7b5344c6c5f65');
 assert.equal(gitBlob(read('src/components/ChatbotLegacy.tsx')),'489affb57946ef165a5cc32ea429897c1994f522');
});
test('rollout wrapper uses new flag and legacy fallback, without weakening old auth',()=>{
 const front=read('src/components/Chatbot.tsx'),back=read('server/src/companion/training/router.ts');
 assert(front.includes("VITE_SHINE_CHAT_ENABLED !== 'true'"));assert(front.includes('LegacyChatbot'));
 assert(back.includes("router.use('/buddy', createConfiguredBuddyRouter(options))"));assert(back.includes('createLegacyTrainingRouter(options)'));
});
test('nutrition and program archives remain ineligible',()=>{
 const programs=JSON.parse(read('data/companion/training_programs.json'));
 assert.equal(programs.programs.length,5);
 assert(programs.programs.every((p:any)=>p.verified===false));
 const text=read('shared/ragDocument.ts');assert(text.includes('kb-nutrition-meal-plan-sources-001'));
 assert.equal(gitBlob(read('data/companion/training_programs.json')),'f53edddb452526b7967961f370c248d259dee70c');
});
test('client identity blocks mismatch, pending logout and auth errors',()=>{
 assert.deepEqual(resolveBuddyClientIdentity('A','B'),{state:'mismatch',uid:null});
 assert.equal(resolveBuddyClientIdentity('A','A',true).state,'pending');
 assert.equal(resolveBuddyClientIdentity('A','A',false,true).state,'error');
 assert.deepEqual(resolveBuddyClientIdentity('A','A'),{state:'authenticated',uid:'A'});
 assert.equal(resolveBuddyClientIdentity(null,'legacy-mock-profile').state,'guest');
 assert.equal(resolveBuddyClientIdentity(undefined,undefined).state,'pending');
});
test('new client has no minimum typing timer, durable transcript or memberInfo payload',()=>{
 const panel=read('src/components/buddy/BuddyPanel.tsx'),client=read('src/components/buddy/client.ts');
 assert(!panel.includes('localStorage.setItem'));assert(!panel.includes('safeStorage'));
 assert(!client.includes('memberInfo:'));assert(!client.includes('history:'));
 assert(!panel.includes('600 -'));assert(panel.includes('generation.current!==version'));
});
test('medical education after a self-disclosure retains caution, not raw sensitive model history',()=>{
 const store=new ConversationStore(),s=store.create('a'),row=store.get(s.conversationId,'a');
 const d=routeBuddy('Tôi bị tiểu đường, protein là gì?');row.memory=d.memory;
 const result:BuddyReply={version:BUDDY_VERSION,requestId:randomUUID(),conversationId:row.id,sessionId:row.id,revision:1,mode:'authenticated_user',task:'NUTRITION_EDUCATION',text:'Protein là chất đạm.',citations:[],missingFields:[],reasonCodes:[],action:null,handover:false,handoverTag:null,handoverStatus:'not_requested',saved:false,timings:emptyTimings()};
 store.begin(row,result.requestId,0);store.finish(row,'Tôi bị tiểu đường, protein là gì?',result);
 assert(row.memory.healthConcern);assert(row.turns.every(t=>t.scope==='private'));assert(!JSON.stringify(row.turns).includes('tiểu đường'));
});
test('grade disclosure and medically actionable explanation remain gated',()=>{
 assert.equal(routeBuddy('Em lớp 9, muốn giảm cân').task,'PROFESSIONAL_REVIEW');
 assert.equal(routeBuddy('Giải thích tôi nên uống thuốc tiểu đường trước hay sau tập').task,'PROFESSIONAL_REVIEW');
});
