import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BuddyPanel } from '../components/buddy/BuddyPanel';
import { BuddyClient } from '../components/buddy/client';
import './local.css';

type Session={user:null|{uid:string;email:string;displayName:string;minorAtSource:boolean;reviewRequired:boolean};csrf:string|null;sessionVersion:string};
const guest:Session={user:null,csrf:null,sessionVersion:'guest'};
function App(){
  const [session,setSession]=useState<Session>(guest),[ready,setReady]=useState(false),[email,setEmail]=useState(''),[password,setPassword]=useState('');
  const [error,setError]=useState(''),[busy,setBusy]=useState(false),[source,setSource]=useState<any>(null),[context,setContext]=useState<any>(null);
  const [tab,setTab]=useState<'chat'|'source'>('chat'),[epoch,setEpoch]=useState(0),[model,setModel]=useState(false);
  const sessionVersion=useRef('guest');
  const version=useRef(0),channel=useRef<BroadcastChannel|null>(null),controllers=useRef(new Set<AbortController>());
  const clear=useCallback(()=>{version.current++;for(const c of controllers.current)c.abort();controllers.current.clear();setReady(false);setSource(null);setContext(null);setTab('chat');setEpoch(x=>x+1);},[]);
  const refresh=useCallback(async()=>{
    const before=version.current;
    try{
      const res=await fetch('/api/local/auth/session',{credentials:'same-origin',cache:'no-store'});
      if(before!==version.current)return;
      if(res.status===401){clear();sessionVersion.current='guest';setSession(guest);setReady(true);return;}
      if(!res.ok)throw new Error('Kh\u00f4ng \u0111\u1ecdc \u0111\u01b0\u1ee3c phi\u00ean local.');
      const next=await res.json();if(before!==version.current)return;
      if(sessionVersion.current!==next.sessionVersion){clear();sessionVersion.current=next.sessionVersion;}setSession(next);setReady(true);
    }catch(e){if(before===version.current){setError(e instanceof Error?e.message:'L\u1ed7i k\u1ebft n\u1ed1i');setReady(false);}}
  },[clear]);
  useEffect(()=>{void refresh();void fetch('/api/local/status').then(r=>r.json()).then(v=>setModel(v.modelEnabled)).catch(()=>{});
    const bc=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('shine-local-auth'):null;channel.current=bc;
    if(bc)bc.onmessage=()=>{clear();void refresh();};
    const focus=()=>void refresh();window.addEventListener('focus',focus);
    return()=>{bc?.close();window.removeEventListener('focus',focus);for(const c of controllers.current)c.abort();};
  },[clear,refresh]);
  const request=useCallback(async(path:string,method='GET',body?:unknown)=>{
    const stamp=version.current,controller=new AbortController();controllers.current.add(controller);
    try{
      const res=await fetch('/api/local'+path,{method,credentials:'same-origin',cache:'no-store',signal:controller.signal,
        headers:{'Content-Type':'application/json','X-Local-Request':'1','X-Local-Context':session.sessionVersion,...(session.csrf?{'X-CSRF-Token':session.csrf}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
      const value=await res.json();if(stamp!==version.current)throw new Error('Danh t\u00ednh \u0111\u00e3 thay \u0111\u1ed5i.');
      if(!res.ok){if(res.status===401||value.code==='identity_changed'){clear();void refresh();}throw new Error(value.error??value.code??'Y\u00eau c\u1ea7u th\u1ea5t b\u1ea1i.');}return value;
    }finally{controllers.current.delete(controller);}
  },[session,clear,refresh]);
  const factory=useMemo(()=>{
    const boundVersion=version.current;
    return (options:ConstructorParameters<typeof BuddyClient>[0])=>new BuddyClient({...options,base:'/api/local/buddy',fetcher:async(input,init)=>{
      if(boundVersion!==version.current)throw new Error('Danh t\u00ednh \u0111\u00e3 thay \u0111\u1ed5i.');
      const headers=new Headers(init?.headers);headers.delete('Authorization');headers.set('X-Local-Request','1');headers.set('X-Local-Context',session.sessionVersion);if(session.csrf)headers.set('X-CSRF-Token',session.csrf);
      const res=await fetch(input,{...init,headers,credentials:'same-origin'});
      if(boundVersion!==version.current)throw new Error('Ph\u1ea3n h\u1ed3i c\u0169 b\u1ecb h\u1ee7y.');
      if(res.status===401||res.status===409){const copy=await res.clone().json().catch(()=>({}));if(res.status===401||copy.code==='identity_changed'){clear();void refresh();}}
      return res;
    }});
  },[session.sessionVersion,session.csrf,epoch,clear,refresh]);
  const noToken=useCallback(async()=>null,[]);
  const login=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);setError('');try{const result=await request('/auth/login','POST',{email,password});clear();sessionVersion.current=result.sessionVersion;setSession(result);setPassword('');setReady(true);channel.current?.postMessage('changed');}catch(e){setError(e instanceof Error?e.message:'L\u1ed7i \u0111\u0103ng nh\u1eadp');}finally{setBusy(false);}};
  const logout=async()=>{setBusy(true);setError('');try{await request('/auth/logout','POST',{});clear();sessionVersion.current='guest';setSession(guest);setReady(true);channel.current?.postMessage('changed');}catch(e){setError(e instanceof Error?e.message:'L\u1ed7i \u0111\u0103ng xu\u1ea5t');}finally{setBusy(false);}};
  const showSource=async()=>{setTab('source');setError('');try{const data=await request('/source');setSource(data);if(!session.user?.minorAtSource)setContext(await request('/training/context'));}catch(e){setError(e instanceof Error?e.message:'Kh\u00f4ng \u0111\u1ecdc \u0111\u01b0\u1ee3c d\u1eef li\u1ec7u.');}};
  return <main className="local-app">
    <header className="local-heading"><div><span className="local-eyebrow">THE SHINE / LOCAL PILOT</span><h1>AI Gym Buddy</h1><p>{'\u0110\u0103ng nh\u1eadp n\u1ed9i b\u1ed9, b\u1ed9 nh\u1edb ri\u00eang theo t\u00e0i kho\u1ea3n.'}</p></div><span className="local-badge">SQLite <b>/</b> Firebase OFF</span></header>
    <p className="local-note">{'B\u1ea3n nghi\u1ec7m thu QA tr\u00ean m\u00e1y c\u1ee5c b\u1ed9. Kh\u00f4ng ph\u1ea3i t\u00e0i kho\u1ea3n kh\u00e1ch h\u00e0ng th\u1eadt. '}<strong>{model?'Gemini: b\u1eadt theo c\u1ea5u h\u00ecnh':'Model tr\u1ea3 ph\u00ed: t\u1eaft; th\u1ebb ki\u1ebfn th\u1ee9c v\u1eabn ho\u1ea1t \u0111\u1ed9ng.'}</strong></p>
    {error&&<p role="alert" className="local-error">{error}</p>}
    <div className="local-grid"><aside className="local-account">
      {session.user?<><h2>{session.user.displayName}</h2><p className="local-email">{session.user.email}</p><p>{'Danh t\u00ednh do server x\u00e1c th\u1ef1c. Kh\u00f4ng c\u1ea7n Firebase.'}</p><button disabled={busy} onClick={()=>void logout()}>{'\u0110\u0103ng xu\u1ea5t'}</button><hr/><button className={tab==='chat'?'active':''} onClick={()=>setTab('chat')}>{'Tr\u00f2 chuy\u1ec7n'}</button><button onClick={()=>void showSource()}>{'H\u1ed3 s\u01a1 v\u00e0 l\u1ecbch s\u1eed QA'}</button></>:<form onSubmit={login}><h2>{'\u0110\u0103ng nh\u1eadp local'}</h2><label>Email<input type="email" autoComplete="username" value={email} required onChange={e=>setEmail(e.target.value)} /></label><label>{'M\u1eadt kh\u1ea9u'}<input type="password" autoComplete="current-password" value={password} required maxLength={128} onChange={e=>setPassword(e.target.value)}/></label><button className="local-primary" disabled={busy||!ready}>{busy?'\u0110ang x\u00e1c th\u1ef1c...':'\u0110\u0103ng nh\u1eadp'}</button><p>{'Email QA ch\u1ec9 l\u00e0 t\u00ean \u0111\u0103ng nh\u1eadp, kh\u00f4ng ph\u1ea3i h\u1ed9p th\u01b0.'}</p></form>}
      <div className="local-small"><h3>{'Ph\u1ea1m vi nghi\u1ec7m thu'}</h3><p>{'H\u1ecfi ki\u1ebfn th\u1ee9c chung, \u0111\u1ecdc \u0111\u00fang h\u1ed3 s\u01a1, ki\u1ec3m tra quy\u1ec1n v\u00e0 gi\u1edbi h\u1ea1n an to\u00e0n. Kh\u00f4ng t\u1ef1 g\u00e1n meal plan hay b\u1ecba bu\u1ed5i \u0111\u00e3 t\u1eadp.'}</p></div>
    </aside><section className="local-workspace">
      {!ready?<p role="status">{'\u0110ang ki\u1ec3m tra phi\u00ean...'}</p>:tab==='chat'||!session.user?<BuddyPanel key={session.sessionVersion+epoch} identityKey={session.sessionVersion} signedIn={!!session.user} getToken={noToken} lang="vi" clientFactory={factory} onOpenTraining={()=>void showSource()} trainingActionLabel={'Xem h\u1ed3 s\u01a1 QA v\u00e0 gi\u1edbi h\u1ea1n t\u1eadp'}/>:source?<div className="local-source"><h2>{source.source.label}</h2><p className="local-warning">{source.source.notice}</p><dl><dt>{'Tu\u1ed5i t\u1ea1i ngu\u1ed3n'}</dt><dd>{source.source.ageAtSource}</dd><dt>{'Chi\u1ec1u cao / c\u00e2n n\u1eb7ng t\u1ea1i ngu\u1ed3n'}</dt><dd>{source.source.heightCm} cm / {source.source.weightKg} kg</dd><dt>{'L\u1ed9 tr\u00ecnh tham chi\u1ebfu'}</dt><dd>{source.reference?.name??source.source.programId}</dd><dt>{'Tr\u1ea1ng th\u00e1i ngu\u1ed3n'}</dt><dd>{source.reference?.reviewStatus??'needs_review'}</dd><dt>{'Meal plan \u0111\u01b0\u1ee3c g\u00e1n'}</dt><dd>{'Ch\u01b0a c\u00f3; kh\u00f4ng g\u00e1n theo m\u1ee5c ti\u00eau m\u1ed9t c\u00e1ch t\u1ef1 \u0111\u1ed9ng.'}</dd></dl><h3>{'Ghi ch\u00fa ngu\u1ed3n'}</h3>{source.source.sourceNotes.map((n:string,i:number)=><p key={i}>{n}</p>)}<h3>{'L\u1ecbch s\u1eed \u0111\u00e3 x\u00e1c nh\u1eadn'}</h3><p>{session.user.minorAtSource?'H\u1ed3 s\u01a1 thi\u1ebfu ni\u00ean kh\u00f4ng \u0111\u01b0\u1ee3c m\u1edf planner ng\u01b0\u1eddi l\u1edbn.':`${context?.summary?.sessionsLast14Days??0} bu\u1ed5i trong 14 ng\u00e0y. Gi\u00e1o \u00e1n tham chi\u1ebfu kh\u00f4ng ph\u1ea3i l\u1ecbch s\u1eed ho\u00e0n th\u00e0nh.`}</p><p className="local-warning">{'C\u00e1c tr\u01b0\u1eddng h\u1ee3p ngu\u1ed3n c\u1ea7n \u0111\u00e1nh gi\u00e1 hi\u1ec7n t\u1ea1i. Kh\u00f4ng t\u1ef1 b\u1ecf c\u1edd ki\u1ec3m tra chuy\u00ean m\u00f4n \u0111\u1ec3 t\u1ea1o gi\u00e1o \u00e1n.'}</p></div>:<p>{'\u0110ang \u0111\u1ecdc h\u1ed3 s\u01a1...'}</p>}
    </section></div>
  </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
