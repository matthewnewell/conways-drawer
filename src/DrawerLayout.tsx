import { createContext, useContext, useState, type ReactNode } from 'react'
import AgentPanel, { type AgentConfig } from './AgentPanel'
import JournalPanel, { type JournalConfig } from './JournalPanel'
import './drawer.css'

type Tab = string | null

const BUILTIN_TABS: { id: 'agent' | 'journal'; label: string }[] = [
  { id: 'agent', label: '✨ Agent' },
  { id: 'journal', label: '📝 Journal' },
]

/** An extra tab an app adds to the drawer's rail — sits in a group at the TOP of the edge (Agent and
 * Journal stay at the bottom) and behaves exactly like them: click to pull open, click again to
 * push back in. Shown as just its `icon` (a compact square; `label` is the tooltip). The Depot uses
 * these for a project's Info / Team / Admin panels. */
export interface DrawerTab {
  id: string
  icon?: string
  label: string
  content: ReactNode
  /** A roomier panel for content that needs it (forms, tables). */
  wide?: boolean
}

export interface DrawerLayoutProps {
  agent: AgentConfig
  journal: JournalConfig
  /** The page's main content. Give the layout a parent with a definite height (flex column). */
  children: ReactNode
  /** Main column scrolls by default; pass false if the page manages its own scrolling. */
  scrollMain?: boolean
  /** If set, the open tab is remembered in localStorage under this key (survives navigation
   * that unmounts the layout, and reloads). */
  storageKey?: string
  /** Extra tabs, rail-top. Only tabs present here are ever shown; an open tab that disappears
   * (e.g. you navigated off the page that supplied it) just reads as closed. */
  tabs?: DrawerTab[]
}

const DrawerContext = createContext<{ openTab: (id: string) => void }>({ openTab: () => {} })

/** Lets page content open a drawer tab — e.g. a "set this up in Admin" prompt. A no-op outside a
 * DrawerLayout. */
export function useDrawer() {
  return useContext(DrawerContext)
}

/**
 * The one file-drawer every app in the ecosystem shares. Right-edge tab rail: closed, the tabs
 * rest flush against the viewport edge; open, they rest against the panel's edge and the active
 * tab pulls out further over the main content. Clicking the open tab pushes it back in. Agent
 * and Journal (bottom) are built in; apps may add more tabs (top) via `tabs`.
 */
export default function DrawerLayout({ agent, journal, children, scrollMain = true, storageKey, tabs = [] }: DrawerLayoutProps) {
  const [active, setActive] = useState<Tab>(() => {
    if (!storageKey) return null
    try {
      return window.localStorage.getItem(storageKey)
    } catch {
      return null
    }
  })

  // Only a tab that exists right now counts as open.
  const extra = tabs.find((t) => t.id === active)
  const current: Tab = active === 'agent' || active === 'journal' || extra ? active : null

  // A reply the person sent from the Agent to the Journal: the composer opens pre-filled with it
  // so they can trim it, pick the scope, and press Add themselves (nothing posts automatically).
  const [journalDraft, setJournalDraft] = useState<{ text: string; nonce: number } | null>(null)

  // Once opened, the Agent stays mounted (just hidden) so its conversation, draft and any
  // in-flight reply survive collapsing or switching to another tab. The Journal is remounted on
  // open on purpose — it refetches, so it's never stale.
  const [agentSeen, setAgentSeen] = useState(current === 'agent')
  if (current === 'agent' && !agentSeen) setAgentSeen(true)

  // The panel resizes the main column via CSS alone, so nudge a resize once it settles
  // (charts/timelines that measure their container re-measure off it).
  const select = (tab: Tab) => {
    setActive(tab)
    if (storageKey) {
      try {
        if (tab) window.localStorage.setItem(storageKey, tab)
        else window.localStorage.removeItem(storageKey)
      } catch {
        /* storage blocked — just doesn't persist */
      }
    }
    setTimeout(() => window.dispatchEvent(new Event('resize')), 80)
  }

  // `text` is what the button shows; `name` is what it is called in the tooltip / for screen readers.
  const railButton = (id: string, text: string, name: string) => {
    const isActive = current === id
    return (
      <button
        key={id}
        className={`cd-rail__btn${isActive ? ' cd-rail__btn--active' : ''}`}
        onClick={() => select(isActive ? null : id)}
        title={isActive ? `Collapse ${name}` : `Open ${name}`}
        aria-label={name}
      >
        {text}
      </button>
    )
  }

  return (
    <DrawerContext.Provider value={{ openTab: (id) => select(id) }}>
      <div
        className={`cd-row${current ? ' cd-row--open' : ''}`}
        style={extra?.wide ? ({ '--cd-panel-w': '600px' } as React.CSSProperties) : undefined}
      >
        <div className={`cd-main${scrollMain ? ' cd-main--scroll' : ''}`}>{children}</div>
        <aside className="cd-panel" hidden={!current}>
          {agentSeen && (
            <div className="cd-panel__pane" hidden={current !== 'agent'}>
              <AgentPanel
                key={agent.resetKey}
                {...agent}
                sessionKey={storageKey ? `${storageKey}:chat:${agent.resetKey ?? ''}` : undefined}
                onPostToJournal={(text) => {
                  setJournalDraft({ text, nonce: Date.now() })
                  select('journal')
                }}
              />
            </div>
          )}
          {current === 'journal' && (
            <div className="cd-panel__pane">
              <JournalPanel {...journal} draft={journalDraft} onDraftUsed={() => setJournalDraft(null)} />
            </div>
          )}
          {extra && <div className="cd-panel__pane cd-panel__pane--scroll">{extra.content}</div>}
        </aside>
        {tabs.length > 0 && (
          <div className="cd-rail cd-rail--top">{tabs.map((t) => railButton(t.id, t.icon ?? t.label, t.label))}</div>
        )}
        <div className="cd-rail">{BUILTIN_TABS.map((t) => railButton(t.id, t.label, t.label.replace(/^\S+\s/, '')))}</div>
      </div>
    </DrawerContext.Provider>
  )
}
