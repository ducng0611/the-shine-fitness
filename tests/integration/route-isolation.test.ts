import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { registerCompanionRoutes } from '../../server/src/companion/router.ts';

// Same order as server/src/index.ts: Companion is registered before the
// Training/Buddy router and the gym catalogue endpoints.
async function withServer(run: (base: string) => Promise<void>) {
  const app = express();
  registerCompanionRoutes(app);
  app.use('/api/companion/training', (_req, res) => { res.json({ reached: 'training' }); });
  app.get('/api/companion/catalogue', (_req, res) => { res.json({ reached: 'catalogue' }); });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try { await run(`http://127.0.0.1:${(server.address() as AddressInfo).port}`); }
  finally { await new Promise(resolve => server.close(resolve)); }
}

for (const enabled of ['false', 'true']) {
  test(`Companion (enabled=${enabled}) does not shadow Training/Buddy or the catalogue`, async () => {
    const previous = process.env.SHINE_COMPANION_ENABLED;
    process.env.SHINE_COMPANION_ENABLED = enabled;
    try {
      await withServer(async base => {
        for (const [path, reached] of [['/api/companion/training/buddy/sessions', 'training'], ['/api/companion/catalogue', 'catalogue']]) {
          const res = await fetch(base + path);
          assert.equal(res.status, 200, path);
          assert.deepEqual(await res.json(), { reached });
        }
        // The Companion router itself still guards its own prefix.
        const member = await fetch(base + '/api/companion/member/context');
        assert.equal(member.status, enabled === 'true' ? 401 : 503);
      });
    } finally {
      if (previous === undefined) delete process.env.SHINE_COMPANION_ENABLED; else process.env.SHINE_COMPANION_ENABLED = previous;
    }
  });
}
