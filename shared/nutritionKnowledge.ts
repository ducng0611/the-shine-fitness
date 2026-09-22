import { normalizeSafetyText } from './programSafety';

/** Bản chép nguồn khác dữ liệu thành phần thực phẩm, thực đơn đã duyệt và nhật ký đã ăn. */
export type NutritionGoal = 'weight_gain' | 'fat_loss' | 'fitness_flexibility' | 'height_growth' | 'medical_nutrition' | 'unknown';
export interface SourceRef { sourceId: string; paragraph: number }
export interface SourceParagraph { index: number; text: string; redaction: string | null; unresolvedCitationMarkers: string[] }
export interface NutritionSourceBundle {
  schemaVersion: 1; sourceScope: 'reference_only'; notModelTrainingData: true;
  contentVerification: 'not_performed';
  sources: Array<{ id: string; filename: string; sourceFileSha256: string; sourceKind: string; verified: false; reviewStatus: 'needs_review'; paragraphCount: number; paragraphs: SourceParagraph[] }>;
  attributionPolicy: string; redactionPolicy: string;
}
export interface MealSpec {
  key: string; label: string; headingParagraph: number; itemParagraphs: number[];
  optionParagraphs: number[]; additionalParagraphs: number[];
  timing: { kind: string; start?: string; end?: string | null; anchor?: string; offsetMinutes?: number | null };
}
export interface TemplateSpec {
  id: string; sourceId: string; sourceRange: [number, number]; name: string; goal: NutritionGoal;
  population: 'not_stated' | 'includes_minors' | 'medical'; sourceKind: string;
  targetStatementParagraph: number; declaredEnergy: [number, number]; bmrParagraph: number | null; bmrValue: number | null;
  weighingConventionParagraph: number | null; notes: number[]; meals: MealSpec[];
}
export interface NutritionMapping { schemaVersion: 1; note: string; templates: TemplateSpec[] }
export interface NutritionSourceLine {
  id: string; sourceRef: SourceRef; raw: string; citationMarkers: string[];
  quantityMentions: Array<{ raw: string; unitAsWritten: string }>;
  hasInlineAlternative: boolean; containsSupplementOrRehydrationProduct: boolean;
  cookedWeightBasis: 'source_raw_except_rice' | 'not_stated';
  computedKcal: null; computedMacros: null; allergenSafety: 'not_verified';
}
export interface NutritionMeal {
  id: string; label: string; sourceRef: SourceRef; headingRaw: string; timing: MealSpec['timing'];
  choicePolicy: 'choose_one_numbered_option' | 'preserve_source_lines';
  optionIds: string[]; items: NutritionSourceLine[]; additionalItems: NutritionSourceLine[];
  computedKcal: null; consumed: false;
}
export interface NutritionTemplate {
  id: string; name: string; goal: NutritionGoal; sourceId: string; sourceRange: [number, number];
  population: TemplateSpec['population']; sourceKind: string;
  reviewStatus: 'needs_review'; verified: false; eligibleForPlanner: false; aiRecommendable: false; ragRetrievalAllowed: false;
  sourceEnergy: { raw: string; sourceRef: SourceRef; minKcal: number; maxKcal: number; basis: 'author_declared_not_calculated'; personalTarget: false; verified: false };
  sourceBMR: { raw: string; sourceRef: SourceRef; valueAsWritten: number; usedAsMinimumIntake: false } | null;
  tdee: null; computedDailyKcal: null; weighingConvention: { raw: string; sourceRef: SourceRef } | null;
  notes: Array<{ sourceRef: SourceRef; raw: string }>;
  meals: NutritionMeal[]; memberIds: []; sourceInstructionsActive: false;
}
export interface NutritionLibrary {
  schemaVersion: 1; version: number; status: 'needs_review';
  description: string; templates: NutritionTemplate[];
  learningMode: 'source_grounding_not_fine_tuning';
}
const fail = (message: string): never => { throw new Error(message); };
const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);
const goals: readonly string[] = ['weight_gain','fat_loss','fitness_flexibility','height_growth','medical_nutrition','unknown'];
export function validateNutritionSources(bundle: NutritionSourceBundle): void {
  if (!bundle || bundle.schemaVersion !== 1 || bundle.sourceScope !== 'reference_only' || bundle.notModelTrainingData !== true || bundle.contentVerification !== 'not_performed' || !Array.isArray(bundle.sources) || !bundle.sources.length) fail('Nguồn dinh dưỡng không đúng cấu trúc hoặc tự nhận đã kiểm chứng.');
  const ids = new Set<string>();
  for (const s of bundle.sources) {
    if (!s || !/^[a-z][a-z0-9_]+$/.test(s.id) || ids.has(s.id)) fail('ID nguồn thiếu hoặc trùng.');
    ids.add(s.id);
    if (s.verified !== false || s.reviewStatus !== 'needs_review' || !Array.isArray(s.paragraphs) || s.paragraphCount !== s.paragraphs.length) fail('Không được tự xác minh nguồn hoặc bỏ đoạn.');
    s.paragraphs.forEach((p, i) => {
      if (p.index !== i + 1 || typeof p.text !== 'string' || p.text.length > 10000 || !Array.isArray(p.unresolvedCitationMarkers)) fail('Thứ tự hoặc nội dung đoạn nguồn không hợp lệ.');
      if (!same(p.unresolvedCitationMarkers, p.text.match(/\[cite: [^\]]+\]/g) ?? [])) fail('Ký hiệu trích dẫn phải được giữ nguyên, chưa tự xác minh.');
    });
  }
}
export function sourceParagraph(bundle: NutritionSourceBundle, sourceId: string, index: number): SourceParagraph {
  const p = bundle.sources.find(s => s.id === sourceId)?.paragraphs[index - 1];
  if (!Number.isInteger(index) || !p || p.index !== index) return fail('Tham chiếu đoạn không tồn tại.');
  return p;
}
/** Chỉ ghi chuỗi số và đơn vị xuất hiện, không đổi chén/bát/cốc/scoop thành gram. */
export function quantityMentions(raw: string): NutritionSourceLine['quantityMentions'] {
  const pattern = /\d+(?:[.,]\d+)?(?:\/\d+)?(?:\s*-\s*\d+(?:[.,]\d+)?)?\s*(gr\b|ml\b|kg\b|g\b|lít\b|l\b|chén|bát|cốc|ly\b|lát|quả|trái|hạt|muỗng|nắm|hộp|bìa|múi|tô\b)/giu;
  return [...raw.matchAll(pattern)].map(m => ({ raw: m[0], unitAsWritten: m[1] }));
}
function makeLine(bundle: NutritionSourceBundle, spec: TemplateSpec, index: number): NutritionSourceLine {
  const p = sourceParagraph(bundle, spec.sourceId, index);
  if (p.redaction) return fail('Không được chuyển đoạn đã tách riêng thành món ăn.');
  const n = normalizeSafetyText(p.text);
  return { id: `${spec.id}_p${index}`, sourceRef: {sourceId: spec.sourceId, paragraph: index}, raw: p.text,
    citationMarkers: [...p.unresolvedCitationMarkers], quantityMentions: quantityMentions(p.text),
    hasInlineAlternative: /\bhoac\b/.test(n),
    containsSupplementOrRehydrationProduct: /\b(whey|oresol|dau ca|vien bo sung|protein isolate)\b/.test(n),
    cookedWeightBasis: spec.weighingConventionParagraph === null ? 'not_stated' : 'source_raw_except_rice',
    computedKcal: null, computedMacros: null, allergenSafety: 'not_verified' };
}
export function buildNutritionLibrary(bundle: NutritionSourceBundle, mapping: NutritionMapping): NutritionLibrary {
  validateNutritionSources(bundle);
  if (mapping?.schemaVersion !== 1 || !Array.isArray(mapping.templates) || !mapping.templates.length) return fail('Thiếu ánh xạ mẫu.');
  const ids = new Set<string>();
  const templates = mapping.templates.map((spec): NutritionTemplate => {
    if (!/^[a-z][a-z0-9_]+$/.test(spec.id) || ids.has(spec.id)) return fail('ID mẫu trùng hoặc không hợp lệ.');
    ids.add(spec.id);
    if (!goals.includes(spec.goal) || !['not_stated','includes_minors','medical'].includes(spec.population)) return fail('Mục tiêu hoặc đối tượng không hợp lệ.');
    const [lo, hi] = spec.sourceRange;
    if (!Number.isInteger(lo) || !Number.isInteger(hi) || lo > hi) return fail('Khoảng nguồn sai.');
    const ref = (paragraph: number): SourceRef => {
      if (paragraph < lo || paragraph > hi) return fail('Tham chiếu vượt phạm vi mẫu, có nguy cơ trộn hồ sơ.');
      sourceParagraph(bundle, spec.sourceId, paragraph);
      return { sourceId: spec.sourceId, paragraph };
    };
    const raw = (p: number) => { ref(p); return sourceParagraph(bundle, spec.sourceId, p).text; };
    const [min, max] = spec.declaredEnergy;
    if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max < min || !raw(spec.targetStatementParagraph).includes(String(min)) || !raw(spec.targetStatementParagraph).includes(String(max))) return fail('Năng lượng khai trong nguồn không khớp.');
    if ((spec.bmrParagraph === null) !== (spec.bmrValue === null)) return fail('BMR chưa có không được tự điền.');
    if (spec.bmrParagraph !== null && !raw(spec.bmrParagraph).includes(String(spec.bmrValue))) return fail('BMR không khớp nguồn.');
    if (spec.weighingConventionParagraph !== null && !normalizeSafetyText(raw(spec.weighingConventionParagraph)).includes('do song tru com')) return fail('Không tự kế thừa quy tắc cân sống/chín.');
    const mealIds = new Set<string>();
    const meals = spec.meals.map((m): NutritionMeal => {
      if (!/^[a-z_]+$/.test(m.key) || mealIds.has(m.key)) return fail('ID bữa thiếu hoặc trùng.');
      mealIds.add(m.key);
      const indexes = [...m.itemParagraphs, ...m.additionalParagraphs];
      if (!indexes.length || new Set(indexes).size !== indexes.length || m.optionParagraphs.some(i => !m.itemParagraphs.includes(i))) return fail('Mục lựa chọn hoặc dòng món bị trùng.');
      indexes.forEach(ref);
      if (m.optionParagraphs.some(i => !normalizeSafetyText(raw(i)).includes('lua chon'))) return fail('Không tự tạo lựa chọn được đánh số.');
      for (const field of ['start','end'] as const) if (m.timing[field] != null && !/^([01]\d|2[0-3]):[0-5]\d$/.test(m.timing[field]!)) return fail('Giờ trong mẫu không hợp lệ.');
      return {id:`${spec.id}_${m.key}`,label:m.label,sourceRef:ref(m.headingParagraph),headingRaw:raw(m.headingParagraph),timing:{...m.timing},
        choicePolicy:m.optionParagraphs.length ? 'choose_one_numbered_option' : 'preserve_source_lines',
        optionIds:m.optionParagraphs.map(i=>`${spec.id}_p${i}`),items:m.itemParagraphs.map(i=>makeLine(bundle,spec,i)),additionalItems:m.additionalParagraphs.map(i=>makeLine(bundle,spec,i)),computedKcal:null,consumed:false};
    });
    return { id:spec.id,name:spec.name,goal:spec.goal,sourceId:spec.sourceId,sourceRange:[lo,hi],population:spec.population,sourceKind:spec.sourceKind,
      reviewStatus:'needs_review',verified:false,eligibleForPlanner:false,aiRecommendable:false,ragRetrievalAllowed:false,
      sourceEnergy:{raw:raw(spec.targetStatementParagraph),sourceRef:ref(spec.targetStatementParagraph),minKcal:min,maxKcal:max,basis:'author_declared_not_calculated',personalTarget:false,verified:false},
      sourceBMR:spec.bmrParagraph === null ? null : {raw:raw(spec.bmrParagraph),sourceRef:ref(spec.bmrParagraph),valueAsWritten:spec.bmrValue!,usedAsMinimumIntake:false},
      tdee:null,computedDailyKcal:null,weighingConvention:spec.weighingConventionParagraph === null ? null : {raw:raw(spec.weighingConventionParagraph),sourceRef:ref(spec.weighingConventionParagraph)},
      notes:spec.notes.map(p=>({sourceRef:ref(p),raw:raw(p)})),meals,memberIds:[],sourceInstructionsActive:false };
  });
  return {schemaVersion:1,version:1,status:'needs_review',learningMode:'source_grounding_not_fine_tuning',description:'Mẫu và nguyên tắc trích từ hai DOCX, chưa xác minh thành phần, khẩu phần, tính phù hợp cá nhân hoặc nguồn y khoa.',templates};
}
export function validateNutritionLibrary(value: unknown, bundle: NutritionSourceBundle, mapping: NutritionMapping) {
  const expected = buildNutritionLibrary(bundle,mapping);
  if (!same(value,expected)) fail('Thư viện phải khớp phép chuyển đổi nguồn: không tự duyệt, tính kcal, sửa khẩu phần, ghép hội viên hoặc bỏ dòng.');
  return {sourceCount:bundle.sources.length,paragraphCount:bundle.sources.reduce((n,s)=>n+s.paragraphs.length,0),templateCount:expected.templates.length,
    mealCount:expected.templates.reduce((n,t)=>n+t.meals.length,0),foodLineCount:expected.templates.flatMap(t=>t.meals).reduce((n,m)=>n+m.items.length+m.additionalItems.length,0),eligibleTemplateCount:0,modelTrainingRuns:0};
}