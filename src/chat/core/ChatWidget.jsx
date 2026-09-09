import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { makeUserMessage } from '../networkAdapter.js'
import './chat.css'

function defaultError(error) {
  return error instanceof Error && error.message
    ? error.message
    : 'AI is unavailable right now. Please try again.'
}

export default function ChatWidget({ adapter, theme }) {
  const initial = useMemo(() => adapter.load(), [adapter])
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState(initial.messages)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [showChoices, setShowChoices] = useState(initial.messages.length === 0)
  const inputRef = useRef(null)
  const scrollRef = useRef(null)

  const themeStyle = useMemo(() => ({
    '--np-chat-primary': theme.primary,
    '--np-chat-bg': theme.background,
    '--np-chat-surface': theme.surface,
    '--np-chat-surface-2': theme.surfaceRaised,
    '--np-chat-text': theme.text,
    '--np-chat-muted': theme.muted,
    '--np-chat-border': theme.border,
    '--np-chat-shadow': theme.shadow,
  }), [theme])

  const syncFromStorage = useCallback(() => {
    const loaded = adapter.load()
    setMessages(loaded.messages)
    if (loaded.messages.length === 0) setShowChoices(true)
  }, [adapter])

  const openChat = useCallback(() => {
    syncFromStorage()
    setOpen(true)
    setError('')
    window.requestAnimationFrame(() => inputRef.current?.focus())
  }, [syncFromStorage])

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = event => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    const frame = window.requestAnimationFrame(() => {
      const node = scrollRef.current
      if (node) node.scrollTop = node.scrollHeight
    })
    return () => window.cancelAnimationFrame(frame)
  }, [messages, open, sending, showChoices, error])

  useEffect(() => {
    const onContextChange = () => {
      if (open) setOpen(false)
    }
    window.addEventListener('networkplus:chat-context', onContextChange)
    return () => window.removeEventListener('networkplus:chat-context', onContextChange)
  }, [open])

  const send = useCallback(async (rawText) => {
    const text = rawText.trim()
    if (!text || sending) return
    if (!navigator.onLine) {
      setError('You are offline. Your saved chat is still here, but this message was not sent.')
      return
    }

    setSending(true)
    setError('')
    try {
      const userMessage = makeUserMessage(text)
      const assistantMessage = await adapter.send(text, messages)
      const next = [...messages, userMessage, assistantMessage]
      setMessages(next)
      adapter.persist(next)
      setDraft('')
      setShowChoices(false)
    } catch (sendError) {
      setError(defaultError(sendError))
    } finally {
      setSending(false)
    }
  }, [adapter, messages, sending])

  const choose = useCallback((choice) => {
    const message = adapter.resolveChoice(choice)
    setShowChoices(false)
    void send(message)
  }, [adapter, send])

  const retry = useCallback(() => {
    if (draft.trim()) void send(draft)
    else setError('Type your message again and press Send.')
  }, [draft, send])

  return (
    <div className="np-chat-root" style={themeStyle}>
      {!open && (
        <button
          type="button"
          className="np-chat-launcher"
          onClick={openChat}
          aria-label="Open Network+ tutor"
        >
          <span aria-hidden="true">AI</span>
        </button>
      )}

      {open && (
        <section className="np-chat-panel" role="dialog" aria-label={adapter.title} aria-modal="false">
          <header className="np-chat-header">
            <div>
              <div className="np-chat-kicker">AI STUDY ASSISTANT</div>
              <div className="np-chat-title">{adapter.title}</div>
            </div>
            <div className="np-chat-header-actions">
              <button type="button" className="np-chat-text-button" onClick={() => setShowChoices(true)}>
                Options
              </button>
              <button type="button" className="np-chat-close" onClick={() => setOpen(false)} aria-label="Close Network+ tutor">
                ×
              </button>
            </div>
          </header>

          <div className="np-chat-scroll" ref={scrollRef} aria-live="polite">
            {messages.length === 0 && (
              <div className="np-chat-welcome">
                <strong>Network+ tutor ready.</strong>
                <span>I can explain concepts, quiz you, and use your saved study progress for context.</span>
              </div>
            )}

            {messages.map(message => (
              <div key={message.id || `${message.role}-${message.createdAt}`} className={`np-chat-row np-chat-row-${message.role}`}>
                <div className={`np-chat-bubble np-chat-bubble-${message.role}`}>
                  {message.content}
                </div>
              </div>
            ))}

            {showChoices && (
              <div className="np-chat-choice-block">
                <div className="np-chat-choice-label">What do you want to do?</div>
                {adapter.openingChoices.map(choice => (
                  <button
                    key={choice.id}
                    type="button"
                    className="np-chat-choice"
                    disabled={sending}
                    onClick={() => choose(choice)}
                  >
                    {choice.label}
                  </button>
                ))}
              </div>
            )}

            {sending && <div className="np-chat-thinking" role="status">Thinking…</div>}

            {error && (
              <div className="np-chat-error" role="status">
                <span>{error}</span>
                <button type="button" onClick={retry}>Retry</button>
              </div>
            )}
          </div>

          <form
            className="np-chat-composer"
            onSubmit={event => {
              event.preventDefault()
              void send(draft)
            }}
          >
            <textarea
              ref={inputRef}
              value={draft}
              onChange={event => setDraft(event.target.value)}
              placeholder={adapter.inputPlaceholder}
              rows={1}
              disabled={sending}
              aria-label="Network+ chat message"
              onKeyDown={event => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  void send(draft)
                }
              }}
            />
            <button type="submit" disabled={sending || !draft.trim()}>Send</button>
          </form>
        </section>
      )}
    </div>
  )
}
