import assert from 'node:assert/strict';
import test from 'node:test';
import { authClient } from '../src/lib/auth-client';

test('browser login uses the same-origin Fastify proxy and stores the returned session', async t => {
  const originalFetch = globalThis.fetch;
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const stored = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => stored.get(key), setItem: (key: string, value: string) => stored.set(key, value) } });
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { cookie: '' } });
  t.after(() => {
    globalThis.fetch = originalFetch;
    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage); else Reflect.deleteProperty(globalThis, 'localStorage');
    if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument); else Reflect.deleteProperty(globalThis, 'document');
  });
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/v1/auth/login');
    assert.equal(options?.method, 'POST');
    assert.deepEqual(JSON.parse(String(options?.body)), { email: 'test@example.com', password: 'password' });
    return Response.json({ success: true, data: { user: { id: 'user-1', name: 'Test User' }, token: 'verified-token' } });
  };
  const result = await authClient.signIn.email({ email: 'test@example.com', password: 'password' });
  assert.equal(result.error, null);
  assert.equal(stored.get('token'), 'verified-token');
  assert.equal(JSON.parse(stored.get('user')!).id, 'user-1');
  globalThis.fetch = async () => Response.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
  assert.equal((await authClient.signIn.email({ email: 'test@example.com', password: 'wrong' })).error?.message, 'Invalid credentials');
});
