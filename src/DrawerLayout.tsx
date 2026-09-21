import { useState, type ReactNode } from 'react'
import AgentPanel, { type AgentConfig } from './AgentPanel'
import JournalPanel, { type JournalConfig } from './JournalPanel'
import './drawer.css'

type Tab = 'agent' | 'journal' | null

const TABS: { id: Exclude<Tab, null>; label: string }[] = [
  { id: 'agent', label: '✨ Agent' },
  { id: 'journal', label: '📝 Journal' },
]

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
}

/**
 * The one Agent | Journal file-drawer every app in the ecosystem shares. Bottom-right tab rail:
 * closed, the tabs rest flush against the viewport edge; open, they rest against the panel's
 * edge and the active tab pulls out further over the main content. Clicking the open tab
 * pushes it back in. Chat-only Agent for now; the Journal is the Depot's shared feed.
 */
export default function DrawerLayout({ agent, journal, children, scrollMain = true, storageKey }: DrawerLayoutProps) {
  const [active, setActive] = useState<Tab>(() => {
    if (!storageKey) return null
    try {
      const v = window.localStorage.getItem(storageKey)
      return v === 'agent' || v === 'journal' ? v : null
    } catch {
      return null
    }
  })

  // Once opened, the Agent stays mounted (just hidden) so its conversation, draft and any
  // in-flight reply survive collapsing or switching to the Journal. The Journal is remounted on
  // open on purpose — it refetches, so it's never stale.
  // A reply the person sent from the Agent to the Journal: the composer opens pre-filled with it
  // so they can trim it, pick the scope, and press Add themselves (nothing posts automatically).
  const [journalDraft, setJournalDraft] = useState<{ text: string; nonce: number } | null>(null)

  const [agentSeen, setAgentSeen] = useState(active === 'agent')
  if (active === 'agent' && !agentSeen) setAgentSeen(true)

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

  return (
    <div className={`cd-row${active ? ' cd-row--open' : ''}`}>
      <div className={`cd-main${scrollMain ? ' cd-main--scroll' : ''}`}>{children}</div>
      <aside className="cd-panel" hidden={!active}>
        {agentSeen && (
          <div className="cd-panel__pane" hidden={active !== 'agent'}>
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
        {active === 'journal' && (
          <div className="cd-panel__pane">
            <JournalPanel {...journal} draft={journalDraft} onDraftUsed={() => setJournalDraft(null)} />
          </div>
        )}
      </aside>
      <div className="cd-rail">
        {TABS.map((t) => {
          const isActive = active === t.id
          const bare = t.label.replace(/^\S+\s/, '')
          return (
            <button
              key={t.id}
              className={`cd-rail__btn${isActive ? ' cd-rail__btn--active' : ''}`}
              onClick={() => select(isActive ? null : t.id)}
              title={isActive ? `Collapse ${bare}` : `Open ${bare}`}
            >
              {t.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
