import { useEffect, useRef, useState, type ReactNode } from 'react'
import { readOrigin } from './origin'
import { usePersona } from './persona'
import './header.css'

/**
 * The one header every app in the ecosystem uses, so they all look and behave the same:
 *
 *   ← <where you came from> │ <App>   <tabs>              <app controls>  (J) Jordan Park ▾
 *
 * - The back link only shows when the app was launched from Conway's Depot, and it names the
 *   page it goes back to ("Launchpad", "Catalog", a project's name), never the brand.
 * - `brand` and the tabs are the app's own router links (this package doesn't depend on a
 *   router): give the brand `className="ch-brand"` and each tab `tabClass(isActive)`.
 * - `right` is for app-specific controls (a project picker, a bell), just left of the user.
 * - The user menu is the shared "viewing as" switcher (needs PersonaProvider). An app with its
 *   own richer menu (the Depot itself) passes it as `user`.
 * Each app keeps its own accent color through its CSS variables; layout, spacing and type are
 * the same everywhere.
 */
export default function AppHeader({
  brand,
  children,
  right,
  user,
}: {
  brand: ReactNode
  children?: ReactNode
  right?: ReactNode
  user?: ReactNode
}) {
  const [origin] = useState(readOrigin)
  return (
    <header className="ch">
      {origin && (
        <a className="ch-back" href={origin.depot + origin.from} title={`Back to ${origin.label} in Conway's Depot`}>
          <span aria-hidden="true">←</span> {origin.label}
        </a>
      )}
      <div className="ch-brand-wrap">{brand}</div>
      {children && <nav className="ch-tabs">{children}</nav>}
      <div className="ch-right">
        {right}
        {user ?? <UserMenu />}
      </div>
    </header>
  )
}

/** Class for an app's tab link: `className={({ isActive }) => tabClass(isActive)}`. */
export function tabClass(isActive: boolean): string {
  return `ch-tab${isActive ? ' ch-tab--active' : ''}`
}

/** The shared "viewing as" switcher: the same person list as Conway's Depot. */
export function UserMenu() {
  const { persona, people, setPersonId, depotReachable } = usePersona()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!depotReachable) {
    return (
      <div className="cd-user">
        <span className="cd-user__trigger cd-user__trigger--offline" title="Conway's Depot is unreachable, so the app can't tell who you are.">
          ⚠ Depot unreachable
        </span>
      </div>
    )
  }
  if (people.length === 0) return null

  return (
    <div className="cd-user" ref={ref}>
      <button
        className="cd-user__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Viewing as: a demo persona, not a login"
      >
        <span className="cd-user__avatar" aria-hidden="true">
          {persona ? persona.name.charAt(0) : '?'}
        </span>
        <span className="cd-user__id">
          <span className="cd-user__name">{persona?.name ?? 'Viewing as…'}</span>
          {persona?.title && <span className="cd-user__role">{persona.title}</span>}
        </span>
        <span className="cd-user__caret" aria-hidden="true">
          ▾
        </span>
      </button>
      {open && (
        <div className="cd-user__dropdown" role="menu">
          <p className="cd-user__hint">Same people as Conway's Depot. Not a login; nothing here is access-controlled.</p>
          {people.map((p) => (
            <button
              key={p.id}
              className={`cd-user__item ${p.id === persona?.id ? 'cd-user__item--active' : ''}`}
              role="menuitemradio"
              aria-checked={p.id === persona?.id}
              onClick={() => {
                setPersonId(p.id)
                setOpen(false)
              }}
            >
              <span className="cd-user__check" aria-hidden="true">
                {p.id === persona?.id ? '✓' : ''}
              </span>
              <span className="cd-user__item-text">
                <span className="cd-user__item-name">{p.name}</span>
                <span className="cd-user__item-title">{p.title}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
