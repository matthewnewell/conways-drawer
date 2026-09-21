import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import AgentPanel from './AgentPanel';
import JournalPanel from './JournalPanel';
import './drawer.css';
const TABS = [
    { id: 'agent', label: '✨ Agent' },
    { id: 'journal', label: '📝 Journal' },
];
/**
 * The one Agent | Journal file-drawer every app in the ecosystem shares. Bottom-right tab rail:
 * closed, the tabs rest flush against the viewport edge; open, they rest against the panel's
 * edge and the active tab pulls out further over the main content. Clicking the open tab
 * pushes it back in. Chat-only Agent for now; the Journal is the Depot's shared feed.
 */
export default function DrawerLayout({ agent, journal, children, scrollMain = true, storageKey }) {
    const [active, setActive] = useState(() => {
        if (!storageKey)
            return null;
        try {
            const v = window.localStorage.getItem(storageKey);
            return v === 'agent' || v === 'journal' ? v : null;
        }
        catch {
            return null;
        }
    });
    // Once opened, the Agent stays mounted (just hidden) so its conversation, draft and any
    // in-flight reply survive collapsing or switching to the Journal. The Journal is remounted on
    // open on purpose — it refetches, so it's never stale.
    // A reply the person sent from the Agent to the Journal: the composer opens pre-filled with it
    // so they can trim it, pick the scope, and press Add themselves (nothing posts automatically).
    const [journalDraft, setJournalDraft] = useState(null);
    const [agentSeen, setAgentSeen] = useState(active === 'agent');
    if (active === 'agent' && !agentSeen)
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
    return (_jsxs("div", { className: `cd-row${active ? ' cd-row--open' : ''}`, children: [_jsx("div", { className: `cd-main${scrollMain ? ' cd-main--scroll' : ''}`, children: children }), _jsxs("aside", { className: "cd-panel", hidden: !active, children: [agentSeen && (_jsx("div", { className: "cd-panel__pane", hidden: active !== 'agent', children: _jsx(AgentPanel, { ...agent, sessionKey: storageKey ? `${storageKey}:chat:${agent.resetKey ?? ''}` : undefined, onPostToJournal: (text) => {
                                setJournalDraft({ text, nonce: Date.now() });
                                select('journal');
                            } }, agent.resetKey) })), active === 'journal' && (_jsx("div", { className: "cd-panel__pane", children: _jsx(JournalPanel, { ...journal, draft: journalDraft, onDraftUsed: () => setJournalDraft(null) }) }))] }), _jsx("div", { className: "cd-rail", children: TABS.map((t) => {
                    const isActive = active === t.id;
                    const bare = t.label.replace(/^\S+\s/, '');
                    return (_jsx("button", { className: `cd-rail__btn${isActive ? ' cd-rail__btn--active' : ''}`, onClick: () => select(isActive ? null : t.id), title: isActive ? `Collapse ${bare}` : `Open ${bare}`, children: t.label }, t.id));
                }) })] }));
}
