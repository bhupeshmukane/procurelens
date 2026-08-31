export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Proxy /api/* requests directly to Render FastAPI backend
    if (url.pathname.startsWith('/api')) {
      const backendBase = 'https://procurelens-api.onrender.com';
      const targetUrl = new URL(url.pathname + url.search, backendBase);

      const newHeaders = new Headers(request.headers);
      newHeaders.set('Host', 'procurelens-api.onrender.com');

      const proxyRequest = new Request(targetUrl.toString(), {
        method: request.method,
        headers: newHeaders,
        body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
        redirect: 'follow'
      });

      try {
        const response = await fetch(proxyRequest);
        const responseHeaders = new Headers(response.headers);
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        responseHeaders.set('Access-Control-Allow-Headers', '*');

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders
        });
      } catch (err) {
        return new Response(JSON.stringify({
          error: 'ProcureLens Gateway Error',
          message: 'Failed to reach Render backend.',
          detail: String(err)
        }), {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }

    // Serve static assets via Cloudflare Assets
    return env.ASSETS.fetch(request);
  }
};
