import express, { type Express, type Response, type NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { createHash, randomUUID } from 'node:crypto';
import { adminDb, adminAuth } from '../lib/firebase-admin.ts';
import { CloudMemberSourceReader, importMemberSources } from '../memberSources/cloud.ts';
import { firestoreSourceStore, firebaseAuthAdmin } from '../memberSources/firebase.ts';
import { requireAuth, requireAdmin, type AuthRequest } from '../middleware/auth.ts';
import { DomainError, ensure, obj, text, num, id, validateProfile, validateCatalogue, planWorkout,
  completeWorkout, calculateMeal, mealSummary, dayBounds, safetyIssue, nutritionAdvice, personality } from './core.mjs';
import { classifyMessage, analyzeFood, searchFoods, foodEnergy, nearbyFood } from './providers.ts';
import bundledCatalogueSource from '../../../data/companion/the-shine-catalogue.json';

type Handler = (req: AuthRequest, res: Response) => Promise<any>;
const wrap = (fn: Handler) => (req: AuthRequest, res: Response, next: NextFunction) => { Promise.resolve(fn(req, res)).catch(next); };
const hash = (v: unknown) => createHash('sha256').update(JSON.stringify(v)).digest('hex');
const root = (req: AuthRequest) => { ensure(req.user?.uid, 'AUTH', 'Cần đăng nhập Firebase.', 401); return adminDb.collection('companion_members').doc(req.user!.uid); };
const catalogRef = () => adminDb.collection('companion_catalogues').doc('the-shine');
const admin = (req: AuthRequest) => Boolean(req.user?.email_verified && (process.env.ADMIN_EMAILS ?? '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean).includes((req.user?.email ?? '').toLowerCase()));
async function profile(req: AuthRequest) {
  const data = (await root(req).get()).data();
  ensure(data?.state === 'active' && data.profile?.consent === true && data.profile?.consentVersion === 'shine-companion-v1', 'PROFILE_REQUIRED', 'Hoàn tất hồ sơ và đồng ý quyền riêng tư trước.', 428);
  return data!.profile;
}
async function activeInTransaction(tx: any, ref: any, revision: string) {
  const snap = await tx.get(ref);
  ensure(snap.data()?.state === 'active' && snap.data()?.profile?.revision === revision, 'CONTEXT_CHANGED', 'Hồ sơ đã thay đổi hoặc đang xóa. Tải lại trước khi tiếp tục.', 409);
}
// Owner-approved default (gym inventory + matching exercises), validated at start-up. Used
// until an admin saves a catalogue in Firestore; it has no revision so that first save
// passes the expectedRevision === null check.
const bundledCatalogue = validateCatalogue(bundledCatalogueSource);
async function catalogue(): Promise<Record<string, any>> { return (await catalogRef().get()).data() ?? bundledCatalogue; }
async function history(req: AuthRequest) {
  const snap = await root(req).collection('workouts').orderBy('occurredAt', 'desc').limit(80).get();
  const workouts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  let legacy: any[] = [], legacyAvailable = true, legacyTruncated = false;
  try {
    // Only explicit ownership. Never merge by a client-supplied email, phone or member code.
    const old = await adminDb.collection('workout_logs').where('userId', '==', req.user!.uid).limit(100).get();
    legacyTruncated = old.size === 100;
    legacy = old.docs.map(d => { const v = d.data(); return { id: d.id, occurredAt: typeof v.occurredAt === 'string' ? v.occurredAt : typeof v.createdAt === 'string' ? v.createdAt : null,
      groups: Array.isArray(v.groups) ? v.groups : [], source: 'legacy', schemaIncomplete: !Array.isArray(v.groups) }; });
  } catch { legacyAvailable = false; }
  return { workouts, legacy, legacyAvailable, legacyTruncated, note: 'Nhật ký cũ không có nhóm cơ rõ ràng sẽ không được AI tự đoán để tính lịch phục hồi.' };
}
async function diary(req: AuthRequest, p: any) {
  const bounds = dayBounds(new Date(), p.timezone);
  const snap = await root(req).collection('meals').where('occurredAt', '>=', bounds.start).where('occurredAt', '<', bounds.end).orderBy('occurredAt', 'desc').limit(301).get();
  const meals = snap.docs.slice(0, 300).map(d => ({ id: d.id, ...d.data() })).filter((m: any) => !m.deleted);
  return { ...bounds, timezone: p.timezone, meals, summary: mealSummary(meals, snap.size > 300) };
}
async function newPlan(req: AuthRequest, p: any, input: any) {
  const [cat, h] = await Promise.all([catalogue(), history(req)]);
  const draft = planWorkout(p, input, cat, [...h.workouts, ...h.legacy]), ref = root(req).collection('plans').doc();
  const plan = { ...draft, id: ref.id, historyWarning: !h.legacyAvailable || h.legacyTruncated };
  await adminDb.runTransaction(async tx => { await activeInTransaction(tx, root(req), p.revision); tx.set(ref, plan); });
  return { kind: 'workout', message: personality(p), plan };
}
function safetyReply(kind: string) {
  return { kind: 'safety', severity: kind, saved: false, action: 'human_review', message: kind === 'urgent'
    ? 'Dừng tập. Nếu đang đau ngực, ngất hoặc khó thở nghiêm trọng, hãy tìm trợ giúp y tế ngay hoặc gọi cấp cứu địa phương. Không chờ chatbot.'
    : 'Mình không tạo bài tập hay chế độ ăn điều trị cho tình huống này. Hãy trao đổi với HLV và chuyên gia y tế phù hợp. Bạn vẫn có thể ghi nhật ký thực tế.' };
}
async function draftFood(message: string, image?: any) {
  const analysis = await analyzeFood(message, image); const foods: any[] = [];
  if (analysis.isFood) for (const item of analysis.foods) {
    let match: any = { configured: Boolean(process.env.USDA_FDC_API_KEY), foods: [] };
    try { match = await searchFoods(item.searchTerm); } catch { match.unavailable = true; }
    foods.push({ ...item, candidates: match.foods, databaseConfigured: match.configured, databaseUnavailable: match.unavailable ?? false });
  }
  return { kind: 'meal_draft', question: analysis.question, foods, saved: false,
    message: 'Đây mới là bản nháp. Kiểm tra món, cách chế biến và khẩu phần rồi xác nhận đã ăn. Ảnh không cho biết kcal chính xác.' };
}
async function advice(req: AuthRequest, p: any, minutes: number, phase = 'pre') {
  const [cat, d] = await Promise.all([catalogue(), diary(req, p)]);
  return { kind: 'nutrition', ...nutritionAdvice(p, cat, minutes, phase), diary: { date: d.date, summary: d.summary },
    lastRecordedMeal: d.meals[0] ?? null, message: personality(p),
    contextNote: 'Bữa vừa ghi chỉ là dữ liệu đã báo, không chứng minh bạn đói hay cần ăn thêm. Mẫu ăn không tự động cộng vào nhật ký.' };
}

/** Register before the legacy express.json() so the food-photo payload has its own limit. */
export function registerCompanionRoutes(app: Express) {
  const r = express.Router(); app.use('/api/companion/member', r); // not /api/companion: must not shadow /training or /catalogue
  r.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'private, no-store'); res.setHeader('X-Content-Type-Options', 'nosniff');
    if (process.env.SHINE_COMPANION_ENABLED !== 'true') return res.status(503).json({ code: 'FEATURE_DISABLED', error: 'Shine Companion chưa được bật.' }); next();
  });
  r.use(requireAuth);
  r.use(rateLimit({ windowMs: 60000, limit: 30, standardHeaders: true, legacyHeaders: false,
    keyGenerator: (req: AuthRequest) => req.user!.uid, message: { code: 'RATE_LIMIT', error: 'Bạn gửi quá nhiều yêu cầu. Vui lòng thử lại sau.' } }));
  r.use(express.json({ limit: '2mb', strict: true }));

  r.get('/context', wrap(async (req, res) => {
    const [member, cat, doc] = await Promise.all([adminDb.collection('members').doc(req.user!.uid).get(), catalogue(), root(req).get()]);
    const p = doc.data()?.state === 'active' ? doc.data()?.profile ?? null : null;
    const plans = p ? await root(req).collection('plans').orderBy('createdAt', 'desc').limit(10).get() : null;
    const pendingPlan = plans?.docs.map(d => ({ id: d.id, ...d.data() })).find((d: any) => d.status === 'proposed' && d.profileRevision === p.revision && Date.parse(d.expiresAt) > Date.now()) ?? null;
    res.json({ profile: p, memberName: member.data()?.fullName ?? '', isAdmin: admin(req), pendingPlan,
      capabilities: { ai: Boolean(process.env.GEMINI_API_KEY && process.env.SHINE_GEMINI_MODEL), nutritionDatabase: Boolean(process.env.USDA_FDC_API_KEY), nearbyPlaces: Boolean(process.env.GOOGLE_PLACES_API_KEY) },
      catalogue: cat ? { verified: cat.verified, revision: cat.revision, equipment: cat.equipment } : null,
      history: p ? await history(req) : null, diary: p ? await diary(req, p) : null, serverTime: new Date().toISOString() });
  }));
  r.put('/profile', wrap(async (req, res) => {
    const p = { ...validateProfile(req.body), revision: randomUUID(), updatedAt: new Date().toISOString() }, ref = root(req);
    await adminDb.runTransaction(async tx => {
      const snap = await tx.get(ref); ensure(snap.data()?.state !== 'deleting', 'DELETION_IN_PROGRESS', 'Dữ liệu đang được xóa. Chưa thể tạo hồ sơ mới.', 409);
      tx.set(ref, { state: 'active', profile: p }, { merge: true });
      if (snap.data()?.profile?.weightKg !== p.weightKg || snap.data()?.profile?.heightCm !== p.heightCm)
        tx.set(ref.collection('measurements').doc(p.revision), { weightKg: p.weightKg, heightCm: p.heightCm, occurredAt: p.updatedAt, source: 'member_reported' });
    }); res.json({ profile: p });
  }));
  r.get('/diary', wrap(async (req, res) => { res.json(await diary(req, await profile(req))); }));
  r.post('/workouts/plan', wrap(async (req, res) => { res.json(await newPlan(req, await profile(req), req.body)); }));
  r.post('/chat', wrap(async (req, res) => {
    const p = await profile(req), body = obj(req.body), message = text(body.message, 2000), issue = safetyIssue(message);
    if (issue) return res.json(safetyReply(issue));
    ensure(!body.history || (Array.isArray(body.history) && body.history.length <= 20), 'INPUT', 'Lịch sử hội thoại không hợp lệ.');
    const intent = await classifyMessage(message, body.history ?? []);
    if (intent.safety !== 'none' || intent.intent === 'safety') return res.json(safetyReply(intent.safety === 'urgent' ? 'urgent' : 'professional'));
    switch (intent.intent) {
      case 'workout': return res.json(await newPlan(req, p, { ...obj(body.readiness), focus: intent.focus, durationMinutes: intent.durationMinutes ?? body.readiness.durationMinutes }));
      case 'meal': return res.json(await draftFood(message));
      case 'nutrition': return res.json(await advice(req, p, intent.minutesUntilTraining ?? 60, intent.phase));
      case 'progress': return res.json({ kind: 'progress', history: await history(req), diary: await diary(req, p), message: 'Mở Nhật ký để xem các bữa và buổi tập đã xác nhận.' });
      case 'nearby': return res.json({ kind: 'location_required', message: 'Nhấn “Quán gần đây” để chia sẻ vị trí cho một lần tìm kiếm. Mình không tự lấy hoặc lưu vị trí.' });
      case 'log_workout': return res.json({ kind: 'completion_required', message: 'Nhập các hiệp đã thực hiện trong thẻ buổi tập rồi xác nhận. Mình không tự đánh dấu cả giáo án là hoàn tất.' });
      default: return res.json({ kind: 'message', message: 'Mình hỗ trợ buổi tập theo thiết bị gym, dinh dưỡng đã duyệt, nhật ký ăn và tiến độ. Với bảng giá hoặc hội viên, chuyển sang Tư vấn dịch vụ nhé.' });
    }
  }));
  r.post('/workouts/:planId/complete', wrap(async (req, res) => {
    const p = await profile(req), body = obj(req.body), planId = id(req.params.planId), ref = root(req), planRef = ref.collection('plans').doc(planId), logRef = ref.collection('workouts').doc(planId);
    ensure(body.confirmed === true, 'CONFIRMATION_REQUIRED', 'Xác nhận phần đã tập.');
    const fingerprint = hash({ sets: body.sets, durationMinutes: body.durationMinutes, painReported: body.painReported === true });
    const result = await adminDb.runTransaction(async tx => {
      await activeInTransaction(tx, ref, p.revision);
      const existing = await tx.get(logRef);
      if (existing.exists) { ensure(existing.data()?.fingerprint === fingerprint, 'ALREADY_COMPLETED', 'Buổi này đã có nhật ký khác.', 409); return { id: planId, saved: true, replay: true }; }
      const snap = await tx.get(planRef); ensure(snap.exists, 'NOT_FOUND', 'Không tìm thấy buổi tập trong tài khoản của bạn.', 404);
      const plan = snap.data()!;
      ensure(plan.status === 'proposed' && plan.profileRevision === p.revision && Date.parse(plan.expiresAt) > Date.now(), 'STALE_PLAN', 'Buổi tập đã hết hạn hoặc hồ sơ thay đổi; cần HLV kiểm tra nhật ký này.', 409);
      const log = completeWorkout(plan, body);
      tx.set(logRef, { ...log, fingerprint, planId }); tx.update(planRef, { status: log.status, completedAt: log.occurredAt });
      return { id: planId, saved: true, replay: false, workout: log };
    }); res.json(result);
  }));
  r.post('/nutrition/advice', wrap(async (req, res) => { const p = await profile(req); res.json(await advice(req, p, num(req.body.minutesUntilTraining, 0, 1440), req.body.phase ?? 'pre')); }));
  r.post('/food/analyze', wrap(async (req, res) => {
    const p = await profile(req), body = obj(req.body);
    if (body.image) ensure(p.photoConsent === true && body.photoConsent === true, 'PHOTO_CONSENT', 'Cần đồng ý riêng trước khi gửi ảnh món ăn cho Gemini.', 403);
    const message = body.message ? text(body.message, 2000) : ''; ensure(message || body.image, 'INPUT', 'Cần ảnh hoặc mô tả món ăn.');
    res.json(await draftFood(message, body.image));
  }));
  r.get('/foods/search', wrap(async (req, res) => { await profile(req); res.json(await searchFoods(text(req.query.q, 150))); }));
  r.post('/meals', wrap(async (req, res) => {
    const p = await profile(req), body = obj(req.body), ref = root(req); ensure(body.confirmed === true, 'CONFIRMATION_REQUIRED', 'Xác nhận bạn đã ăn trước khi lưu.');
    const requestId = id(body.requestId); ensure(Array.isArray(body.items) && body.items.length > 0 && body.items.length <= 20, 'MEAL', 'Cần 1–20 món.');
    const occurredAt = new Date(body.occurredAt ?? new Date().toISOString());
    ensure(Number.isFinite(occurredAt.getTime()) && occurredAt.getTime() <= Date.now() + 60000 && occurredAt.getTime() >= Date.now() - 30 * 86400000, 'DATE', 'Chỉ ghi bữa trong 30 ngày gần nhất, không ghi bữa dự kiến.');
    const mealRef = ref.collection('meals').doc(hash({ requestId })), fingerprint = hash({ items: body.items, occurredAt: body.occurredAt ?? null });
    const prior = await mealRef.get();
    if (prior.exists) { ensure(prior.data()?.fingerprint === fingerprint, 'IDEMPOTENCY_CONFLICT', 'Mã yêu cầu đã dùng cho bữa khác.', 409); return res.json({ id: mealRef.id, saved: true, replay: true }); }
    const items: any[] = [];
    for (const raw of body.items) {
      const item = obj(raw), source = item.fdcId != null ? await foodEnergy(num(item.fdcId, 1, 1000000000))
        : { name: text(item.name, 150), kcalPer100g: num(item.kcalPer100g, 0, 950), source: text(item.source, 300), sourceType: 'member_label' };
      items.push({ ...source, grams: item.grams, gramsMin: item.gramsMin, gramsMax: item.gramsMax });
    }
    const meal = { ...calculateMeal(items), occurredAt: occurredAt.toISOString(), timezoneAtEntry: p.timezone, savedAt: new Date().toISOString(), source: 'member_confirmed', deleted: false, fingerprint };
    const replay = await adminDb.runTransaction(async tx => {
      await activeInTransaction(tx, ref, p.revision); const existing = await tx.get(mealRef);
      if (existing.exists) { ensure(existing.data()?.fingerprint === fingerprint, 'IDEMPOTENCY_CONFLICT', 'Mã yêu cầu đã dùng cho bữa khác.', 409); return true; }
      tx.set(mealRef, meal); return false;
    }); res.json({ id: mealRef.id, saved: true, replay, meal });
  }));
  r.delete('/meals/:id', wrap(async (req, res) => {
    const p = await profile(req), ref = root(req), mealRef = ref.collection('meals').doc(id(req.params.id));
    await adminDb.runTransaction(async tx => { await activeInTransaction(tx, ref, p.revision); const snap = await tx.get(mealRef);
      ensure(snap.exists, 'NOT_FOUND', 'Bữa ăn không thuộc tài khoản của bạn.', 404); tx.update(mealRef, { deleted: true, deletedAt: new Date().toISOString() }); });
    res.json({ deleted: true });
  }));
  r.post('/places/nearby', wrap(async (req, res) => { await profile(req); res.json({ kind: 'places', ...await nearbyFood(req.body) }); }));
  r.post('/handover', wrap(async (req, res) => {
    const p = await profile(req), reason = text(req.body.reason, 500), ref = root(req), request = ref.collection('handover').doc();
    await adminDb.runTransaction(async tx => { await activeInTransaction(tx, ref, p.revision);
      tx.set(request, { reason, status: 'requested', createdAt: new Date().toISOString(), consentToShareWithStaff: req.body.consentToShareWithStaff === true }); });
    res.json({ id: request.id, status: 'requested', message: 'Đã ghi yêu cầu, chưa đặt lịch hoặc xác nhận HLV đã nhận. Hãy liên hệ phòng tập trực tiếp nếu cần ngay.' });
  }));
  r.get('/export', wrap(async (req, res) => {
    const p = await profile(req), result: any = { profile: p };
    for (const name of ['plans', 'workouts', 'meals', 'measurements', 'handover']) { const snap = await root(req).collection(name).get(); result[name] = snap.docs.map(d => ({ id: d.id, ...d.data() })); }
    res.setHeader('Content-Disposition', 'attachment; filename="shine-companion-data.json"'); res.json(result);
  }));
  r.delete('/data', wrap(async (req, res) => {
    ensure(req.body.confirmation === 'DELETE_MY_COMPANION_DATA', 'CONFIRMATION_REQUIRED', 'Cần xác nhận xóa.');
    const ref = root(req);
    await adminDb.runTransaction(async tx => { const snap = await tx.get(ref); if (snap.exists) tx.set(ref, { state: 'deleting' }, { merge: true }); });
    // Root tombstone blocks writes and profile recreation until all child collections are deleted.
    for (const name of ['plans', 'workouts', 'meals', 'measurements', 'handover']) await adminDb.recursiveDelete(ref.collection(name));
    await ref.delete(); res.json({ deleted: true, scope: 'Dữ liệu Companion; không xóa hội viên hoặc dữ liệu legacy.' });
  }));
  // Member source records imported from the Local Pilot: the owner reads only their own card.
  const sourceStore = firestoreSourceStore(adminDb), sources = new CloudMemberSourceReader(sourceStore, process.cwd());
  r.get('/source-profile', wrap(async (req, res) => { res.json({ sourceProfile: await sources.profileCard(req.user!.uid) }); }));
  // Admin import: dry run by default; apply creates virtual accounts (plus-addressed mailbox)
  // and writes the records in one batch. New passwords are returned once and never stored.
  r.post('/admin/member-sources/import', requireAdmin, wrap(async (req, res) => {
    const body = obj(req.body);
    try {
      res.json(await importMemberSources({ payload: body.document, emailBase: text(body.emailBase, 120), apply: body.apply === true,
        store: sourceStore, auth: firebaseAuthAdmin(adminAuth), root: process.cwd() }));
    } catch (e: any) {
      // Validation and conflict messages help the admin fix the document; Firebase errors (with a code) stay generic.
      if (e instanceof Error && !(e as any).code) throw new DomainError('MEMBER_IMPORT', e.message, 400);
      throw e;
    }
  }));
  r.get('/admin/catalogue', requireAdmin, wrap(async (_req, res) => { res.json(await catalogue() ?? { verified: false, equipment: [], exercises: [], nutritionTemplates: [] }); }));
  r.put('/admin/catalogue', requireAdmin, wrap(async (req, res) => {
    const body = obj(req.body), cat = { ...validateCatalogue(body.catalogue), revision: randomUUID(), reviewedByUid: req.user!.uid, updatedAt: new Date().toISOString() };
    ensure(Buffer.byteLength(JSON.stringify(cat), 'utf8') < 900000, 'CATALOGUE_TOO_LARGE', 'Danh mục vượt giới hạn pilot. Chia nhỏ dữ liệu trước khi lưu.');
    await adminDb.runTransaction(async tx => { const snap = await tx.get(catalogRef()); ensure((snap.data()?.revision ?? null) === (body.expectedRevision ?? null), 'CATALOGUE_CONFLICT', 'Danh mục đã thay đổi; tải lại trước khi lưu.', 409); tx.set(catalogRef(), cat); }); res.json(cat);
  }));
  r.use((error: any, req: AuthRequest, res: Response, _next: NextFunction) => {
    const traceId = randomUUID(), known = error instanceof DomainError;
    const status = known ? error.status : error.type === 'entity.too.large' ? 413 : error.type === 'entity.parse.failed' ? 400 : 500;
    console.warn('[shine-companion]', { traceId, method: req.method, route: req.route?.path ?? 'request', code: known ? error.code : 'UNEXPECTED' });
    res.status(status).json({ code: known ? error.code : 'REQUEST_FAILED', error: known ? error.message : status === 413 ? 'Ảnh quá lớn.' : status === 400 ? 'JSON không hợp lệ.' : 'Không xác nhận được kết quả yêu cầu. Nếu đang lưu, thử lại cùng mã yêu cầu để tránh ghi trùng.', traceId });
  });
}
