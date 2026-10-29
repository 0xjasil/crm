import assert from 'node:assert/strict';
import test from 'node:test';
import { fetchEnquiry } from '../src/lib/api/enquiry-api';

test('single enquiry API request, dates and errors', async (t) => {
  const originalFetch = globalThis.fetch;
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  let token: string | null = 'test-token';
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: () => token },
  });
  t.after(() => {
    globalThis.fetch = originalFetch;
    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  });

  globalThis.fetch = async (url, options) => {
    assert.ok(String(url).endsWith('/enquiries/enquiry%2F1'));
    assert.deepEqual(options?.headers, { Authorization: 'Bearer test-token' });
    assert.equal(options?.cache, 'no-store');
    return Response.json({ success: true, data: {
      id: 'enquiry/1', candidateName: 'Example',
      createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-02T00:00:00.000Z',
      lastContactDate: '2026-10-03T00:00:00.000Z',
      preferredCourse: { name: 'Solar', courseFee: 150000 },
    } });
  };
  const result = await fetchEnquiry('enquiry/1');
  assert.equal(result.data.candidateName, 'Example');
  assert.equal(result.data.preferredCourse?.courseFee, 150000);
  assert.ok(result.data.createdAt instanceof Date);
  assert.ok(result.data.updatedAt instanceof Date);
  assert.equal(result.data.lastContactDate?.toISOString(), '2026-10-03T00:00:00.000Z');

  for (const [status, message] of [[404, 'Enquiry not found'], [403, 'Access denied']] as const) {
    globalThis.fetch = async () => Response.json({ success: false, error: { message } }, { status });
    await assert.rejects(fetchEnquiry('enquiry-1'), { message });
  }

  globalThis.fetch = async () => { throw new Error('Network unavailable'); };
  await assert.rejects(fetchEnquiry('enquiry-1'), { message: 'Network unavailable' });

  token = null;
  await assert.rejects(fetchEnquiry('enquiry-1'), { message: 'Your session has expired. Sign in again to continue.' });
});
