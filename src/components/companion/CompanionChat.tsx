import React, { useCallback, useEffect, useRef, useState } from 'react';
import { auth } from '../../lib/firebase';
import type { Language } from '../../translations';
import { type Data, companionApi as api, prepareFoodPhoto, fieldClass, buttonClass, secondaryClass, groupNames } from './client';
import ProfileForm from './ProfileForm';
import WorkoutCard from './WorkoutCard';
import MealDraft from './MealDraft';
import { BuddyPanel } from '../buddy/BuddyPanel';
import SourceProfileCard from './SourceProfileCard';
import MemberImportPanel from './MemberImportPanel';

type Props = { lang?: Language; onToggle?: (open: boolean) => void; onService: () => void; onOpenTraining?: () => void };
const initialReadiness = { durationMinutes: 35, focus: 'auto', energy: 3, pain: false, soreGroups: [] as string[], unavailableStationIds: [] as string[], confirmed: false };
// AI Gym Buddy Q&A (knowledge + the member's own records) is one tab of the member assistant.
const buddyEnabled = () => import.meta.env.VITE_SHINE_CHAT_ENABLED === 'true';

/** Vietnamese pilot UI. No sensitive state is written to localStorage or shared sales-chat caches. */
export default function CompanionChat({ lang, onToggle, onService, onOpenTraining }: Props) {
  const [open, setOpen] = useState(false), [tab, setTab] = useState(buddyEnabled() ? 'ask' : 'chat');
  const [context, setContext] = useState<Data | null>(null), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [sourceProfile, setSourceProfile] = useState<Data | null>(null);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [conversation, setConversation] = useState<Data[]>([]);
  const [result, setResult] = useState<Data | null>(null), [plan, setPlan] = useState<Data | null>(null), [draft, setDraft] = useState<Data | null>(null);
  const [readiness, setReadiness] = useState(initialReadiness), [preMinutes, setPreMinutes] = useState(60);
  const [catalogueText, setCatalogueText] = useState(''), [catalogueRevision, setCatalogueRevision] = useState<string | null>(null);
  const upload = useRef<HTMLInputElement>(null), messageInput = useRef<HTMLInputElement>(null), lock = useRef(false), alive = useRef(true);
  const actor = useRef(auth.currentUser?.uid);
  const current = () => alive.current && auth.currentUser?.uid === actor.current;
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const buddyToken = useCallback(async () => {
    if (!current()) throw new Error('identity_changed');
    const token = await auth.currentUser!.getIdToken();
    if (!current()) throw new Error('identity_changed');
    return token;
  }, []);
  const task = async (fn: () => Promise<void>) => {
    if (lock.current || !current()) return;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    try { await fn(); } catch (e) { if (current()) setError(e instanceof Error ? e.message : 'Không hoàn tất được yêu cầu.'); }
    finally { lock.current = false; if (current()) setBusy(false); }
  };
  const refresh = async (restorePlan = false) => {
    // The gym's recorded profile is optional; failing to load it must not block the assistant.
    const [data, source] = await Promise.all([api('/context'), api('/source-profile').catch(() => null)]); if (!current()) return;
    setContext(data); setSourceProfile(source?.sourceProfile ?? null);
    if (!data.profile) setTab(t => t === 'ask' ? t : 'profile');
    if (restorePlan && data.pendingPlan) setPlan(data.pendingPlan);
  };
  const refreshAfterSaved = async (savedMessage: string) => {
    setNotice(savedMessage);
    try { await refresh(); }
    catch { if (current()) setError('Đã lưu thành công nhưng chưa tải lại được nhật ký. Nhấn Cập nhật; không nhập lại một bữa hoặc buổi mới.'); }
  };
  useEffect(() => { if (open && !context) void task(() => refresh(true)); }, [open]);
  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); onToggle?.(false); } };
    window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close);
  }, [open, onToggle]);
  const toggle = () => { const value = !open; setOpen(value); onToggle?.(value); };
  function accept(data: Data) {
    if (!current()) return; setResult(data);
    if (data.plan) { setPlan(data.plan); setDraft(null); }
    if (data.kind === 'meal_draft') setDraft({ ...data, key: crypto.randomUUID() });
    if (data.kind === 'progress') { setTab('diary'); setContext(previous => previous ? { ...previous, history: data.history, diary: data.diary } : previous); }
  }
  function updateReadiness(key: string, value: unknown) { setReadiness(r => ({ ...r, [key]: value, confirmed: key === 'confirmed' ? Boolean(value) : false })); }
  async function send() {
    const sent = message.trim(); if (!sent) return;
    await task(async () => {
      const data = await api('/chat', { message: sent, history: conversation.slice(-6), readiness });
      if (!current()) return;
      setMessage(''); setConversation(h => [...h.slice(-18), { role: 'user', text: sent }, { role: 'assistant', text: data.message ?? data.notice ?? 'Đã chuẩn bị thông tin bên dưới.' }]);
      accept(data);
    });
  }
  const manualMeal = () => { setDraft({ key: crypto.randomUUID(), foods: [{}], question: 'Nhập bữa vừa ăn từ nhãn dinh dưỡng hoặc công thức đã biết. Đây không phải số liệu AI suy đoán.' }); setResult(null); };
  return <>
    <button aria-expanded={open} aria-controls="shine-companion" onClick={toggle} className="fixed bottom-6 right-5 z-50 min-h-14 rounded-full bg-orange-500 px-5 py-3 font-bold text-slate-950 shadow-xl hover:bg-orange-400">{open ? 'Đóng trợ lý' : 'Shine Companion'}</button>
    {open && <section id="shine-companion" role="dialog" aria-label="Shine AI Companion" aria-modal="false" className="fixed bottom-24 right-3 z-50 flex h-[78dvh] max-h-[880px] w-[calc(100vw-24px)] max-w-xl flex-col overflow-hidden rounded-3xl border border-slate-700 bg-slate-950 text-white shadow-2xl">
      <header className="flex items-start justify-between gap-3 border-b border-slate-700 bg-slate-900 p-4"><div><p className="text-xs font-bold uppercase tracking-widest text-orange-300">The Shine · AI Pilot</p><h2 className="text-xl font-bold">Companion của bạn</h2><p className="mt-1 text-xs text-slate-300">Shine on. Sweat on. Tập có mục tiêu, không bằng mọi giá.</p></div><button className={secondaryClass} onClick={toggle} aria-label="Đóng cửa sổ trợ lý">Đóng</button></header>
      <nav className="flex shrink-0 gap-2 overflow-x-auto border-b border-slate-700 p-2" aria-label="Chức năng trợ lý">
        {[...(buddyEnabled() ? [['ask', 'Hỏi đáp']] : []), ['chat', 'Đồng hành'], ['profile', 'Hồ sơ'], ['diary', 'Nhật ký'], ...(context?.isAdmin ? [['gym', 'Quản trị gym']] : [])].map(([key, name]) => <button key={key} onClick={() => setTab(key)} className={tab === key ? buttonClass : secondaryClass} aria-pressed={tab === key}>{name}</button>)}
        <button className={secondaryClass} onClick={() => { onToggle?.(false); onService(); }}>Tư vấn dịch vụ</button>
      </nav>
      {tab === 'ask' && actor.current && <div className="flex min-h-0 flex-1 flex-col">
        <BuddyPanel identityKey={actor.current} signedIn getToken={buddyToken} lang={lang === 'en' ? 'en' : 'vi'} onOpenTraining={onOpenTraining} />
      </div>}
      {tab !== 'ask' && <main className="flex-1 space-y-4 overflow-y-auto overscroll-contain p-4">
        {busy && <p role="status" className="text-sm text-orange-300">Đang xử lý yêu cầu…</p>}
        {notice && <p role="status" className="rounded-xl border border-emerald-700 p-3 text-sm text-emerald-200">{notice}</p>}
        {error && <p role="alert" className="rounded-xl border border-red-500/60 p-3 text-sm text-red-200">{error}</p>}
        {!context && <button className={secondaryClass} disabled={busy} onClick={() => void task(() => refresh(true))}>Tải hồ sơ</button>}
        {context && !context.profile && tab !== 'profile' && <div className="rounded-xl bg-slate-800 p-4"><p>Hoàn tất hồ sơ và quyền riêng tư để bắt đầu cá nhân hóa.</p><button className={buttonClass + ' mt-3'} onClick={() => setTab('profile')}>Tạo hồ sơ</button></div>}
        {tab === 'profile' && sourceProfile && <SourceProfileCard profile={sourceProfile} />}
        {context && tab === 'profile' && <ProfileForm key={context.profile?.revision ?? 'new'} profile={context.profile} memberName={context.memberName} busy={busy}
          onSave={p => void task(async () => { await api('/profile', p, 'PUT'); setPlan(null); setDraft(null); await refreshAfterSaved('Đã lưu hồ sơ. Giáo án cũ cần tạo lại theo hồ sơ mới.'); setTab('chat'); })}
          onExport={() => void task(async () => {
            const data = await api('/export'); if (!current()) return;
            const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
            const link = document.createElement('a'); link.href = url; link.download = 'shine-companion-data.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
          })}
          onDelete={() => { if (window.confirm('Xóa toàn bộ hồ sơ, số đo và nhật ký Companion? Hồ sơ hội viên và dữ liệu cũ không bị xóa.')) void task(async () => {
            await api('/data', { confirmation: 'DELETE_MY_COMPANION_DATA' }, 'DELETE');
            setPlan(null); setDraft(null); setConversation([]); setResult(null); setContext(null); setTab('profile'); await refreshAfterSaved('Đã xóa dữ liệu Companion.');
          }); }} />}
        {tab === 'chat' && context?.profile && <>
          {!context.catalogue?.verified && <p className="rounded-xl border border-amber-600/60 p-3 text-sm text-amber-200">Danh mục máy và vị trí chưa được phòng tập xác minh. Trợ lý sẽ không tự bịa máy hoặc giáo án theo thiết bị chưa biết.</p>}
          <section className="space-y-3 rounded-2xl bg-slate-900 p-3" aria-label="Tình trạng trước buổi tập"><h3 className="font-bold">Hôm nay bạn thấy thế nào?</h3>
            <div className="grid grid-cols-2 gap-3"><label className="grid gap-1 text-sm">Bạn có bao nhiêu phút?<input className={fieldClass} type="number" min="15" max="90" value={readiness.durationMinutes} onChange={e => updateReadiness('durationMinutes', Number(e.target.value))} /></label><label className="grid gap-1 text-sm">Muốn tập nhóm cơ nào?<select className={fieldClass} value={readiness.focus} onChange={e => updateReadiness('focus', e.target.value)}>{Object.entries(groupNames).map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select></label></div>
            <label className="grid gap-1 text-sm">Mức năng lượng (1: rất mệt · 5: nhiều năng lượng)<input className={fieldClass} type="number" min="1" max="5" value={readiness.energy} onChange={e => updateReadiness('energy', Number(e.target.value))} /></label>
            <label className="flex gap-2 text-sm"><input type="checkbox" checked={readiness.pain} onChange={e => updateReadiness('pain', e.target.checked)} />Tôi đang có đau hoặc khó chịu.</label>
            <fieldset className="rounded-xl border border-slate-700 p-3"><legend className="text-sm">Nhóm cơ còn ê mỏi</legend><div className="grid grid-cols-2 gap-2">{['legs', 'push', 'pull', 'core'].map(g => <label className="flex gap-2 text-xs" key={g}><input type="checkbox" checked={readiness.soreGroups.includes(g)} onChange={e => updateReadiness('soreGroups', e.target.checked ? [...readiness.soreGroups, g] : readiness.soreGroups.filter(v => v !== g))} />{groupNames[g]}</label>)}</div></fieldset>
            {context.catalogue?.equipment?.length > 0 && <details><summary className="cursor-pointer py-2 text-sm">Báo máy đang bận / không dùng được</summary><div className="max-h-40 space-y-2 overflow-y-auto">{context.catalogue.equipment.map((s: Data) => <label key={s.id} className="flex gap-2 text-xs"><input type="checkbox" checked={readiness.unavailableStationIds.includes(s.id)} onChange={e => updateReadiness('unavailableStationIds', e.target.checked ? [...readiness.unavailableStationIds, s.id] : readiness.unavailableStationIds.filter(v => v !== s.id))} />{s.name} · {s.zone}</label>)}</div></details>}
            <label className="flex gap-2 text-sm"><input type="checkbox" checked={readiness.confirmed} onChange={e => updateReadiness('confirmed', e.target.checked)} />Tôi đã kiểm tra và xác nhận tình trạng hiện tại ở trên.</label>
            <button className={buttonClass} disabled={busy || !readiness.confirmed} onClick={() => void task(async () => accept(await api('/workouts/plan', readiness)))}>Tạo buổi tập cho tôi</button>
          </section>
          {conversation.map((m, i) => <div key={i} className={'whitespace-pre-wrap rounded-xl p-3 text-sm ' + (m.role === 'user' ? 'ml-6 bg-orange-900/40' : 'mr-4 bg-slate-800')}><span className="mb-1 block text-xs text-slate-400">{m.role === 'user' ? 'Bạn' : 'Shine'}</span>{m.text}</div>)}
          {result?.message && <p className="whitespace-pre-wrap rounded-xl bg-slate-800 p-3 text-sm">{result.message}</p>}
          {plan && <WorkoutCard key={plan.id} plan={plan} busy={busy} onConfirm={body => void task(async () => {
            await api(`/workouts/${plan.id}/complete`, body); setPlan(null); setReadiness(r => ({ ...r, confirmed: false })); setTab('diary');
            await refreshAfterSaved('Đã ghi nhận phần thực sự hoàn thành, không đánh dấu các hiệp còn trống.');
          })} />}
          <section className="space-y-3 rounded-2xl bg-slate-900 p-3"><h3 className="font-bold">Ăn uống quanh buổi tập</h3><label className="grid gap-1 text-sm">Còn bao nhiêu phút trước khi tập?<input className={fieldClass} type="number" min="0" max="1440" value={preMinutes} onChange={e => setPreMinutes(Number(e.target.value))} /></label><div className="flex flex-wrap gap-2"><button className={secondaryClass} disabled={busy} onClick={() => void task(async () => accept(await api('/nutrition/advice', { minutesUntilTraining: preMinutes, phase: 'pre' })))}>Gợi ý trước / sau tập</button><button className={secondaryClass} disabled={busy} onClick={manualMeal}>Ghi bữa từ nhãn</button><button className={secondaryClass} disabled={busy || !context.profile.photoConsent} onClick={() => upload.current?.click()}>Chụp / tải ảnh món ăn</button></div>
            <input ref={upload} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) void task(async () => accept(await api('/food/analyze', { image: await prepareFoodPhoto(file), photoConsent: true, message: message.trim() }))); }} />
            {!context.profile.photoConsent && <p className="text-xs text-slate-400">Bật đồng ý gửi ảnh trong Hồ sơ để sử dụng chức năng ảnh món ăn.</p>}
          </section>
          {result?.kind === 'nutrition' && <section className="space-y-3 rounded-xl border border-slate-700 p-3"><p className="text-sm">{result.notice}</p><p className="text-xs text-slate-300">Hôm nay đã ghi: {result.diary?.summary?.kcal ?? '—'} kcal. Đây không nhất thiết là toàn bộ lượng ăn trong ngày.</p>{result.templates.map((t: Data) => <article key={t.id} className="rounded-xl bg-slate-800 p-3"><h4 className="font-bold">{t.title}</h4><p className="whitespace-pre-wrap text-sm">{t.body}</p><p className="mt-2 text-xs text-slate-400">Người duyệt: {t.reviewedBy} · Nguồn: {t.source}</p></article>)}<p className="text-xs text-slate-400">{result.contextNote}</p><p className="text-xs text-slate-400">{result.limits}</p></section>}
          {draft && <MealDraft key={draft.key} draft={draft} busy={busy} onConfirm={body => void task(async () => {
            await api('/meals', body); setDraft(null); setTab('diary'); await refreshAfterSaved('Đã lưu bữa ăn đã xác nhận và tính kcal từ nguồn số liệu bạn chọn.');
          })} />}
          <button className={secondaryClass} disabled={busy} onClick={() => void task(async () => {
            if (!navigator.geolocation) throw new Error('Trình duyệt không hỗ trợ vị trí.');
            const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 }));
            accept(await api('/places/nearby', { locationConsent: true, latitude: position.coords.latitude, longitude: position.coords.longitude }));
          })}>Quán gần đây · Chia sẻ vị trí cho lần tìm này</button>
          {result?.kind === 'places' && <section className="space-y-3"><p className="text-sm">{result.disclaimer}</p><p className="text-sm font-bold">Google Maps</p>{result.places.length === 0 && <p className="text-sm">Không có kết quả phù hợp từ nhà cung cấp.</p>}{result.places.map((p: Data) => <article className="rounded-xl bg-slate-800 p-3" key={p.id}><h4 className="font-bold">{p.name}</h4><p className="text-sm">{p.address}</p><p className="mt-1 text-xs text-slate-300">{p.openNow === null ? 'Chưa có dữ liệu mở cửa hiện tại' : p.openNow ? 'Nhà cung cấp báo đang mở' : 'Nhà cung cấp báo đang đóng'}</p>{p.mapsUrl && <a className="mt-2 inline-block text-sm text-orange-300 underline" href={p.mapsUrl} target="_blank" rel="noopener noreferrer">Mở Google Maps</a>}{p.attributions.map((a: Data, i: number) => <p className="text-xs text-slate-400" key={i}>{a.provider}</p>)}</article>)}</section>}
          <p className="text-xs text-slate-400">Trợ lý không đo phục hồi cơ, không nhìn thấy máy đang trống và không thay thế HLV hoặc chuyên gia y tế. Muốn tư vấn người thật: chuyển sang Tư vấn dịch vụ.</p>
        </>}
        {tab === 'diary' && context?.profile && <section className="space-y-4"><div className="flex items-center justify-between"><h3 className="text-xl font-bold">Nhật ký của bạn</h3><button className={secondaryClass} disabled={busy} onClick={() => void task(() => refresh())}>Cập nhật</button></div><p className="text-xs text-slate-400">{context.diary?.date} · {context.diary?.timezone}</p>
          <div className="rounded-2xl bg-slate-900 p-4"><p className="text-3xl font-bold text-orange-300">{context.diary?.summary.kcal ?? '—'} <span className="text-base">kcal đã ghi</span></p><p className="mt-2 text-sm">Khoảng theo khẩu phần: {context.diary?.summary.kcalMin ?? '—'}–{context.diary?.summary.kcalMax ?? '—'} kcal</p><p className="mt-2 text-xs text-slate-400">{context.diary?.summary.note} Khoảng này chưa bao quát mọi sai số công thức hoặc chế biến.</p></div>
          {context.diary?.meals.map((meal: Data) => <article key={meal.id} className="rounded-xl border border-slate-700 p-3"><p className="font-semibold">{meal.items.map((i: Data) => i.name).join(', ')}</p><p className="text-sm">~{meal.kcal} kcal</p><details className="my-2 text-xs text-slate-400"><summary>Nguồn và khẩu phần</summary>{meal.items.map((i: Data, n: number) => <p key={n}>{i.grams} g · {i.kcalPer100g} kcal/100 g · {i.source}</p>)}</details><button className={secondaryClass} disabled={busy} onClick={() => { if (window.confirm('Bỏ bữa này khỏi tổng ngày? Để sửa, hãy bỏ bản ghi sai rồi nhập lại.')) void task(async () => { await api(`/meals/${meal.id}`, undefined, 'DELETE'); await refreshAfterSaved('Đã bỏ bữa khỏi tổng ngày.'); }); }}>Bỏ bản ghi sai</button></article>)}
          <h4 className="font-bold">Các buổi tập đã xác nhận</h4>{context.history?.workouts.map((w: Data) => <article key={w.id} className="rounded-xl bg-slate-900 p-3"><p className="font-semibold">{new Date(w.occurredAt).toLocaleString('vi-VN', { timeZone: context.profile.timezone })}</p><p className="text-sm">{w.sets.length} hiệp · {w.durationMinutes} phút · {w.status === 'completed' ? 'Hoàn thành các hiệp dự kiến' : 'Hoàn thành một phần'}</p><p className="mt-1 text-xs text-slate-300">Tổng tải ngoài: {w.externalLoadVolumeKg} kg (số lần × tạ), không phải kcal tiêu hao.</p></article>)}<p className="text-xs text-slate-400">{context.history?.note}</p>
        </section>}
        {tab === 'gym' && context?.isAdmin && <MemberImportPanel />}
        {tab === 'gym' && context?.isAdmin && <section className="space-y-3"><h3 className="text-xl font-bold">Danh mục gym đã kiểm chứng</h3><p className="text-sm text-slate-300">Tải mẫu trong data/companion, thay toàn bộ chỗ chưa xác minh bằng máy và vị trí thực tế. Chỉ đặt verified=true sau khi quản lý/HLV kiểm tra. Mẫu không được tự kích hoạt.</p><button className={secondaryClass} disabled={busy} onClick={() => void task(async () => { const c = await api('/admin/catalogue'); setCatalogueText(JSON.stringify(c, null, 2)); setCatalogueRevision(c.revision ?? null); })}>Tải danh mục hiện tại</button><textarea className={fieldClass + ' h-96 font-mono text-xs'} aria-label="JSON danh mục máy, bài tập và mẫu ăn đã duyệt" spellCheck={false} value={catalogueText} onChange={e => setCatalogueText(e.target.value)} /><button className={buttonClass} disabled={busy || !catalogueText} onClick={() => void task(async () => { const saved = await api('/admin/catalogue', { catalogue: JSON.parse(catalogueText), expectedRevision: catalogueRevision }, 'PUT'); setCatalogueText(JSON.stringify(saved, null, 2)); setCatalogueRevision(saved.revision); await refreshAfterSaved('Đã kiểm tra cấu trúc và lưu danh mục. Độ đúng thực tế do người duyệt chịu trách nhiệm.'); })}>Kiểm tra cấu trúc và lưu</button></section>}
      </main>}
      {tab === 'chat' && context?.profile && <form className="flex shrink-0 gap-2 border-t border-slate-700 bg-slate-950 p-3" onSubmit={e => { e.preventDefault(); void send(); }}><input ref={messageInput} className={fieldClass} aria-label="Tin nhắn cho Shine Companion" maxLength={2000} value={message} onChange={e => setMessage(e.target.value)} placeholder="Tôi có 35 phút, muốn tập chân…" /><button className={buttonClass} disabled={busy || !message.trim()}>Gửi</button></form>}
    </section>}
  </>;
}
