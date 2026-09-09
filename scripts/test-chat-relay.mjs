import assert from 'node:assert/strict'
import { relayNetworkChat } from '../functions/api/chat.js'

const baseRequest = (body, token = 'access-token') => new Request('https://network.cabozu0987.us/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(token ? { 'Cf-Access-Jwt-Assertion': token } : {}),
  },
  body: typeof body === 'string' ? body : JSON.stringify(body),
})

{
  const response = await relayNetworkChat(baseRequest({ message: 'hello', sessionId: 's1', context: {} }, null), async () => {
    throw new Error('fetch should not run')
  })
  assert.equal(response.status, 401)
}

{
  const response = await relayNetworkChat(baseRequest('{bad json'), async () => {
    throw new Error('fetch should not run')
  })
  assert.equal(response.status, 400)
}

{
  const response = await relayNetworkChat(baseRequest({ message: '', sessionId: 's1', context: {} }), async () => {
    throw new Error('fetch should not run')
  })
  assert.equal(response.status, 400)
}

{
  let forwardedUrl = ''
  let forwardedOptions = null
  const response = await relayNetworkChat(
    baseRequest({ message: 'Explain VLANs', sessionId: 'session-123', context: { current: { lessonId: 'vlans' } } }),
    async (url, options) => {
      forwardedUrl = url
      forwardedOptions = options
      return new Response(JSON.stringify({ text: 'VLAN explanation', sessionId: 'session-123' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    },
  )

  assert.equal(forwardedUrl, 'https://ai.cabozu0987.us/v1/network/chat')
  assert.equal(forwardedOptions.method, 'POST')
  assert.equal(forwardedOptions.headers['Cf-Access-Jwt-Assertion'], 'access-token')
  assert.equal(forwardedOptions.headers.Origin, 'https://network.cabozu0987.us')
  assert.deepEqual(JSON.parse(forwardedOptions.body), {
    message: 'Explain VLANs',
    sessionId: 'session-123',
    context: { current: { lessonId: 'vlans' } },
  })
  assert.equal(response.status, 200)
  const text = await response.text()
  assert.equal(text.includes('access-token'), false)
  assert.equal(JSON.parse(text).text, 'VLAN explanation')
}

{
  const response = await relayNetworkChat(
    baseRequest({ message: 'test', sessionId: 's1', context: {} }),
    async () => new Response(JSON.stringify({ error: 'Too many AI requests. Try again in a minute.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
    }),
  )
  assert.equal(response.status, 429)
  assert.equal(response.headers.get('Retry-After'), '60')
}

console.log('Network+ chat relay tests passed')
