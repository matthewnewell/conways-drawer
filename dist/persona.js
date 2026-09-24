import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { depotApiBase } from './origin';
/**
 * Who's using the app: the "viewing as" persona from Conway's Depot's own people list, the same
 * list and the same switcher in every app of the ecosystem. Not a login, nothing is access
 * controlled; it's who the app credits work to. A Depot link names the person
 * (`?person_id=`), which wins on arrival; otherwise the last choice is remembered.
 *
 * Reads the Depot's API directly (it allows cross-origin reads), so an app needs no backend
 * route of its own for this.
 */
const STORAGE_KEY = 'cd:person-id';
const PersonaContext = createContext(undefined);
function readStored() {
    try {
        return window.localStorage.getItem(STORAGE_KEY);
    }
    catch {
        return null;
    }
}
/** The persona id to use right now, outside React (e.g. an app's plain `readPersonId()`). */
export function currentPersonId() {
    try {
        return new URLSearchParams(window.location.search).get('person_id') ?? readStored();
    }
    catch {
        return readStored();
    }
}
export function PersonaProvider({ children, reloadOnSwitch = false, }) {
    const [people, setPeople] = useState([]);
    const [reachable, setReachable] = useState(true);
    const [urlId] = useState(() => new URLSearchParams(window.location.search).get('person_id'));
    const [personId, setId] = useState(readStored);
    function store(id) {
        setId(id);
        try {
            window.localStorage.setItem(STORAGE_KEY, id);
        }
        catch {
            /* storage blocked: the choice just won't persist */
        }
    }
    useEffect(() => {
        let alive = true;
        fetch(`${depotApiBase()}/api/people`)
            .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
            .then((list) => alive && setPeople(Array.isArray(list) ? list : []))
            .catch(() => alive && setReachable(false));
        return () => {
            alive = false;
        };
    }, []);
    // A Depot link that names someone wins; otherwise keep the stored choice, else the admin seat.
    useEffect(() => {
        if (people.length === 0)
            return;
        if (urlId && people.some((p) => p.id === urlId)) {
            if (personId !== urlId)
                store(urlId);
            return;
        }
        if (people.some((p) => p.id === personId))
            return;
        store((people.find((p) => p.is_admin) ?? people[0]).id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [people]);
    const value = useMemo(() => ({
        persona: people.find((p) => p.id === personId) ?? null,
        people,
        depotReachable: reachable,
        setPersonId: (id) => {
            store(id);
            if (reloadOnSwitch) {
                // Drop a person_id in the URL, or it would win again after the reload.
                const u = new URL(window.location.href);
                u.searchParams.delete('person_id');
                window.location.replace(u.toString());
            }
        },
    }), 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [people, personId, reachable, reloadOnSwitch]);
    return _jsx(PersonaContext.Provider, { value: value, children: children });
}
export function usePersona() {
    const ctx = useContext(PersonaContext);
    if (!ctx)
        throw new Error('usePersona must be used inside PersonaProvider (from @conways/drawer)');
    return ctx;
}
