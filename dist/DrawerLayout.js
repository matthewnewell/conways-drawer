import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useContext, useState } from 'react';
import AgentPanel from './AgentPanel';
import JournalPanel from './JournalPanel';
import './drawer.css';
const BUILTIN_TABS = [
    { id: 'agent', label: '✨ Agent' },
    { id: 'journal', label: '📝 Journal' },
];
const DrawerContext = createContext({ openTab: () => { } });
/** Lets page content open a drawer tab — e.g. a "set this up in Admin" prompt. A no-op outside a
 * DrawerLayout. */
export function useDrawer() {
    return useContext(DrawerContext);
}
/**
 * The one file-drawer every app in the ecosystem shares. Right-edge tab rail: closed, the tabs
 * rest flush against the viewport edge; open, they rest against the panel's edge and the active
 * tab pulls out further over the main content. Clicking the open tab pushes it back in. Agent
 * and Journal (bottom) are built in; apps may add more tabs (top) via `tabs`.
 */
export default function DrawerLayout({ agent, journal, children, scrollMain = true, storageKey, tabs = [] }) {
    const [active, setActive] = useState(() => {
        if (!storageKey)
            return null;
        try {
            return window.localStorage.getItem(storageKey);
        }
        catch {
            return null;
        }
    });
    // Only a tab that exists right now counts as open.
    const extra = tabs.find((t) => t.id === active);
    const current = active === 'agent' || active === 'journal' || extra ? active : null;
    // A reply the person sent from the Agent to the Journal: the composer opens pre-filled with it
    // so they can trim it, pick the scope, and press Add themselves (nothing posts automatically).
    const [journalDraft, setJournalDraft] = useState(null);
    // Once opened, the Agent stays mounted (just hidden) so its conversation, draft and any
    // in-flight reply survive collapsing or switching to another tab. The Journal is remounted on
    // open on purpose — it refetches, so it's never stale.
    const [agentSeen, setAgentSeen] = useState(current === 'agent');
    if (current === 'agent' && !agentSeen)
        setAgentSeen(true);
    // The panel resizes the main column via CSS alone, so nudge a resize once it settles
    // (charts/timelines that measure their container re-measure off it).
    const select = (tab) => {
        setActive(tab);
        if (storageKey) {
            try {
                if (tab)
                    window.localStorage.setItem(storageKey, tab);
                else
                    window.localStorage.removeItem(storageKey);
            }
            catch {
                /* storage blocked — just doesn't persist */
            }
        }
        setTimeout(() => window.dispatchEvent(new Event('resize')), 80);
    };
    // `text` is what the button shows; `name` is what it is called in the tooltip / for screen readers.
    const railButton = (id, text, name) => {
        const isActive = current === id;
        return (_jsx("button", { className: `cd-rail__btn${isActive ? ' cd-rail__btn--active' : ''}`, onClick: () => select(isActive ? null : id), title: isActive ? `Collapse ${name}` : `Open ${name}`, "aria-label": name, children: text }, id));
    };
    return (_jsx(DrawerContext.Provider, { value: { openTab: (id) => select(id) }, children: _jsxs("div", { className: `cd-row${current ? ' cd-row--open' : ''}`, style: extra?.wide ? { '--cd-panel-w': '600px' } : undefined, children: [_jsx("div", { className: `cd-main${scrollMain ? ' cd-main--scroll' : ''}`, children: children }), _jsxs("aside", { className: "cd-panel", hidden: !current, children: [agentSeen && (_jsx("div", { className: "cd-panel__pane", hidden: current !== 'agent', children: _jsx(AgentPanel, { ...agent, sessionKey: storageKey ? `${storageKey}:chat:${agent.resetKey ?? ''}` : undefined, onPostToJournal: (text) => {
                                    setJournalDraft({ text, nonce: Date.now() });
                                    select('journal');
                                } }, agent.resetKey) })), current === 'journal' && (_jsx("div", { className: "cd-panel__pane", children: _jsx(JournalPanel, { ...journal, draft: journalDraft, onDraftUsed: () => setJournalDraft(null) }) })), extra && _jsx("div", { className: "cd-panel__pane cd-panel__pane--scroll", children: extra.content })] }), tabs.length > 0 && (_jsx("div", { className: "cd-rail cd-rail--top", children: tabs.map((t) => railButton(t.id, t.icon ?? t.label, t.label)) })), _jsx("div", { className: "cd-rail", children: BUILTIN_TABS.map((t) => railButton(t.id, t.label, t.label.replace(/^\S+\s/, ''))) })] }) }));
}
