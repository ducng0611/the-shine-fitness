import { MUSCLE_GROUPS, EXPERIENCE_LEVELS } from '../../../../shared/training';
import type { AdaptivePlan, CatalogueSnapshot, GroupScore, MuscleGroup, PlannedExercise, PlanningResult, Readiness, RecordObject, StructureBlock, TrainingContext } from '../../../../shared/training';
import { dayAge, normalizeMuscle } from './context';
import { hash, localDay } from './validation';

const record = (v: unknown): RecordObject => v && typeof v === 'object' && !Array.isArray(v) ? v as RecordObject : {};
const finite = (v: unknown, min: number, max: number, integer = false): v is number => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max && (!integer || Number.isInteger(v));
const list = (v: unknown): string[] => Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && !!x.trim()) : [];
const uniqueIds = (rows: RecordObject[]) => new Set(rows.map(r => r.id)).size === rows.length;
export function verified(r: RecordObject | undefined): boolean {
  return !!r && r.verified === true && r.reviewStatus === 'verified' && r.SAMPLE_DATA_ONLY !== true &&
    typeof r.verifiedBy === 'string' && !!r.verifiedBy.trim() && typeof r.verifiedAt === 'string' && Number.isFinite(Date.parse(r.verifiedAt)) &&
    finite(r.revision, 1, 1e9, true);
}
/** Score is a transparent pilot heuristic, NOT a recovery, injury or medical score. */
export function scoreMuscles(context: TrainingContext, readiness: Readiness, now: number): GroupScore[] {
  const profile = context.profile!, summary = context.summary, today = localDay(now, profile.timezone);
  const most = Math.max(...Object.values(summary.muscleFrequency14Days));
  return MUSCLE_GROUPS.map(muscleGroup => {
    const factors: GroupScore['factors'] = [];
    if (readiness.desiredMuscles.includes(muscleGroup)) factors.push({ code: 'explicit_request', points: 100 });
    if (profile.preferences.includes(muscleGroup)) factors.push({ code: 'stated_preference', points: 8 });
    const last = summary.lastTrainedAt[muscleGroup];
    if (last) {
      const age = dayAge(last.length === 10 ? last : localDay(last, profile.timezone), today);
      if (age >= 0 && age < 2) factors.push({ code: 'recent_training_signal_not_recovery', points: -25 });
    }
    if (!summary.truncated && most > 0) factors.push({ code: 'less_frequent_in_recorded_history', points: Math.min(20, (most - summary.muscleFrequency14Days[muscleGroup]) * 5) });
    const excluded = readiness.soreness.includes(muscleGroup);
    if (excluded) factors.push({ code: 'self_reported_soreness', points: -1000 });
    return { muscleGroup, factors, excluded, score: factors.reduce((n, f) => n + f.points, 0) };
  }).sort((a, b) => b.score - a.score || MUSCLE_GROUPS.indexOf(a.muscleGroup) - MUSCLE_GROUPS.indexOf(b.muscleGroup));
}
/** All requiredEquipmentIds are required, NOT interchangeable alternatives. */
export function catalogueCandidates(catalogue: CatalogueSnapshot, context: TrainingContext, readiness: Readiness): PlannedExercise[] {
  if (catalogue.availability !== 'available' || !uniqueIds(catalogue.zones) || !uniqueIds(catalogue.equipment) || !uniqueIds(catalogue.exercises)) return [];
  const profile = context.profile!, zones = new Map(catalogue.zones.map(z => [String(z.id), z]));
  const equipment = new Map(catalogue.equipment.map(e => [String(e.id), e]));
  const candidates: PlannedExercise[] = [];
  for (const ex of catalogue.exercises) {
    if (!verified(ex) || typeof ex.id !== 'string' || typeof ex.name !== 'string' || !ex.name.trim() || profile.avoidedExerciseIds.includes(ex.id)) continue;
    if (!EXPERIENCE_LEVELS.includes(ex.difficulty as never) || EXPERIENCE_LEVELS.indexOf(ex.difficulty as never) > EXPERIENCE_LEVELS.indexOf(profile.experience)) continue;
    const primary = [...new Set([normalizeMuscle(ex.primaryMuscle), normalizeMuscle(ex.category)].filter((g): g is MuscleGroup => g !== null))];
    const mappedSecondary = list(ex.secondaryMuscles).map(normalizeMuscle);
    if (mappedSecondary.some(g => g === null)) continue; // Unknown secondary involvement cannot bypass soreness screening.
    const secondary = [...new Set(mappedSecondary.filter((g): g is MuscleGroup => g !== null))];
    if (!primary.length || [...primary, ...secondary].some(g => readiness.soreness.includes(g))) continue;
    const stationIds = list(ex.requiredEquipmentIds);
    if (!stationIds.length || new Set(stationIds).size !== stationIds.length || stationIds.some(s => readiness.blockedEquipmentIds.includes(s))) continue;
    const stations = stationIds.map(s => equipment.get(s));
    if (stations.some(e => !verified(e) || e!.operationalStatus !== 'operational' || e!.isFunctional !== true || !verified(zones.get(String(e!.zoneId))))) continue;
    const locations = stations.map(e => {
      const z = zones.get(String(e!.zoneId))!;
      return { stationId: String(e!.id), stationName: String(e!.name ?? ''), zoneId: String(z.id), zoneName: String(z.name ?? ''),
        directions: [z.directionsFromReception, e!.directions, e!.landmark].filter(x => typeof x === 'string' && !!x.trim()).join(' | ') };
    });
    if (locations.some(l => !l.directions || !l.stationName || !l.zoneName)) continue;
    const cues = list(ex.trainerCues); if (!cues.length) continue;
    // Step 2 did not contain dosing. An explicit reviewed prescription is required;
    // missing dosing never turns into an AI-invented sets/reps recommendation.
    const p = record(ex.trainingPrescription);
    if (!Array.isArray(p.goals) || !p.goals.includes(profile.goal)) continue;
    if (p.reviewedAgainstRevision !== ex.revision || p.reviewed !== true || typeof p.reviewedBy !== 'string' || !p.reviewedBy || typeof p.reviewedAt !== 'string' || !Number.isFinite(Date.parse(p.reviewedAt))) continue;
    if (!finite(p.sets, 1, 5, true) || !finite(p.repsMin, 1, 30, true) || !finite(p.repsMax, 1, 30, true) || p.repsMin > p.repsMax ||
        !finite(p.restSeconds, 15, 300, true) || !finite(p.secondsPerRep, 1, 15) || !finite(p.setupSeconds, 0, 300, true)) continue;
    const sets = Math.max(1, p.sets - (profile.experience === 'beginner' ? 1 : 0) - (readiness.energy <= 2 ? 1 : 0));
    candidates.push({ exerciseId: ex.id, name: ex.name, primaryMuscles: primary, secondaryMuscles: secondary,
      movementPattern: typeof ex.movementPattern === 'string' ? ex.movementPattern : 'unspecified', stationIds, locations,
      sets, repRange: { min: p.repsMin, max: p.repsMax }, restSeconds: p.restSeconds, secondsPerRep: p.secondsPerRep,
      setupSeconds: p.setupSeconds, transitionSeconds: 0, estimatedSeconds: 0, trainerCues: cues,
      previousPerformance: context.summary.latestPerformance[ex.id] ?? null, programmingSource: 'reviewed_catalogue_prescription',
      evidence: { catalogueRevision: catalogue.revision, exerciseRevision: Number(ex.revision),
        equipmentRevisions: Object.fromEntries(stations.map(e => [String(e!.id), Number(e!.revision)])), reasons: ['reviewed_goal_compatible_prescription', 'reviewed_exercise', 'all_required_equipment_verified_operational', 'experience_compatible', 'no_reported_soreness_in_mapped_groups'] } });
  }
  return candidates;
}
export function exerciseSeconds(e: PlannedExercise): number {
  return e.setupSeconds + e.transitionSeconds + e.sets * e.repRange.max * e.secondsPerRep + Math.max(0, e.sets - 1) * e.restSeconds;
}
const STRUCTURES: Record<MuscleGroup, { pattern: string; intent: string }[]> = {
  legs: [{ pattern: 'squat_pattern', intent: 'lower_body_pattern_discussion' }, { pattern: 'hinge_pattern', intent: 'lower_body_pattern_discussion' }],
  chest: [{ pattern: 'horizontal_push', intent: 'upper_body_pattern_discussion' }], back: [{ pattern: 'horizontal_pull', intent: 'upper_body_pattern_discussion' }, { pattern: 'vertical_pull', intent: 'upper_body_pattern_discussion' }],
  shoulders: [{ pattern: 'shoulder_pattern', intent: 'upper_body_pattern_discussion' }], arms: [{ pattern: 'elbow_pattern', intent: 'upper_body_pattern_discussion' }], core: [{ pattern: 'trunk_stability', intent: 'stability_pattern_discussion' }]
};
/** Conceptual time blocks, not unreviewed exercise instructions or prescriptions. */
function buildStructure(groups: MuscleGroup[], seconds: number, goal: string): StructureBlock[] {
  const intent = `goal_${goal}_discussion`;
  const patterns = goal === 'endurance' ? [{ pattern: 'endurance_planning', intent }] : goal === 'mobility' ? [{ pattern: 'mobility_planning', intent }] : groups.flatMap(g => STRUCTURES[g]).map(p => ({ ...p, intent }));
  const each = Math.floor(seconds / patterns.length);
  return patterns.map((p, i) => ({ ...p, seconds: each + (i === patterns.length - 1 ? seconds - each * patterns.length : 0) }));
}
export function makePlan(context: TrainingContext, readiness: Readiness | null, catalogue: CatalogueSnapshot, now: number, planId: string, requestHash: string): PlanningResult {
  const p = context.profile;
  if (!p) return { status: 'needs_input', code: 'profile_required', message: 'Complete your training profile first.' };
  if (!readiness || readiness.confirmed !== true) return { status: 'needs_input', code: 'readiness_required', message: 'Confirm how you feel today.' };
  if (readiness.profileRevision !== p.revision || Date.parse(readiness.expiresAt) <= now || Date.parse(readiness.reportedAt) > now) return { status: 'needs_input', code: 'readiness_stale', message: 'Please update and confirm your current readiness.' };
  if (readiness.currentPain || p.healthReviewNeeded) return { status: 'needs_review', code: 'professional_review_required', message: 'Automatic planning is paused. Please discuss your current symptoms or needs with a qualified professional.' };
  if (readiness.energy === 1) return { status: 'needs_review', code: 'very_low_reported_energy', message: 'No workout has been prescribed. Consider resting and checking in with qualified staff if this is unusual.' };
  const scores = scoreMuscles(context, readiness, now), explicit = readiness.desiredMuscles;
  if (explicit.some(g => readiness.soreness.includes(g))) return { status: 'needs_review', code: 'requested_group_sore', message: 'Your requested group is marked sore. Update your choice or speak with qualified staff.' };
  const allowed = scores.filter(s => !s.excluded);
  if (!allowed.length) return { status: 'needs_review', code: 'no_suitable_groups', message: 'No suitable group is available from your current report.' };
  const hasHistory = context.summary.sessionsLast14Days + context.summary.legacyTrainingDays14 > 0;
  const target = explicit.length ? explicit : (!hasHistory && !p.preferences.length ? allowed.slice(0, 3).map(s => s.muscleGroup) : allowed.slice(0, 1).map(s => s.muscleGroup));
  const budget = readiness.availableMinutes * 60;
  const warmup = Math.min(300, Math.floor(budget * .2)), cooldown = Math.min(180, Math.floor(budget * .1));
  const effectiveBudget = readiness.energy === 2 ? Math.floor(budget * .75) : budget;
  const usable = catalogueCandidates(catalogue, context, readiness).filter(e => e.primaryMuscles.some(g => target.includes(g)));
  const order = usable.sort((a, b) => {
    const rank = (e: PlannedExercise) => Math.max(...e.primaryMuscles.map(g => scores.find(s => s.muscleGroup === g)!.score));
    return rank(b) - rank(a) || a.exerciseId.localeCompare(b.exerciseId);
  });
  const chosen: PlannedExercise[] = []; let used = warmup + cooldown;
  const maxExercises = p.experience === 'beginner' ? 4 : 6;
  for (const raw of order) {
    if (chosen.length >= maxExercises) break;
    const e = structuredClone(raw), last = chosen.at(-1);
    e.transitionSeconds = !last ? 0 : last.locations[0].zoneId === e.locations[0].zoneId ? 45 : 120;
    while (e.sets > 1 && used + exerciseSeconds(e) > effectiveBudget) e.sets--;
    e.estimatedSeconds = exerciseSeconds(e);
    if (used + e.estimatedSeconds > effectiveBudget) continue;
    e.evidence.reasons.push('fits_time_budget');
    if (explicit.some(g => e.primaryMuscles.includes(g))) e.evidence.reasons.push('matches_requested_group');
    chosen.push(e); used += e.estimatedSeconds;
  }
  const covered = new Set(chosen.flatMap(e => e.primaryMuscles)), allRequestedCovered = target.every(g => covered.has(g));
  // Never silently substitute another group for a requested group with no reviewed data.
  const executable = chosen.length > 0 && allRequestedCovered && !['mobility', 'endurance'].includes(p.goal);
  const mode = executable ? 'gym_grounded' as const : 'personalized_general' as const;
  const structure = executable ? [] : buildStructure(target, Math.max(0, effectiveBudget - warmup - cooldown), p.goal);
  const rationale = [explicit.length ? 'uses_explicit_group_request' : hasHistory ? 'uses_recorded_history_ranking' : 'limited_history_balanced_discussion_structure',
    'uses_confirmed_time_and_readiness', `goal_${p.goal}`, `experience_${p.experience}`];
  const caveats = ['not_medical_or_recovery_assessment', 'time_is_estimated_not_a_guarantee', 'historical_load_is_reference_only'];
  if (readiness.energy === 2) caveats.push('volume_reduced_for_low_reported_energy');
  if (!executable) caveats.push('structure_only_not_an_exercise_prescription', 'no_verified_gym_equipment_claims', 'ask_trainer_to_select_exercises_and_technique');
  if (context.summary.truncated) caveats.push('history_incomplete');
  const grounding = executable ? (chosen.length >= 2 ? 'verified' : 'partial') : usable.length ? 'partial' : 'unavailable';
  const plan: AdaptivePlan = {
    id: planId, uid: p.uid, status: 'proposed', mode, kind: executable ? 'exercises' : 'structure_only', gymGroundingStatus: grounding,
    generatedAt: new Date(now).toISOString(), expiresAt: readiness.expiresAt, startedAt: null, readinessId: readiness.id,
    profileRevision: p.revision, historyRevision: context.historyRevision, catalogueRevision: executable ? catalogue.revision : null,
    heuristicVersion: 'training-v1', goal: p.goal, targetMuscleGroups: target, availableMinutes: readiness.availableMinutes,
    estimatedMinutes: Math.ceil((executable ? used : effectiveBudget) / 60), warmupSeconds: warmup, cooldownSeconds: cooldown,
    exercises: executable ? chosen : [], structure, rationale, caveats, scores,
    contextCompleteness: { profile: true, readiness: true, history: hasHistory, verifiedGym: executable,
      label: context.summary.truncated || !hasHistory ? 'limited' : executable ? 'established' : 'partial' }, requestHash
  };
  return { status: 'ready', plan };
}
export function catalogueRevision(data: { zones: RecordObject[]; equipment: RecordObject[]; exercises: RecordObject[] }): string {
  return hash(Object.fromEntries(Object.entries(data).map(([k, rows]) => [k, [...rows].sort((a, b) => String(a.id).localeCompare(String(b.id)))])));
}
export function renderPlanIntro(style: string, mode: string): string {
  const lead = style === 'energetic' ? 'Shine on. Train with purpose, not pressure.' : style === 'gentle' ? 'Let us choose a manageable session together.' : 'Here is the result based on your confirmed inputs.';
  return `${lead} ${mode === 'gym_grounded' ? 'Equipment and cues come from the reviewed catalogue.' : 'This is a personalized discussion structure, not a verified The Shine exercise programme.'}`;
}
