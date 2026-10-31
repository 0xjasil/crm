import 'server-only';
import { cookies, headers } from 'next/headers';
import { env } from '@/lib/env';
import { parseApiError } from '@/lib/api/errors';

async function getRequestHeaders(init: RequestInit): Promise<Headers> {
  const cookieStore = await cookies();
  const incomingHeaders = await headers();
  const authorization = incomingHeaders.get('authorization');
  const token = cookieStore.get('auth_token')?.value || cookieStore.get('token')?.value;
  const requestHeaders = new Headers({ 'Content-Type': 'application/json' });

  if (authorization) {
    requestHeaders.set('Authorization', authorization);
  } else if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  new Headers(init.headers).forEach((value, key) => {
    requestHeaders.set(key, value);
  });
  return requestHeaders;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${env.API_URL}${path}`, {
    ...init,
    cache: 'no-store',
    headers: await getRequestHeaders(init),
  });

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    throw parseApiError(body, response.status);
  }

  return response.json() as Promise<T>;
}
