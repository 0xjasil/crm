import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { NextRequest } from 'next/server';
import { GET } from '../src/app/api/v1/auth/session-ended/route';
import { getLogoutReason, sessionLogoutUrl } from '../src/lib/session-logout';

test('forced logout clears every session cookie and redirects to a fixed login URL', () => {
  for (const reason of ['access-denied', 'session-expired', 'https://evil.example']) {
    const response = GET(new NextRequest('https://crm.example/api/v1/auth/session-ended?reason=' + reason));
    assert.equal(response.status, 303);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(response.headers.get('Location'), 'https://crm.example/login?reason=' + (reason === 'access-denied' ? reason : 'session-expired'));
    for (const name of ['token', 'auth_token', 'user', 'better-auth.session_token', 'session_token', 'auth.session-token']) {
      assert.equal(response.cookies.get(name)?.value, '');
      assert.equal(response.cookies.get(name)?.maxAge, 0);
    }
  }
});

test('browser requests force logout only once for auth failures and preserve ordinary errors', async () => {
  const compiled = ts.transpileModule(readFileSync('src/lib/api/authenticated-fetch.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 },
  });
  const destinations: string[] = [];
  let status = 500;
  const exports: { authenticatedFetch?: typeof fetch } = {};
  runInNewContext(compiled.outputText, {
    exports,
    fetch: async () => new Response(null, { status }),
    window: { location: { replace: (url: string) => destinations.push(url) } },
    require: () => ({ getLogoutReason, sessionLogoutUrl }),
  });
  await exports.authenticatedFetch!('/enquiries');
  assert.deepEqual(destinations, []);
  status = 403;
  await exports.authenticatedFetch!('/enquiries');
  await exports.authenticatedFetch!('/enquiries');
  assert.deepEqual(destinations, ['/api/v1/auth/session-ended?reason=access-denied']);
  assert.equal(getLogoutReason(401), 'session-expired');
  assert.equal(getLogoutReason(422), null);
});
