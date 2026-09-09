const PREFIX = 'netplus_chat_v1'

export function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function dailyChatKey(date) {
  return `${PREFIX}:${date}:messages`
}

function dailySessionKey(date) {
  return `${PREFIX}:${date}:session`
}

function isMessage(value) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    (value.role === 'user' || value.role === 'assistant') &&
    typeof value.content === 'string'
  )
}

export function readTranscript(storage, date) {
  try {
    const raw = storage.getItem(dailyChatKey(date))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isMessage) : []
  } catch {
    return []
  }
}

export function writeTranscript(storage, date, messages) {
  const safeMessages = Array.isArray(messages) ? messages.filter(isMessage) : []
  storage.setItem(dailyChatKey(date), JSON.stringify(safeMessages))
}

function randomId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

export function getDailySessionId(storage, date) {
  const key = dailySessionKey(date)
  const existing = storage.getItem(key)
  if (existing) return existing
  const created = `netplus-${date}-${randomId()}`
  storage.setItem(key, created)
  return created
}
