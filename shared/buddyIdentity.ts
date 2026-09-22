export type BuddyClientIdentity = {state:'pending'|'mismatch'|'error';uid:null}|{state:'guest';uid:null}|{state:'authenticated';uid:string};
/** Display data can block inconsistency but can never grant authentication. */
export function resolveBuddyClientIdentity(firebaseUid:string|null|undefined,displayUid:string|undefined,logoutPending=false,authError=false,displayState:'unmanaged'|'absent'|'present'='unmanaged'):BuddyClientIdentity {
  if(authError)return {state:'error',uid:null};
  if(logoutPending||firebaseUid===undefined)return {state:'pending',uid:null};
  if(firebaseUid && (displayState==='absent'||(displayState==='present'&&!displayUid)))return {state:'mismatch',uid:null};
  if(displayUid&&firebaseUid&&displayUid!==firebaseUid)return {state:'mismatch',uid:null};
  if(!firebaseUid)return {state:'guest',uid:null};
  return {state:'authenticated',uid:firebaseUid};
}
