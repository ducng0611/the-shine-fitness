import React, { useEffect, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import type { BuddyEvent, BuddyLanguage, BuddyReply } from '../../../shared/buddyChat';
import { BuddyClient } from './client';
import './buddy.css';
export interface BuddyPanelProps { identityKey:string; signedIn:boolean; getToken:()=>Promise<string|null>; lang?:BuddyLanguage; onOpenTraining?:()=>void; trainingActionLabel?:string; clientFactory?:(options:ConstructorParameters<typeof BuddyClient>[0])=>BuddyClient }
interface Message { id:string; role:'user'|'assistant'; text:string; reply?:BuddyReply; incomplete?:boolean }
export function BuddyPanel({identityKey,signedIn,getToken,lang='vi',onOpenTraining,trainingActionLabel,clientFactory}:BuddyPanelProps) {
  const [messages,setMessages]=useState<Message[]>([]),[input,setInput]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [epoch,setEpoch]=useState(0),client=useRef<BuddyClient|null>(null),generation=useRef(0),scroll=useRef<HTMLDivElement>(null);
  const t=(vi:string,en:string)=>lang==='vi'?vi:en;
  useEffect(()=>{
    const version=++generation.current;
    const c=(clientFactory??(o=>new BuddyClient(o)))({getToken,isCurrent:()=>generation.current===version});client.current=c;
    setMessages([]);setBusy(false);setError('');setInput('');
    return ()=>{generation.current++;c.dispose();if(client.current===c)client.current=null;};
  },[identityKey,getToken,epoch,clientFactory]);
  useEffect(()=>{scroll.current?.scrollIntoView({block:'nearest'});},[messages]);
  const send=async(value:string)=>{
    if(busy||!value.trim()||!client.current)return;
    const current=client.current,version=generation.current,id=crypto.randomUUID();
    setMessages(prev=>[...prev,{id:`user-${id}`,role:'user',text:value.trim()},{id,role:'assistant',text:''}]);setInput('');setBusy(true);setError('');
    const update=(event:BuddyEvent)=>{
      if(generation.current!==version)return;
      if(event.type==='delta')setMessages(prev=>prev.map(m=>m.id===id?{...m,text:m.text+event.text}:m));
      if(event.type==='done')setMessages(prev=>prev.map(m=>m.id===id?{...m,text:event.reply.text,reply:event.reply}:m));
    };
    try{await current.send(value.trim(),lang,update);}catch(e){if(generation.current===version){setError(e instanceof Error?e.message:t('Không thể hoàn tất.','Unable to complete.'));setMessages(prev=>prev.map(m=>m.id===id?{...m,incomplete:true}:m));}}
    finally{if(generation.current===version)setBusy(false);}
  };
  const reset=()=>{client.current?.dispose();generation.current++;setMessages([]);setError('');setBusy(false);setEpoch(e=>e+1);};
  return <div className="buddy-panel" data-identity={signedIn?'authenticated':'guest'}>
    <div className="buddy-status"><span>{t(signedIn?'Đã đăng nhập':'Chế độ khách',signedIn?'Signed in':'Guest mode')}</span><button type="button" onClick={reset}>{t('Cuộc trò chuyện mới','New conversation')}</button></div>
    <div className="buddy-messages" aria-live="polite" aria-label={t('Nội dung hội thoại','Conversation')}>
      {!messages.length&&<div className="buddy-welcome"><h3>{t('Hỏi rõ, hiểu đúng, tập phù hợp.','Ask clearly. Learn well. Train thoughtfully.')}</h3><p>{t('Em là AI Gym Buddy. Bạn không cần đăng nhập để hỏi kiến thức chung; hồ sơ riêng chỉ được đọc khi có quyền và khi câu hỏi cần tới.','I am AI Gym Buddy. General questions need no login; private records require permission and are read only when relevant.')}</p><div className="buddy-suggestions">{(lang==='vi'?['Protein là gì?','TDEE khác BMR thế nào?','Tôi đã tập gì tuần này?']:['What is protein?','How is TDEE different from BMR?','What did I train this week?']).map(q=><button key={q} type="button" onClick={()=>void send(q)}>{q}</button>)}</div></div>}
      {messages.map(m=><article key={m.id} className={`buddy-message ${m.role}`}>
        <strong className="buddy-speaker">{m.role==='user'?t('Bạn','You'):'AI Gym Buddy'}</strong>
        {m.role==='user'?<p>{m.text}</p>:<Markdown skipHtml components={{a:({href,children})=>href?.startsWith('https://')?<a href={href} target="_blank" rel="noopener noreferrer">{children}</a>:<span>{children}</span>}}>{m.text|| (busy&&!m.incomplete?t('Đang phản hồi…','Responding…'):'')}</Markdown>}
        {m.incomplete&&<p className="buddy-incomplete">{t('Phản hồi chưa hoàn tất. Chưa có thao tác ghi dữ liệu được xác nhận.','Response incomplete. No data-writing action was confirmed.')}</p>}
        {!!m.reply?.citations.length&&<details className="buddy-sources"><summary>{t('Nguồn được sử dụng','Sources used')}</summary>{m.reply.citations.map(c=><p key={c.id}>{c.url?.startsWith('https://')?<a href={c.url} target="_blank" rel="noopener noreferrer">{c.title}</a>:c.title}{c.checkedAt&&<small> · {c.checkedAt}</small>}</p>)}</details>}
        {m.reply?.reasonCodes.includes('general_model_knowledge_not_source_verified')&&<small className="buddy-source-note">{t('Giải thích kiến thức chung từ mô hình; chưa có nguồn riêng xác minh cho chi tiết này.','General model explanation; no matched source verifies this specific detail.')}</small>}
        {m.reply?.handoverStatus==='suggested'&&<small className="buddy-source-note">{t('Đề nghị hỗ trợ chuyên môn, chưa tạo lịch hẹn hoặc gửi hồ sơ.','Professional review suggested; no booking or record transmission has occurred.')}</small>}
        {m.reply?.action==='open_training'&&onOpenTraining&&<button className="buddy-primary" type="button" onClick={onOpenTraining}>{trainingActionLabel??t('Mở Training để xác nhận','Open Training to confirm')}</button>}
      </article>)}
      <div ref={scroll}/>
    </div>
    {error&&<p role="alert" className="buddy-error">{error}</p>}
    <form className="buddy-compose" onSubmit={e=>{e.preventDefault();void send(input);}}>
      <label className="buddy-input-label" htmlFor={`buddy-input-${identityKey}`}>{t('Câu hỏi cho AI Gym Buddy','Ask AI Gym Buddy')}</label>
      <textarea id={`buddy-input-${identityKey}`} value={input} maxLength={4000} rows={2} onChange={e=>setInput(e.target.value)} placeholder={t('Hỏi về tập luyện, dinh dưỡng hoặc dữ liệu của bạn…','Ask about training, nutrition or your own records…')} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();void send(input);}}}/>
      <div className="buddy-compose-actions"><small>{t('AI có thể sai. Không thay thế đánh giá y tế.','AI can make mistakes. Not a substitute for medical assessment.')}</small>{busy?<button type="button" onClick={()=>client.current?.cancel()}>{t('Dừng','Stop')}</button>:<button className="buddy-primary" disabled={!input.trim()} type="submit">{t('Gửi','Send')}</button>}</div>
    </form>
    <details className="buddy-privacy"><summary>{t('Quyền riêng tư của phiên','Session privacy')}</summary><p>{t('Không lưu hội thoại này vào localStorage hoặc hồ sơ hội viên. Server giữ ngữ cảnh tạm có giới hạn, hết hạn sau thời gian không hoạt động. Mở phiên mới hoặc đổi tài khoản không tự nhập nội dung cũ. Trạng thái phiên có thể mất khi server khởi động lại.','This chat is not stored in localStorage or your member profile. The server retains bounded temporary context that expires after inactivity. New sessions and account changes do not import old content. Server restarts may end the session.')}</p></details>
  </div>;
}
