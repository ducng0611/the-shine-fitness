import { createHash } from 'node:crypto';
import { EXPERIENCE_LEVELS, MUSCLE_GROUPS, TRAINING_GOALS } from '../../../../shared/training';
import type { ActualExercise, CompletionInput, MuscleGroup, ReadinessInput, RecordObject, TrainingProfileInput } from '../../../../shared/training';

export class TrainingError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export function fail(code: string, message: string, status = 400): never { throw new TrainingError(status, code, message); }
export function object(value: unknown): RecordObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('invalid_input', 'Expected an object.');
  return value as RecordObject;
}
export function exactKeys(value: RecordObject, allowed: readonly string[]) {
  const extra = Object.keys(value).filter(k => !allowed.includes(k));
  if (extra.length) fail('unknown_fields', `Unsupported fields: ${extra.join(', ')}`);
}
export function text(value: unknown, name: string, max: number, allowEmpty = false): string {
  if (typeof value !== 'string' || value.trim().length > max || (!allowEmpty && !value.trim())) fail('invalid_input', `${name} is invalid.`);
  return (value as string).trim();
}
export function number(value: unknown, name: string, min: number, max: number, integer = false): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) fail('invalid_input', `${name} must be ${integer ? 'an integer' : 'a number'} between ${min} and ${max}.`);
  return value as number;
}
export function boolean(value: unknown, name: string): boolean {
  if (typeof value !== 'boolean') fail('needs_input', `Please explicitly answer ${name}.`);
  return value as boolean;
}
export function oneOf<T extends string>(value: unknown, allowed: readonly T[], name: string): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) fail('invalid_input', `${name} is invalid.`);
  return value as T;
}
export function id(value: unknown): string {
  const v = text(value, 'ID', 128);
  if (!/^[a-zA-Z0-9_-]+$/.test(v)) fail('invalid_id', 'Invalid identifier.');
  return v;
}
export function uid(value: unknown): string {
  const v = text(value, 'Account identity', 128);
  if (v.includes('/') || v === '.' || v === '..') fail('invalid_identity', 'Invalid account identity.', 401);
  return v;
}
export function strings(value: unknown, name: string, maxItems: number, maxLength = 128): string[] {
  if (!Array.isArray(value) || value.length > maxItems) fail('invalid_input', `${name} must be a bounded list.`);
  const result = (value as unknown[]).map(v => text(v, name, maxLength));
  if (new Set(result).size !== result.length) fail('invalid_input', `${name} contains duplicates.`);
  return result;
}
export function groups(value: unknown): MuscleGroup[] {
  return strings(value, 'muscle groups', MUSCLE_GROUPS.length).map(v => oneOf(v, MUSCLE_GROUPS, 'muscle group'));
}
export function iso(value: unknown, name = 'time'): string {
  const v = text(value, name, 35);
  if (!/^\d{4}-\d{2}-\d{2}T/.test(v) || !Number.isFinite(Date.parse(v))) fail('invalid_input', `${name} must be an ISO timestamp.`);
  return new Date(v).toISOString();
}
export function localDay(time: string | number, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(time));
  const get = (type: string) => parts.find(p => p.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function owns(data: RecordObject, account: string): boolean {
  const identities = [data.uid, data.userId].filter(v => v !== undefined && v !== null && v !== '');
  return identities.length > 0 && identities.every(v => v === account);
}
export function profileInput(raw: unknown): TrainingProfileInput {
  const p = object(raw);
  exactKeys(p, ['nickname', 'age', 'adultConfirmed', 'consent', 'goal', 'experience', 'preferredMinutes', 'timezone', 'heightCm', 'weightKg', 'preferences', 'avoidedExerciseIds', 'healthReviewNeeded', 'includeLegacyHistory', 'style']);
  if (!boolean(p.consent, 'data processing consent')) fail('consent_required', 'Consent is required to save a training profile.');
  if (!boolean(p.adultConfirmed, 'adult confirmation')) fail('adult_confirmation_required', 'This pilot is for adults only.');
  const age = number(p.age, 'age', 18, 100, true);
  const timezone = text(p.timezone, 'timezone', 80);
  try { localDay(Date.now(), timezone); } catch { fail('invalid_timezone', 'Use a valid IANA timezone.'); }
  return {
    nickname: text(p.nickname, 'nickname', 60), age, adultConfirmed: true, consent: true,
    goal: oneOf(p.goal, TRAINING_GOALS, 'goal'), experience: oneOf(p.experience, EXPERIENCE_LEVELS, 'experience'),
    preferredMinutes: number(p.preferredMinutes, 'preferredMinutes', 10, 120, true), timezone,
    heightCm: p.heightCm === null ? null : number(p.heightCm, 'heightCm', 100, 250),
    weightKg: p.weightKg === null ? null : number(p.weightKg, 'weightKg', 25, 350),
    preferences: groups(p.preferences), avoidedExerciseIds: strings(p.avoidedExerciseIds, 'avoided exercises', 40).map(id),
    healthReviewNeeded: boolean(p.healthReviewNeeded, 'need for professional review'),
    includeLegacyHistory: boolean(p.includeLegacyHistory, 'use of legacy workout records'),
    style: oneOf(p.style, ['gentle', 'energetic', 'direct'] as const, 'style')
  };
}
export function readinessInput(raw: unknown): ReadinessInput {
  const r = object(raw);
  exactKeys(r, ['confirmed', 'availableMinutes', 'energy', 'currentPain', 'soreness', 'desiredMuscles', 'blockedEquipmentIds']);
  if (!boolean(r.confirmed, 'readiness confirmation')) fail('readiness_required', 'Confirm your current state before planning.');
  return { confirmed: true, availableMinutes: number(r.availableMinutes, 'availableMinutes', 10, 120, true),
    energy: number(r.energy, 'energy', 1, 5, true), currentPain: boolean(r.currentPain, 'current pain'),
    soreness: groups(r.soreness), desiredMuscles: groups(r.desiredMuscles),
    blockedEquipmentIds: strings(r.blockedEquipmentIds, 'unavailable equipment', 50).map(id) };
}
export function completionInput(raw: unknown): CompletionInput {
  const r = object(raw);
  exactKeys(r, ['confirmed', 'performedAt', 'actualMinutes', 'exercises', 'notes', 'expectedHistoryRevision', 'acknowledgeProfileChange']);
  if (!boolean(r.confirmed, 'workout completion')) fail('confirmation_required', 'Only confirmed actual performance can be recorded.');
  if (!Array.isArray(r.exercises) || r.exercises.length < 1 || r.exercises.length > 12) fail('invalid_input', 'Enter 1 to 12 actual exercises.');
  const exercises: ActualExercise[] = r.exercises.map(rawExercise => {
    const e = object(rawExercise);
    exactKeys(e, ['exerciseId', 'name', 'muscleGroups', 'sets', 'skipped']);
    const skipped = boolean(e.skipped, 'exercise skipped');
    if (!Array.isArray(e.sets) || e.sets.length > 10 || (!skipped && e.sets.length === 0) || (skipped && e.sets.length > 0)) fail('invalid_sets', 'Enter actual sets, or mark the exercise skipped without sets.');
    return { exerciseId: e.exerciseId === null ? null : id(e.exerciseId), name: text(e.name, 'exercise name', 120),
      muscleGroups: groups(e.muscleGroups), skipped,
      sets: e.sets.map(rawSet => {
        const s = object(rawSet); exactKeys(s, ['reps', 'loadKg', 'rpe']);
        return { reps: number(s.reps, 'reps', 1, 100, true), loadKg: s.loadKg === null ? null : number(s.loadKg, 'loadKg', 0, 500),
          rpe: s.rpe === null ? null : number(s.rpe, 'RPE', 1, 10) };
      }) };
  });
  if (!exercises.some(e => !e.skipped && e.sets.length)) fail('no_actual_performance', 'No completed sets were entered. Cancel the plan instead.');
  return { confirmed: true, performedAt: iso(r.performedAt), actualMinutes: number(r.actualMinutes, 'actualMinutes', 1, 240), exercises,
    notes: text(r.notes, 'notes', 600, true), expectedHistoryRevision: number(r.expectedHistoryRevision, 'history revision', 0, 1e9, true),
    acknowledgeProfileChange: boolean(r.acknowledgeProfileChange, 'profile change acknowledgment') };
}
export function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${stable((value as RecordObject)[k])}`).join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}
export function hash(value: unknown): string { return createHash('sha256').update(stable(value)).digest('hex'); }
