import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { ApiError, parseApiError } from '../src/lib/api/errors';

interface ClientOptions {
  token?: string;
  authorization?: string;
  fetch: typeof fetch;
}

function loadClient(options: ClientOptions): {
  apiFetch: <T>(path: string, init?: RequestInit) => Promise<T>;
} {
  const source = readFileSync('src/lib/api/client.ts', 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 },
  });
  const exports = {};
  const dependencies: Record<string, unknown> = {
    'server-only': {},
    'next/headers': {
      cookies: async () => ({ get: () => options.token ? { value: options.token } : undefined }),
      headers: async () => new Headers(options.authorization ? { authorization: options.authorization } : {}),
    },
    '@/lib/env': { env: { API_URL: 'https://api.example.com/api/v1' } },
    '@/lib/api/errors': { parseApiError },
  };
  runInNewContext(compiled.outputText, {
    exports,
    Headers,
    fetch: options.fetch,
    require: (name: string) => {
      assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  });
  return exports as ReturnType<typeof loadClient>;
}

test('API client forwards cookie authentication, disables caching and preserves Headers overrides', async () => {
  const client = loadClient({
    token: 'session-token',
    fetch: async (url, init) => {
      assert.equal(url, 'https://api.example.com/api/v1/enquiries');
      assert.equal(init?.cache, 'no-store');
      const headers = new Headers(init?.headers);
      assert.equal(headers.get('Authorization'), 'Bearer session-token');
      assert.equal(headers.get('Content-Type'), 'application/custom+json');
      return Response.json({ data: [] });
    },
  });
  const result = await client.apiFetch('/enquiries', {
    cache: 'force-cache',
    headers: new Headers({ 'Content-Type': 'application/custom+json' }),
  });
  assert.deepEqual(result, { data: [] });
});

test('API client preserves incoming authorization precedence and structured errors', async () => {
  const client = loadClient({
    token: 'cookie-token',
    authorization: 'Bearer incoming-token',
    fetch: async (_url, init) => {
      assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer incoming-token');
      return Response.json({ error: { code: 'FORBIDDEN', message: 'Access denied' } }, { status: 403 });
    },
  });
  await assert.rejects(client.apiFetch('/enquiries'), (error: unknown) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.statusCode, 403);
    assert.equal(error.code, 'FORBIDDEN');
    assert.equal(error.message, 'Access denied');
    return true;
  });
});

test('API client handles non-JSON errors and anonymous requests', async () => {
  const client = loadClient({
    fetch: async (_url, init) => {
      assert.equal(new Headers(init?.headers).has('Authorization'), false);
      return new Response('Bad gateway', { status: 502 });
    },
  });
  await assert.rejects(client.apiFetch('/auth/login'), { message: 'API request failed (502)' });
  assert.equal(parseApiError({ message: 'Legacy failure' }, 400).message, 'Legacy failure');
  assert.equal(parseApiError({ error: { message: 'Session expired' } }, 401).message, 'Session expired');
  assert.equal(parseApiError({ error: { message: { invalid: true } } }, 500).message, 'API request failed (500)');
});
