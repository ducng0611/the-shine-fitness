import { Router } from 'express';
import { createTrainingRouter as createLegacyTrainingRouter } from './legacyRouter';
import type { TrainingRouterOptions } from './legacyRouter';
import { createConfiguredBuddyRouter } from '../../buddy/configured';
export type { TrainingRouterOptions, TrainingIdentity } from './legacyRouter';

/** Composition boundary: public/member chat owns its auth; legacy training stays protected.
 * Mounted by the existing application at /api/companion/training.
 * Buddy endpoints never fall through to legacy /api/chat on failure.
 */
export function createTrainingRouter(options: TrainingRouterOptions): Router {
  const router = Router();
  router.use('/buddy', createConfiguredBuddyRouter(options));
  router.use(createLegacyTrainingRouter(options));
  return router;
}
