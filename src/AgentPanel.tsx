import { useRef, useState } from 'react'

export interface AgentConfig {
  /** Full URL of this app's own chat endpoint. Receives `{messages}`, returns `{reply}` or
   * `{error}` — the AI's grounding/context is each app's own job, only the UX is shared. */
  chatUrl: string
  aiConfigured: boolean
  starters?: string[]
  intro?: string
  /** Extra fields merged into every chat request body (e.g. project_id / person_id). */
  chatExtra?: Record<string, unknown>
  /** Change this to start a fresh conversation (e.g. when the page's scope changes). */
  resetKey?: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

/** Chat-only for now (proposal cards / actions are a later step). History is plain React state,
 * not persisted — a working-session tool, same deliberate v1 scope every app's chat had. */
export default function AgentPanel({ chatUrl, aiConfigured, starters = [], intro, chatExtra }: AgentConfig) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  function scrollToBottom() {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
    })
  }

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || pending) return
    const next: Message[] = [...messages, { role: 'user', content: trimmed }]
    setMessages(next)
    setInput('')
    setError(null)
    setPending(true)
    scrollToBottom()
    try {
      const res = await fetch(chatUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...chatExtra, messages: next }),
      })
      const data = (await res.json().catch(() => null)) as { reply?: string; error?: string } | null
      if (data?.error) setError(data.error)
      else if (!res.ok || !data) setError(`Request failed (${res.status})`)
      else setMessages((m) => [...m, { role: 'assistant', content: data.reply ?? '' }])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setPending(false)
      scrollToBottom()
    }
  }

  if (!aiConfigured) {
    return (
      <div className="cd-agent cd-agent--empty">
        <div className="cd-agent__not-configured">
          AI is not configured for this instance. Set <code>AI_PROVIDER</code> to{' '}
          <code>claude</code>, <code>gemini</code>, <code>ollama</code>, or <code>depot</code>.
          Everything else works fully without it.
        </div>
      </div>
    )
  }

  return (
    <div className="cd-agent">
      <div className="cd-agent__messages" ref={listRef}>
        {messages.length === 0 && (
          <div className="cd-agent__intro">
            {intro && <p>{intro}</p>}
            <div className="cd-agent__starters">
              {starters.map((p) => (
                <button key={p} className="cd-agent__starter" onClick={() => send(p)}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`cd-agent__msg cd-agent__msg--${m.role}`}>
            {m.content}
          </div>
        ))}
        {pending && <div className="cd-agent__msg cd-agent__msg--assistant cd-agent__msg--pending">thinking…</div>}
        {error && <div className="cd-agent__error">{error}</div>}
      </div>
      <form
        className="cd-agent__input-row"
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
      >
        <textarea
          className="cd-agent__input"
          value={input}
          rows={2}
          placeholder="Ask a question…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send(input)
            }
          }}
        />
        <button type="submit" className="cd-agent__send" disabled={!input.trim() || pending}>
          Send
        </button>
      </form>
    </div>
  )
}
