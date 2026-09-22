import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AdaptivePlan, CompletionInput, IntentResult, PlanningResult, Readiness, TrainingContextResponse, TrainingProfileInput, TrainingSession } from '../../../shared/training';
import { createTrainingApi, TrainingApiError, type TrainingApi } from './api';
import { CompletionForm, initialReadiness, ProfileForm, ReadinessForm, type ReadinessDraft } from './TrainingForms';
import { trainingCopy } from './copy';
import './training.css';

interface Props { uid: string; lang?: string; api?: TrainingApi }
const uuid = () => crypto.randomUUID();
function errorCode(error: unknown): string { return error instanceof TrainingApiError ? error.code : 'request_failed'; }

export function TrainingWorkspace({ uid, lang = 'vi', api: suppliedApi }: Props) {
  const api = useMemo(() => suppliedApi ?? createTrainingApi(uid), [suppliedApi, uid]);
  const t = trainingCopy(lang), alive = useRef(true);
  const [context, setContext] = useState<TrainingContextResponse | null>(null);
  const [tab, setTab] = useState<'overview' | 'profile' | 'history'>('overview');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [draft, setDraft] = useState<ReadinessDraft>(initialReadiness());
  const [plan, setPlan] = useState<AdaptivePlan | null>(null), [message, setMessage] = useState('');
  const planAttempt = useRef<{ readinessId: string; requestId: string; gymOnly: boolean } | null>(null);
  const requestVersion = useRef(0);
  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    const next = await api.request<TrainingContextResponse>('/context');
    if (!alive.current || version !== requestVersion.current) return;
    setContext(next);
    setPlan(prev => prev ? next.openPlans.find(p => p.id === prev.id) ?? null : next.openPlans[0] ?? null);
    if (!next.profile) setTab('profile');
  }, [api]);
  useEffect(() => {
    alive.current = true;
    void load().catch(e => { if (alive.current) setError(errorCode(e)); });
    return () => { alive.current = false; requestVersion.current++; api.abort(); };
  }, [api, load]);
  const run = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try { await action(); } catch (e) { if (alive.current) setError(errorCode(e)); }
    finally { if (alive.current) setBusy(false); }
  };
  const saveProfile = async (profile: TrainingProfileInput) => run(async () => {
    await api.request('/profile', 'PUT', { profile, expectedRevision: context?.profileRevision ?? 0 });
    setNotice('saved'); planAttempt.current = null;
    setDraft(initialReadiness(profile.preferredMinutes));
    // A read failure after a successful write is not a failed write.
    try { await load(); setTab('overview'); } catch (e) { setError(errorCode(e)); }
  });
  const generate = async (input: Omit<Readiness, 'id' | 'profileRevision' | 'reportedAt' | 'expiresAt'>) => run(async () => {
    if (!context?.profile) return;
    if (!planAttempt.current) {
      const saved = await api.request<{ readiness: Readiness }>('/readiness', 'PUT', { readiness: input, expectedProfileRevision: context.profile.revision });
      planAttempt.current = { readinessId: saved.readiness.id, requestId: uuid(), gymOnly: draft.gymOnly };
    }
    try {
      const result = await api.request<PlanningResult>('/plans', 'POST', planAttempt.current);
      planAttempt.current = null;
      if (result.status !== 'ready') { setError(result.code); return; }
      setPlan(result.plan); setTab('overview');
      try { await load(); setPlan(result.plan); } catch (e) { setError(errorCode(e)); }
    } catch (e) {
      if (!(e instanceof TrainingApiError) || !['connection_uncertain', 'service_unavailable'].includes(e.code)) planAttempt.current = null;
      throw e;
    }
  });
  const complete = async (input: CompletionInput) => {
    if (!plan) throw new TrainingApiError('plan_not_found', 'No plan selected.');
    setBusy(true); setError('');
    try {
      const result = await api.request<{ session: TrainingSession; replay: boolean }>(`/plans/${plan.id}/complete`, 'POST', input);
      setNotice(result.replay ? 'replay' : 'recorded'); setPlan(null); setTab('history'); planAttempt.current = null;
      setDraft(initialReadiness(context?.profile?.preferredMinutes ?? 35));
      // Keep successful completion successful even when the subsequent refresh is unavailable.
      try { await load(); } catch (e) { setError(errorCode(e)); }
    } finally { if (alive.current) setBusy(false); }
  };
  const understand = async (event: React.FormEvent) => {
    event.preventDefault(); await run(async () => {
      const result = await api.request<{ intent: IntentResult; replyCode: string }>('/chat', 'POST', { message });
      setNotice(result.replyCode);
      if (result.intent.intent === 'history') { await load(); setTab('history'); }
      if (result.intent.intent === 'plan') {
        planAttempt.current = null;
        setDraft(prev => ({ ...prev, ...(result.intent.availableMinutes === undefined ? {} : { minutes: String(result.intent.availableMinutes) }),
          ...(result.intent.desiredMuscles === undefined ? {} : { desired: result.intent.desiredMuscles }), confirmed: false }));
      }
      if (result.intent.intent === 'safety') {
        planAttempt.current = null;
        // This is an input requiring review, never an automatic "pain free" determination.
        setDraft(prev => ({ ...prev, pain: 'true', confirmed: false }));
        setError('professional_review_required');
      }
    });
  };
  const exportData = () => run(async () => {
    const result = await api.request('/export');
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = 'my-shine-training-data.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  const erase = () => { if (window.confirm(t('eraseConfirm'))) void run(async () => {
    await api.request('/data', 'DELETE', { confirmed: true }); setPlan(null); setContext(null); planAttempt.current = null;
    setNotice('saved'); await load();
  }); };
  return <section className="shine-training" aria-label={t('title')}>
    <header className="training-heading"><div><span className="training-badge">{t('pilot')}</span><h2>{t('title')}</h2><p>{t('subtitle')}</p></div><button type="button" disabled={busy} onClick={() => void run(load)}>{t('refresh')}</button></header>
    <nav className="training-tabs" aria-label={t('title')}>{(['overview', 'profile', 'history'] as const).map(k => <button type="button" key={k} aria-current={tab === k ? 'page' : undefined} disabled={busy || (!context?.profile && k !== 'profile')} onClick={() => setTab(k)}>{t(k)}</button>)}</nav>
    {error && <div role="alert" className="training-alert">{t(error)}<small>{error}</small></div>}
    {notice && <div role="status" className="training-notice">{t(notice)}</div>}
    {!context ? (!error && <p role="status">{t('loading')}</p>) : <>
      {tab === 'profile' && <ProfileForm key={context.profileRevision} profile={context.profile} revision={context.profileRevision} lang={lang} busy={busy} onSave={saveProfile} />}
      {context.profile && tab === 'overview' && <>
        <form className="training-chat" onSubmit={understand}><label>{t('ask')}<input value={message} maxLength={600} required placeholder={t('askHint')} onChange={e => setMessage(e.target.value)} /></label><button disabled={busy || !message.trim()}>{t('send')}</button></form>
        <ReadinessForm draft={draft} setDraft={next => { planAttempt.current = null; setDraft(next); }} lang={lang} busy={busy} onPlan={generate} />
        {context.openPlans.length > 1 && <label>{t('openPlans')}<select value={plan?.id ?? ''} disabled={busy} onChange={e => setPlan(context.openPlans.find(p => p.id === e.target.value) ?? null)}><option value="">{t('select')}</option>{context.openPlans.map(p => <option value={p.id} key={p.id}>{new Date(p.generatedAt).toLocaleString(lang, { timeZone: context.profile!.timezone })} - {p.targetMuscleGroups.map(t).join(', ')} - {p.status}</option>)}</select></label>}
        {plan ? <>
          <PlanView plan={plan} lang={lang} style={context.profile.style} />
          {plan.status === 'proposed' && <div className="training-actions"><button disabled={busy} onClick={() => void run(async () => { const result = await api.request<{ plan: AdaptivePlan }>(`/plans/${plan.id}/start`, 'POST', { confirmed: true }); setPlan(result.plan); })}>{t('start')}</button><button disabled={busy} onClick={() => void run(async () => { await api.request(`/plans/${plan.id}/cancel`, 'POST', { confirmed: true }); setPlan(null); await load(); })}>{t('cancel')}</button></div>}
          {plan.status === 'started' && <CompletionForm key={plan.id} plan={plan} historyRevision={context.historyRevision} profileRevision={context.profileRevision} lang={lang} busy={busy} onComplete={complete} />}
        </> : <p className="training-muted">{t('noPlan')}</p>}
      </>}
      {context.profile && tab === 'history' && <>
        <div className="training-summary"><div><strong>{context.summary.sessionsLast14Days}</strong><span>{t('confirmedSessions')}</span></div><div><strong>{context.summary.legacyTrainingDays14}</strong><span>{t('legacyDays')}</span></div></div>
        {context.warnings.map(w => <p key={w} className="training-muted">{t(w)}</p>)}
        {!context.recentSessions.length && <p>{t('emptyHistory')}</p>}
        {context.recentSessions.map(s => <article className="training-card" key={s.id}><header><strong>{new Date(s.performedAt).toLocaleString(lang, { timeZone: context.profile!.timezone })}</strong><span>{s.status} - {s.actualMinutes} min</span></header>{s.exercises.map((e, i) => <div key={`${e.exerciseId ?? e.name}-${i}`}><strong>{e.name}</strong><p>{e.skipped ? t('skip') : e.sets.map(set => `${set.reps} reps / ${set.loadKg === null ? '?' : set.loadKg} kg${set.rpe === null ? '' : ` / RPE ${set.rpe}`}`).join(' | ')}</p></div>)}<button disabled={busy} type="button" onClick={() => { if (window.confirm(t('eraseSessionConfirm'))) void run(async () => { await api.request(`/sessions/${s.id}`, 'DELETE', { confirmed: true }); await load(); }); }}>{t('eraseSession')}</button></article>)}
        {!!context.progress.points.length && <article className="training-card"><h3>{t('weight')}</h3><p>{t(context.progress.explanation)}</p>{context.progress.points.map(p => <p key={p.date}>{p.date}: {p.weightKg} kg</p>)}{context.progress.changeKg !== null && <p>{context.progress.changeKg > 0 ? '+' : ''}{context.progress.changeKg} kg ({t('observed_change_only')})</p>}</article>}
      </>}
    </>}
    <details className="training-privacy"><summary>{t('privacy')}</summary><div className="training-actions"><button disabled={busy} onClick={() => void exportData()}>{t('export')}</button><button disabled={busy} onClick={erase}>{t('erase')}</button></div></details>
  </section>;
}

export function PlanView({ plan, lang = 'vi', style = 'gentle' }: { plan: AdaptivePlan; lang?: string; style?: string }) {
  const t = trainingCopy(lang);
  return <article className="training-plan"><header><span className="training-badge">{t(plan.mode)}</span><h3>{plan.targetMuscleGroups.map(t).join(' + ')} - {plan.estimatedMinutes} min</h3><p>{t(plan.contextCompleteness.label)}</p><p>{t(`coach_${style}`)}</p></header>
    {plan.kind === 'structure_only' && <p className="training-alert">{t('structureNotice')}</p>}
    <p>{t('warmup')}: {Math.round(plan.warmupSeconds / 60)} min | {t('cooldown')}: {Math.round(plan.cooldownSeconds / 60)} min</p>
    {plan.structure.map((b, i) => <div className="training-card" key={`${b.pattern}-${i}`}><strong>{t(b.pattern)}</strong><p>{t(b.intent)} - {(b.seconds / 60).toFixed(1)} min</p></div>)}
    {plan.exercises.map(e => <section className="training-card" key={e.exerciseId}><h4>{e.name}</h4><p>{e.sets} {t('countSets')} x {e.repRange.min}-{e.repRange.max} reps | {e.restSeconds}s rest</p><div>{e.locations.map(l => <p key={l.stationId}>{t('location')}: {l.stationName} - {l.zoneName}<br />{l.directions}</p>)}</div><strong>{t('cues')}</strong><ul>{e.trainerCues.map((c, i) => <li key={i}>{c}</li>)}</ul>{e.previousPerformance && <p>{t('reference')}: {e.previousPerformance.sets.map(s => `${s.reps} reps / ${s.loadKg === null ? '?' : s.loadKg} kg`).join(' | ')}</p>}</section>)}
    <details><summary>{t('why')}</summary><p>{t('qualityNotice')}</p><div className="training-flags">{(['profile', 'readiness', 'history', 'verifiedGym'] as const).map(k => <span key={k}>{t(k === 'verifiedGym' ? 'gymFlag' : `${k}Flag`)}: {plan.contextCompleteness[k] ? t('yes') : t('no')}</span>)}</div><ul>{plan.rationale.map(r => <li key={r}>{t(r)}</li>)}</ul><div className="training-table-wrap"><table><caption>{t('rules')}</caption><thead><tr><th>{t('desired')}</th><th>Score</th><th>{t('more')}</th></tr></thead><tbody>{plan.scores.map(s => <tr key={s.muscleGroup}><td>{t(s.muscleGroup)}</td><td>{s.score}</td><td>{s.factors.map(f => `${t(f.code)} (${f.points})`).join('; ')}</td></tr>)}</tbody></table></div><p>{t('snapshot')}: profile {plan.profileRevision}, history {plan.historyRevision}, catalogue {plan.catalogueRevision?.slice(0, 12) ?? '-'}</p></details>
    <ul className="training-muted">{plan.caveats.map(c => <li key={c}>{t(c)}</li>)}</ul>
  </article>;
}
