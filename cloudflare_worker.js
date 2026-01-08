// This script is intended to be deployed to a Cloudflare Worker.
// It proxies traffic from your custom domain (plustalentglobal.com) to the deployed application.

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // The target URL where your React app is hosted
    const TARGET_HOST = 'meagfvis6f.preview.c24.airoapp.ai';
    
    // Construct the new URL by swapping the host
    const targetUrl = new URL(request.url);
    targetUrl.hostname = TARGET_HOST;
    targetUrl.protocol = 'https:';

    // Create a new request object to forward to the target
    const proxyRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'follow'
    });

    // Add necessary headers to mimic the original request
    proxyRequest.headers.set('Host', TARGET_HOST);
    proxyRequest.headers.set('X-Forwarded-Host', url.hostname);
    proxyRequest.headers.set('X-Forwarded-Proto', 'https');

    try {
      const response = await fetch(proxyRequest);
      
      // Create a new response to return to the client
      const newResponse = new Response(response.body, response);
      
      // Security headers (optional but recommended)
      newResponse.headers.set('X-Content-Type-Options', 'nosniff');
      newResponse.headers.set('X-Frame-Options', 'DENY');
      newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

      return newResponse;
    } catch (e) {
      return new Response('Error connecting to the application backend.', { status: 502 });
    }
  }
};