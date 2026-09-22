import React, { useCallback, useEffect, useRef, useState } from 'react';
import { onIdTokenChanged, signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import type { MemberUser } from '../AuthModal';
import type { Language } from '../../translations';
import { BuddyPanel } from './BuddyPanel';
import './buddy.css';
interface Props { lang?:Language;currentUser?:MemberUser|null;onOpenTrialModal?:()=>void;onToggle?:(open:boolean)=>void;onOpenTraining?:()=>void }
export default function BuddyChat({lang='vi',currentUser,onToggle,onOpenTraining}:Props) {
  const [open,setOpen]=useState(false),[firebaseUid,setFirebaseUid]=useState<string|null|undefined>(undefined);
  const previousView=useRef(currentUser);
  useEffect(()=>onIdTokenChanged(auth,user=>setFirebaseUid(user?.uid??null),()=>setFirebaseUid(null)),[]);
  useEffect(()=>{onToggle?.(open);},[open,onToggle]);
  useEffect(()=>{
    // Old app logout only clears its display record. The new flow also signs out
    // Firebase, so other tabs receive the identity change. Never infer identity
    // or gender from the display record.
    if(previousView.current && currentUser===null){setFirebaseUid(null);void signOut(auth).catch(()=>{});}
    previousView.current=currentUser;
  },[currentUser]);
  useEffect(()=>{
    // Remove only obsolete shared chat keys, not profiles or durable user data.
    try{for(const key of ['shine_chatbot_messages','shine_chat_session_id'])localStorage.removeItem(key);}catch{}
  },[]);
  const viewKey=currentUser?.uid??currentUser?.id??'no-display-profile';
  const expectedUid=currentUser===null?null:firebaseUid??null;
  const identityKey=`${expectedUid??'guest'}:${viewKey}`;
  const getToken=useCallback(async()=>{
    if(!expectedUid)return null;
    if(auth.currentUser?.uid!==expectedUid)throw new Error('identity_changed');
    // Firebase SDK manages token refresh. No retry of the chat request on 401.
    const token=await auth.currentUser.getIdToken();
    if(auth.currentUser?.uid!==expectedUid)throw new Error('identity_changed');
    return token;
  },[expectedUid]);
  return <div className="buddy-shell">
    {!open&&<button type="button" className="buddy-launcher" aria-label={lang==='vi'?'Mở AI Gym Buddy':'Open AI Gym Buddy'} onClick={()=>setOpen(true)}>AI Gym Buddy</button>}
    {open&&<section className="buddy-window" aria-label="The Shine AI Gym Buddy">
      <header className="buddy-header"><div><small>THE SHINE</small><h2>AI Gym Buddy</h2><p>{lang==='vi'?'Kiến thức rõ ràng. Ngữ cảnh đúng người.':'Clear knowledge. The right personal context.'}</p></div><button type="button" aria-label={lang==='vi'?'Đóng chat':'Close chat'} onClick={()=>setOpen(false)}>×</button></header>
      {firebaseUid===undefined?<p role="status">{lang==='vi'?'Đang kiểm tra phiên đăng nhập…':'Checking sign-in…'}</p>:<BuddyPanel key={identityKey} identityKey={identityKey} signedIn={!!expectedUid} getToken={getToken} lang={lang==='vi'?'vi':'en'} onOpenTraining={onOpenTraining}/>}
    </section>}
  </div>;
}
