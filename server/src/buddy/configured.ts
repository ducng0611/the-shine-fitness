import type { TrainingRouterOptions } from '../companion/training/router';
import { TrainingService } from '../companion/training/service';
import { createBuddyRouter } from './router';
import { createGeminiBuddyProvider } from './provider';
import { invalidateOwnTrainingReadiness } from './freshness';
import { CloudMemberSourceReader } from '../memberSources/cloud';

/** Mounted before the existing training-auth middleware; each buddy request resolves identity itself.
 * Public chat does not require training enrollment. Private access rechecks it on every request.
 * No nutrition archive, real member profile or token is supplied to the model provider.
 * Safety invalidation only removes old readiness after permission checks; it never confirms
 * new symptoms, edits the profile or records workout/meal completion.
 */
export function createConfiguredBuddyRouter(options:TrainingRouterOptions) {
  const service=new TrainingService(options.store,options.clock), now=options.clock??Date.now;
  // Imported member source records (goal, health notes, PT notes, linked programme), owner-only.
  const sources=new CloudMemberSourceReader(options.store,process.cwd());
  return createBuddyRouter({
    sourceReadAllowed:uid=>sources.hasSource(uid),
    readReviewContext:(uid,lang)=>sources.reviewContext(uid,lang),
    readOwnSources:(uid,message,lang,topic)=>sources.answer(uid,message,lang,topic),
    verifyToken:options.verifyToken,
    enabled:()=>process.env.SHINE_CHAT_ENABLED==='true',
    memberContextEnabled:()=>process.env.SHINE_CHAT_MEMBER_CONTEXT_ENABLED==='true' && options.enabled(),
    adminEmails:options.adminEmails,
    entitled:async uid=>{
      if(options.pilotUids().includes(uid))return true;
      const access=await options.store.get(`training_access/${uid}`);
      if(access?.enabled!==true)return false;
      const expiry=access.expiresAt;
      return expiry===undefined || (typeof expiry==='string' && Number.isFinite(Date.parse(expiry)) && Date.parse(expiry)>now());
    },
    readContext:uid=>service.context(uid),
    onOwnSafetyReport:uid=>invalidateOwnTrainingReadiness(options.store,uid),
    provider:process.env.SHINE_CHAT_ENABLED==='true'?createGeminiBuddyProvider():null,
    now,
    timeoutMs:Number(process.env.SHINE_CHAT_TIMEOUT_MS)||12_000
  });
}
