import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveBackendUrl } from '../src/lib/api/backend-url';

test('relative browser API URLs resolve to an absolute backend URL on the server', () => {
  assert.equal(resolveBackendUrl({ publicUrl: '/api/v1' }), 'http://127.0.0.1:5000/api/v1');
  assert.equal(resolveBackendUrl({ internalUrl: 'http://127.0.0.1:5000', publicUrl: '/api/v1' }), 'http://127.0.0.1:5000/api/v1');
});

test('server API settings take precedence over the browser API URL', () => {
  assert.equal(resolveBackendUrl({ apiUrl: 'https://api.example.com/api/v1/', internalUrl: 'http://127.0.0.1:5000', publicUrl: '/api/v1' }), 'https://api.example.com/api/v1');
  assert.equal(resolveBackendUrl({ internalUrl: 'http://backend:5000/', publicUrl: 'https://public.example.com/api/v1' }), 'http://backend:5000/api/v1');
});

test('an absolute browser API URL works when no internal backend is configured', () => {
  assert.equal(resolveBackendUrl({ publicUrl: 'https://api.example.com/api/v1/' }), 'https://api.example.com/api/v1');
  assert.equal(resolveBackendUrl({}), 'http://127.0.0.1:5000/api/v1');
});
