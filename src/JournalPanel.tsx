import { useCallback, useEffect, useState } from 'react'

export interface JournalConfig {
  /** Defaults to http://localhost:8090 — the Depot owns the data, this only renders it. */
  depotUrl?: string
  /** A known Depot project id → that project's shared feed. */
  projectId?: string
  /** For an app that stays Depot-unaware: hand over its own application id + the resource id
   * it's showing (e.g. a map id) and the Depot resolves the project (routes/applications.py's
   * /project-link) — the app never learns a Depot id. */
  resolve?: { applicationId: string; externalRef: string }
  /** The active person — enables a personal "My day" feed (project-less notes only that
   * person's queries return) alongside `projects`. On a page with no project in view, pass
   * just this (plus `projects` if you want the picker). */
  personId?: string
  projects?: { id: string; name: string }[]
}

interface Entry {
  id: string
  timestamp: string
  author: string | null
  summary: string
  href: string | null
  application_name?: string | null
}

const PERSONAL = 'personal'

export default function JournalPanel({ depotUrl = 'http://localhost:8090', projectId, resolve, personId, projects = [] }: JournalConfig) {
  const [resolved, setResolved] = useState<{ id: string; name: string } | null | 'pending'>(
    !projectId && resolve ? 'pending' : null,
  )
  const [selected, setSelected] = useState<string>(projectId ?? (personId ? PERSONAL : projects[0]?.id ?? ''))
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)

  const resolveKey = resolve ? `${resolve.applicationId}|${resolve.externalRef}` : ''
  useEffect(() => {
    if (projectId || !resolve) return
    setResolved('pending')
    let cancelled = false
    fetch(`${depotUrl}/api/applications/${resolve.applicationId}/project-link?external_ref=${encodeURIComponent(resolve.externalRef)}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        if (d.project_id) {
          setResolved({ id: d.project_id, name: d.project_name })
          setSelected(d.project_id)
        } else setResolved(null)
      })
      .catch(() => !cancelled && setResolved(null))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depotUrl, projectId, resolveKey])

  const activeProject = projectId ?? (resolved && resolved !== 'pending' ? resolved.id : null)
  const scope = activeProject && !personId ? activeProject : selected
  const feedUrl =
    scope === PERSONAL
      ? `${depotUrl}/api/people/${personId}/notes`
      : scope
        ? `${depotUrl}/api/projects/${scope}/journal`
        : null
  const postUrl = scope === PERSONAL ? feedUrl : scope ? `${depotUrl}/api/projects/${scope}/notes` : null

  const load = useCallback(() => {
    if (!feedUrl) return
    fetch(feedUrl)
      .then((r) => r.json())
      .then((d) => setEntries(d.entries ?? []))
      .catch(() => setEntries([]))
  }, [feedUrl])

  useEffect(() => {
    setEntries(null)
    load()
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [load])

  async function submit() {
    const body = text.trim()
    if (!body || !postUrl || posting) return
    setPosting(true)
    try {
      await fetch(postUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, person_id: personId ?? null }),
      })
      setText('')
      load()
    } finally {
      setPosting(false)
    }
  }

  if (resolved === 'pending') return <div className="cd-journal"><p className="cd-journal__empty cd-journal__pad">Looking up this project…</p></div>
  if (!scope) {
    return (
      <div className="cd-journal">
        <p className="cd-journal__empty cd-journal__pad">This isn't connected to a Conway's Depot project yet.</p>
      </div>
    )
  }

  const showPicker = !!personId && !projectId
  return (
    <div className="cd-journal">
      {showPicker && (
        <select className="cd-journal__picker" value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value={PERSONAL}>My day (personal)</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}
      <div className="cd-journal__list">
        {entries === null ? (
          <p className="cd-journal__empty">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="cd-journal__empty">Nothing logged yet.</p>
        ) : (
          entries.map((e) => (
            <div key={e.id} className="cd-journal__entry">
              <div className="cd-journal__meta">
                <span>
                  {new Date(e.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </span>
                {e.author && <span>{e.author}</span>}
                {e.application_name && <span className="cd-journal__source">{e.application_name}</span>}
              </div>
              {e.href ? (
                <a className="cd-journal__body" href={e.href} target="_blank" rel="noreferrer">
                  {e.summary}
                </a>
              ) : (
                <p className="cd-journal__body">{e.summary}</p>
              )}
            </div>
          ))
        )}
      </div>
      <div className="cd-journal__composer">
        <textarea
          className="cd-journal__input"
          rows={2}
          value={text}
          placeholder="Log a note…"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
        />
        <button className="cd-journal__submit" onClick={submit} disabled={!text.trim() || posting}>
          Add
        </button>
      </div>
    </div>
  )
}
