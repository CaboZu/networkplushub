import assert from 'node:assert/strict'
import {
  dailyChatKey,
  getDailySessionId,
  readTranscript,
  writeTranscript,
} from '../src/chat/core/state.js'
import { buildNetworkContext } from '../src/chat/networkContext.js'

class MemoryStorage {
  constructor(seed = {}) {
    this.data = new Map(Object.entries(seed))
  }
  getItem(key) { return this.data.has(key) ? this.data.get(key) : null }
  setItem(key, value) { this.data.set(key, String(value)) }
  removeItem(key) { this.data.delete(key) }
}

const storage = new MemoryStorage()
const day = '2026-09-09'
const nextDay = '2026-09-10'

assert.equal(dailyChatKey(day), 'netplus_chat_v1:2026-09-09:messages')
assert.deepEqual(readTranscript(storage, day), [])

const transcript = [
  { id: '1', role: 'user', content: 'Explain VLANs', createdAt: '2026-09-09T12:00:00.000Z' },
  { id: '2', role: 'assistant', content: 'A VLAN is a logical broadcast domain.', createdAt: '2026-09-09T12:00:01.000Z' },
]
writeTranscript(storage, day, transcript)
assert.deepEqual(readTranscript(storage, day), transcript)
assert.deepEqual(readTranscript(storage, nextDay), [])

storage.setItem(dailyChatKey(nextDay), '{not json')
assert.deepEqual(readTranscript(storage, nextDay), [])

const firstSession = getDailySessionId(storage, day)
assert.ok(firstSession.startsWith('netplus-2026-09-09-'))
assert.equal(getDailySessionId(storage, day), firstSession)
assert.notEqual(getDailySessionId(storage, nextDay), firstSession)

const progressStorage = new MemoryStorage({
  netplus_v3: JSON.stringify({
    completedLessons: ['osi', 'tcp'],
    quizScores: { osi: 80, tcp: 90 },
    flashcardsReviewed: 42,
    currentWeek: 2,
    nested: { notes: 'x'.repeat(2000) },
  }),
  VITE_SUPABASE_PUBLISHABLE_KEY: 'must-not-leak',
  unrelated_secret: 'must-not-leak',
})

const context = buildNetworkContext({
  storage: progressStorage,
  location: { pathname: '/', hash: '#week-2' },
  appContext: { view: 'lesson', week: 2, lessonId: 'vlans', lessonTitle: 'VLANs & Trunking' },
  recentMessages: Array.from({ length: 20 }, (_, index) => ({ role: index % 2 ? 'assistant' : 'user', content: `message-${index}` })),
})

assert.equal(context.app, 'network-plus')
assert.equal(context.current.view, 'lesson')
assert.equal(context.current.lessonId, 'vlans')
assert.deepEqual(context.progress.completedLessonIds, ['osi', 'tcp'])
assert.equal(context.progress.currentWeek, 2)
assert.equal(context.recentMessages.length, 8)
assert.ok(JSON.stringify(context).length < 16000)
assert.equal(JSON.stringify(context).includes('must-not-leak'), false)

console.log('Network+ chat state/context tests passed')
