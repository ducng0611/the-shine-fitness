/** Pure domain rules. No credentials, network, model calls or database writes. */
export class DomainError extends Error {
  constructor(code, message, status = 400) { super(message); this.code = code; this.status = status; }
}
export function ensure(ok, code, message, status = 400) { if (!ok) throw new DomainError(code, message, status); }
export function obj(v) { ensure(v && typeof v === 'object' && !Array.isArray(v), 'INPUT', 'Expected an object.'); return v; }
export function text(v, max = 200) { ensure(typeof v === 'string' && v.trim() && v.length <= max, 'INPUT', 'Missing or oversized text.'); return v.trim(); }
export function num(v, min, max, name = 'value') { ensure(typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max, 'INPUT', `${name}: expected ${min}–${max}.`); return v; }
export function choice(v, values) { ensure(values.includes(v), 'INPUT', `Unsupported value: ${String(v).slice(0, 80)}`); return v; }
export function id(v) { ensure(typeof v === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(v), 'INPUT', 'Invalid identifier.'); return v; }
export function list(v = [], max = 20, length = 150) { ensure(Array.isArray(v) && v.length <= max, 'INPUT', 'Invalid list.'); return [...new Set(v.map(x => text(x, length)))]; }
export const GROUPS = ['legs', 'push', 'pull', 'core'];
export const LEVELS = ['beginner', 'intermediate', 'advanced'];
export const GOALS = ['general_fitness', 'build_muscle', 'fat_loss'];
export function timezone(v) {
  text(v, 80); try { new Intl.DateTimeFormat('en', { timeZone: v }).format(); } catch { throw new DomainError('TIMEZONE', 'Use an IANA timezone.'); } return v;
}
export function localDate(date, zone) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  return ['year', 'month', 'day'].map(t => parts.find(p => p.type === t).value).join('-');
}
/** Local-day boundaries account for DST; never assume every day has 24 hours. */
export function dayBounds(now, zone) {
  timezone(zone); const date = localDate(now, zone);
  const next = new Date(`${date}T12:00:00Z`); next.setUTCDate(next.getUTCDate() + 1);
  function boundary(day) {
    let low = Date.parse(`${day}T00:00:00Z`) - 36 * 3600000, high = low + 72 * 3600000;
    while (low < high) { const mid = Math.floor((low + high) / 2); if (localDate(new Date(mid), zone) < day) low = mid + 1; else high = mid; }
    return new Date(low).toISOString();
  }
  return { date, start: boundary(date), end: boundary(next.toISOString().slice(0, 10)) };
}
export function validateProfile(input) {
  const p = obj(input);
  ensure(p.consent === true, 'CONSENT_REQUIRED', 'Cần đồng ý lưu dữ liệu cá nhân trước khi sử dụng.', 403);
  ensure(p.adultConfirmed === true, 'ADULT_ONLY', 'Bản thử nghiệm dành cho người từ 18 tuổi.', 403);
  ensure(typeof p.needsProfessionalReview === 'boolean', 'SCREENING_REQUIRED', 'Cần hoàn tất câu hỏi sàng lọc.');
  return { schemaVersion: 1, consentVersion: 'shine-companion-v1', consent: true, adultConfirmed: true,
    nickname: text(p.nickname, 60), age: num(p.age, 18, 100, 'age'), heightCm: num(p.heightCm, 100, 240, 'heightCm'),
    weightKg: num(p.weightKg, 30, 350, 'weightKg'), goal: choice(p.goal, GOALS), experience: choice(p.experience, LEVELS),
    style: choice(p.style, ['gentle', 'energetic', 'direct']), diet: choice(p.diet, ['omnivore', 'vegetarian', 'vegan']),
    allergies: list(p.allergies, 20, 60), needsProfessionalReview: p.needsProfessionalReview,
    photoConsent: p.photoConsent === true, timezone: timezone(p.timezone), preferredMinutes: num(p.preferredMinutes, 15, 90) };
}
export function validateCatalogue(input) {
  const c = obj(input);
  ensure(Array.isArray(c.equipment) && c.equipment.length <= 200 && Array.isArray(c.exercises) && c.exercises.length <= 500, 'CATALOGUE', 'Invalid catalogue size.');
  const equipment = c.equipment.map(raw => { const e = obj(raw); return { id: id(e.id), name: text(e.name, 120), zone: text(e.zone, 100),
    directions: text(e.directions, 500), verified: e.verified === true, status: choice(e.status, ['operational', 'maintenance', 'retired']) }; });
  const stationIds = new Set(equipment.map(e => e.id)); ensure(stationIds.size === equipment.length, 'CATALOGUE', 'Duplicate stations.');
  const exercises = c.exercises.map(raw => {
    const e = obj(raw); ensure(stationIds.has(e.stationId), 'CATALOGUE', 'Unknown station.');
    const groups = list(e.groups, 4); groups.forEach(g => choice(g, GROUPS)); ensure(groups.length, 'CATALOGUE', 'Missing muscle groups.');
    const cues = list(e.cues, 8, 300); ensure(cues.length, 'CATALOGUE', 'Coach-reviewed instructions are required.');
    return { id: id(e.id), name: text(e.name, 120), stationId: e.stationId, groups, cues, verified: e.verified === true,
      pattern: text(e.pattern, 60), minLevel: choice(e.minLevel, LEVELS), sets: Math.trunc(num(e.sets, 1, 5)),
      repsMin: Math.trunc(num(e.repsMin, 1, 30)), repsMax: Math.trunc(num(e.repsMax, e.repsMin, 30)),
      workSeconds: num(e.workSeconds, 15, 180), restSeconds: num(e.restSeconds, 30, 300), transitionSeconds: num(e.transitionSeconds, 15, 300) };
  });
  ensure(new Set(exercises.map(e => e.id)).size === exercises.length, 'CATALOGUE', 'Duplicate exercises.');
  ensure(Array.isArray(c.nutritionTemplates ?? []) && (c.nutritionTemplates ?? []).length <= 100, 'CATALOGUE', 'Invalid nutrition templates.');
  const nutritionTemplates = (c.nutritionTemplates ?? []).map(raw => {
    const t = obj(raw), diets = list(t.diets, 3), goals = list(t.goals, 3);
    diets.forEach(d => choice(d, ['omnivore', 'vegetarian', 'vegan'])); goals.forEach(g => choice(g, GOALS));
    return { id: id(t.id), title: text(t.title, 120), body: text(t.body, 1500), diets, goals,
      timing: choice(t.timing, ['pre_soon', 'pre_later', 'post']), verified: t.verified === true,
      reviewedBy: text(t.reviewedBy, 100), source: text(t.source, 500) };
  });
  return { schemaVersion: 1, verified: c.verified === true, equipment, exercises, nutritionTemplates };
}
export function safetyIssue(message = '') {
  const m = String(message).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();
  if (/(chest pain|shortness of breath|fainting|dau nguc|kho tho|ngat xiu)/.test(m)) return 'urgent';
  if (/(injur|sharp pain|pregnan|chan thuong|dau nhoi|mang thai|tieu duong|diabetes|kidney|benh than|eating disorder|roi loan an uong)/.test(m)) return 'professional';
  return null;
}
export function validateReadiness(input, profile) {
  const q = obj(input); ensure(typeof q.pain === 'boolean' && q.confirmed === true, 'READINESS_REQUIRED', 'Xác nhận tình trạng hiện tại trước khi tạo buổi tập.');
  const soreGroups = list(q.soreGroups, 4); soreGroups.forEach(g => choice(g, GROUPS));
  return { durationMinutes: num(q.durationMinutes ?? profile.preferredMinutes, 15, 90),
    focus: choice(q.focus ?? 'auto', ['auto', 'full_body', ...GROUPS]), energy: num(q.energy, 1, 5), pain: q.pain, soreGroups,
    unavailableStationIds: list(q.unavailableStationIds, 100).map(id), confirmed: true };
}
/** A transparent constrained heuristic, not physiological recovery detection. */
export function planWorkout(profile, request, catalogue, history = [], now = new Date()) {
  const q = validateReadiness(request, profile);
  ensure(!profile.needsProfessionalReview && !q.pain, 'PROFESSIONAL_REVIEW', 'Không tập xuyên qua cơn đau. Hãy nhờ HLV hoặc chuyên gia y tế đánh giá trước.', 422);
  ensure(q.energy >= 2, 'LOW_READINESS', 'Hôm nay nên nghỉ hoặc hỏi HLV về buổi vận động nhẹ thay vì tự động tạo giáo án.', 422);
  ensure(catalogue?.verified === true, 'INVENTORY_REQUIRED', 'Phòng tập chưa xác minh danh mục máy, vị trí và thư viện bài tập.', 422);
  const stations = new Map(catalogue.equipment.filter(s => s.verified && s.status === 'operational' && !q.unavailableStationIds.includes(s.id)).map(s => [s.id, s]));
  const excluded = new Set(q.soreGroups), weekly = Object.fromEntries(GROUPS.map(g => [g, 0]));
  const recent = history.filter(h => { const elapsed = now.getTime() - Date.parse(h.occurredAt); return Number.isFinite(elapsed) && elapsed >= 0 && elapsed <= 7 * 86400000; });
  for (const h of recent) for (const group of h.groups ?? []) if (GROUPS.includes(group)) {
    weekly[group] += 1; if (now.getTime() - Date.parse(h.occurredAt) < 48 * 3600000) excluded.add(group);
  }
  const candidates = catalogue.exercises.filter(e => e.verified && stations.has(e.stationId)
    && LEVELS.indexOf(e.minLevel) <= LEVELS.indexOf(profile.experience) && !e.groups.some(g => excluded.has(g))
    && (['auto', 'full_body'].includes(q.focus) || e.groups.includes(q.focus)));
  const score = e => e.groups.reduce((sum, g) => sum + weekly[g], 0);
  candidates.sort((a, b) => score(a) - score(b) || a.id.localeCompare(b.id));
  let seconds = 480; const chosen = [], patterns = new Set();
  for (const e of candidates) {
    if (chosen.length >= 6 || patterns.has(e.pattern)) continue;
    let sets = Math.min(e.sets, profile.experience === 'beginner' || q.energy === 2 ? 2 : profile.goal === 'build_muscle' ? 3 : 2);
    const duration = n => n * e.workSeconds + Math.max(0, n - 1) * e.restSeconds + e.transitionSeconds;
    while (sets > 1 && seconds + duration(sets) > q.durationMinutes * 60) sets--;
    if (seconds + duration(sets) > q.durationMinutes * 60) continue;
    const station = stations.get(e.stationId);
    const previousLog = [...history].sort((a, b) => String(b.occurredAt).localeCompare(String(a.occurredAt))).find(h => h.sets?.some(s => s.exerciseId === e.id));
    chosen.push({ exerciseId: e.id, name: e.name, groups: e.groups, sets, repsMin: e.repsMin, repsMax: e.repsMax,
      restSeconds: e.restSeconds, estimatedSeconds: duration(sets), stationId: station.id, stationName: station.name,
      zone: station.zone, directions: station.directions, cues: e.cues,
      lastPerformance: previousLog ? { date: previousLog.occurredAt, sets: previousLog.sets.filter(s => s.exerciseId === e.id).map(s => ({ reps: s.reps, loadKg: s.loadKg, effort: s.effort ?? null })) } : null });
    seconds += duration(sets); patterns.add(e.pattern);
  }
  ensure(chosen.length, 'NO_SUITABLE_WORKOUT', 'Không đủ bài đã xác minh phù hợp thời gian, nhóm cơ và lịch sử hiện tại. Đổi nhóm cơ hoặc hỏi HLV.', 422);
  chosen.sort((a, b) => a.zone.localeCompare(b.zone));
  return { status: 'proposed', createdAt: now.toISOString(), expiresAt: new Date(now.getTime() + 24 * 3600000).toISOString(),
    profileRevision: profile.revision ?? null, catalogueRevision: catalogue.revision ?? null, request: q,
    goal: profile.goal, warmupMinutes: 5, cooldownMinutes: 3, estimatedMinutes: Math.ceil(seconds / 60), exercises: chosen,
    reasons: { experience: profile.experience, goal: profile.goal, recentGroupsExcluded: [...excluded], weeklyGroupSessions: weekly, historyRecordsUsed: recent.length },
    limitations: ['Thời gian là ước lượng; không vội tăng tốc để bù thời gian.', 'Loại nhóm cơ trong 48 giờ là quy tắc thử nghiệm bảo thủ, không phải đo hồi phục cơ.', 'Máy hoạt động không đồng nghĩa máy đang trống.', 'Tạ buổi trước chỉ để tham khảo. Không tự tăng tạ theo chiều cao/cân nặng.', 'Tự chọn nhóm cơ không thay thế giáo án dài hạn được HLV duyệt.'] };
}
export function completeWorkout(plan, input, now = new Date()) {
  const v = obj(input); ensure(v.confirmed === true, 'CONFIRMATION_REQUIRED', 'Xác nhận phần đã thực hiện.');
  ensure(Array.isArray(v.sets) && v.sets.length > 0 && v.sets.length <= 60, 'SETS', 'Nhập các hiệp thực tế, không phải giáo án dự kiến.');
  const allowed = new Map(plan.exercises.map(e => [e.exerciseId, e])), counts = new Map();
  const sets = v.sets.map(raw => {
    const s = obj(raw), e = allowed.get(s.exerciseId); ensure(e, 'EXERCISE', 'Bài tập không thuộc buổi tập này.');
    counts.set(e.exerciseId, (counts.get(e.exerciseId) ?? 0) + 1); ensure(counts.get(e.exerciseId) <= e.sets, 'SETS', 'Vượt số hiệp dự kiến.');
    const reps = num(s.reps, 1, 100); ensure(Number.isInteger(reps), 'SETS', 'Reps must be an integer.');
    return { exerciseId: e.exerciseId, name: e.name, groups: e.groups, reps, loadKg: num(s.loadKg, 0, 500), effort: s.effort == null ? null : num(s.effort, 1, 10) };
  });
  return { occurredAt: now.toISOString(), durationMinutes: num(v.durationMinutes, 1, 240), sets,
    groups: [...new Set(sets.flatMap(s => s.groups))], status: plan.exercises.every(e => counts.get(e.exerciseId) === e.sets) ? 'completed' : 'partial',
    externalLoadVolumeKg: Math.round(sets.reduce((n, s) => n + s.reps * s.loadKg, 0) * 10) / 10,
    source: 'member_confirmed', painReported: v.painReported === true,
    note: 'Khối lượng tạ ngoài không phải kcal tiêu hao hoặc thước đo đầy đủ của sức mạnh.' };
}
export function calculateMeal(items) {
  ensure(Array.isArray(items) && items.length > 0 && items.length <= 20, 'MEAL', 'Một bữa cần 1–20 món.');
  const result = items.map(raw => {
    const i = obj(raw), grams = num(i.grams, 1, 3000), low = num(i.gramsMin ?? grams, 1, grams), high = num(i.gramsMax ?? grams, grams, 4000), energy = num(i.kcalPer100g, 0, 950);
    return { name: text(i.name, 150), grams, gramsMin: low, gramsMax: high, kcalPer100g: energy,
      kcal: Math.round(grams * energy / 100), kcalMin: Math.floor(low * energy / 100), kcalMax: Math.ceil(high * energy / 100),
      source: text(i.source, 300), sourceType: choice(i.sourceType, ['USDA', 'member_label']), fdcId: i.fdcId ?? null };
  });
  return { items: result, kcal: result.reduce((n, i) => n + i.kcal, 0), kcalMin: result.reduce((n, i) => n + i.kcalMin, 0), kcalMax: result.reduce((n, i) => n + i.kcalMax, 0),
    estimate: true, uncertainty: 'Khoảng chỉ phản ánh ước lượng khẩu phần, chưa bao quát sai số công thức, dầu, cách nấu và cơ sở dữ liệu.' };
}
export function mealSummary(meals, incomplete = false) {
  const sum = key => incomplete ? null : meals.reduce((n, m) => n + m[key], 0);
  return { recordedMeals: meals.length, incomplete, kcal: sum('kcal'), kcalMin: sum('kcalMin'), kcalMax: sum('kcalMax'),
    note: 'Chỉ cộng các bữa đã xác nhận. Bữa chưa ghi không có nghĩa là bạn đã ăn 0 kcal.' };
}
export function nutritionAdvice(profile, catalogue, minutesUntilTraining = 60, phase = 'pre') {
  num(minutesUntilTraining, 0, 1440); choice(phase, ['pre', 'post']);
  ensure(!profile.needsProfessionalReview, 'PROFESSIONAL_REVIEW', 'Cần chuyên gia cho dinh dưỡng liên quan bệnh lý, thai kỳ hoặc rối loạn ăn uống.', 422);
  const timing = phase === 'post' ? 'post' : minutesUntilTraining <= 60 ? 'pre_soon' : 'pre_later';
  const templates = profile.allergies.length ? [] : (catalogue?.nutritionTemplates ?? []).filter(t => t.verified && t.diets.includes(profile.diet) && t.goals.includes(profile.goal) && [timing, 'post'].includes(t.timing));
  return { goal: profile.goal, diet: profile.diet, minutesUntilTraining, phase, templates, calorieTarget: null,
    notice: profile.allergies.length ? 'Có thông tin dị ứng: không tự suy đoán món ăn an toàn. Cần kiểm tra với chuyên gia và nơi bán.'
      : templates.length ? 'Các lựa chọn đã được phòng tập duyệt; không phải đơn dinh dưỡng hoặc khẩu phần bắt buộc.'
      : 'Chưa có mẫu ăn phù hợp mục tiêu, chế độ ăn và thời điểm được chuyên gia duyệt. Nhật ký ăn vẫn hoạt động.',
    limits: 'Không tự đặt thâm hụt kcal, kê thực phẩm bổ sung hoặc bù ăn bằng tập luyện. Chiều cao và cân nặng không đủ để kê chế độ ăn cá nhân.' };
}
export function personality(profile) {
  if (profile.style === 'direct') return `${profile.nickname}, đây là phương án dựa trên thời gian, dữ liệu đã ghi và thiết bị đã xác minh.`;
  if (profile.style === 'energetic') return `${profile.nickname}, mình tập có mục tiêu, không cần tập bằng mọi giá. Shine on. Sweat on.`;
  return `${profile.nickname}, mình chọn một buổi vừa sức nhé. Duy trì đều đặn quan trọng hơn cố vượt qua cơn đau.`;
}
