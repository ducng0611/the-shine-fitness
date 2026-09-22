import React, { useCallback, useEffect, useRef, useState } from 'react';
import { onIdTokenChanged, signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import type { MemberUser } from '../AuthModal';
import type { Language } from '../../translations';
import { resolveBuddyClientIdentity } from '../../../shared/buddyIdentity';
import { BuddyPanel } from './BuddyPanel';
import './buddy.css';
interface Props {lang?:Language;currentUser?:MemberUser|null;onOpenTrialModal?:()=>void;onToggle?:(open:boolean)=>void;onOpenTraining?:()=>void}
export default function BuddyChat({lang='vi',currentUser,onToggle,onOpenTraining}:Props){
  const [open,setOpen]=useState(false),[firebaseUid,setFirebaseUid]=useState<string|null|undefined>(undefined);
  const [logoutPending,setLogoutPending]=useState(false),[authError,setAuthError]=useState(false);
  const previousView=useRef(currentUser);
  useEffect(()=>onIdTokenChanged(auth,user=>{setAuthError(false);setFirebaseUid(user?.uid??null);},()=>{setAuthError(true);}),[]);
  useEffect(()=>{onToggle?.(open);},[open,onToggle]);
  const endFirebaseSession=useCallback(()=>{
    setLogoutPending(true);
    void signOut(auth).then(()=>{setFirebaseUid(null);setAuthError(false);setLogoutPending(false);}).catch(()=>{setAuthError(true);setLogoutPending(false);});
  },[]);
  useEffect(()=>{
    if(previousView.current&&currentUser===null)endFirebaseSession();
    previousView.current=currentUser;
  },[currentUser,endFirebaseSession]);
  useEffect(()=>{try{for(const key of ['shine_chatbot_messages','shine_chat_session_id'])localStorage.removeItem(key);}catch{}},[]);
  const displayState=currentUser===undefined?'unmanaged':currentUser===null?'absent':'present';
  const resolved=resolveBuddyClientIdentity(firebaseUid,currentUser?.uid,logoutPending,authError,displayState);
  const expectedUid=resolved.state==='authenticated'?resolved.uid:null;
  const viewKey=currentUser?.uid??currentUser?.id??'no-display-profile';
  const identityKey=`${expectedUid??'guest'}:${viewKey}`;
  const getToken=useCallback(async()=>{
    if(!expectedUid){if(auth.currentUser)throw new Error('identity_changed');return null;}
    if(auth.currentUser?.uid!==expectedUid)throw new Error('identity_changed');
    const token=await auth.currentUser.getIdToken();
    if(auth.currentUser?.uid!==expectedUid)throw new Error('identity_changed');
    return token;
  },[expectedUid]);
  const ready=resolved.state==='guest'||resolved.state==='authenticated';
  return <div className="buddy-shell">
    {!open&&<button type="button" className="buddy-launcher" aria-label={lang==='vi'?'Mở AI Gym Buddy':'Open AI Gym Buddy'} onClick={()=>setOpen(true)}>AI Gym Buddy</button>}
    {open&&<section className="buddy-window" aria-label="The Shine AI Gym Buddy">
      <header className="buddy-header"><div><small>THE SHINE</small><h2>AI Gym Buddy</h2><p>{lang==='vi'?'Kiến thức rõ ràng. Ngữ cảnh đúng người.':'Clear knowledge. The right personal context.'}</p></div><button type="button" aria-label={lang==='vi'?'Đóng chat':'Close chat'} onClick={()=>setOpen(false)}>×</button></header>
      {ready?<BuddyPanel key={identityKey} identityKey={identityKey} signedIn={!!expectedUid} getToken={getToken} lang={lang==='vi'?'vi':'en'} onOpenTraining={onOpenTraining}/>:
        <div className="buddy-error"><p role={resolved.state==='pending'?'status':'alert'}>{resolved.state==='pending'?(lang==='vi'?'Đang xác minh thay đổi phiên đăng nhập…':'Verifying the sign-in transition…'):(lang==='vi'?'Phiên Firebase và thông tin hiển thị chưa khớp hoặc không xác minh được. Chat không đọc dữ liệu riêng trong trạng thái này. Hãy đăng nhập lại đúng tài khoản hoặc chủ động kết thúc phiên Firebase để tiếp tục hỏi kiến thức với vai trò khách.':'The Firebase session and displayed account are inconsistent or could not be verified. No private data will be read. Sign in again with the matching account, or explicitly end the Firebase session to continue as a guest.')}</p>{resolved.state!=='pending'&&<button type="button" onClick={endFirebaseSession}>{lang==='vi'?'Kết thúc phiên Firebase':'End Firebase session'}</button>}</div>}
    </section>}
  </div>;
}
