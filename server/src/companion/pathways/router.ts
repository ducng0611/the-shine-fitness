import { Router, json, type Request, type Response, type NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { createHash } from 'node:crypto';
import { parsePathwayBundle, assessPathway, record, safeId, PathwayInputError } from '../../../../shared/pathwayIntake';
import type { TrainingStore } from '../training/store';
import { uid } from '../training/validation';
interface Identity { uid: string; email?: string; email_verified?: boolean }
interface AuthenticatedRequest extends Request { pathwayIdentity?: Identity }
export interface PathwayRouterOptions {
  store: TrainingStore; verifyToken: (token: string) => Promise<Identity>;
  enabled: () => boolean; adminEmails: () => string[]; clock?: () => number;
}
export function createPathwayRouter(options: PathwayRouterOptions) {
  const router = Router(), now = () => new Date((options.clock ?? Date.now)()).toISOString();
  router.use((_req, res, next) => { res.setHeader('Cache-Control','no-store'); res.setHeader('Vary','Authorization'); next(); });
  router.use(rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: true, legacyHeaders: false }));
  router.use(async (req: AuthenticatedRequest, res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ') || header.length > 16_500) { res.status(401).json({ code: 'authentication_required' }); return; }
    try {
      const identity = await options.verifyToken(header.slice(7)); uid(identity.uid);
      const allowed = options.adminEmails().map(e => e.trim().toLowerCase()).filter(Boolean);
      if (identity.email_verified !== true || !allowed.includes((identity.email ?? '').trim().toLowerCase())) { res.status(403).json({ code: 'admin_required' }); return; }
      req.pathwayIdentity = identity;
      // Privacy retrieval/deletion remains possible when the feature is disabled.
      if (!options.enabled() && req.method !== 'GET' && req.method !== 'DELETE') { res.status(503).json({ code: 'pathway_intake_disabled' }); return; }
      next();
    } catch { res.status(401).json({ code: 'invalid_token' }); }
  });
  router.use(json({ limit: '240kb', strict: true }));
  const handle = (fn: (req: AuthenticatedRequest, res: Response) => Promise<unknown>) => (req: AuthenticatedRequest,res:Response,next:NextFunction) => { void Promise.resolve(fn(req,res)).catch(next); };
  const root = (req: AuthenticatedRequest) => `pathway_intake_owners/${uid(req.pathwayIdentity!.uid)}/cases`;
  const casePath = (req: AuthenticatedRequest) => `${root(req)}/${safeId(req.params.id)}`;
  const expected = (v: unknown) => { if (!Number.isSafeInteger(v) || (v as number) < 0 || (v as number) > 1e9) throw new PathwayInputError('invalid_revision'); return v as number; };
  const requireExisting = (d: Record<string,unknown> | null) => { if (!d || d.deleted === true) throw new PathwayInputError('case_not_found',404); return d; };
  router.post('/preview', handle(async (req,res) => {
    const body = record(req.body,['bundle']); const bundle = parsePathwayBundle(body.bundle);
    res.json({ review: assessPathway(bundle), databaseWrites: 0 });
  }));
  router.get('/cases', handle(async (req,res) => {
    const all = await options.store.list(root(req), { limit: 51, order: { field: 'updatedAt', direction: 'desc' } });
    res.json({ cases: all.slice(0,50).filter(d => !d.deleted).map(d => ({ id: d.id, revision: d.revision, state: d.state, updatedAt: d.updatedAt, review: d.review })), truncated: all.length > 50 });
  }));
  router.get('/cases/:id', handle(async (req,res) => {
    const d = requireExisting(await options.store.get(casePath(req)));
    // Internal retry hash and actor information are not needed on the client.
    const { writeHash, writeExpectedRevision, ...visible } = d;
    res.json({ case: visible });
  }));
  router.put('/cases/:id', handle(async (req,res) => {
    const body = record(req.body,['bundle','expectedRevision','privacyConfirmed']);
    if (body.privacyConfirmed !== true) throw new PathwayInputError('privacy_confirmation_required');
    const bundle = parsePathwayBundle(body.bundle), revision = expected(body.expectedRevision);
    const hash = createHash('sha256').update(JSON.stringify(bundle)).digest('hex');
    const path = casePath(req), id = safeId(req.params.id), timestamp = now();
    const result = await options.store.atomic(async tx => {
      const old = await tx.get(path);
      if (old?.deleted) throw new PathwayInputError('deleted_case_cannot_be_recreated',409);
      if (old && old.writeHash === hash && old.writeExpectedRevision === revision) return { id, revision: old.revision, replay: true, state: old.state };
      if ((old?.revision ?? 0) !== revision) throw new PathwayInputError('revision_conflict',409);
      const data = { id, revision: revision + 1, state: 'draft', bundle,
        originalBundle: old?.originalBundle ?? bundle, review: assessPathway(bundle),
        createdAt: old?.createdAt ?? timestamp, updatedAt: timestamp, reviewedAt: null, reviewedBy: null,
        writeHash: hash, writeExpectedRevision: revision };
      tx.set(path,data);
      return { id, revision: data.revision, replay: false, state: 'draft' };
    });
    res.json(result);
  }));
  router.post('/cases/:id/review', handle(async (req,res) => {
    const body = record(req.body,['expectedRevision','transcriptionConfirmed','notAPrescriptionConfirmed']);
    if (body.transcriptionConfirmed !== true || body.notAPrescriptionConfirmed !== true) throw new PathwayInputError('review_confirmation_required');
    const revision = expected(body.expectedRevision), path = casePath(req);
    await options.store.atomic(async tx => {
      const d = requireExisting(await tx.get(path));
      if (d.revision !== revision) throw new PathwayInputError('revision_conflict',409);
      const review = assessPathway(parsePathwayBundle(d.bundle));
      if (!review.readyForSourceReview) throw new PathwayInputError('unresolved_source_issues',409);
      tx.set(path,{...d,revision:revision+1,state:'source_reviewed',reviewedAt:now(),reviewedBy:req.pathwayIdentity!.uid,writeHash:null,writeExpectedRevision:null});
    });
    res.json({ state: 'source_reviewed', revision: revision+1, eligibleForPlanner: false });
  }));
  router.delete('/cases/:id', handle(async (req,res) => {
    const body = record(req.body,['expectedRevision','confirmed']); if (body.confirmed !== true) throw new PathwayInputError('confirmation_required');
    const revision = expected(body.expectedRevision), path = casePath(req);
    await options.store.atomic(async tx => {
      const d = await tx.get(path);
      if (d?.deleted === true && d.revision === revision+1) return;
      requireExisting(d); if (d!.revision !== revision) throw new PathwayInputError('revision_conflict',409);
      // Replace all source and original content with a minimal retry tombstone.
      tx.set(path,{ id:safeId(req.params.id),deleted:true,revision:revision+1,updatedAt:now() });
    });
    res.json({deleted:true});
  }));
  router.use((error: unknown,_req:Request,res:Response,_next:NextFunction) => {
    if (error instanceof PathwayInputError) { res.status(error.status).json({code:error.code}); return; }
    const e = error as {type?:string};
    if (e?.type === 'entity.too.large') { res.status(413).json({code:'source_bundle_too_large'}); return; }
    if (e?.type === 'entity.parse.failed') { res.status(400).json({code:'invalid_json'}); return; }
    // Never log a request, source body, medical notes or raw provider/storage error.
    res.status(503).json({code:'pathway_storage_unavailable'});
  });
  return router;
}
