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
    return (_jsxs("div", { className: `cd-row${active ? ' cd-row--open' : ''}`, children: [_jsx("div", { className: `cd-main${scrollMain ? ' cd-main--scroll' : ''}`, children: children }), active && (_jsx("aside", { className: "cd-panel", children: active === 'agent' ? _jsx(AgentPanel, { ...agent }, agent.resetKey) : _jsx(JournalPanel, { ...journal }) })), _jsx("div", { className: "cd-rail", children: TABS.map((t) => {
                    const isActive = active === t.id;
                    const bare = t.label.replace(/^\S+\s/, '');
                    return (_jsx("button", { className: `cd-rail__btn${isActive ? ' cd-rail__btn--active' : ''}`, onClick: () => select(isActive ? null : t.id), title: isActive ? `Collapse ${bare}` : `Open ${bare}`, children: t.label }, t.id));
                }) })] }));
}
