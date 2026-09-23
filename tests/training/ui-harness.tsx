/** TEST HARNESS ONLY. Not an application route or authentication fallback.
 * The synthetic identity is accepted only by the loopback test server. The real
 * Firebase identity/permissions are exercised separately by emulator tests.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { TrainingWorkspace } from '../../src/components/training/TrainingWorkspace';
import { TrainingApiError, type TrainingApi } from '../../src/components/training/api';

const controllers = new Set<AbortController>();
const api: TrainingApi = {
  async request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
    const controller = new AbortController();
    controllers.add(controller);
    const timer = setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch('/api/companion/training' + path, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ui-test-member' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: controller.signal,
        cache: 'no-store'
      });
      const value = await response.json();
      if (!response.ok) throw new TrainingApiError(value.code ?? 'request_failed', value.error ?? 'Request failed.', response.status);
      return value as T;
    } catch (error) {
      if (error instanceof TrainingApiError) throw error;
      // Match createTrainingApi: a lost response has an uncertain write outcome.
      // Do not let a raw fetch TypeError exercise a different UI branch here.
      throw new TrainingApiError('connection_uncertain', 'Connection interrupted. Refresh to check what was saved before retrying.');
    } finally {
      clearTimeout(timer);
      controllers.delete(controller);
    }
  },
  abort() {
    for (const controller of controllers) controller.abort();
    controllers.clear();
  }
};
createRoot(document.getElementById('root')!).render(
  <TrainingWorkspace uid="ui-test-member" lang={new URLSearchParams(location.search).get('lang') ?? 'en'} api={api} />
);
