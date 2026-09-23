export interface PathwayApi { request<T>(path: string, method?: string, body?: unknown): Promise<T>; abort(): void }
export class PathwayApiError extends Error { constructor(public code: string) { super(code); } }
export function createPathwayApi(): PathwayApi {
  const controllers = new Set<AbortController>(); let owner: string | null = null;
  return {
    async request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
      const { auth } = await import('../../lib/firebase');
      const user = auth.currentUser;
      if (!user || (owner !== null && owner !== user.uid)) throw new PathwayApiError('account_changed_or_signed_out');
      owner = user.uid;
      const token = await user.getIdToken();
      if (auth.currentUser?.uid !== owner) throw new PathwayApiError('account_changed_or_signed_out');
      const controller = new AbortController(); controllers.add(controller);
      const timeout = setTimeout(() => controller.abort(), 20_000);
      try {
        const response = await fetch('/api/admin/pathway-intake'+path, { method, signal:controller.signal, cache:'no-store',
          headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}) });
        if (auth.currentUser?.uid !== owner) throw new PathwayApiError('account_changed_or_signed_out');
        const data = await response.json(); if (!response.ok) throw new PathwayApiError(data.code ?? 'request_failed'); return data as T;
      } catch (error) {
        if (error instanceof PathwayApiError) throw error;
        throw new PathwayApiError('connection_uncertain_check_queue_before_retry');
      } finally { clearTimeout(timeout); controllers.delete(controller); }
    },
    abort() { for (const c of controllers) c.abort(); controllers.clear(); }
  };
}
