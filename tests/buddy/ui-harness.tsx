import React, { useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { BuddyPanel } from '../../src/components/buddy/BuddyPanel';
/** Test-only fixture, served by loopback ui-server.ts, never an application auth provider. */
function Harness(){
  const [account,setAccount]=useState<string|null>(null);
  const getToken=useCallback(async()=>account,[account]);
  return <main style={{fontFamily:'Arial',maxWidth:1000,margin:'0 auto',padding:8}}>
    <header style={{padding:'8px 0',display:'flex',gap:6,flexWrap:'wrap'}}><strong style={{marginRight:10}}>SYNTHETIC TEST ONLY</strong>
      <button onClick={()=>setAccount(null)}>Guest / Logout</button><button onClick={()=>setAccount('test-a')}>Account A</button><button onClick={()=>setAccount('test-b')}>Account B</button><span data-testid="account">{account??'guest'}</span>
    </header>
    <section style={{maxWidth:470,height:'calc(100dvh - 88px)',minHeight:420,margin:'0 auto',borderRadius:16,overflow:'hidden'}}>
      <BuddyPanel key={account??'guest'} identityKey={account??'guest'} signedIn={!!account} getToken={getToken} lang="vi" onOpenTraining={()=>alert('Synthetic training action, no writes')}/>
    </section>
  </main>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><Harness/></React.StrictMode>);
