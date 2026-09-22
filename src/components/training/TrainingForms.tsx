import React, { useState } from 'react';
import { EXPERIENCE_LEVELS, MUSCLE_GROUPS, TRAINING_GOALS } from '../../../shared/training';
import type { ActualExercise, AdaptivePlan, CompletionInput, MuscleGroup, ReadinessInput, TrainingProfile, TrainingProfileInput } from '../../../shared/training';
import { TrainingApiError } from './api';
import { trainingCopy } from './copy';

export function ProfileForm({ profile, revision, lang, busy, onSave }: { profile: TrainingProfile | null; revision: number; lang: string; busy: boolean; onSave: (input: TrainingProfileInput, revision: number) => Promise<void> }) {
  const t = trainingCopy(lang);
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const f = new FormData(event.currentTarget);
    const value = (k: string) => String(f.get(k) ?? '');
    const optional = (k: string) => value(k) === '' ? null : Number(value(k));
    const input: TrainingProfileInput = {
      nickname: value('nickname'), age: Number(value('age')), goal: value('goal') as TrainingProfileInput['goal'],
      experience: value('experience') as TrainingProfileInput['experience'], preferredMinutes: Number(value('preferredMinutes')),
      timezone: value('timezone'), heightCm: optional('heightCm'), weightKg: optional('weightKg'),
      preferences: f.getAll('preferences').map(String) as MuscleGroup[], avoidedExerciseIds: value('avoidedExerciseIds').split(',').map(s => s.trim()).filter(Boolean),
      healthReviewNeeded: value('health') === 'true', includeLegacyHistory: f.has('legacy'), style: value('style') as TrainingProfileInput['style'],
      adultConfirmed: f.has('adult'), consent: f.has('consent')
    };
    await onSave(input, revision);
  };
  return <form className="training-stack" onSubmit={save}>
    <fieldset disabled={busy} className="training-stack">
      <legend>{t('profile')}</legend>
      <div className="training-grid">
        <label>{t('nickname')}<input name="nickname" defaultValue={profile?.nickname ?? ''} required maxLength={60} autoComplete="nickname" /></label>
        <label>{t('age')}<input name="age" type="number" min={18} max={100} step={1} defaultValue={profile?.age ?? ''} required /></label>
        <label>{t('goal')}<select name="goal" defaultValue={profile?.goal ?? ''} required><option value="">{t('select')}</option>{TRAINING_GOALS.map(g => <option key={g} value={g}>{t(g)}</option>)}</select></label>
        <label>{t('experience')}<select name="experience" defaultValue={profile?.experience ?? ''} required><option value="">{t('select')}</option>{EXPERIENCE_LEVELS.map(g => <option key={g} value={g}>{t(g)}</option>)}</select></label>
        <label>{t('minutes')}<input name="preferredMinutes" type="number" min={10} max={120} step={1} defaultValue={profile?.preferredMinutes ?? 35} required /></label>
        <label>{t('timezone')}<input name="timezone" maxLength={80} defaultValue={profile?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'Asia/Ho_Chi_Minh'} required /></label>
        <label>{t('height')}<input name="heightCm" type="number" min={100} max={250} step="any" defaultValue={profile?.heightCm ?? ''} /></label>
        <label>{t('weight')}<input name="weightKg" type="number" min={25} max={350} step="any" defaultValue={profile?.weightKg ?? ''} /></label>
      </div>
      <fieldset><legend>{t('preferences')}</legend><div className="training-pills">{MUSCLE_GROUPS.map(g => <label className="training-check" key={g}><input name="preferences" type="checkbox" value={g} defaultChecked={profile?.preferences.includes(g)} />{t(g)}</label>)}</div></fieldset>
      <label>{t('avoid')}<input name="avoidedExerciseIds" maxLength={1200} defaultValue={profile?.avoidedExerciseIds.join(', ') ?? ''} /></label>
      <label>{t('health')}<select name="health" defaultValue={profile ? String(profile.healthReviewNeeded) : ''} required><option value="">{t('select')}</option><option value="false">{t('no')}</option><option value="true">{t('yes')}</option></select></label>
      <label>{t('style')}<select name="style" defaultValue={profile?.style ?? 'gentle'}>{['gentle', 'energetic', 'direct'].map(s => <option value={s} key={s}>{t(s)}</option>)}</select></label>
      <label className="training-check"><input name="legacy" type="checkbox" defaultChecked={profile?.includeLegacyHistory ?? false} />{t('legacy')}</label>
      <label className="training-check"><input name="adult" type="checkbox" required defaultChecked={profile?.adultConfirmed ?? false} />{t('adult')}</label>
      <label className="training-check"><input name="consent" type="checkbox" required defaultChecked={profile?.consent ?? false} />{t('consent')}</label>
      <button className="training-primary" type="submit">{t('save')}</button>
    </fieldset>
  </form>;
}
export interface ReadinessDraft { minutes: string; energy: string; pain: string; soreness: MuscleGroup[]; desired: MuscleGroup[]; blocked: string; confirmed: boolean; gymOnly: boolean }
export const initialReadiness = (minutes = 35): ReadinessDraft => ({ minutes: String(minutes), energy: '', pain: '', soreness: [], desired: [], blocked: '', confirmed: false, gymOnly: false });
export function ReadinessForm({ draft, setDraft, onPlan, lang, busy }: { draft: ReadinessDraft; setDraft: React.Dispatch<React.SetStateAction<ReadinessDraft>>; onPlan: (input: ReadinessInput, gymOnly: boolean) => Promise<void>; lang: string; busy: boolean }) {
  const t = trainingCopy(lang), set = (key: keyof ReadinessDraft, value: unknown) => setDraft(d => ({ ...d, [key]: value, confirmed: key === 'confirmed' ? Boolean(value) : false }));
  const toggle = (field: 'soreness' | 'desired', g: MuscleGroup) => set(field, draft[field].includes(g) ? draft[field].filter(x => x !== g) : [...draft[field], g]);
  return <form onSubmit={async e => { e.preventDefault(); await onPlan({ confirmed: draft.confirmed, availableMinutes: Number(draft.minutes), energy: Number(draft.energy), currentPain: draft.pain === 'true', soreness: draft.soreness, desiredMuscles: draft.desired, blockedEquipmentIds: draft.blocked.split(',').map(s => s.trim()).filter(Boolean) }, draft.gymOnly); }} className="training-card training-stack">
    <fieldset disabled={busy} className="training-stack"><legend>{t('readiness')}</legend>
      <div className="training-grid">
        <label>{t('minutes')}<input type="number" required min={10} max={120} step={1} value={draft.minutes} onChange={e => set('minutes', e.target.value)} /></label>
        <label>{t('energy')}<select required value={draft.energy} onChange={e => set('energy', e.target.value)}><option value="">{t('select')}</option>{[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}</select></label>
      </div>
      <label>{t('pain')}<select required value={draft.pain} onChange={e => set('pain', e.target.value)}><option value="">{t('select')}</option><option value="false">{t('no')}</option><option value="true">{t('yes')}</option></select></label>
      {(['soreness', 'desired'] as const).map(field => <fieldset key={field}><legend>{t(field === 'soreness' ? 'sore' : 'desired')}</legend><div className="training-pills">{MUSCLE_GROUPS.map(g => <label className="training-check" key={g}><input type="checkbox" checked={draft[field].includes(g)} onChange={() => toggle(field, g)} />{t(g)}</label>)}</div></fieldset>)}
      <label>{t('blocked')}<input maxLength={1200} value={draft.blocked} onChange={e => set('blocked', e.target.value)} /></label>
      <label className="training-check"><input type="checkbox" checked={draft.gymOnly} onChange={e => set('gymOnly', e.target.checked)} />{t('gymOnly')}</label>
      <label className="training-check"><input type="checkbox" checked={draft.confirmed} required onChange={e => set('confirmed', e.target.checked)} />{t('readinessConfirm')}</label>
      <button className="training-primary" type="submit">{t('generate')}</button>
    </fieldset>
  </form>;
}
interface SetDraft { reps: string; load: string; rpe: string }
interface ExerciseDraft { exerciseId: string | null; name: string; groups: MuscleGroup[]; skipped: boolean; sets: SetDraft[] }
const emptySet = (): SetDraft => ({ reps: '', load: '', rpe: '' });
export function CompletionForm({ plan, historyRevision, profileRevision, lang, busy, onComplete }: { plan: AdaptivePlan; historyRevision: number; profileRevision: number; lang: string; busy: boolean; onComplete: (input: CompletionInput) => Promise<void> }) {
  const t = trainingCopy(lang);
  const emptyExercise = (): ExerciseDraft => ({ exerciseId: null, name: '', groups: [], skipped: false, sets: [emptySet()] });
  const [rows, setRows] = useState<ExerciseDraft[]>(() => plan.kind === 'exercises' ? plan.exercises.map(e => ({ exerciseId: e.exerciseId, name: e.name, groups: e.primaryMuscles, skipped: false, sets: [emptySet()] })) : [emptyExercise()]);
  const [actualMinutes, setMinutes] = useState(''), [notes, setNotes] = useState(''), [confirmed, setConfirmed] = useState(false), [ack, setAck] = useState(false);
  const [attempt, setAttempt] = useState<CompletionInput | null>(null), [error, setError] = useState('');
  const update = (index: number, patch: Partial<ExerciseDraft>) => setRows(rs => rs.map((r, i) => i === index ? { ...r, ...patch } : r));
  const transmit = async (payload: CompletionInput) => {
    setError(''); setAttempt(payload);
    try { await onComplete(payload); }
    catch (err) {
      const code = err instanceof TrainingApiError ? err.code : 'connection_uncertain';
      setError(t(code));
      if (!['connection_uncertain', 'service_unavailable'].includes(code)) setAttempt(null);
    }
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    try {
      const exercises: ActualExercise[] = [];
      for (const r of rows) {
        const touched = r.sets.filter(s => s.reps !== '' || s.load !== '' || s.rpe !== '');
        if (!r.skipped && !touched.length) continue;
        if (!r.name.trim() || (!r.skipped && !r.groups.length) || touched.some(s => s.reps === '' || !Number.isInteger(Number(s.reps)) || Number(s.reps) <= 0)) throw new Error('incomplete');
        exercises.push({ exerciseId: r.exerciseId, name: r.name.trim(), muscleGroups: r.groups, skipped: r.skipped,
          sets: r.skipped ? [] : touched.map(s => ({ reps: Number(s.reps), loadKg: s.load === '' ? null : Number(s.load), rpe: s.rpe === '' ? null : Number(s.rpe) })) });
      }
      if (!confirmed || !exercises.some(e => e.sets.length > 0)) throw new Error('empty');
      await transmit({ confirmed: true, performedAt: new Date().toISOString(), actualMinutes: Number(actualMinutes), exercises, notes,
        expectedHistoryRevision: historyRevision, acknowledgeProfileChange: ack });
    } catch { setError(t('incompleteSets')); }
  };
  return <form onSubmit={submit} className="training-card training-stack">
    <h3>{t('actual')}</h3><p className="training-muted">{t('actualNotice')}</p>
    {error && <p role="alert" className="training-alert">{error}</p>}
    <fieldset disabled={busy || attempt !== null} className="training-stack">
      {rows.map((r, i) => <div key={i} className="training-exercise">
        {plan.kind === 'structure_only' ? <><label>{t('name')}<input maxLength={120} value={r.name} onChange={e => update(i, { name: e.target.value })} /></label>
          <div className="training-pills">{MUSCLE_GROUPS.map(g => <label className="training-check" key={g}><input type="checkbox" checked={r.groups.includes(g)} onChange={() => update(i, { groups: r.groups.includes(g) ? r.groups.filter(x => x !== g) : [...r.groups, g] })} />{t(g)}</label>)}</div></> : <strong>{r.name}</strong>}
        <label className="training-check"><input type="checkbox" checked={r.skipped} onChange={e => update(i, { skipped: e.target.checked, sets: e.target.checked ? [] : [emptySet()] })} />{t('skip')}</label>
        {!r.skipped && <>{r.sets.map((s, j) => <div className="training-set-grid" key={j}>
          {(['reps', 'load', 'rpe'] as const).map(key => <label key={key}>{t(key)}<input type="number" value={s[key]} min={key === 'load' ? 0 : 1} max={key === 'load' ? 500 : key === 'rpe' ? 10 : 100} step={key === 'reps' ? 1 : 'any'} onChange={e => update(i, { sets: r.sets.map((old, n) => n === j ? { ...old, [key]: e.target.value } : old) })} /></label>)}
          <button type="button" aria-label={t('removeSet')} onClick={() => update(i, { sets: r.sets.filter((_, n) => n !== j) })}>{t('removeSet')}</button>
        </div>)}<button type="button" disabled={r.sets.length >= 10} onClick={() => update(i, { sets: [...r.sets, emptySet()] })}>{t('addSet')}</button></>}
      </div>)}
      {plan.kind === 'structure_only' && <button type="button" disabled={rows.length >= 12} onClick={() => setRows(r => [...r, emptyExercise()])}>{t('addExercise')}</button>}
      <label>{t('actualMinutes')}<input type="number" min={1} max={240} required value={actualMinutes} onChange={e => setMinutes(e.target.value)} /></label>
      <label>{t('notes')}<textarea maxLength={600} value={notes} onChange={e => setNotes(e.target.value)} /></label>
      {profileRevision !== plan.profileRevision && <label className="training-check training-alert"><input type="checkbox" required checked={ack} onChange={e => setAck(e.target.checked)} />{t('changedProfile')}</label>}
      <label className="training-check"><input type="checkbox" required checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />{t('completedConfirm')}</label>
      <button type="submit" className="training-primary">{t('complete')}</button>
    </fieldset>
    {attempt && <button type="button" disabled={busy} onClick={() => void transmit(attempt)}>{t('retryCompletion')}</button>}
  </form>;
}
