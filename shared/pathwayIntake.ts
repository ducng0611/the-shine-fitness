/** Source intake is NOT training, a prescription, proof of attendance or clearance.
 * No member UID is accepted here. Private source cases never enter the public RAG.
 */
export type SourceKind = 'intake_form' | 'workout_log' | 'tracker';
export type Reading = 'clear' | 'uncertain' | 'blank' | 'dash' | 'redacted';
export interface SourceField { label: string; raw: string | null; reading: Reading; unit: string | null }
export interface PathwaySource {
  id: string; kind: SourceKind; subjectGroup: string;
  subjectAssociation: 'unconfirmed' | 'human_confirmed';
  goal: 'fat_loss' | 'strength' | 'general_fitness' | 'not_stated';
  goalBasis: 'source_explicit' | 'user_batch_description' | 'not_stated';
}
export interface SourceObservation {
  id: string; sourceId: string; locator: string; section: string; group: string;
  rowLabel: string; fields: SourceField[]; duplicateGroup: string | null;
}
export interface SourceIssue {
  id: string; sourceIds: string[]; code: string; detail: string;
  severity: 'blocker' | 'warning'; status: 'open' | 'resolved'; resolution: string | null;
}
export interface PathwaySourceBundle {
  schemaVersion: 1; kind: 'private_pathway_source';
  sources: PathwaySource[]; observations: SourceObservation[]; issues: SourceIssue[];
  privacy: { directIdentifiersRemoved: true; containsHealthData: boolean };
  usage: 'source_review_only';
}
export interface PathwayReviewResult {
  sources: number; observations: number; fields: number; uncertainFields: number;
  repeatedGroups: number; openBlockers: string[]; warnings: string[];
  readyForSourceReview: boolean; eligibleForPlanner: false;
}
export interface PathwayRecord {
  id: string; revision: number; state: 'draft' | 'source_reviewed';
  bundle: PathwaySourceBundle; originalBundle: PathwaySourceBundle;
  createdAt: string; updatedAt: string; reviewedAt: string | null;
  reviewedBy: string | null; review: PathwayReviewResult;
}
export class PathwayInputError extends Error {
  constructor(public code: string, public status = 400) { super(code); }
}
const fail = (code: string): never => { throw new PathwayInputError(code); };
export function record(value: unknown, allowed: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('expected_object');
  const o = value as Record<string, unknown>;
  if (Object.keys(o).some(k => !allowed.includes(k))) fail('unsupported_field');
  return o;
}
function text(v: unknown, max = 160): string {
  if (typeof v !== 'string' || !v.trim() || v.length > max || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(v)) fail('invalid_text');
  return v as string; // Preserve source spelling and whitespace, not a correction.
}
function nullable(v: unknown, max = 160): string | null { return v === null ? null : text(v, max); }
export function safeId(v: unknown): string {
  const s = text(v, 100); if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(s)) fail('invalid_id'); return s;
}
function oneOf<T extends string>(v: unknown, options: readonly T[]): T {
  if (typeof v !== 'string' || !options.includes(v as T)) fail('invalid_enum'); return v as T;
}
function rows(v: unknown, max: number): unknown[] { if (!Array.isArray(v) || v.length > max) fail('invalid_array'); return v as unknown[]; }
function unique(values: string[]) { if (new Set(values).size !== values.length) fail('duplicate_id'); }
export function parsePathwayBundle(value: unknown): PathwaySourceBundle {
  const b = record(value, ['schemaVersion','kind','sources','observations','issues','privacy','usage']);
  if (b.schemaVersion !== 1 || b.kind !== 'private_pathway_source' || b.usage !== 'source_review_only') fail('unsupported_source_schema');
  const privacy = record(b.privacy, ['directIdentifiersRemoved','containsHealthData']);
  if (privacy.directIdentifiersRemoved !== true || typeof privacy.containsHealthData !== 'boolean') fail('redaction_review_required');
  const sources: PathwaySource[] = rows(b.sources, 12).map(v => {
    const s = record(v, ['id','kind','subjectGroup','subjectAssociation','goal','goalBasis']);
    const goal = oneOf(s.goal, ['fat_loss','strength','general_fitness','not_stated'] as const);
    const goalBasis = oneOf(s.goalBasis, ['source_explicit','user_batch_description','not_stated'] as const);
    if ((goal === 'not_stated') !== (goalBasis === 'not_stated')) fail('inconsistent_goal_basis');
    return { id: safeId(s.id), kind: oneOf(s.kind, ['intake_form','workout_log','tracker'] as const),
      subjectGroup: safeId(s.subjectGroup), subjectAssociation: oneOf(s.subjectAssociation, ['unconfirmed','human_confirmed'] as const), goal, goalBasis };
  });
  if (!sources.length) fail('source_required'); unique(sources.map(s => s.id));
  const sourceIds = new Set(sources.map(s => s.id));
  const observations: SourceObservation[] = rows(b.observations, 300).map(v => {
    const o = record(v, ['id','sourceId','locator','section','group','rowLabel','fields','duplicateGroup']);
    const sourceId = safeId(o.sourceId); if (!sourceIds.has(sourceId)) fail('unknown_source');
    const fields: SourceField[] = rows(o.fields, 40).map(vf => {
      const f = record(vf, ['label','raw','reading','unit']);
      const reading = oneOf(f.reading, ['clear','uncertain','blank','dash','redacted'] as const);
      const raw = nullable(f.raw, 1600), unit = nullable(f.unit, 60);
      if ((reading === 'blank' || reading === 'redacted') && raw !== null) fail('blank_or_redacted_must_be_null');
      if ((reading === 'clear' || reading === 'uncertain' || reading === 'dash') && raw === null) fail('source_value_required');
      if (reading === 'dash' && !/^[-\u2013\u2014]$/.test(raw!)) fail('invalid_dash');
      if (reading !== 'clear' && unit !== null) fail('uncertain_unit_not_allowed');
      return { label: text(f.label), raw, reading, unit };
    });
    if (!fields.length) fail('field_required'); unique(fields.map(f => f.label));
    return { id: safeId(o.id), sourceId, locator: text(o.locator, 300), section: text(o.section), group: text(o.group),
      rowLabel: text(o.rowLabel, 300), fields, duplicateGroup: o.duplicateGroup === null ? null : safeId(o.duplicateGroup) };
  });
  if (!observations.length) fail('observation_required'); unique(observations.map(o => o.id));
  const issues: SourceIssue[] = rows(b.issues, 100).map(v => {
    const i = record(v, ['id','sourceIds','code','detail','severity','status','resolution']);
    const ids = rows(i.sourceIds, 12).map(safeId); if (!ids.length || ids.some(id => !sourceIds.has(id))) fail('unknown_issue_source'); unique(ids);
    const status = oneOf(i.status, ['open','resolved'] as const), resolution = nullable(i.resolution, 1600);
    if ((status === 'resolved') !== (resolution !== null)) fail('resolution_required');
    return { id: safeId(i.id), sourceIds: ids, code: safeId(i.code), detail: text(i.detail, 1600),
      severity: oneOf(i.severity, ['blocker','warning'] as const), status, resolution };
  });
  unique(issues.map(i => i.id));
  const result: PathwaySourceBundle = { schemaVersion: 1, kind: 'private_pathway_source', sources, observations, issues,
    privacy: { directIdentifiersRemoved: true, containsHealthData: privacy.containsHealthData as boolean }, usage: 'source_review_only' };
  if (new TextEncoder().encode(JSON.stringify(result)).length > 180_000) fail('source_bundle_too_large');
  return result;
}
export function assessPathway(bundle: PathwaySourceBundle): PathwayReviewResult {
  const fields = bundle.observations.flatMap(o => o.fields);
  const uncertainFields = fields.filter(f => f.reading === 'uncertain').length;
  const repeatedGroups = new Set(bundle.observations.map(o => o.duplicateGroup).filter(Boolean)).size;
  const openBlockers = bundle.issues.filter(i => i.severity === 'blocker' && i.status === 'open').map(i => i.id);
  if (bundle.sources.some(s => s.subjectAssociation === 'unconfirmed')) openBlockers.push('subject_association_unconfirmed');
  if (uncertainFields) openBlockers.push('uncertain_transcription');
  const warnings = ['historical_source_is_not_prescription', 'no_member_history_write', 'no_automatic_generalization'];
  if (repeatedGroups) warnings.push('repeated_content_not_independent_progress');
  if (bundle.privacy.containsHealthData) warnings.push('sensitive_health_data_private_only');
  if (bundle.sources.some(s => s.goalBasis === 'user_batch_description')) warnings.push('batch_goal_is_not_source_verified');
  if (fields.some(f => f.reading === 'blank' || f.reading === 'dash')) warnings.push('blank_or_dash_does_not_mean_zero_or_repeat');
  return { sources: bundle.sources.length, observations: bundle.observations.length, fields: fields.length, uncertainFields,
    repeatedGroups, openBlockers, warnings, readyForSourceReview: openBlockers.length === 0, eligibleForPlanner: false };
}
/** Intentionally exports only counts and controlled values, never source text/labels. */
export function publicStructureSummary(bundle: PathwaySourceBundle) {
  const a = assessPathway(bundle);
  return { schemaVersion: 1, kind: 'pathway_structure_summary', sourceKinds: [...new Set(bundle.sources.map(s => s.kind))],
    sourceCount: a.sources, observationCount: a.observations, uncertainFieldCount: a.uncertainFields,
    repeatedGroupCount: a.repeatedGroups, containsSourceValues: false, eligibleForPlanner: false };
}
export function pathwayCsv(bundle: PathwaySourceBundle): string {
  // Escaping is for spreadsheet safety only; raw JSON remains lossless.
  const quote = (value: unknown) => { let s = value === null ? '' : String(value); if (/^[\s]*[=+@-]/.test(s)) s = "'" + s; return '"' + s.replaceAll('"', '""') + '"'; };
  const out: unknown[][] = [['id','sourceId','locator','section','group','rowLabel','field','raw','reading','unit','duplicateGroup']];
  for (const o of bundle.observations) for (const f of o.fields) out.push([o.id,o.sourceId,o.locator,o.section,o.group,o.rowLabel,f.label,f.raw,f.reading,f.unit,o.duplicateGroup]);
  return '\uFEFF' + out.map(r => r.map(quote).join(',')).join('\r\n') + '\r\n';
}
