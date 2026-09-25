import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { readOrigin } from './origin';
import { usePersona } from './persona';
import './header.css';
/** Framed by the demo shell (localhost:5180), whose bar links to these Depot pages itself. */
const IN_DEMO_SHELL = window.self !== window.top;
const SHELL_BAR_PAGES = new Set(['/', '/projects', '/catalog']);
/**
 * The one header every app in the ecosystem uses, so they all look and behave the same:
 *
 *   ← <where you came from> │ <App>   <tabs>              <app controls>  (J) Jordan Park ▾
 *
 * - The back link only shows when the app was launched from Conway's Depot, and it names the
 *   page it goes back to ("Launchpad", "Catalog", a project's name), never the brand. Inside the
 *   demo shell it's dropped when the shell's own bar already links there (Launchpad, Projects,
 *   Catalog); a link back to a specific project still shows.
 * - `brand` and the tabs are the app's own router links (this package doesn't depend on a
 *   router): give the brand `className="ch-brand"` and each tab `tabClass(isActive)`.
 * - `right` is for app-specific controls (a project picker, a bell), just left of the user.
 * - The user menu is the shared "viewing as" switcher (needs PersonaProvider). An app with its
 *   own richer menu (the Depot itself) passes it as `user`.
 * Each app keeps its own accent color through its CSS variables; layout, spacing and type are
 * the same everywhere.
 */
export default function AppHeader({ brand, children, right, user, }) {
    const [origin] = useState(readOrigin);
    const showBack = origin && !(IN_DEMO_SHELL && SHELL_BAR_PAGES.has(origin.from));
    return (_jsxs("header", { className: "ch", children: [showBack && (_jsxs("a", { className: "ch-back", href: origin.depot + origin.from, title: `Back to ${origin.label} in Conway's Depot`, children: [_jsx("span", { "aria-hidden": "true", children: "\u2190" }), " ", origin.label] })), _jsx("div", { className: "ch-brand-wrap", children: brand }), children && _jsx("nav", { className: "ch-tabs", children: children }), _jsxs("div", { className: "ch-right", children: [right, user ?? _jsx(UserMenu, {})] })] }));
}
/** Class for an app's tab link: `className={({ isActive }) => tabClass(isActive)}`. */
export function tabClass(isActive) {
    return `ch-tab${isActive ? ' ch-tab--active' : ''}`;
}
/** The shared "viewing as" switcher: the same person list as Conway's Depot. */
export function UserMenu() {
    const { persona, people, setPersonId, depotReachable } = usePersona();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        if (!open)
            return;
        const onDown = (e) => {
            if (ref.current && !ref.current.contains(e.target))
                setOpen(false);
        };
        const onKey = (e) => e.key === 'Escape' && setOpen(false);
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);
    if (!depotReachable) {
        return (_jsx("div", { className: "cd-user", children: _jsx("span", { className: "cd-user__trigger cd-user__trigger--offline", title: "Conway's Depot is unreachable, so the app can't tell who you are.", children: "\u26A0 Depot unreachable" }) }));
    }
    if (people.length === 0)
        return null;
    return (_jsxs("div", { className: "cd-user", ref: ref, children: [_jsxs("button", { className: "cd-user__trigger", onClick: () => setOpen((v) => !v), "aria-haspopup": "menu", "aria-expanded": open, title: "Viewing as: a demo persona, not a login", children: [_jsx("span", { className: "cd-user__avatar", "aria-hidden": "true", children: persona ? persona.name.charAt(0) : '?' }), _jsxs("span", { className: "cd-user__id", children: [_jsx("span", { className: "cd-user__name", children: persona?.name ?? 'Viewing as…' }), persona?.title && _jsx("span", { className: "cd-user__role", children: persona.title })] }), _jsx("span", { className: "cd-user__caret", "aria-hidden": "true", children: "\u25BE" })] }), open && (_jsxs("div", { className: "cd-user__dropdown", role: "menu", children: [_jsx("p", { className: "cd-user__hint", children: "Same people as Conway's Depot. Not a login; nothing here is access-controlled." }), people.map((p) => (_jsxs("button", { className: `cd-user__item ${p.id === persona?.id ? 'cd-user__item--active' : ''}`, role: "menuitemradio", "aria-checked": p.id === persona?.id, onClick: () => {
                            setPersonId(p.id);
                            setOpen(false);
                        }, children: [_jsx("span", { className: "cd-user__check", "aria-hidden": "true", children: p.id === persona?.id ? '✓' : '' }), _jsxs("span", { className: "cd-user__item-text", children: [_jsx("span", { className: "cd-user__item-name", children: p.name }), _jsx("span", { className: "cd-user__item-title", children: p.title })] })] }, p.id)))] }))] }));
}
