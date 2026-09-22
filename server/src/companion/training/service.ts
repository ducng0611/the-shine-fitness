import { randomUUID } from 'node:crypto';
import type { AdaptivePlan, CatalogueSnapshot, CompletionInput, Readiness, RecordObject, TrainingContext, TrainingProfile, TrainingSession, PlanningResult } from '../../../../shared/training';
import type { TrainingStore, TrainingTransaction } from './store';
import { completionInput, exactKeys, fail, hash, id, localDay, number, object, owns, profileInput, readinessInput, uid } from './validation';
import { DAY_MS, emptySummary, normalizeLegacy, summarizeHistory, summarizeProgress } from './context';
import { catalogueRevision, makePlan, verified } from './planner';

const ROOT = 'training_members';
const LIMIT = 500;
const plain = <T>(v: T): RecordObject => JSON.parse(JSON.stringify(v)) as RecordObject;
interface RootRecord extends RecordObject {
  state: 'active' | 'deleting' | 'deleted';
  profile: TrainingProfile | null;
  profileRevision: number;
  historyRevision: number;
  readiness: Readiness | null;
}
export class TrainingService {
  constructor(public readonly store: TrainingStore, private readonly clock: () => number = Date.now) {}
  root(account: string): string { return `${ROOT}/${uid(account)}`; }
  private async active(account: string, tx?: TrainingTransaction): Promise<RootRecord> {
    const raw = await (tx ?? this.store).get(this.root(account));
    if (!raw?.profile) fail('profile_required', 'Complete your training profile first.', 409);
    if (raw.state !== 'active') fail('profile_inactive', 'Training data is inactive or being removed.', 409);
    const root = raw as RootRecord;
    if (root.profile?.uid !== account) fail('identity_mismatch', 'Training profile ownership is invalid.', 403);
    return root;
  }
  async saveProfile(account: string, raw: unknown): Promise<TrainingProfile> {
    const body = object(raw); exactKeys(body, ['profile', 'expectedRevision']);
    const input = profileInput(body.profile), expected = number(body.expectedRevision, 'profile revision', 0, 1e9, true), now = new Date(this.clock()).toISOString();
    return this.store.atomic(async tx => {
      const existing = await tx.get(this.root(account)) as RootRecord | null;
      if (existing?.state === 'deleting') fail('deletion_in_progress', 'Wait for data removal to finish.', 409);
      const current = existing?.profileRevision ?? 0;
      if (current !== expected) fail('profile_revision_conflict', 'Your profile changed. Reload before saving.', 409);
      const profile: TrainingProfile = { ...input, uid: account, revision: current + 1, consentVersion: 'training-v1',
        createdAt: existing?.profile?.createdAt ?? now, updatedAt: now };
      tx.set(this.root(account), plain({ state: 'active', profile, profileRevision: profile.revision,
        historyRevision: existing?.historyRevision ?? 0, readiness: null }));
      if (profile.weightKg !== null && existing?.profile?.weightKg !== profile.weightKg) {
        tx.set(`${this.root(account)}/measurements/${profile.revision}`, { uid: account, date: localDay(now, profile.timezone), weightKg: profile.weightKg, reportedAt: now, source: 'profile' });
      }
      return profile;
    });
  }
  async saveReadiness(account: string, raw: unknown): Promise<Readiness> {
    const body = object(raw); exactKeys(body, ['readiness', 'expectedProfileRevision']);
    const input = readinessInput(body.readiness), expected = number(body.expectedProfileRevision, 'profile revision', 1, 1e9, true);
    const now = this.clock();
    const result: Readiness = { ...input, id: randomUUID(), profileRevision: expected,
      reportedAt: new Date(now).toISOString(), expiresAt: new Date(now + 2 * 60 * 60_000).toISOString() };
    return this.store.atomic(async tx => {
      const root = await this.active(account, tx);
      if (root.profileRevision !== expected) fail('profile_revision_conflict', 'Reload your profile before confirming readiness.', 409);
      tx.set(this.root(account), plain({ ...root, readiness: result })); return result;
    });
  }
  async context(account: string): Promise<TrainingContext & { readiness: Readiness | null; openPlans: AdaptivePlan[]; profileRevision: number }> {
    const root = await this.store.get(this.root(account)) as RootRecord | null;
    if (root?.state === 'deleting') fail('deletion_in_progress', 'Data removal is in progress.', 409);
    if (!root?.profile || root.state !== 'active') return { profile: null, profileRevision: root?.profileRevision ?? 0, historyRevision: root?.historyRevision ?? 0,
      readiness: null, openPlans: [], summary: emptySummary(), recentSessions: [], legacyDays: [], progress: { points: [], changeKg: null, explanation: 'profile_required' }, warnings: [] };
    if (root.profile.uid !== account) fail('identity_mismatch', 'Invalid profile ownership.', 403);
    const now = this.clock(), cutoff = new Date(now - 90 * DAY_MS).toISOString(), cutoffDay = localDay(now - 90 * DAY_MS, root.profile.timezone);
    const ownerRecords = async (collection: string) => {
      const lists = await Promise.all(['userId', 'uid'].map(field => this.store.list(collection, {
        filters: [{ field, op: '==', value: account }, { field: 'date', op: '>=', value: cutoffDay }],
        order: { field: 'date', direction: 'desc' }, limit: LIMIT + 1
      })));
      return { rows: [...new Map(lists.flat().filter(r => owns(r, account)).map(r => [r.id, r])).values()], truncated: lists.some(l => l.length > LIMIT), unavailable: false };
    };
    const [rows, legacy, progress, planRows, measurements] = await Promise.all([
      this.store.list(`${this.root(account)}/sessions`, { filters: [{ field: 'performedAt', op: '>=', value: cutoff }], order: { field: 'performedAt', direction: 'desc' }, limit: LIMIT + 1 }),
      root.profile.includeLegacyHistory ? ownerRecords('workout_logs').catch(() => ({ rows: [], truncated: true, unavailable: true })) : Promise.resolve({ rows: [], truncated: false, unavailable: false }),
      ownerRecords('member_progress').catch(() => ({ rows: [], truncated: true, unavailable: true })),
      this.store.list(`${this.root(account)}/plans`, { order: { field: 'generatedAt', direction: 'desc' }, limit: 20 }),
      this.store.list(`${this.root(account)}/measurements`, { filters: [{ field: 'date', op: '>=', value: cutoffDay }], order: { field: 'date', direction: 'desc' }, limit: LIMIT + 1 })
    ]);
    const sessions = rows.slice(0, LIMIT).filter(r => r.uid === account && r.confirmed === true && ['completed', 'partial'].includes(String(r.status))) as unknown as TrainingSession[];
    const legacyDays = normalizeLegacy(legacy.rows, account, now, root.profile.timezone);
    const summary = summarizeHistory(sessions, legacyDays, account, now, root.profile.timezone, rows.length > LIMIT || legacy.truncated);
    return { profile: root.profile, profileRevision: root.profileRevision, historyRevision: root.historyRevision, readiness: root.readiness,
      openPlans: planRows.filter(r => r.uid === account && ['proposed', 'started'].includes(String(r.status))) as unknown as AdaptivePlan[],
      summary, legacyDays: legacyDays.filter(d => d.date >= localDay(now - 14 * DAY_MS, root.profile!.timezone)),
      recentSessions: sessions.filter(s => Date.parse(s.performedAt) >= now - 14 * DAY_MS && Date.parse(s.performedAt) <= now),
      progress: summarizeProgress([...progress.rows, ...measurements], account, now, root.profile.timezone),
      warnings: [...summary.warnings, ...(progress.truncated || measurements.length > LIMIT ? ['progress_truncated'] : []), ...(legacy.unavailable ? ['legacy_source_unavailable'] : []), ...(progress.unavailable ? ['legacy_progress_unavailable'] : []), ...(!root.profile.includeLegacyHistory ? ['legacy_history_not_enabled'] : [])] };
  }
  async catalogue(): Promise<CatalogueSnapshot> {
    // Deliberately bypass the legacy local-file fallback: it can be stale or synthetic.
    const [zones, equipment, exercises] = await Promise.all(['gym_zones', 'gym_equipment', 'gym_exercises'].map(c => this.store.list(c, { limit: 1001 })));
    if ([zones, equipment, exercises].some(r => r.length > 1000)) fail('catalogue_limit', 'Catalogue requires paginated review before planning.', 503);
    const data = { zones, equipment, exercises };
    return { ...data, revision: catalogueRevision(data), fetchedAt: new Date(this.clock()).toISOString(), availability: 'available' };
  }
  private async validatePlanCatalogue(plan: AdaptivePlan, tx: TrainingTransaction) {
    for (const ex of plan.exercises) {
      const current = await tx.get(`gym_exercises/${id(ex.exerciseId)}`);
      if (!verified(current ?? undefined) || current!.revision !== ex.evidence.exerciseRevision) fail('catalogue_changed', 'Reviewed exercise data changed. Generate a new plan.', 409);
      for (const location of ex.locations) {
        const [station, zone] = await Promise.all([tx.get(`gym_equipment/${id(location.stationId)}`), tx.get(`gym_zones/${id(location.zoneId)}`)]);
        if (!verified(station ?? undefined) || !verified(zone ?? undefined) || station!.zoneId !== location.zoneId || station!.revision !== ex.evidence.equipmentRevisions[location.stationId] || station!.operationalStatus !== 'operational' || station!.isFunctional !== true) fail('equipment_changed', 'Equipment or location changed. Generate a new plan.', 409);
        const directions = [zone!.directionsFromReception, station!.directions, station!.landmark].filter(x => typeof x === 'string' && !!x.trim()).join(' | ');
        if (directions !== location.directions || zone!.name !== location.zoneName) fail('location_changed', 'Directions changed. Generate a new plan.', 409);
      }
    }
  }
  async plan(account: string, raw: unknown): Promise<PlanningResult> {
    const b = object(raw); exactKeys(b, ['readinessId', 'requestId', 'gymOnly']);
    const readinessId = id(b.readinessId), requestId = id(b.requestId);
    if (typeof b.gymOnly !== 'boolean') fail('invalid_input', 'gymOnly must be explicit.');
    const planId = hash({ account, requestId }), requestHash = hash({ readinessId, gymOnly: b.gymOnly });
    const path = `${this.root(account)}/plans/${planId}`;
    const existing = await this.store.get(path) as unknown as AdaptivePlan | null;
    if (existing) {
      await this.active(account);
      if (existing.requestHash !== requestHash) fail('idempotency_conflict', 'This request ID was already used with different inputs.', 409);
      return { status: 'ready', plan: existing };
    }
    const context = await this.context(account);
    if (!context.profile) return { status: 'needs_input', code: 'profile_required', message: 'Complete your training profile.' };
    if (context.readiness?.id !== readinessId) return { status: 'needs_input', code: 'readiness_stale', message: 'Confirm your current readiness again.' };
    const catalogue = await this.catalogue();
    const result = makePlan(context, context.readiness, catalogue, this.clock(), planId, requestHash);
    if (result.status !== 'ready') return result;
    if (b.gymOnly && result.plan.mode !== 'gym_grounded') return { status: 'insufficient_verified_gym_data', code: 'no_reviewed_executable_plan', message: 'There is not enough reviewed equipment, exercise and prescription data for this request.' };
    return this.store.atomic(async tx => {
      const root = await this.active(account, tx), prior = await tx.get(path) as unknown as AdaptivePlan | null;
      if (prior) {
        if (prior.requestHash !== requestHash) fail('idempotency_conflict', 'Request ID conflict.', 409);
        return { status: 'ready' as const, plan: prior };
      }
      if (root.profileRevision !== result.plan.profileRevision || root.historyRevision !== result.plan.historyRevision || root.readiness?.id !== readinessId) fail('context_changed', 'Your context changed. Reload and generate again.', 409);
      if (!root.readiness || Date.parse(root.readiness.expiresAt) <= this.clock()) fail('readiness_stale', 'Readiness expired. Confirm your current state again.', 409);
      await this.validatePlanCatalogue(result.plan, tx);
      tx.set(path, plain(result.plan)); return result;
    });
  }
  async getPlan(account: string, planId: string): Promise<AdaptivePlan> {
    await this.active(account);
    const plan = await this.store.get(`${this.root(account)}/plans/${id(planId)}`) as unknown as AdaptivePlan | null;
    if (!plan || plan.uid !== account) fail('plan_not_found', 'Plan not found.', 404);
    return plan;
  }
  async start(account: string, planId: string, confirmed: unknown): Promise<AdaptivePlan> {
    if (confirmed !== true) fail('confirmation_required', 'Confirm you are starting this session.');
    const path = `${this.root(account)}/plans/${id(planId)}`, now = this.clock();
    return this.store.atomic(async tx => {
      const root = await this.active(account, tx), plan = await tx.get(path) as unknown as AdaptivePlan | null;
      if (!plan || plan.uid !== account) fail('plan_not_found', 'Plan not found.', 404);
      if (plan.status === 'started') return plan;
      if (plan.status !== 'proposed') fail('plan_not_startable', 'This plan cannot be started.', 409);
      if (Date.parse(plan.expiresAt) <= now || plan.profileRevision !== root.profileRevision || plan.historyRevision !== root.historyRevision || plan.readinessId !== root.readiness?.id) fail('context_changed', 'The plan or readiness is stale. Generate a new plan.', 409);
      if (root.profile!.healthReviewNeeded || root.readiness.currentPain || root.readiness.energy === 1) fail('professional_review_required', 'Automatic planning is paused.', 409);
      await this.validatePlanCatalogue(plan, tx);
      const next: AdaptivePlan = { ...plan, status: 'started', startedAt: new Date(now).toISOString() };
      tx.set(path, plain(next)); return next;
    });
  }
  async cancel(account: string, planId: string): Promise<void> {
    const path = `${this.root(account)}/plans/${id(planId)}`;
    await this.store.atomic(async tx => {
      await this.active(account, tx); const plan = await tx.get(path) as unknown as AdaptivePlan | null;
      if (!plan || plan.uid !== account) fail('plan_not_found', 'Plan not found.', 404);
      if (['completed', 'partial'].includes(plan.status)) fail('already_recorded', 'Delete the session record instead.', 409);
      tx.set(path, plain({ ...plan, status: 'cancelled' }));
    });
  }
  async complete(account: string, planId: string, raw: unknown): Promise<{ session: TrainingSession; replay: boolean }> {
    const input = completionInput(raw), sessionId = id(planId), now = this.clock();
    // UI revision/acknowledgment are concurrency controls, not workout facts.
    const { expectedHistoryRevision: _h, acknowledgeProfileChange: _a, ...facts } = input;
    const requestHash = hash(facts), path = `${this.root(account)}/sessions/${sessionId}`, planPath = `${this.root(account)}/plans/${sessionId}`;
    return this.store.atomic(async tx => {
      const root = await this.active(account, tx), prior = await tx.get(path) as unknown as TrainingSession | null;
      const plan = await tx.get(planPath) as unknown as AdaptivePlan | null;
      if (prior) {
        if (prior.status === 'deleted') fail('session_deleted', 'This session was deleted and cannot be recreated by retry.', 409);
        if (prior.requestHash !== requestHash) fail('completion_conflict', 'This plan already has a different completion record.', 409);
        return { session: prior, replay: true };
      }
      if (!plan || plan.uid !== account) fail('plan_not_found', 'Plan not found.', 404);
      if (plan.status !== 'started' || !plan.startedAt) fail('start_required', 'Start the session before recording its completion.', 409);
      if (input.expectedHistoryRevision !== root.historyRevision) fail('history_changed', 'Your history changed. Reload before recording.', 409);
      if (plan.profileRevision !== root.profileRevision && !input.acknowledgeProfileChange) fail('profile_changed', 'Your profile changed. Confirm that you are recording actual past performance.', 409);
      if (Date.parse(input.performedAt) > now || Date.parse(input.performedAt) < Date.parse(plan.startedAt) - 5 * 60_000 || Date.parse(input.performedAt) < now - 90 * DAY_MS) fail('invalid_performed_time', 'Workout time must be after session start and not in the future.');
      const exercises = this.normalizeActual(plan, input);
      const status = plan.kind === 'exercises' && !plan.exercises.every(p => exercises.some(e => e.exerciseId === p.exerciseId && !e.skipped && e.sets.length >= p.sets)) ? 'partial' : 'completed';
      const session: TrainingSession = { id: sessionId, uid: account, planId: plan.id, status, mode: plan.mode, confirmed: true,
        performedAt: input.performedAt, recordedAt: new Date(now).toISOString(), localDate: localDay(input.performedAt, root.profile!.timezone),
        actualMinutes: input.actualMinutes, exercises, notes: input.notes, profileRevisionAtPlanning: plan.profileRevision,
        profileRevisionAtCompletion: root.profileRevision, historyRevisionAtPlanning: plan.historyRevision, source: 'shine_training_v1', requestHash };
      // The catalogue is NOT revalidated here: logging what already happened is not a recommendation.
      tx.set(path, plain(session));
      tx.set(planPath, plain({ ...plan, status }));
      tx.set(this.root(account), plain({ ...root, historyRevision: root.historyRevision + 1, readiness: null }));
      return { session, replay: false };
    });
  }
  private normalizeActual(plan: AdaptivePlan, input: CompletionInput) {
    const seen = new Set<string>();
    return input.exercises.map(e => {
      const key = e.exerciseId ?? e.name.toLowerCase();
      if (seen.has(key)) fail('duplicate_exercise', 'An exercise was entered twice.'); seen.add(key);
      if (plan.kind === 'structure_only') {
        if (e.exerciseId !== null) fail('unverified_exercise_reference', 'General self-reports must not claim verified exercise IDs.');
        if (!e.skipped && !e.muscleGroups.length) fail('muscle_group_required', 'Select the groups you actually trained.');
        return e;
      }
      const planned = plan.exercises.find(p => p.exerciseId === e.exerciseId);
      if (!planned) fail('exercise_not_in_plan', 'Only exercises from this plan can be recorded here.');
      return { ...e, name: planned.name, muscleGroups: [...new Set([...planned.primaryMuscles, ...planned.secondaryMuscles])] };
    });
  }
  async deleteSession(account: string, sessionId: string, confirmed: unknown): Promise<void> {
    if (confirmed !== true) fail('confirmation_required', 'Confirm session deletion.');
    const path = `${this.root(account)}/sessions/${id(sessionId)}`;
    await this.store.atomic(async tx => {
      const root = await this.active(account, tx), session = await tx.get(path);
      if (!session || session.uid !== account) fail('session_not_found', 'Session not found.', 404);
      if (session.status === 'deleted') return;
      // Minimal tombstone prevents late network retries from resurrecting a removed workout.
      tx.set(path, { id: sessionId, uid: account, status: 'deleted', performedAt: session.performedAt, recordedAt: new Date(this.clock()).toISOString() });
      tx.set(this.root(account), plain({ ...root, historyRevision: root.historyRevision + 1, readiness: null }));
    });
  }
  async removeData(account: string, confirmed: unknown): Promise<void> {
    if (confirmed !== true) fail('confirmation_required', 'Confirm removal of your Step 3 training data.');
    const deletionId = await this.store.atomic(async tx => {
      const root = await tx.get(this.root(account));
      if (!root || root.state === 'deleted') return null;
      const token = root.state === 'deleting' && typeof root.deletionId === 'string' ? root.deletionId : randomUUID();
      tx.set(this.root(account), { ...root, state: 'deleting', deletionId: token });
      return token;
    });
    if (!deletionId) return;
    for (const collection of ['plans', 'sessions', 'measurements']) {
      for (;;) {
        const rows = await this.store.list(`${this.root(account)}/${collection}`, { limit: 100 });
        if (!rows.length) break;
        const done = await this.store.atomic(async tx => {
          const root = await tx.get(this.root(account));
          if (root?.state === 'deleted' && root.deletionId === deletionId) return true;
          if (root?.state !== 'deleting' || root.deletionId !== deletionId) fail('deletion_conflict', 'Data removal state changed.', 409);
          for (const r of rows) tx.delete(`${this.root(account)}/${collection}/${id(r.id)}`);
          return false;
        });
        if (done) return;
      }
    }
    await this.store.atomic(async tx => {
      const root = await tx.get(this.root(account));
      if (root?.state === 'deleted' && root.deletionId === deletionId) return;
      if (root?.state !== 'deleting' || root.deletionId !== deletionId) fail('deletion_conflict', 'Data removal state changed.', 409);
      tx.set(this.root(account), { state: 'deleted', deletionId, profile: null, readiness: null, profileRevision: (Number(root.profileRevision) || 0) + 1, historyRevision: (Number(root.historyRevision) || 0) + 1 });
    });
  }
}
