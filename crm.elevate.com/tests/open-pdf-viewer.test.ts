import assert from 'node:assert/strict';
import test from 'node:test';
import { openPdfViewer } from '../src/lib/open-pdf-viewer';

test('PDF tabs handle blocked popups, independent URLs, tab closure and generation failures', () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const originalRevoke = URL.revokeObjectURL;
  const revoked: string[] = [];
  const callbacks = new Map<number, () => void>();
  let nextTimer = 0;
  let blocked = false;
  const tabs: Array<{ opener: unknown; closed: boolean; url: string; close(): void; location: { replace(url: string): void } }> = [];
  const fakeWindow = {
    open(url: string, target: string) {
      assert.equal(url, 'about:blank');
      assert.equal(target, '_blank');
      if (blocked) return null;
      const tab = {
        opener: {} as unknown, closed: false, url: '',
        close() { this.closed = true; },
        location: { replace(url: string) { tab.url = url; } },
      };
      tabs.push(tab);
      return tab;
    },
    setInterval(callback: () => void) { callbacks.set(++nextTimer, callback); return nextTimer; },
    clearInterval(id: number) { callbacks.delete(id); },
  };

  try {
    Object.defineProperty(globalThis, 'window', { configurable: true, value: fakeWindow });
    URL.revokeObjectURL = (url: string) => { revoked.push(url); };

    blocked = true;
    let generated = false;
    assert.throws(() => openPdfViewer(() => { generated = true; return 'blob:blocked'; }), /Allow pop-ups/);
    assert.equal(generated, false, 'do not generate a PDF when the tab is blocked');

    blocked = false;
    openPdfViewer(() => 'blob:invoice-1');
    assert.equal(tabs[0].opener, null);
    assert.equal(tabs[0].url, 'blob:invoice-1#toolbar=1&navpanes=0');
    callbacks.get(1)!();
    assert.deepEqual(revoked, [], 'do not revoke the URL while printing or cancelling');

    openPdfViewer(() => 'blob:invoice-2');
    assert.equal(tabs[1].url, 'blob:invoice-2#toolbar=1&navpanes=0');
    tabs[0].closed = true;
    callbacks.get(1)!();
    assert.deepEqual(revoked, ['blob:invoice-1']);
    assert.ok(callbacks.has(2), 'closing one viewer leaves other viewers available');
    tabs[1].closed = true;
    callbacks.get(2)!();
    assert.equal(callbacks.size, 0);

    assert.throws(() => openPdfViewer(() => { throw new Error('PDF generation failed'); }), /PDF generation failed/);
    assert.equal(tabs[2].closed, true, 'close the empty tab on generation failure');
    assert.equal(callbacks.size, 0);
  } finally {
    URL.revokeObjectURL = originalRevoke;
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
    else Reflect.deleteProperty(globalThis, 'window');
  }
});
