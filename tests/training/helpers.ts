/** SYNTHETIC TEST DATA ONLY. This module is never imported by the application. */
import type { RecordObject, TrainingProfileInput, ReadinessInput, TrainingProfile, Readiness, CatalogueSnapshot, TrainingContext, TrainingSession, CompletionInput } from '../../shared/training';
import { TRAINING_GOALS } from '../../shared/training';
import type { QuerySpec, TrainingStore, TrainingTransaction } from '../../server/src/companion/training/store';
import { emptySummary } from '../../server/src/companion/training/context';
import { catalogueRevision } from '../../server/src/companion/training/planner';
import { TrainingService } from '../../server/src/companion/training/service';
export const NOW = Date.parse('2026-09-22T05:00:00.000Z');
export const ISO = new Date(NOW).toISOString();
export const clone = <T>(v: T): T => structuredClone(v);
export class MemoryStore implements TrainingStore {
  readonly records = new Map<string, RecordObject>();
  private queue: Promise<unknown> = Promise.resolve();
  failReads = false;
  seed(path: string, data: unknown) { this.records.set(path, clone(data as RecordObject)); }
  async get(path: string): Promise<(RecordObject & { id: string }) | null> { if (this.failReads) throw new Error('synthetic storage failure'); const data = this.records.get(path); return data ? clone({ ...data, id: path.split('/').at(-1)! }) : null; }
  async list(path: string, spec: QuerySpec) {
    if (this.failReads) throw new Error('synthetic storage failure');
    let rows: (RecordObject & { id: string })[] = [...this.records].filter(([key]) => key.startsWith(`${path}/`) && key.split('/').length === path.split('/').length + 1).map(([key, value]) => clone({ ...value, id: key.split('/').at(-1)! }));
    for (const f of spec.filters ?? []) rows = rows.filter(r => f.field in r && (f.op === '==' ? r[f.field] === f.value : f.op === '>=' ? (r[f.field] as string) >= (f.value as string) : (r[f.field] as string) <= (f.value as string)));
    if (spec.order) { const { field, direction } = spec.order; rows = rows.filter(r => field in r).sort((a, b) => (String(a[field]).localeCompare(String(b[field])) || a.id.localeCompare(b.id)) * (direction === 'desc' ? -1 : 1)); }
    return rows.slice(0, spec.limit);
  }
  async atomic<T>(fn: (tx: TrainingTransaction) => Promise<T>): Promise<T> {
    const job = this.queue.then(async () => {
      const pending = new Map<string, RecordObject | null>();
      const result = await fn({
        get: async path => { if (pending.size) throw new Error('Transactions must read before writing'); return this.get(path); },
        set: (path, value) => pending.set(path, clone(value)), delete: path => pending.set(path, null)
      });
      for (const [key, value] of pending) value === null ? this.records.delete(key) : this.records.set(key, value);
      return result;
    });
    this.queue = job.catch(() => undefined); return job;
  }
}
export const profileInput = (patch: Partial<TrainingProfileInput> = {}): TrainingProfileInput => ({
  nickname: 'Synthetic member', age: 25, adultConfirmed: true, consent: true, goal: 'hypertrophy', experience: 'intermediate',
  preferredMinutes: 35, timezone: 'Asia/Ho_Chi_Minh', heightCm: null, weightKg: null, preferences: [], avoidedExerciseIds: [],
  healthReviewNeeded: false, includeLegacyHistory: false, style: 'gentle', ...patch
});
export const profile = (patch: Partial<TrainingProfile> = {}): TrainingProfile => ({ ...profileInput(), uid: 'member-a', revision: 1, consentVersion: 'training-v1', createdAt: ISO, updatedAt: ISO, ...patch });
export const readinessInput = (patch: Partial<ReadinessInput> = {}): ReadinessInput => ({ confirmed: true, availableMinutes: 35, energy: 4, currentPain: false, soreness: [], desiredMuscles: ['legs'], blockedEquipmentIds: [], ...patch });
export const readiness = (patch: Partial<Readiness> = {}): Readiness => ({ ...readinessInput(), id: 'readiness-test', profileRevision: 1, reportedAt: ISO, expiresAt: new Date(NOW + 7_200_000).toISOString(), ...patch });
export const context = (patch: Partial<TrainingContext> = {}): TrainingContext => ({ profile: profile(), historyRevision: 0, summary: emptySummary(), recentSessions: [], legacyDays: [], progress: { points: [], changeKg: null, explanation: 'test' }, warnings: [], ...patch });
export const approved = { verified: true, reviewStatus: 'verified', verifiedBy: 'synthetic-reviewer', verifiedAt: ISO, revision: 1 };
export function catalogue(): CatalogueSnapshot {
  const zones: RecordObject[] = [{ id: 'test-zone', name: 'SYNTHETIC ZONE', directionsFromReception: 'Synthetic fixture directions', ...approved }];
  const equipment: RecordObject[] = ['a','b','c'].map(s => ({ id: `test-station-${s}`, name: `SYNTHETIC STATION ${s}`, zoneId: 'test-zone', operationalStatus: 'operational', isFunctional: true, ...approved }));
  const exercises: RecordObject[] = ['a','b','c'].map(s => ({ id: `test-exercise-${s}`, name: `SYNTHETIC EXERCISE ${s}`, primaryMuscle: 'legs', category: 'legs', secondaryMuscles: [], requiredEquipmentIds: [`test-station-${s}`], difficulty: 'beginner', movementPattern: 'test', trainerCues: ['Synthetic test cue, not training guidance'], ...approved,
    trainingPrescription: { reviewed: true, reviewedBy: 'synthetic-reviewer', reviewedAt: ISO, reviewedAgainstRevision: 1, sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90, secondsPerRep: 4, setupSeconds: 30, goals: [...TRAINING_GOALS] } }));
  const data = { zones, equipment, exercises }; return { ...data, revision: catalogueRevision(data), fetchedAt: ISO, availability: 'available' };
}
export const noCatalogue = (): CatalogueSnapshot => ({ zones: [], equipment: [], exercises: [], revision: 'empty', fetchedAt: ISO, availability: 'available' });
export function seedCatalogue(store: MemoryStore, data = catalogue()) { for (const [collection, rows] of [['gym_zones',data.zones],['gym_equipment',data.equipment],['gym_exercises',data.exercises]] as const) for (const row of rows) store.seed(`${collection}/${row.id}`, row); }
export function session(patch: Partial<TrainingSession> = {}): TrainingSession {
  return { id: 'test-session', uid: 'member-a', planId: 'test-plan', status: 'completed', mode: 'personalized_general', confirmed: true,
    performedAt: new Date(NOW - 86_400_000).toISOString(), recordedAt: ISO, localDate: '2026-09-21', actualMinutes: 30,
    exercises: [{ exerciseId: null, name: 'Synthetic member report', muscleGroups: ['chest'], skipped: false, sets: [{ reps: 10, loadKg: 0, rpe: 7 }] }],
    notes: '', profileRevisionAtPlanning: 1, profileRevisionAtCompletion: 1, historyRevisionAtPlanning: 0, source: 'shine_training_v1', requestHash: 'test-hash', ...patch };
}
export async function setup(withCatalogue = false, account = 'member-a') {
  const store = new MemoryStore(); if (withCatalogue) seedCatalogue(store);
  let now = NOW; const clock = () => now, service = new TrainingService(store, clock);
  await service.saveProfile(account, { profile: profileInput(), expectedRevision: 0 });
  const ready = await service.saveReadiness(account, { readiness: readinessInput(), expectedProfileRevision: 1 });
  const result = await service.plan(account, { readinessId: ready.id, requestId: 'test-request', gymOnly: false });
  if (result.status !== 'ready') throw new Error('Test setup did not produce a plan.');
  const plan = await service.start(account, result.plan.id, true);
  const payload: CompletionInput = { confirmed: true, performedAt: ISO, actualMinutes: 30,
    exercises: [{ exerciseId: plan.exercises[0]?.exerciseId ?? null, name: 'Actual test exercise', muscleGroups: ['legs'], skipped: false, sets: [{ reps: 10, loadKg: null, rpe: null }] }],
    notes: '', expectedHistoryRevision: 0, acknowledgeProfileChange: false };
  return { store, clock, advance: (ms: number) => { now += ms; }, service, plan, payload, ready, account };
}
