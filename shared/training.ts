/** Shared DTOs only. No credentials, database access or model code belongs here. */
export const MUSCLE_GROUPS = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'] as const;
export type MuscleGroup = typeof MUSCLE_GROUPS[number];
export const TRAINING_GOALS = ['general_fitness', 'hypertrophy', 'strength', 'fat_loss', 'endurance', 'mobility'] as const;
export type TrainingGoal = typeof TRAINING_GOALS[number];
export const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type Experience = typeof EXPERIENCE_LEVELS[number];
export type CoachStyle = 'gentle' | 'energetic' | 'direct';
export type TrainingMode = 'gym_grounded' | 'personalized_general';
export type GroundingStatus = 'verified' | 'partial' | 'unavailable';
export type RecordObject = Record<string, unknown>;

export interface TrainingProfileInput {
  nickname: string;
  age: number;
  adultConfirmed: boolean;
  consent: boolean;
  goal: TrainingGoal;
  experience: Experience;
  preferredMinutes: number;
  timezone: string;
  heightCm: number | null;
  weightKg: number | null;
  preferences: MuscleGroup[];
  avoidedExerciseIds: string[];
  healthReviewNeeded: boolean;
  includeLegacyHistory: boolean;
  style: CoachStyle;
}
export interface TrainingProfile extends TrainingProfileInput {
  uid: string;
  revision: number;
  consentVersion: 'training-v1';
  createdAt: string;
  updatedAt: string;
}
export interface ReadinessInput {
  confirmed: boolean;
  availableMinutes: number;
  energy: number;
  currentPain: boolean;
  soreness: MuscleGroup[];
  desiredMuscles: MuscleGroup[];
  blockedEquipmentIds: string[];
}
export interface Readiness extends ReadinessInput {
  id: string;
  profileRevision: number;
  reportedAt: string;
  expiresAt: string;
}
export interface ActualSet {
  reps: number;
  loadKg: number | null;
  rpe: number | null;
}
export interface ActualExercise {
  exerciseId: string | null;
  name: string;
  muscleGroups: MuscleGroup[];
  sets: ActualSet[];
  skipped: boolean;
}
export interface TrainingSession {
  id: string;
  uid: string;
  planId: string;
  status: 'completed' | 'partial' | 'deleted';
  mode: TrainingMode;
  confirmed: true;
  performedAt: string;
  recordedAt: string;
  localDate: string;
  actualMinutes: number;
  exercises: ActualExercise[];
  notes: string;
  profileRevisionAtPlanning: number;
  profileRevisionAtCompletion: number;
  historyRevisionAtPlanning: number;
  source: 'shine_training_v1';
  requestHash: string;
}
export interface LegacyTrainingDay {
  id: string;
  date: string;
  muscleGroups: MuscleGroup[];
  completedSets: number;
  source: 'legacy_member_report';
}
export interface HistorySummary {
  sessionsLast7Days: number;
  sessionsLast14Days: number;
  legacyTrainingDays14: number;
  lastWorkoutAt: string | null;
  muscleFrequency7Days: Record<MuscleGroup, number>;
  muscleFrequency14Days: Record<MuscleGroup, number>;
  lastTrainedAt: Partial<Record<MuscleGroup, string>>;
  latestPerformance: Record<string, { performedAt: string; sets: ActualSet[] }>;
  confirmedSetCount14Days: number;
  windowDays: 90;
  truncated: boolean;
  warnings: string[];
}
export interface ProgressPoint { date: string; weightKg: number; source: 'member_progress' | 'profile' }
export interface TrainingContext {
  profile: TrainingProfile | null;
  historyRevision: number;
  summary: HistorySummary;
  recentSessions: TrainingSession[];
  progress: { points: ProgressPoint[]; changeKg: number | null; explanation: string };
  legacyDays: LegacyTrainingDay[];
  warnings: string[];
}
export interface CatalogueSnapshot {
  zones: RecordObject[];
  equipment: RecordObject[];
  exercises: RecordObject[];
  revision: string;
  fetchedAt: string;
  availability: 'available' | 'unavailable';
}
export interface PlannedExercise {
  exerciseId: string;
  name: string;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  movementPattern: string;
  stationIds: string[];
  locations: { stationId: string; stationName: string; zoneId: string; zoneName: string; directions: string }[];
  sets: number;
  repRange: { min: number; max: number };
  restSeconds: number;
  secondsPerRep: number;
  setupSeconds: number;
  transitionSeconds: number;
  estimatedSeconds: number;
  trainerCues: string[];
  previousPerformance: { performedAt: string; sets: ActualSet[] } | null;
  programmingSource: 'reviewed_catalogue_prescription';
  evidence: { catalogueRevision: string; exerciseRevision: number; equipmentRevisions: Record<string, number>; reasons: string[] };
}
export interface StructureBlock { pattern: string; seconds: number; intent: string }
export interface GroupScore { muscleGroup: MuscleGroup; score: number; excluded: boolean; factors: { code: string; points: number }[] }
export interface AdaptivePlan {
  id: string;
  uid: string;
  status: 'proposed' | 'started' | 'completed' | 'partial' | 'cancelled';
  mode: TrainingMode;
  kind: 'exercises' | 'structure_only';
  gymGroundingStatus: GroundingStatus;
  generatedAt: string;
  expiresAt: string;
  startedAt: string | null;
  readinessId: string;
  profileRevision: number;
  historyRevision: number;
  catalogueRevision: string | null;
  heuristicVersion: 'training-v1';
  goal: TrainingGoal;
  targetMuscleGroups: MuscleGroup[];
  availableMinutes: number;
  estimatedMinutes: number;
  warmupSeconds: number;
  cooldownSeconds: number;
  exercises: PlannedExercise[];
  structure: StructureBlock[];
  rationale: string[];
  caveats: string[];
  scores: GroupScore[];
  contextCompleteness: { profile: boolean; readiness: boolean; history: boolean; verifiedGym: boolean; label: 'limited' | 'partial' | 'established' };
  requestHash: string;
}
export type PlanningResult =
  | { status: 'ready'; plan: AdaptivePlan }
  | { status: 'needs_input' | 'needs_review' | 'insufficient_verified_gym_data'; code: string; message: string };
export interface IntentResult {
  intent: 'plan' | 'history' | 'past_report' | 'safety' | 'other';
  availableMinutes?: number;
  desiredMuscles?: MuscleGroup[];
  source: 'rules' | 'gemini';
}
export interface CompletionInput {
  confirmed: boolean;
  performedAt: string;
  actualMinutes: number;
  exercises: ActualExercise[];
  notes: string;
  expectedHistoryRevision: number;
  acknowledgeProfileChange: boolean;
}
export interface TrainingContextResponse extends TrainingContext {
  readiness: Readiness | null;
  openPlans: AdaptivePlan[];
  profileRevision: number;
}
