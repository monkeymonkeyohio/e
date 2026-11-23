self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (!url.pathname.endsWith('.gz')) return;

  event.respondWith(
    (async () => {
      const response = await fetch(event.request);
      if (!response.ok) return response;
      if (response.headers.get('Content-Encoding') === 'gzip') return response;

      const ds = new DecompressionStream('gzip');
      const decompressedStream = response.body.pipeThrough(ds);

      const headers = new Headers(response.headers);
      headers.delete('Content-Encoding');
      headers.delete('Content-Length');

      if (url.pathname.endsWith('.wasm.gz')) {
        headers.set('Content-Type', 'application/wasm');
      } else if (url.pathname.endsWith('.js.gz')) {
        headers.set('Content-Type', 'application/javascript');
      } else if (url.pathname.endsWith('.data.gz')) {
        headers.set('Content-Type', 'application/octet-stream');
      }

      return new Response(decompressedStream, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    })()
  );
});
