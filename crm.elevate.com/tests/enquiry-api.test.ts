import assert from 'node:assert/strict';
import test from 'node:test';
import { createEnquiry, updateEnquiry, deleteEnquiry, fetchEnquiry } from '../src/lib/api/enquiry-api';

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

test('enquiry mutation requests map form fields and surface API errors', async (t) => {
  const originalFetch = globalThis.fetch;
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  let token: string | null = 'test-token';
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => token } });
  t.after(() => {
    globalThis.fetch = originalFetch;
    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  });

  globalThis.fetch = async (url, options) => {
    assert.ok(String(url).endsWith('/enquiries'));
    assert.equal(options?.method, 'POST');
    assert.equal(new Headers(options?.headers).get('Authorization'), 'Bearer test-token');
    assert.deepEqual(JSON.parse(String(options?.body)), {
      candidateName: 'Example', phone: '9876543210', branchId: 'branch-1',
      sourceId: 'source-1', serviceId: 'service-1',
    });
    return Response.json({ success: true, data: { id: 'new-enquiry' } }, { status: 201 });
  };
  const created = await createEnquiry({
    candidateName: 'Example', phone: '9876543210', branchId: 'branch-1',
    enquirySourceId: 'source-1', requiredServiceId: 'service-1',
  });
  assert.equal(created.data?.id, 'new-enquiry');

  globalThis.fetch = async (url, options) => {
    assert.ok(String(url).endsWith('/enquiries/enquiry%2F1'));
    assert.equal(options?.method, 'PATCH');
    assert.equal(new Headers(options?.headers).get('Authorization'), 'Bearer test-token');
    assert.deepEqual(JSON.parse(String(options?.body)), {
      email: '', notes: '', sourceId: null, source: null, serviceId: null, preferredCourseId: null,
    });
    return Response.json({ success: true, data: { id: 'enquiry/1' } });
  };
  await updateEnquiry({ id: 'enquiry/1', email: '', notes: '', enquirySourceId: '', requiredServiceId: '', preferredCourseId: '' });

  globalThis.fetch = async (url, options) => {
    assert.ok(String(url).endsWith('/enquiries/enquiry%2F1'));
    assert.equal(options?.method, 'DELETE');
    assert.equal(new Headers(options?.headers).get('Authorization'), 'Bearer test-token');
    return Response.json({ success: true, data: null, message: 'Deleted' });
  };
  assert.equal((await deleteEnquiry('enquiry/1')).message, 'Deleted');

  globalThis.fetch = async () => Response.json({ success: false, error: { message: 'Access denied' } }, { status: 403 });
  await assert.rejects(updateEnquiry({ id: 'enquiry-1', notes: 'Changed' }), { message: 'Access denied' });
  await assert.rejects(deleteEnquiry('enquiry-1'), { message: 'Access denied' });

  token = null;
  await assert.rejects(createEnquiry({ candidateName: 'Example', phone: '9876543210' }), /session has expired/);
  await assert.rejects(updateEnquiry({ id: 'enquiry-1' }), /session has expired/);
  await assert.rejects(deleteEnquiry('enquiry-1'), /session has expired/);
});
