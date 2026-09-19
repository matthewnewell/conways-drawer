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
}

/**
 * The one Agent | Journal file-drawer every app in the ecosystem shares. Bottom-right tab rail:
 * closed, the tabs rest flush against the viewport edge; open, they rest against the panel's
 * edge and the active tab pulls out further over the main content. Clicking the open tab
 * pushes it back in. Chat-only Agent for now; the Journal is the Depot's shared feed.
 */
export default function DrawerLayout({ agent, journal, children, scrollMain = true }: DrawerLayoutProps) {
  const [active, setActive] = useState<Tab>(null)

  // The panel resizes the main column via CSS alone, so nudge a resize once it settles
  // (charts/timelines that measure their container re-measure off it).
  const select = (tab: Tab) => {
    setActive(tab)
    setTimeout(() => window.dispatchEvent(new Event('resize')), 80)
  }

  return (
    <div className={`cd-row${active ? ' cd-row--open' : ''}`}>
      <div className={`cd-main${scrollMain ? ' cd-main--scroll' : ''}`}>{children}</div>
      {active && (
        <aside className="cd-panel">
          {active === 'agent' ? <AgentPanel {...agent} /> : <JournalPanel {...journal} />}
        </aside>
      )}
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
