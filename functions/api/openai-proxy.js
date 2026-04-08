/**
 * Cloudflare Pages Function — POST /api/openai-proxy
 * Proxies requests to OpenAI using the server-side OPENAI_API_KEY env var.
 * The key is set in: Cloudflare Pages dashboard → Settings → Environment variables
 * It is never exposed to the browser.
 */
export async function onRequestPost(context) {
  const apiKey = context.env.OPENAI_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: { message: 'OPENAI_API_KEY is not configured in environment variables.' } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: { message: 'Invalid JSON body' } }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!body || !Array.isArray(body.messages)) {
    return new Response(
      JSON.stringify({ error: { message: 'Invalid request shape' } }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    const data = await upstream.json();
    return new Response(JSON.stringify(data), {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: { message: `Proxy error: ${e.message}` } }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
