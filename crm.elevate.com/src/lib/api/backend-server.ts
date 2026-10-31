import 'server-only';
import { apiFetch } from '@/lib/api/client';
import { env } from '@/lib/env';

// Keep existing callers working while features migrate to their own API modules.
export { ApiError as BackendRequestError } from '@/lib/api/errors';
export { apiFetch as backendRequest } from '@/lib/api/client';

export function backendUrl(): string {
  return env.API_URL;
}

export async function backendPost<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) });
}
