import test from 'node:test';
import assert from 'node:assert/strict';
import { TrainingService } from '../../server/src/companion/training/service';
import { TrainingError } from '../../server/src/companion/training/validation';
import { MemoryStore, NOW, ISO, profileInput, readinessInput, setup, session, clone } from './helpers';
const isCode=(expected:string)=>(error:unknown)=>error instanceof TrainingError && error.code===expected;

test('profile read and update use only authenticated account paths', async()=>{
  const a=await setup(); await a.service.saveProfile('member-b',{profile:profileInput({nickname:'B'}),expectedRevision:0});
  const ctx=await a.service.context('member-b'); assert.equal(ctx.profile!.nickname,'B'); assert.equal(ctx.recentSessions.length,0); assert.equal(ctx.openPlans.length,0);
  await assert.rejects(a.service.getPlan('member-b',a.plan.id),isCode('plan_not_found'));
  await assert.rejects(a.service.saveProfile('member-a',{profile:{...profileInput(),uid:'member-b'},expectedRevision:1}));
});
test('foreign member cannot complete or cancel another member plan', async()=>{
  const a=await setup(); await a.service.saveProfile('member-b',{profile:profileInput(),expectedRevision:0});
  await assert.rejects(a.service.complete('member-b',a.plan.id,a.payload),isCode('plan_not_found'));
  await assert.rejects(a.service.cancel('member-b',a.plan.id),isCode('plan_not_found'));
});
test('revisions reject stale profile edits and reset readiness on update', async()=>{
  const a=await setup(); await a.service.saveProfile(a.account,{profile:profileInput({nickname:'Edited'}),expectedRevision:1});
  await assert.rejects(a.service.saveProfile(a.account,{profile:profileInput(),expectedRevision:1}),isCode('profile_revision_conflict'));
  assert.equal((await a.service.context(a.account)).readiness,null);
});
test('optional profile weight changes create self-reported measurement history',async()=>{
  const store=new MemoryStore(), service=new TrainingService(store,()=>NOW);
  await service.saveProfile('member-a',{profile:profileInput({weightKg:70}),expectedRevision:0});
  const ctx=await service.context('member-a'); assert.equal(ctx.progress.points.length,1); assert.equal(ctx.progress.points[0].weightKg,70); assert.equal(ctx.progress.points[0].source,'profile'); assert.equal(ctx.progress.changeKg,null);
});
test('readiness confirmation and profile revision are mandatory',async()=>{
  const a=await setup(); await assert.rejects(a.service.saveReadiness(a.account,{readiness:readinessInput({confirmed:false}),expectedProfileRevision:1}));
  await assert.rejects(a.service.saveReadiness(a.account,{readiness:readinessInput(),expectedProfileRevision:99}),isCode('profile_revision_conflict'));
});
test('empty gym catalogue supports general mode; gym-only request refuses invented plan',async()=>{
  const a=await setup(); assert.equal(a.plan.mode,'personalized_general');
  const result=await a.service.plan(a.account,{readinessId:a.ready.id,requestId:'only-gym',gymOnly:true}); assert.equal(result.status,'insufficient_verified_gym_data');
});
test('same plan request is idempotent and changed payload conflicts',async()=>{
  const a=await setup(); const same=await a.service.plan(a.account,{readinessId:a.ready.id,requestId:'test-request',gymOnly:false}); assert.equal(same.status,'ready'); if(same.status==='ready') assert.equal(same.plan.id,a.plan.id);
  await assert.rejects(a.service.plan(a.account,{readinessId:a.ready.id,requestId:'test-request',gymOnly:true}),isCode('idempotency_conflict'));
});
test('unstarted plan cannot be completed',async()=>{
  const a=await setup(); const r=await a.service.plan(a.account,{readinessId:a.ready.id,requestId:'second-plan',gymOnly:false}); assert.equal(r.status,'ready'); if(r.status==='ready') await assert.rejects(a.service.complete(a.account,r.plan.id,a.payload),isCode('start_required'));
});
test('new readiness invalidates an older proposed plan',async()=>{
  const a=await setup(); const r=await a.service.plan(a.account,{readinessId:a.ready.id,requestId:'second-plan',gymOnly:false});
  await a.service.saveReadiness(a.account,{readiness:readinessInput({energy:3}),expectedProfileRevision:1});
  if(r.status==='ready') await assert.rejects(a.service.start(a.account,r.plan.id,true),isCode('context_changed'));
});
test('expired readiness does not create a fresh plan',async()=>{
  const a=await setup(); a.advance(7_200_001); const r=await a.service.plan(a.account,{readinessId:a.ready.id,requestId:'late-plan',gymOnly:false}); assert.equal(r.status,'needs_input');
});
test('maintenance change blocks starting proposed plans',async()=>{
  const a=await setup(true); const r=await a.service.plan(a.account,{readinessId:a.ready.id,requestId:'second-plan',gymOnly:false});
  const equipment=await a.store.get('gym_equipment/test-station-a'); a.store.seed('gym_equipment/test-station-a',{...equipment,operationalStatus:'under_maintenance'});
  if(r.status==='ready') await assert.rejects(a.service.start(a.account,r.plan.id,true),isCode('equipment_changed'));
});
test('location changes without a revision still invalidate a pending plan',async()=>{
  const a=await setup(true); const r=await a.service.plan(a.account,{readinessId:a.ready.id,requestId:'second-plan',gymOnly:false});
  const zone=await a.store.get('gym_zones/test-zone'); a.store.seed('gym_zones/test-zone',{...zone,directionsFromReception:'Changed directions'});
  if(r.status==='ready') await assert.rejects(a.service.start(a.account,r.plan.id,true),isCode('location_changed'));
});
test('partial completion saves actuals only; null load remains unknown',async()=>{
  const a=await setup(true); const result=await a.service.complete(a.account,a.plan.id,a.payload);
  assert.equal(result.session.status,'partial'); assert.equal(result.session.exercises.length,1); assert.equal(result.session.exercises[0].sets.length,1); assert.equal(result.session.exercises[0].sets[0].loadKg,null);
  assert.equal(result.session.exercises[0].name,a.plan.exercises[0].name);
  const ctx=await a.service.context(a.account); assert.equal(ctx.summary.sessionsLast14Days,1); assert.equal(ctx.historyRevision,1); assert.equal(ctx.readiness,null);
});
test('concurrent identical completion creates exactly one session and one history revision',async()=>{
  const a=await setup(); const results=await Promise.all(Array.from({length:12},()=>a.service.complete(a.account,a.plan.id,a.payload)));
  assert.equal(results.filter(r=>!r.replay).length,1); assert.equal(a.store.records.get(a.service.root(a.account))!.historyRevision,1);
  assert.equal((await a.store.list(`${a.service.root(a.account)}/sessions`,{limit:100})).length,1);
});
test('conflicting duplicate completion does not overwrite prior actuals',async()=>{
  const a=await setup(); await a.service.complete(a.account,a.plan.id,a.payload);
  await assert.rejects(a.service.complete(a.account,a.plan.id,{...a.payload,actualMinutes:45}),isCode('completion_conflict'));
});
test('completion retry remains idempotent after profile changes',async()=>{
  const a=await setup(); await a.service.complete(a.account,a.plan.id,a.payload);
  await a.service.saveProfile(a.account,{profile:profileInput({nickname:'New'}),expectedRevision:1});
  assert.equal((await a.service.complete(a.account,a.plan.id,a.payload)).replay,true);
});
test('profile change requires explicit acknowledgment when recording previous actuals',async()=>{
  const a=await setup(); await a.service.saveProfile(a.account,{profile:profileInput({nickname:'New'}),expectedRevision:1});
  await assert.rejects(a.service.complete(a.account,a.plan.id,a.payload),isCode('profile_changed'));
  const result=await a.service.complete(a.account,a.plan.id,{...a.payload,acknowledgeProfileChange:true});
  assert.equal(result.session.profileRevisionAtPlanning,1); assert.equal(result.session.profileRevisionAtCompletion,2);
});
test('incorrect current history revision blocks new completion',async()=>{
  const a=await setup(); await assert.rejects(a.service.complete(a.account,a.plan.id,{...a.payload,expectedHistoryRevision:2}),isCode('history_changed'));
});
test('machine becoming unavailable after actual exercise does not erase historical truth',async()=>{
  const a=await setup(true); const row=await a.store.get('gym_equipment/test-station-a'); a.store.seed('gym_equipment/test-station-a',{...row,operationalStatus:'under_maintenance'});
  const result=await a.service.complete(a.account,a.plan.id,a.payload); assert.equal(result.session.confirmed,true);
});
test('general actual reports cannot claim a verified exercise ID',async()=>{
  const a=await setup(); const payload=clone(a.payload); payload.exercises[0].exerciseId='verified-looking-id'; await assert.rejects(a.service.complete(a.account,a.plan.id,payload),isCode('unverified_exercise_reference'));
});
test('actual gym exercise outside the proposed plan is rejected',async()=>{
  const a=await setup(true); const payload=clone(a.payload); payload.exercises[0].exerciseId='other-exercise'; await assert.rejects(a.service.complete(a.account,a.plan.id,payload),isCode('exercise_not_in_plan'));
});
test('completion cannot be inferred from chat or all-skipped exercises',async()=>{
  const a=await setup(); const payload=clone(a.payload); payload.exercises[0].skipped=true; payload.exercises[0].sets=[]; await assert.rejects(a.service.complete(a.account,a.plan.id,payload),isCode('no_actual_performance'));
});
test('future and pre-start completion timestamps are rejected',async()=>{
  const a=await setup(); for(const performedAt of [new Date(NOW+1000).toISOString(),new Date(NOW-600_000).toISOString()]) await assert.rejects(a.service.complete(a.account,a.plan.id,{...a.payload,performedAt}),isCode('invalid_performed_time'));
});
test('deleting a session updates memory and late retry cannot recreate it',async()=>{
  const a=await setup(); await a.service.complete(a.account,a.plan.id,a.payload); await a.service.deleteSession(a.account,a.plan.id,true);
  assert.equal((await a.service.context(a.account)).summary.sessionsLast14Days,0);
  await assert.rejects(a.service.complete(a.account,a.plan.id,a.payload),isCode('session_deleted'));
});
test('legacy opt-in is required and unowned health data is never joined by email',async()=>{
  const a=await setup(); a.store.seed('workout_logs/legacy',{uid:a.account,date:'2026-09-21',category:'legs',sets:[{reps:10,completed:true}]}); a.store.seed('health_assessments/unsafe',{email:'same@example.invalid',weightKg:12});
  assert.equal((await a.service.context(a.account)).legacyDays.length,0);
  await a.service.saveProfile(a.account,{profile:profileInput({includeLegacyHistory:true}),expectedRevision:1}); const ctx=await a.service.context(a.account); assert.equal(ctx.legacyDays.length,1); assert.equal(ctx.profile!.weightKg,null);
});
test('storage error never claims a successful save or an empty history',async()=>{
  const a=await setup(); a.store.failReads=true; await assert.rejects(a.service.context(a.account)); await assert.rejects(a.service.complete(a.account,a.plan.id,a.payload));
});
test('privacy deletion removes own plans, sessions and measurements; keeps other users and legacy data',async()=>{
  const a=await setup(); await a.service.complete(a.account,a.plan.id,a.payload); a.store.seed('workout_logs/keep',{uid:a.account}); a.store.seed('training_members/member-b',{state:'active',profile:{uid:'member-b'}});
  await Promise.all([a.service.removeData(a.account,true),a.service.removeData(a.account,true)]);
  assert.equal((await a.service.context(a.account)).profile,null); assert(a.store.records.has('workout_logs/keep')); assert(a.store.records.has('training_members/member-b')); assert(![...a.store.records.keys()].some(k=>k.startsWith(`${a.service.root(a.account)}/`)));
});
test('new explicit onboarding after deletion uses the new revision and old plan remains absent',async()=>{
  const a=await setup(); await a.service.removeData(a.account,true); const ctx=await a.service.context(a.account);
  await a.service.saveProfile(a.account,{profile:profileInput(),expectedRevision:ctx.profileRevision});
  await assert.rejects(a.service.complete(a.account,a.plan.id,a.payload),isCode('plan_not_found'));
});
