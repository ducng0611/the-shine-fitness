import { Router, type Request, type Response, type NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import type { IntentResult, RecordObject } from '../../../../shared/training';
import { TRAINING_GOALS } from '../../../../shared/training';
import { TrainingService } from './service';
import type { TrainingStore } from './store';
import { TrainingError, exactKeys, fail, id, number, object, oneOf, strings, text, uid } from './validation';
import { parseTrainingIntent } from './intent';

export interface TrainingIdentity { uid: string; email?: string; email_verified?: boolean }
interface TrainingRequest extends Request { trainingIdentity?: TrainingIdentity }
export interface TrainingRouterOptions {
  store: TrainingStore;
  verifyToken: (token: string) => Promise<TrainingIdentity>;
  enabled: () => boolean;
  pilotUids: () => string[];
  adminEmails: () => string[];
  parseIntent?: (message: string) => Promise<IntentResult>;
  clock?: () => number;
  rateLimit?: number;
}
export function createTrainingRouter(options: TrainingRouterOptions): Router {
  const router = Router(), service = new TrainingService(options.store, options.clock);
  const clock = options.clock ?? Date.now;
  router.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); res.setHeader('Vary', 'Authorization'); next(); });
  router.use(rateLimit({ windowMs: 60_000, limit: options.rateLimit ?? 120, standardHeaders: true, legacyHeaders: false }));
  router.use(async (req: TrainingRequest, res, next) => {
    try {
      const header = req.headers.authorization;
      if (!header?.startsWith('Bearer ') || header.length > 16_500) return res.status(401).json({ code: 'authentication_required', error: 'Sign in with Firebase.' });
      let identity: TrainingIdentity;
      try { identity = await options.verifyToken(header.slice(7)); } catch { return res.status(401).json({ code: 'invalid_token', error: 'Please sign in again.' }); }
      uid(identity.uid);
      if (identity.email_verified !== true) return res.status(403).json({ code: 'verified_email_required', error: 'Use a verified Firebase account.' });
      req.trainingIdentity = identity;
      const privacyRequest = (req.path === '/data' && req.method === 'DELETE') || (req.path === '/export' && req.method === 'GET');
      if (!options.enabled() && !privacyRequest) return res.status(503).json({ code: 'training_disabled', error: 'Training pilot is not enabled.' });
      // Explicit admission is independent from user-editable membership fields.
      if (!privacyRequest && !req.path.startsWith('/admin/')) {
        const access = options.pilotUids().includes(identity.uid) ? { enabled: true } : await options.store.get(`training_access/${identity.uid}`);
        const expiry = access && 'expiresAt' in access ? access.expiresAt : undefined;
        if (access?.enabled !== true || (expiry !== undefined && (typeof expiry !== 'string' || !Number.isFinite(Date.parse(expiry)) || Date.parse(expiry) <= clock()))) return res.status(403).json({ code: 'pilot_access_required', error: 'Ask an administrator to admit this Firebase UID to the training pilot.' });
      }
      next();
    } catch (error) { next(error); }
  });
  router.use(rateLimit({ windowMs: 5 * 60_000, limit: options.rateLimit ?? 100, keyGenerator: (req: TrainingRequest) => req.trainingIdentity!.uid, standardHeaders: true, legacyHeaders: false }));
  const handle = (fn: (req: TrainingRequest, res: Response) => Promise<unknown>) => (req: TrainingRequest, res: Response, next: NextFunction) => { Promise.resolve(fn(req, res)).catch(next); };
  const account = (req: TrainingRequest) => req.trainingIdentity!.uid;
  router.get('/context', handle(async (req, res) => res.json(await service.context(account(req)))));
  router.put('/profile', handle(async (req, res) => res.json({ profile: await service.saveProfile(account(req), req.body) })));
  router.put('/readiness', handle(async (req, res) => res.json({ readiness: await service.saveReadiness(account(req), req.body) })));
  router.post('/plans', handle(async (req, res) => res.json(await service.plan(account(req), req.body))));
  router.get('/plans/:id', handle(async (req, res) => res.json({ plan: await service.getPlan(account(req), req.params.id) })));
  router.post('/plans/:id/start', handle(async (req, res) => {
    const b = object(req.body); exactKeys(b, ['confirmed']);
    res.json({ plan: await service.start(account(req), req.params.id, b.confirmed) });
  }));
  router.post('/plans/:id/complete', handle(async (req, res) => res.json(await service.complete(account(req), req.params.id, req.body))));
  router.post('/plans/:id/cancel', handle(async (req, res) => {
    const b = object(req.body); exactKeys(b, ['confirmed']); if (b.confirmed !== true) fail('confirmation_required', 'Confirm cancellation.');
    await service.cancel(account(req), req.params.id); res.json({ cancelled: true });
  }));
  router.delete('/sessions/:id', handle(async (req, res) => {
    const b = object(req.body); exactKeys(b, ['confirmed']); await service.deleteSession(account(req), req.params.id, b.confirmed); res.json({ deleted: true });
  }));
  router.post('/chat', handle(async (req, res) => {
    const b = object(req.body); exactKeys(b, ['message']); const message = text(b.message, 'message', 600);
    const lexical = parseTrainingIntent(message);
    const intent = lexical.intent === 'safety' || lexical.intent === 'past_report' ? lexical : await (options.parseIntent ?? (async m => parseTrainingIntent(m)))(message);
    const replyCode = intent.intent === 'plan' ? 'confirm_readiness_to_plan' : intent.intent === 'past_report' ? 'past_report_not_saved' : intent.intent === 'history' ? 'show_confirmed_history' : intent.intent === 'safety' ? 'professional_review_required' : 'training_actions_help';
    res.json({ intent, replyCode, saved: false }); // No chat log or implicit memory mutation.
  }));
  router.get('/export', handle(async (req, res) => {
    const root = service.root(account(req));
    const [profile, plans, sessions, measurements] = await Promise.all([options.store.get(root), options.store.list(`${root}/plans`, { limit: 1001 }), options.store.list(`${root}/sessions`, { limit: 1001 }), options.store.list(`${root}/measurements`, { limit: 1001 })]);
    if (plans.length > 1000 || sessions.length > 1000 || measurements.length > 1000) fail('export_limit', 'This account requires an administrator-assisted paginated export.', 409);
    res.json({ exportedAt: new Date(clock()).toISOString(), scope: 'step3_training_only', profile, plans, sessions, measurements });
  }));
  router.delete('/data', handle(async (req, res) => {
    const b = object(req.body); exactKeys(b, ['confirmed']); await service.removeData(account(req), b.confirmed); res.json({ deleted: true, scope: 'step3_training_only', legacyDataUnchanged: true });
  }));
  router.put('/admin/exercises/:id/prescription', handle(async (req, res) => {
    const identity = req.trainingIdentity!;
    if (!options.adminEmails().includes((identity.email ?? '').trim().toLowerCase())) fail('admin_required', 'Administrator access is required.', 403);
    const b = object(req.body); exactKeys(b, ['expectedRevision', 'prescription', 'reviewConfirmed']);
    if (b.reviewConfirmed !== true) fail('human_review_required', 'A qualified reviewer must check this prescription before approval.');
    const expected = number(b.expectedRevision, 'revision', 1, 1e9, true), p = object(b.prescription);
    exactKeys(p, ['sets', 'repsMin', 'repsMax', 'restSeconds', 'secondsPerRep', 'setupSeconds', 'goals']);
    const prescription = { sets: number(p.sets, 'sets', 1, 5, true), repsMin: number(p.repsMin, 'repsMin', 1, 30, true), repsMax: number(p.repsMax, 'repsMax', 1, 30, true),
      restSeconds: number(p.restSeconds, 'restSeconds', 15, 300, true), secondsPerRep: number(p.secondsPerRep, 'secondsPerRep', 1, 15), setupSeconds: number(p.setupSeconds, 'setupSeconds', 0, 300, true),
      goals: strings(p.goals, 'goals', 6).map(g => oneOf(g, TRAINING_GOALS, 'goal')), reviewedAgainstRevision: expected + 1, reviewed: true, reviewedBy: identity.uid, reviewedAt: new Date(clock()).toISOString() };
    if (!prescription.goals.length || prescription.repsMin > prescription.repsMax) fail('invalid_prescription', 'Check goals and rep range.');
    const path = `gym_exercises/${id(req.params.id)}`;
    await options.store.atomic(async tx => {
      const ex = await tx.get(path);
      if (!ex) fail('exercise_not_found', 'Exercise not found.', 404);
      if (ex.revision !== expected) fail('revision_conflict', 'Reload the latest exercise before editing.', 409);
      if (ex.SAMPLE_DATA_ONLY === true) fail('sample_not_publishable', 'Synthetic examples cannot be approved for members.');
      tx.set(path, { ...ex, trainingPrescription: prescription, revision: expected + 1, updatedAt: prescription.reviewedAt });
    });
    res.json({ saved: true, revision: expected + 1 });
  }));
  router.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof TrainingError) return res.status(error.status).json({ code: error.code, error: error.message });
    // Do not leak Firestore internals, request bodies or member details into shared logs.
    res.status(503).json({ code: 'service_unavailable', error: 'Training service is temporarily unavailable. No successful write is claimed; refresh before retrying.' });
  });
  return router;
}
