import React, { useEffect, useMemo, useRef, useState } from 'react';
import { parsePathwayBundle, assessPathway, pathwayCsv, publicStructureSummary, type PathwaySourceBundle, type PathwayRecord } from '../../../shared/pathwayIntake';
import { createPathwayApi, type PathwayApi } from './api';
import './pathways.css';
export const pathwayIntakeEnabled = () => import.meta.env.VITE_SHINE_PATHWAY_INTAKE_ENABLED === 'true';
interface Props { onClose: () => void; api?: PathwayApi }
interface QueueItem { id: string; revision: number; state: string; updatedAt: string }
const newId = () => crypto.randomUUID();
export function PathwayIntakeModal({onClose, api: suppliedApi}:Props) {
  const api = useMemo(() => suppliedApi ?? createPathwayApi(),[suppliedApi]);
  const dialog = useRef<HTMLDialogElement>(null), alive = useRef(true), fileVersion = useRef(0);
  const [editor,setEditor] = useState(''),[bundle,setBundle] = useState<PathwaySourceBundle|null>(null);
  const [caseId,setCaseId] = useState(newId),[revision,setRevision] = useState(0);
  const [busy,setBusy] = useState(false),[error,setError] = useState(''),[message,setMessage] = useState('');
  const [privacy,setPrivacy] = useState(false),[reviewConsent,setReviewConsent] = useState(false);
  const [queue,setQueue] = useState<QueueItem[]>([]),[truncated,setTruncated] = useState(false);
  const [images,setImages] = useState<string[]>([]); const imageUrls = useRef<string[]>([]);
  const review = bundle ? assessPathway(bundle) : null;
  const refresh = async () => { const data = await api.request<{cases:QueueItem[];truncated:boolean}>('/cases'); if (alive.current) { setQueue(data.cases);setTruncated(data.truncated); } };
  const clearImages = () => { imageUrls.current.forEach(URL.revokeObjectURL); imageUrls.current=[];setImages([]); };
  useEffect(() => {
    alive.current=true;dialog.current?.showModal();
    void refresh().catch(() => { if(alive.current)setError('Cannot load private queue. Sign in as an authorized admin.'); });
    let detach: (()=>void) | undefined;
    if(!suppliedApi) void Promise.all([import('firebase/auth'),import('../../lib/firebase')]).then(([sdk,{auth}])=>{
      if(!alive.current)return;
      const initialUid=auth.currentUser?.uid;
      detach=sdk.onAuthStateChanged(auth,user=>{ if(user?.uid!==initialUid || !user) {api.abort();onClose();} });
    });
    return ()=>{alive.current=false;fileVersion.current++;detach?.();api.abort();imageUrls.current.forEach(URL.revokeObjectURL);};
  },[api]);
  const run = async (action:()=>Promise<void>) => {
    if(busy)return;setBusy(true);setError('');setMessage('');
    try {await action();} catch(e){if(alive.current)setError(e instanceof Error?e.message:'Request failed.');}
    finally{if(alive.current)setBusy(false);}
  };
  const edit = (text:string) => {setEditor(text);setBundle(null);setPrivacy(false);setReviewConsent(false);setMessage('');};
  const upload = async (file:File|undefined) => {
    if(!file)return;const version=++fileVersion.current;
    if(file.size>240_000 || !file.name.toLowerCase().endsWith('.json')) {setError('Use a prepared JSON source bundle up to 240 KB. Original XLSX files require the local extraction script.');return;}
    try{const text=await file.text();if(!alive.current||version!==fileVersion.current)return;setCaseId(newId());setRevision(0);clearImages();edit(text);setError('');}catch{setError('Could not read file.');}
  };
  const preview = () => run(async()=>{
    const parsed=parsePathwayBundle(JSON.parse(editor));
    await api.request('/preview','POST',{bundle:parsed});
    if(alive.current){setBundle(parsed);setMessage('Preview validated. Nothing has been saved.');}
  });
  const save = () => run(async()=>{
    if(!bundle||!privacy)throw new Error('Preview and privacy confirmation are required.');
    const result=await api.request<{revision:number;replay:boolean}>(`/cases/${caseId}`,'PUT',{bundle,expectedRevision:revision,privacyConfirmed:true});
    if(!alive.current)return;setRevision(result.revision);setMessage(result.replay?'Already saved. No duplicate was created.':'Saved privately as draft. No planner or member history was changed.');
    try{await refresh();}catch{setError('Saved successfully, but the queue could not refresh.');}
  });
  const load = (id:string) => run(async()=>{
    const data=await api.request<{case:PathwayRecord}>(`/cases/${id}`);
    if(!alive.current)return;setCaseId(data.case.id);setRevision(data.case.revision);setEditor(JSON.stringify(data.case.bundle,null,2));setBundle(data.case.bundle);setPrivacy(false);setReviewConsent(false);clearImages();
  });
  const resolveIssue = (id:string,resolution:string) => {
    if(!bundle)return;const next={...bundle,issues:bundle.issues.map(i=>i.id===id?{...i,status:(resolution.trim()?'resolved':'open') as 'open'|'resolved',resolution:resolution.trim()?resolution:null}:i)};
    setBundle(next);setEditor(JSON.stringify(next,null,2));setPrivacy(false);setReviewConsent(false);
  };
  const download = (text:string,name:string,type:string) => {const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  return <dialog className="pathway-dialog" ref={dialog} aria-labelledby="pathway-title" onCancel={e=>{e.preventDefault();if(!busy)onClose();}}>
    <header><div><h2 id="pathway-title">Training Pathway Intake</h2><p>Private source review / not a prescription</p></div><button aria-label="Close pathway intake" disabled={busy} onClick={onClose}>Close</button></header>
    <div className="pathway-body">
      <p className="pathway-warning">Never upload identifiable customer or health records to GitHub. Remove names, dates of birth, addresses, phone numbers, signatures and unrelated details. A source log is not a reusable program or proof of completion.</p>
      <div className="pathway-grid">
        <section><h3>1. Private source bundle</h3>
          <label>Prepared JSON<input type="file" accept=".json,application/json" disabled={busy} onChange={e=>{void upload(e.target.files?.[0]);e.target.value='';}}/></label>
          <p>For the supported Master Tracker layout use <code>scripts/extract-pathway-tracker.py</code>. Image transcription is reviewed manually in this version; no image or workbook is sent to an AI provider.</p>
          <label>Source JSON<textarea aria-label="Source JSON" rows={9} disabled={busy} value={editor} onChange={e=>edit(e.target.value)} spellCheck={false}/></label>
          <button disabled={busy||!editor.trim()} onClick={()=>void preview()}>Validate preview (no write)</button>
          <button disabled={busy} onClick={()=>{setCaseId(newId());setRevision(0);edit('');clearImages();setError('');}}>New separate case</button>
          <h3>Optional local image references</h3><p>Use redacted crops only. Images stay in this tab and disappear when the modal closes. They are not saved with the case.</p>
          <input aria-label="Local reference images" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={e=>{
            const files=Array.from(e.target.files??[]);e.target.value='';
            if(files.length>4||files.some(f=>!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>8_000_000)||files.reduce((sum,f)=>sum+f.size,0)>20_000_000){setError('Use up to 4 PNG/JPEG/WebP images, 8 MB each and 20 MB total.');return;}
            clearImages();const urls=files.map(f=>URL.createObjectURL(f));imageUrls.current=urls;setImages(urls);
          }}/>
          <div className="pathway-images">{images.map((url,i)=><img key={url} src={url} alt={`Local source reference ${i+1}`}/>)}</div>
        </section>
        <section><h3>2. Private review queue</h3><button disabled={busy} onClick={()=>void run(refresh)}>Refresh queue</button>
          <p>Only the importing administrator can access these cases. No member matching by name or email.</p>
          {truncated&&<p role="status">Showing at most 50 records. This is not the complete archive.</p>}
          {!queue.length&&<p>No private cases loaded.</p>}
          {queue.map(q=><div key={q.id} className="pathway-queue"><button disabled={busy} onClick={()=>void load(q.id)}>{q.id}</button><span>rev {q.revision} / {q.state}</span></div>)}
          {review&&<><h3>Source coverage</h3><p>{review.sources} sources / {review.observations} rows / {review.fields} fields</p><p>{review.uncertainFields} uncertain fields / {review.repeatedGroups} repeated groups</p>
            <strong>Planner eligibility: NO</strong><ul>{review.openBlockers.map(x=><li key={x}>{x}</li>)}</ul><ul>{review.warnings.map(x=><li key={x}>{x}</li>)}</ul></>}
        </section>
      </div>
      {error&&<div role="alert" className="pathway-warning">{error}</div>}{message&&<p role="status">{message}</p>}
      {bundle&&<>
        <h3>3. Observations exactly as supplied</h3>
        <p>Blank, dash and uncertain readings are different states. Units are not inferred. Repeated cells are not additional sessions or progress.</p>
        <div className="pathway-table"><table><thead><tr><th>Source / locator</th><th>Printed section / row</th><th>Raw fields</th><th>Duplicate group</th></tr></thead><tbody>{bundle.observations.map(o=><tr key={o.id}><td>{o.sourceId}<br/>{o.locator}</td><td>{o.section}<br/>{o.group}<br/>{o.rowLabel}</td><td>{o.fields.map(f=><div key={f.label}><strong>{f.label}: </strong>{f.raw??'(not supplied / redacted)'} <small>[{f.reading}{f.unit?`; ${f.unit}`:''}]</small></div>)}</td><td>{o.duplicateGroup??'-'}</td></tr>)}</tbody></table></div>
        <h3>4. Human review issues</h3>
        {bundle.issues.map(i=><label key={i.id}>{i.id} / {i.severity}: {i.detail}<textarea aria-label={`Resolution ${i.id}`} rows={2} disabled={busy} placeholder="Leave blank while unresolved. Record evidence; do not guess." value={i.resolution??''} onChange={e=>resolveIssue(i.id,e.target.value)}/></label>)}
        <label className="pathway-checkbox"><input type="checkbox" checked={privacy} disabled={busy} onChange={e=>setPrivacy(e.target.checked)}/>I am authorized to process this source, have removed direct identifiers, and understand it remains sensitive and private.</label>
        <button disabled={busy||!privacy} onClick={()=>void save()}>Save private draft</button>
        <label className="pathway-checkbox"><input type="checkbox" checked={reviewConsent} disabled={busy} onChange={e=>setReviewConsent(e.target.checked)}/>I have checked source associations and transcription. This is NOT approval for exercise prescription, clinical clearance or reuse on another person.</label>
        <button disabled={busy||revision===0||!privacy||!reviewConsent||!review?.readyForSourceReview} onClick={()=>void run(async()=>{
          // Always save any current edits first; reviewed status never applies to stale content.
          const saved=await api.request<{revision:number}>(`/cases/${caseId}`,'PUT',{bundle,expectedRevision:revision,privacyConfirmed:true});setRevision(saved.revision);
          const result=await api.request<{revision:number}>(`/cases/${caseId}/review`,'POST',{expectedRevision:saved.revision,transcriptionConfirmed:true,notAPrescriptionConfirmed:true});setRevision(result.revision);setMessage('Source reviewed only. Still not eligible for member recommendations.');await refresh();
        })}>Mark transcription reviewed</button>
        <details><summary>Export / delete</summary><p>JSON and CSV exports remain sensitive. Store outside Git and outside a public RAG index.</p>
          <button disabled={!privacy} onClick={()=>download(JSON.stringify(bundle,null,2),'private-pathway-source.json','application/json')}>Export private JSON</button>
          <button disabled={!privacy} onClick={()=>download(pathwayCsv(bundle),'private-pathway-rows.csv','text/csv;charset=utf-8')}>Export private CSV</button>
          <button onClick={()=>download(JSON.stringify(publicStructureSummary(bundle),null,2),'pathway-structure-only.json','application/json')}>Export counts only</button>
          <button disabled={busy||revision===0} onClick={()=>{if(window.confirm('Delete this private case and original transcription?'))void run(async()=>{await api.request(`/cases/${caseId}`,'DELETE',{confirmed:true,expectedRevision:revision});setRevision(0);setCaseId(newId());edit('');clearImages();setMessage('Private case deleted.');await refresh();});}}>Delete private case</button>
        </details>
      </>}
    </div>
  </dialog>;
}
