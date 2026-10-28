// Open synchronously from a click so popup blockers can be detected. Each tab
// owns a separate Blob URL, independent of the preview dialog's lifecycle.
export function openPdfViewer(createUrl: () => string): void {
  const tab = window.open('about:blank', '_blank');
  if (!tab) throw new Error('Allow pop-ups to open the invoice, or use Download PDF.');

  let url: string | undefined;
  try {
    tab.opener = null;
    url = createUrl();
    tab.location.replace(`${url}#toolbar=1&navpanes=0`);
  } catch (error) {
    tab.close();
    if (url) URL.revokeObjectURL(url);
    throw error;
  }

  const viewerUrl = url;
  const cleanup = window.setInterval(() => {
    if (tab.closed) {
      window.clearInterval(cleanup);
      URL.revokeObjectURL(viewerUrl);
    }
  }, 1000);
}
