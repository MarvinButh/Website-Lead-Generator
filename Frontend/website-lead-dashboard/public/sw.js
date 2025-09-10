// Simple service worker to accept generate requests from the page and perform fetch in background.
// It posts back results using postMessage.

self.addEventListener('install', (event) => {
  // activate immediately
  // @ts-ignore
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // @ts-ignore
  if (self.registration && self.registration.navigationPreload) {
    try { self.registration.navigationPreload.enable(); } catch (e) { }
  }
  // @ts-ignore
  self.clients.claim();
});

self.addEventListener('message', async (event) => {
  const data = event.data;
  if (!data) return;

  if (data.type === 'RUN_GENERATE') {
    const { jobId, apiBase, body } = data;
    const clients = await self.clients.matchAll({ includeUncontrolled: true });

    try {
      const res = await fetch(`${apiBase}/leads/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const ok = res.ok;
      const json = ok ? await res.json() : null;

      for (const c of clients) {
        c.postMessage({ type: 'GENERATE_RESULT', jobId, ok, data: json, status: res.status });
      }
    } catch (err) {
      for (const c of clients) {
        c.postMessage({ type: 'GENERATE_RESULT', jobId, ok: false, error: String(err) });
      }
    }
  }
});
