const CLOUDBOT_URL = 'https://ai.cabozu0987.us/v1/network/chat'
const NETWORK_ORIGIN = 'https://network.cabozu0987.us'

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...headers,
    },
  })
}

function validBody(body) {
  return Boolean(
    body &&
    typeof body === 'object' &&
    !Array.isArray(body) &&
    typeof body.message === 'string' &&
    body.message.trim() &&
    typeof body.sessionId === 'string' &&
    body.sessionId.trim() &&
    (body.context === undefined || (body.context && typeof body.context === 'object' && !Array.isArray(body.context)))
  )
}

export async function relayNetworkChat(request, fetchImpl = fetch) {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const assertion = request.headers.get('Cf-Access-Jwt-Assertion')
  if (!assertion) return json({ error: 'Missing Cloudflare Access session' }, 401)

  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  if (!validBody(body)) return json({ error: 'message and sessionId are required' }, 400)

  let upstream
  try {
    upstream = await fetchImpl(CLOUDBOT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cf-Access-Jwt-Assertion': assertion,
        Origin: NETWORK_ORIGIN,
      },
      body: JSON.stringify({
        message: body.message.trim(),
        sessionId: body.sessionId.trim(),
        context: body.context || {},
      }),
    })
  } catch {
    return json({ error: 'AI gateway is unavailable right now' }, 502)
  }

  const responseText = await upstream.text()
  const retryAfter = upstream.headers.get('Retry-After')
  const headers = {
    'Content-Type': upstream.headers.get('Content-Type') || 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...(retryAfter ? { 'Retry-After': retryAfter } : {}),
  }

  return new Response(responseText, {
    status: upstream.status,
    headers,
  })
}

export async function onRequestPost({ request }) {
  return relayNetworkChat(request)
}
