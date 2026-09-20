import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
const KEY = 'cd:origin';
function labelFor(from) {
    if (from === '/' || from === '')
        return 'Launchpad';
    if (from === '/catalog' || from.startsWith('/catalog/'))
        return 'Catalog';
    if (from.startsWith('/projects/'))
        return 'project';
    return "Conway's Depot";
}
/** The Depot hands an app `?from=<path in the Depot>&depot=<Depot origin>` when it launches it
 * (frontend/src/lib/launch.ts there). Remembered for the tab's session, since the params vanish
 * the first time the app navigates inside itself. Anything that isn't an http(s) origin plus a
 * same-site path is ignored — this is a link builder, never a redirect. */
function readOrigin() {
    const p = new URLSearchParams(window.location.search);
    const depot = p.get('depot');
    if (depot) {
        const from = p.get('from') ?? '/';
        try {
            const u = new URL(depot);
            if ((u.protocol === 'http:' || u.protocol === 'https:') && from.startsWith('/') && !from.startsWith('//')) {
                const o = { depot: u.origin, from };
                try {
                    window.sessionStorage.setItem(KEY, JSON.stringify(o));
                }
                catch {
                    /* storage blocked — just won't survive in-app navigation */
                }
                return o;
            }
        }
        catch {
            /* not a URL */
        }
    }
    try {
        const v = window.sessionStorage.getItem(KEY);
        return v ? JSON.parse(v) : null;
    }
    catch {
        return null;
    }
}
/** A thin bar above the whole app — "← Conway's Depot · back to <where you came from>" — shown
 * only when the app was launched from the Depot. Render once at the app's root; it reserves its
 * own space (see drawer.css) so it never overlaps the app's navbar. */
export default function DepotBackBar() {
    const [origin] = useState(readOrigin);
    useEffect(() => {
        if (!origin)
            return;
        document.body.classList.add('cd-has-bar');
        return () => document.body.classList.remove('cd-has-bar');
    }, [origin]);
    if (!origin)
        return null;
    return (_jsxs("div", { className: "cd-backbar", children: [_jsx("a", { className: "cd-backbar__link", href: origin.depot + origin.from, children: "\u2190 Conway's Depot" }), _jsxs("span", { className: "cd-backbar__where", children: ["back to ", labelFor(origin.from)] })] }));
}
