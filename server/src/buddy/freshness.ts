import type { TrainingStore } from '../companion/training/store';
import { routeBuddy, nonQuotedSpeech } from '../../../shared/buddyPolicy';
import { normalizeSafetyText } from '../../../shared/programSafety';
import { BuddyError } from '../../../shared/buddyChat';

/** A warning changes freshness, not a diagnosis, reported pain value or completed activity. */
export function isOwnSafetyReport(message:string):boolean {
  const text=normalizeSafetyText(nonQuotedSpeech(message));
  if(/\b(con toi|con em|be nha|bo toi|me toi|anh toi|chi toi|ban toi|nguoi nha|hoi ho|hoi cho|my child|my son|my daughter|my father|my mother|my friend)\b/.test(text))return false;
  const d=routeBuddy(message);
  const self=/\b(toi|minh|em|anh|chi|i|i'm|im)\b/.test(text);
  return d.task==='URGENT_SAFETY'||(self&&d.task==='PROFESSIONAL_REVIEW'&&d.memory.healthConcern);
}
/** Called only after authenticated identity, enabled member scope and entitlement checks.
 * It matches the existing training safety-chat semantics: null old readiness atomically,
 * preserve profile/history revisions, and never create a profile, symptom or session.
 */
export async function invalidateOwnTrainingReadiness(store:TrainingStore,uid:string):Promise<boolean> {
  if(!/^[A-Za-z0-9_-]{1,128}$/.test(uid))throw new BuddyError('invalid_identity','Định danh không hợp lệ.',403);
  return store.atomic(async tx=>{
    const path=`training_members/${uid}`,root=await tx.get(path);
    if(!root||root.state!=='active'||!root.profile)return false;
    const profile=root.profile as Record<string,unknown>;
    if(profile.uid!==uid)throw new BuddyError('identity_mismatch','Quyền sở hữu hồ sơ không hợp lệ.',403);
    if(profile.consent!==true||!root.readiness)return false;
    tx.set(path,{...root,readiness:null});
    return true;
  });
}
