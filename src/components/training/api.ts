import { auth } from '../../lib/firebase';
export class TrainingApiError extends Error {
  constructor(public code: string, message: string, public status = 0) { super(message); }
}
export interface TrainingApi {
  request<T>(path: string, method?: string, body?: unknown): Promise<T>;
  abort(): void;
}
/** Captures an account, not a token. Tokens are refreshed and identity checked on each request. */
export function createTrainingApi(expectedUid: string): TrainingApi {
  const controllers = new Set<AbortController>();
  return {
    async request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
      if (!/^\/[a-zA-Z0-9_/-]+$/.test(path)) throw new TrainingApiError('invalid_path', 'Invalid training endpoint.');
      const current = auth.currentUser;
      if (!current || current.uid !== expectedUid) throw new TrainingApiError('identity_changed', 'Sign in to the correct account.');
      const controller = new AbortController(); controllers.add(controller);
      const timer = setTimeout(() => controller.abort(), 20_000);
      try {
        const token = await current.getIdToken();
        if (auth.currentUser?.uid !== expectedUid) throw new TrainingApiError('identity_changed', 'Account changed.');
        const res = await fetch(`/api/companion/training${path}`, {
          method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: controller.signal, cache: 'no-store'
        });
        const data = await res.json();
        if (auth.currentUser?.uid !== expectedUid) throw new TrainingApiError('identity_changed', 'Account changed.');
        if (!res.ok) throw new TrainingApiError(data.code ?? 'request_failed', data.error ?? 'Request failed.', res.status);
        return data as T;
      } catch (error) {
        if (error instanceof TrainingApiError) throw error;
        throw new TrainingApiError('connection_uncertain', 'Connection interrupted. Refresh to check what was saved before retrying.');
      } finally { clearTimeout(timer); controllers.delete(controller); }
    },
    abort() { for (const controller of controllers) controller.abort(); controllers.clear(); }
  };
}
