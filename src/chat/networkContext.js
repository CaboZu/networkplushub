const PROGRESS_KEY = 'netplus_v3'
const MAX_DEPTH = 4
const MAX_KEYS = 40
const MAX_ARRAY = 50
const MAX_STRING = 500
const MAX_CONTEXT_CHARS = 15000

function safeJsonParse(value) {
  if (!value) return null
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function sanitize(value, depth = 0) {
  if (value == null || typeof value === 'boolean' || typeof value === 'number') return value
  if (typeof value === 'string') return value.slice(0, MAX_STRING)
  if (depth >= MAX_DEPTH) return '[truncated]'

  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY).map(item => sanitize(item, depth + 1))
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value).slice(0, MAX_KEYS)
    return Object.fromEntries(entries.map(([key, child]) => [key, sanitize(child, depth + 1)]))
  }

  return String(value).slice(0, MAX_STRING)
}

function firstArray(progress, patterns) {
  for (const [key, value] of Object.entries(progress || {})) {
    if (patterns.some(pattern => pattern.test(key)) && Array.isArray(value)) {
      return value.filter(item => typeof item === 'string' || typeof item === 'number').slice(0, 100).map(String)
    }
  }
  return []
}

function firstNumber(progress, patterns) {
  for (const [key, value] of Object.entries(progress || {})) {
    if (patterns.some(pattern => pattern.test(key)) && typeof value === 'number') return value
  }
  return null
}

function firstObject(progress, patterns) {
  for (const [key, value] of Object.entries(progress || {})) {
    if (patterns.some(pattern => pattern.test(key)) && value && typeof value === 'object' && !Array.isArray(value)) {
      return sanitize(value)
    }
  }
  return null
}

function progressSummary(progress) {
  return {
    currentWeek: firstNumber(progress, [/currentWeek/i, /^week$/i]),
    completedLessonIds: firstArray(progress, [/completed.*lesson/i, /lesson.*completed/i]),
    quizScores: firstObject(progress, [/quiz.*score/i, /scores.*quiz/i]),
    flashcardsReviewed: firstNumber(progress, [/flashcard.*review/i, /reviewed.*flashcard/i]),
    medals: firstArray(progress, [/medal/i, /badge/i]),
  }
}

function sanitizeAppContext(appContext) {
  if (!appContext || typeof appContext !== 'object') return {}
  const allowed = ['view', 'week', 'weekTitle', 'lessonId', 'lessonTitle', 'lessonExcerpt', 'activity', 'quizTopic', 'labTopic']
  return Object.fromEntries(
    allowed
      .filter(key => appContext[key] !== undefined && appContext[key] !== null)
      .map(key => [key, sanitize(appContext[key])])
  )
}

export function buildNetworkContext({ storage, location, appContext, recentMessages = [] }) {
  const progress = safeJsonParse(storage?.getItem?.(PROGRESS_KEY)) || {}
  const context = {
    app: 'network-plus',
    mode: 'read-only-study-assistant',
    current: {
      ...sanitizeAppContext(appContext),
      path: typeof location?.pathname === 'string' ? location.pathname.slice(0, 200) : '/',
      hash: typeof location?.hash === 'string' ? location.hash.slice(0, 200) : '',
    },
    progress: {
      ...progressSummary(progress),
      snapshot: sanitize(progress),
    },
    recentMessages: recentMessages.slice(-8).map(message => ({
      role: message?.role === 'assistant' ? 'assistant' : 'user',
      content: String(message?.content || '').slice(0, 800),
    })),
    instructions: [
      'Act as a focused CompTIA Network+ N10-009 tutor inside the Network+ study app.',
      'Use the supplied app/progress context when it helps, but do not claim progress facts that are not present.',
      'The assistant is read-only: never claim to mark lessons complete, change scores, award medals, or modify app state.',
      'Prefer clear certification-focused explanations, troubleshooting logic, concise examples, and short quizzes when requested.',
    ],
  }

  if (JSON.stringify(context).length > MAX_CONTEXT_CHARS) {
    context.progress.snapshot = {
      truncated: true,
      topLevelKeys: Object.keys(progress).slice(0, MAX_KEYS),
    }
  }

  return context
}
