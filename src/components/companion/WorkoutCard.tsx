import React, { useState } from 'react';
import { type Data, buttonClass, fieldClass, groupNames } from './client';

type Props = { plan: Data; busy: boolean; onConfirm: (body: Data) => void };
export default function WorkoutCard({ plan, busy, onConfirm }: Props) {
  const [actual, setActual] = useState<Record<string, Data>>({});
  const [minutes, setMinutes] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [pain, setPain] = useState(false);
  const [error, setError] = useState('');
  function change(key: string, exerciseId: string, field: string, value: string) {
    setConfirmed(false);
    setActual(a => ({ ...a, [key]: { ...a[key], exerciseId, [field]: value } }));
  }
  function submit(event: React.FormEvent) {
    event.preventDefault(); setError('');
    const entered = Object.values(actual).filter(s => (s.reps ?? '') !== '' || (s.loadKg ?? '') !== '');
    if (!entered.length || entered.some(s => !s.reps || (s.loadKg ?? '') === '')) {
      setError('Nhập số lần và tạ của ít nhất một hiệp. Để trống hoàn toàn các hiệp chưa tập; nhập 0 kg nếu không dùng tạ ngoài.'); return;
    }
    if (!confirmed || !minutes) { setError('Cần thời gian thực tế và xác nhận trước khi lưu.'); return; }
    onConfirm({ confirmed: true, durationMinutes: Number(minutes), painReported: pain,
      sets: entered.map(s => ({ exerciseId: s.exerciseId, reps: Number(s.reps), loadKg: Number(s.loadKg), effort: s.effort ? Number(s.effort) : null })) });
  }
  return <form onSubmit={submit} className="space-y-4 rounded-2xl border border-orange-400/60 bg-slate-950 p-4">
    <div><span className="text-xs font-bold uppercase tracking-wider text-orange-300">Đề xuất · Chưa ghi là đã tập</span>
      <h3 className="mt-1 text-xl font-bold">Buổi tập khoảng {plan.estimatedMinutes} phút</h3>
      <p className="mt-1 text-sm text-slate-300">Đã dành 5 phút khởi động và 3 phút thả lỏng. Thời gian không phải cam kết chính xác.</p></div>
    <div className="rounded-xl bg-slate-800 p-3 text-sm text-slate-200">
      <p>Ưu tiên theo mục tiêu, kinh nghiệm và {plan.reasons.historyRecordsUsed} buổi có dữ liệu trong 7 ngày gần đây.</p>
      {plan.reasons.recentGroupsExcluded.length > 0 && <p className="mt-1">Tạm tránh nhóm cơ: {plan.reasons.recentGroupsExcluded.map((g: string) => groupNames[g] ?? g).join(', ')}.</p>}
      {plan.historyWarning && <p className="mt-1 text-orange-300">Một phần nhật ký cũ chưa đọc được hoặc chưa đầy đủ.</p>}
    </div>
    {plan.exercises.map((exercise: Data, n: number) => <article key={exercise.exerciseId} className="space-y-3 rounded-xl bg-slate-900 p-3">
      <h4 className="font-bold">{n + 1}. {exercise.name}</h4>
      <div className="rounded-lg border border-slate-700 p-2 text-sm"><p className="font-semibold text-orange-300">{exercise.stationName} · {exercise.zone}</p><p className="mt-1 text-slate-200">{exercise.directions}</p></div>
      <p className="text-sm">{exercise.sets} hiệp × {exercise.repsMin}–{exercise.repsMax} lần · Nghỉ {exercise.restSeconds} giây</p>
      <div className="space-y-1 text-sm text-slate-300">{exercise.cues.map((cue: string, i: number) => <p key={i}>{cue}</p>)}</div>
      {exercise.lastPerformance && <p className="rounded-lg bg-slate-800 p-2 text-xs text-slate-300">Lần ghi trước ({exercise.lastPerformance.date.slice(0, 10)}): {exercise.lastPerformance.sets.map((s: Data) => `${s.reps} lần / ${s.loadKg} kg`).join('; ')}. Chỉ để đối chiếu, không phải yêu cầu tăng tạ.</p>}
      <p className="text-xs font-semibold text-orange-200">Ghi thực tế sau khi tập — hiệp chưa tập để trống</p>
      {Array.from({ length: exercise.sets }, (_, i) => {
        const key = `${exercise.exerciseId}:${i}`, value = actual[key] ?? {};
        return <div className="grid grid-cols-3 gap-2" key={key}>
          <label className="text-xs text-slate-300">Hiệp {i + 1}: số lần<input className={fieldClass} type="number" min="1" max="100" step="1" placeholder="Chưa tập" value={value.reps ?? ''} onChange={e => change(key, exercise.exerciseId, 'reps', e.target.value)} /></label>
          <label className="text-xs text-slate-300">Tạ ngoài (kg)<input className={fieldClass} type="number" min="0" max="500" step="0.5" placeholder="0 nếu không" value={value.loadKg ?? ''} onChange={e => change(key, exercise.exerciseId, 'loadKg', e.target.value)} /></label>
          <label className="text-xs text-slate-300">Mức gắng sức 1–10<input className={fieldClass} type="number" min="1" max="10" placeholder="Tùy chọn" value={value.effort ?? ''} onChange={e => change(key, exercise.exerciseId, 'effort', e.target.value)} /></label>
        </div>;
      })}
    </article>)}
    <label className="grid gap-1 text-sm text-slate-300">Thời gian thực tế (phút)<input required className={fieldClass} type="number" min="1" max="240" value={minutes} onChange={e => { setMinutes(e.target.value); setConfirmed(false); }} /></label>
    <label className="flex gap-2 text-sm"><input type="checkbox" checked={pain} onChange={e => { setPain(e.target.checked); setConfirmed(false); }} />Tôi có đau hoặc khó chịu trong buổi tập.</label>
    {pain && <p role="alert" className="text-sm text-orange-200">Dừng bài gây đau và hỏi HLV/chuyên gia y tế. Ghi nhận cơn đau không có nghĩa AI đã đánh giá nguyên nhân.</p>}
    <label className="flex gap-2 text-sm"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />Tôi xác nhận các hiệp đã nhập là phần thực sự hoàn thành.</label>
    {error && <p role="alert" className="text-sm text-red-200">{error}</p>}
    <button className={buttonClass} disabled={busy || !confirmed}>Lưu phần đã tập</button>
    <details className="text-xs text-slate-400"><summary className="cursor-pointer py-2">Giới hạn của đề xuất này</summary>{plan.limitations.map((line: string, i: number) => <p key={i} className="mb-2">{line}</p>)}</details>
  </form>;
}
