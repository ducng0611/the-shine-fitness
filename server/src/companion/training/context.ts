import { MUSCLE_GROUPS } from '../../../../shared/training';
import type { HistorySummary, LegacyTrainingDay, MuscleGroup, ProgressPoint, RecordObject, TrainingSession } from '../../../../shared/training';
import { localDay, owns } from './validation';

export const DAY_MS = 86_400_000;
export function normalizeMuscle(value: unknown): MuscleGroup | null {
  if (typeof value !== 'string') return null;
  const s = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0111/g, 'd').toLowerCase().replace(/\([^)]*\)/g, '').trim().replace(/^co /, '');
  const aliases: Record<string, MuscleGroup> = {
    chest: 'chest', nguc: 'chest', back: 'back', lung: 'back', xo: 'back', legs: 'legs', leg: 'legs', chan: 'legs',
    quadriceps: 'legs', quads: 'legs', hamstrings: 'legs', glutes: 'legs', calves: 'legs',
    shoulders: 'shoulders', shoulder: 'shoulders', vai: 'shoulders', arms: 'arms', tay: 'arms', biceps: 'arms', triceps: 'arms',
    core: 'core', abs: 'core', bung: 'core', 'tay truoc': 'arms', 'tay sau': 'arms', 'lung rong': 'back', 'latissimus dorsi': 'back', 'co tram': 'back', tram: 'back', rhomboids: 'back', deltoids: 'shoulders', 'dui truoc': 'legs', 'dui sau': 'legs', mong: 'legs', 'bap chan': 'legs'
  };
  return aliases[s] ?? null;
}
export function emptySummary(): HistorySummary {
  const zero = () => Object.fromEntries(MUSCLE_GROUPS.map(g => [g, 0])) as Record<MuscleGroup, number>;
  return { sessionsLast7Days: 0, sessionsLast14Days: 0, legacyTrainingDays14: 0, lastWorkoutAt: null,
    muscleFrequency7Days: zero(), muscleFrequency14Days: zero(), lastTrainedAt: {}, latestPerformance: {},
    confirmedSetCount14Days: 0, windowDays: 90, truncated: false, warnings: [] };
}
export function dayAge(day: string, today: string): number { return (Date.parse(today) - Date.parse(day)) / DAY_MS; }
function validDay(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value))) return false;
  return new Date(value).toISOString().slice(0, 10) === value;
}
/** Legacy exercise entries are grouped into DAYS, never falsely counted as sessions. */
export function normalizeLegacy(rows: RecordObject[], account: string, now: number, timezone: string): LegacyTrainingDay[] {
  const today = localDay(now, timezone), days = new Map<string, LegacyTrainingDay>(), seen = new Set<string>();
  for (const r of rows) {
    if (!owns(r, account) || r.source === 'shine_training_v1' || r.SAMPLE_DATA_ONLY === true || r.status === 'proposed' || r.status === 'deleted') continue;
    if (!validDay(r.date) || dayAge(r.date, today) < 0 || dayAge(r.date, today) >= 90 || !Array.isArray(r.sets)) continue;
    const key = String(r.id ?? ''); if (!key || seen.has(key)) continue; seen.add(key);
    const sets = r.sets.filter(raw => {
      if (!raw || typeof raw !== 'object') return false;
      const s = raw as RecordObject;
      return s.completed === true && typeof s.reps === 'number' && Number.isInteger(s.reps) && s.reps > 0 && s.reps <= 100;
    });
    if (!sets.length) continue;
    const muscle = normalizeMuscle(r.category); if (!muscle) continue;
    const entry = days.get(r.date) ?? { id: `legacy-${r.date}`, date: r.date, muscleGroups: [], completedSets: 0, source: 'legacy_member_report' as const };
    if (!entry.muscleGroups.includes(muscle)) entry.muscleGroups.push(muscle);
    entry.completedSets += sets.length; days.set(r.date, entry);
  }
  return [...days.values()].sort((a, b) => b.date.localeCompare(a.date));
}
export function summarizeHistory(sessions: TrainingSession[], legacyDays: LegacyTrainingDay[], account: string, now: number, timezone: string, truncated = false): HistorySummary {
  const result = emptySummary(), today = localDay(now, timezone), seen = new Set<string>(), canonicalGroupsByDay = new Map<string, Set<MuscleGroup>>();
  result.truncated = truncated;
  const addGroups = (groups: MuscleGroup[], when: string, age: number) => {
    for (const g of new Set(groups)) {
      if (!MUSCLE_GROUPS.includes(g)) continue;
      if (age < 7) result.muscleFrequency7Days[g]++;
      if (age < 14) result.muscleFrequency14Days[g]++;
      if (!result.lastTrainedAt[g] || when > result.lastTrainedAt[g]!) result.lastTrainedAt[g] = when;
    }
  };
  for (const s of [...sessions].sort((a, b) => b.performedAt.localeCompare(a.performedAt))) {
    if (s.uid !== account || !s.confirmed || !['completed', 'partial'].includes(s.status) || s.source !== 'shine_training_v1' || seen.has(s.id)) continue;
    const timestamp = Date.parse(s.performedAt);
    if (!Number.isFinite(timestamp) || timestamp > now || timestamp < now - 90 * DAY_MS) continue;
    const completed = s.exercises.filter(e => !e.skipped && e.sets.length > 0);
    if (!completed.length) continue;
    seen.add(s.id);
    const age = dayAge(localDay(timestamp, timezone), today);
    if (age < 7) result.sessionsLast7Days++;
    if (age < 14) {
      result.sessionsLast14Days++;
      result.confirmedSetCount14Days += completed.reduce((n, e) => n + e.sets.length, 0);
    }
    if (!result.lastWorkoutAt || s.performedAt > result.lastWorkoutAt) result.lastWorkoutAt = s.performedAt;
    addGroups(completed.flatMap(e => e.muscleGroups), s.performedAt, age);
    const localDate = localDay(timestamp, timezone), existing = canonicalGroupsByDay.get(localDate) ?? new Set<MuscleGroup>();
    completed.flatMap(e => e.muscleGroups).forEach(g => existing.add(g)); canonicalGroupsByDay.set(localDate, existing);
    for (const e of completed) {
      if (e.exerciseId && !result.latestPerformance[e.exerciseId]) result.latestPerformance[e.exerciseId] = { performedAt: s.performedAt, sets: e.sets };
    }
  }
  for (const day of legacyDays) {
    const age = dayAge(day.date, today); if (age < 0 || age >= 90) continue;
    if (age < 14) result.legacyTrainingDays14++;
    // Avoid counting the same date/group again when members also use the old manual log.
    addGroups(day.muscleGroups.filter(g => !canonicalGroupsByDay.get(day.date)?.has(g)), day.date, age);
    if (!result.lastWorkoutAt || day.date > result.lastWorkoutAt.slice(0, 10)) result.lastWorkoutAt = day.date;
  }
  if (legacyDays.length) result.warnings.push('legacy_self_reported_days_not_sessions');
  if (!seen.size && !legacyDays.length) result.warnings.push('no_confirmed_history');
  if (truncated) result.warnings.push('history_truncated_no_absence_inference');
  return result;
}
export function summarizeProgress(rows: RecordObject[], account: string, now: number, timezone: string): { points: ProgressPoint[]; changeKg: number | null; explanation: string } {
  const today = localDay(now, timezone), days = new Map<string, ProgressPoint>();
  // Keep the most recent dated report per day; stable ID breaks timestamp ties.
  const ranked = [...rows].sort((a, b) => {
    const stamp = (r: RecordObject) => { const t = Date.parse(String(r.reportedAt ?? r.createdAt ?? '')); return Number.isFinite(t) && t <= now ? t : 0; };
    return stamp(a) - stamp(b) || String(a.id ?? '').localeCompare(String(b.id ?? ''));
  });
  for (const r of ranked) {
    if (!owns(r, account) || r.SAMPLE_DATA_ONLY === true || !validDay(r.date) || dayAge(r.date, today) < 0 || dayAge(r.date, today) >= 90) continue;
    if (typeof r.weightKg !== 'number' || !Number.isFinite(r.weightKg) || r.weightKg < 25 || r.weightKg > 350) continue;
    days.set(r.date, { date: r.date, weightKg: r.weightKg, source: r.source === 'profile' ? 'profile' : 'member_progress' });
  }
  const points = [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
  const enough = points.length >= 3 && dayAge(points[0].date, points.at(-1)!.date) >= 7;
  return { points, changeKg: enough ? Math.round((points.at(-1)!.weightKg - points[0].weightKg) * 10) / 10 : null,
    explanation: enough ? 'observed_change_only_not_health_assessment' : 'need_three_dated_measurements_over_seven_days' };
}
