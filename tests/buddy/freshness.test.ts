import test from 'node:test';
import assert from 'node:assert/strict';
import { MemoryStore, setup } from '../training/helpers';
import { invalidateOwnTrainingReadiness, isOwnSafetyReport } from '../../server/src/buddy/freshness';

for(const text of ['Tôi đang đau ngực','Tôi đau vai khi tập','Tôi bị tiểu đường'])test(`own safety freshness: ${text}`,()=>assert.equal(isOwnSafetyReport(text),true));
for(const text of ['Protein là gì?','Tiểu đường type 2 là gì?','Tôi không bị tiểu đường','Con tôi đang đau vai','Bố tôi bị tiểu đường','Trong sách ghi "tôi đang đau ngực" là gì?'])test(`not own safety freshness: ${text}`,()=>assert.equal(isOwnSafetyReport(text),false));
test('readiness invalidation is owner-only and does not create clinical or workout records',async()=>{
 const a=await setup(),before=await a.store.get('training_members/member-a');
 a.store.seed('training_members/member-b',{state:'active',profile:{uid:'member-b',consent:true},readiness:{id:'other'}});
 const other=await a.store.get('training_members/member-b');
 assert.equal(await invalidateOwnTrainingReadiness(a.store,'member-a'),true);
 const after=await a.store.get('training_members/member-a');
 assert.equal(after!.readiness,null);assert.deepEqual(after!.profile,before!.profile);
 assert.equal(after!.profileRevision,before!.profileRevision);assert.equal(after!.historyRevision,before!.historyRevision);
 assert.deepEqual(await a.store.get('training_members/member-b'),other);
 assert.equal([...a.store.records.keys()].filter(k=>k.includes('/sessions/')).length,0);
 assert.equal(await invalidateOwnTrainingReadiness(a.store,'member-a'),false);
});
test('missing/inactive/non-consenting profile creates no data',async()=>{
 const s=new MemoryStore();assert.equal(await invalidateOwnTrainingReadiness(s,'a'),false);assert.equal(s.records.size,0);
 for(const state of ['inactive','deleted']){s.seed('training_members/a',{state,profile:{uid:'a',consent:true},readiness:{id:'r'}});assert.equal(await invalidateOwnTrainingReadiness(s,'a'),false);}
 s.seed('training_members/a',{state:'active',profile:{uid:'a',consent:false},readiness:{id:'r'}});assert.equal(await invalidateOwnTrainingReadiness(s,'a'),false);
});
test('ownership inconsistency and storage outage fail closed',async()=>{
 const s=new MemoryStore();s.seed('training_members/a',{state:'active',profile:{uid:'b',consent:true},readiness:{id:'r'}});
 await assert.rejects(()=>invalidateOwnTrainingReadiness(s,'a'));
 s.failReads=true;await assert.rejects(()=>invalidateOwnTrainingReadiness(s,'a'));
});
test('an unstarted old plan cannot start after invalidation, actual started session stays recordable',async()=>{
 const a=await setup();
 const root=await a.store.get('training_members/member-a');
 const prior=await a.store.get(`training_members/member-a/plans/${a.plan.id}`);
 a.store.seed(`training_members/member-a/plans/${a.plan.id}`,{...prior,status:'proposed',startedAt:null});
 await invalidateOwnTrainingReadiness(a.store,'member-a');
 await assert.rejects(()=>a.service.start('member-a',a.plan.id,true),/stale/i);
 // Observation of an already-started session remains distinct from permission to train.
 a.store.seed(`training_members/member-a/plans/${a.plan.id}`,prior!);
 const completed=await a.service.complete('member-a',a.plan.id,a.payload);
 assert.equal(completed.session.confirmed,true);assert(root);
});
