import {
  getDailySessionId,
  localDateKey,
  readTranscript,
  writeTranscript,
} from './core/state.js'
import { buildNetworkContext } from './networkContext.js'

const OPENING_CHOICES = [
  { id: 'lesson-help', label: 'Help with this lesson' },
  { id: 'quiz-me', label: 'Quiz me' },
  { id: 'explain-topic', label: 'Explain a topic' },
  { id: 'study-next', label: 'What should I study next?' },
]

function messageId(prefix) {
  if (globalThis.crypto?.randomUUID) return `${prefix}-${globalThis.crypto.randomUUID()}`
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

async function responseError(response) {
  let message = `AI request failed (${response.status})`
  try {
    const data = await response.json()
    if (typeof data?.error === 'string' && data.error.trim()) message = data.error.trim()
  } catch {
    // Keep status-based message when the response is not JSON.
  }

  if (response.status === 401) {
    message = 'Your Network+ access session needs to be refreshed. Reload the page and sign in again if prompted.'
  }
  return new Error(message)
}

export function createNetworkAdapter({ storage = window.localStorage, fetchImpl = window.fetch.bind(window) } = {}) {
  return {
    title: 'Network+ Tutor',
    inputPlaceholder: 'Ask about Network+…',
    openingChoices: OPENING_CHOICES,

    load() {
      const date = localDateKey()
      return {
        date,
        messages: readTranscript(storage, date),
      }
    },

    persist(messages) {
      writeTranscript(storage, localDateKey(), messages)
    },

    resolveChoice(choice) {
      switch (choice.id) {
        case 'lesson-help':
          return 'Help me understand what I am currently studying. Use my current lesson context if one is available, and focus on the Network+ exam.'
        case 'quiz-me':
          return 'Quiz me on what I am currently studying. Ask one Network+ question at a time and wait for my answer before explaining it.'
        case 'explain-topic':
          return 'Ask me which Network+ topic I want explained, then teach it clearly with an exam-focused example.'
        case 'study-next':
          return 'Based on my saved Network+ progress, what should I study next and why? Keep the recommendation practical.'
        default:
          return choice.label
      }
    },

    async send(message, transcript) {
      const date = localDateKey()
      const sessionId = getDailySessionId(storage, date)
      const appContext = window.__NETWORKPLUS_CHAT_CONTEXT__ || null
      const context = buildNetworkContext({
        storage,
        location: window.location,
        appContext,
        recentMessages: transcript,
      })

      const response = await fetchImpl('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, sessionId, context }),
      })

      if (!response.ok) throw await responseError(response)
      const data = await response.json()
      if (typeof data?.text !== 'string' || !data.text.trim()) {
        throw new Error('The AI returned an empty response. Please try again.')
      }

      return {
        id: messageId('assistant'),
        role: 'assistant',
        content: data.text.trim(),
        createdAt: new Date().toISOString(),
      }
    },
  }
}

export function makeUserMessage(content) {
  return {
    id: messageId('user'),
    role: 'user',
    content,
    createdAt: new Date().toISOString(),
  }
}
