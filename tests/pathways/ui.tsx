/** Loopback test harness only. Synthetic identity, never a production fallback. */
import React,{useState} from 'react';import{createRoot}from'react-dom/client';
import{PathwayIntakeModal}from'../../src/components/pathways/PathwayIntakeModal';
import{type PathwayApi,PathwayApiError}from'../../src/components/pathways/api';
const api:PathwayApi={async request<T>(path:string,method='GET',body?:unknown):Promise<T>{try{const r=await fetch('/api/admin/pathway-intake'+path,{method,headers:{Authorization:'Bearer admin-a','Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});const d=await r.json();if(!r.ok)throw new PathwayApiError(d.code);return d;}catch(e){if(e instanceof PathwayApiError)throw e;throw new PathwayApiError('connection_uncertain_check_queue_before_retry');}},abort(){}};
function App(){const[open,setOpen]=useState(true);return <>{!open&&<button onClick={()=>setOpen(true)}>Open intake</button>}{open&&<PathwayIntakeModal api={api} onClose={()=>setOpen(false)}/>}</>;}
createRoot(document.getElementById('root')!).render(<App/>);
