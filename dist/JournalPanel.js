import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from 'react';
const PERSONAL = 'personal';
export default function JournalPanel({ depotUrl = 'http://localhost:8090', projectId, resolve, personId, projects = [] }) {
    const [resolved, setResolved] = useState(!projectId && resolve ? 'pending' : null);
    const [selected, setSelected] = useState(projectId ?? (personId ? PERSONAL : projects[0]?.id ?? ''));
    const [entries, setEntries] = useState(null);
    const [text, setText] = useState('');
    const [posting, setPosting] = useState(false);
    const resolveKey = resolve ? `${resolve.applicationId}|${resolve.externalRef}` : '';
    useEffect(() => {
        if (projectId || !resolve)
            return;
        setResolved('pending');
        let cancelled = false;
        fetch(`${depotUrl}/api/applications/${resolve.applicationId}/project-link?external_ref=${encodeURIComponent(resolve.externalRef)}`)
            .then((r) => r.json())
            .then((d) => {
            if (cancelled)
                return;
            if (d.project_id) {
                setResolved({ id: d.project_id, name: d.project_name });
                setSelected(d.project_id);
            }
            else
                setResolved(null);
        })
            .catch(() => !cancelled && setResolved(null));
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [depotUrl, projectId, resolveKey]);
    const activeProject = projectId ?? (resolved && resolved !== 'pending' ? resolved.id : null);
    const scope = activeProject && !personId ? activeProject : selected;
    const feedUrl = scope === PERSONAL
        ? `${depotUrl}/api/people/${personId}/notes`
        : scope
            ? `${depotUrl}/api/projects/${scope}/journal`
            : null;
    const postUrl = scope === PERSONAL ? feedUrl : scope ? `${depotUrl}/api/projects/${scope}/notes` : null;
    const load = useCallback(() => {
        if (!feedUrl)
            return;
        fetch(feedUrl)
            .then((r) => r.json())
            .then((d) => setEntries(d.entries ?? []))
            .catch(() => setEntries([]));
    }, [feedUrl]);
    useEffect(() => {
        setEntries(null);
        load();
        const t = setInterval(load, 15000);
        return () => clearInterval(t);
    }, [load]);
    async function submit() {
        const body = text.trim();
        if (!body || !postUrl || posting)
            return;
        setPosting(true);
        try {
            await fetch(postUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ body, person_id: personId ?? null }),
            });
            setText('');
            load();
        }
        finally {
            setPosting(false);
        }
    }
    if (resolved === 'pending')
        return _jsx("div", { className: "cd-journal", children: _jsx("p", { className: "cd-journal__empty cd-journal__pad", children: "Looking up this project\u2026" }) });
    if (!scope) {
        return (_jsx("div", { className: "cd-journal", children: _jsx("p", { className: "cd-journal__empty cd-journal__pad", children: "This isn't connected to a Conway's Depot project yet." }) }));
    }
    const showPicker = !!personId && !projectId;
    return (_jsxs("div", { className: "cd-journal", children: [showPicker && (_jsxs("select", { className: "cd-journal__picker", value: selected, onChange: (e) => setSelected(e.target.value), children: [_jsx("option", { value: PERSONAL, children: "My day (personal)" }), projects.map((p) => (_jsx("option", { value: p.id, children: p.name }, p.id)))] })), _jsx("div", { className: "cd-journal__list", children: entries === null ? (_jsx("p", { className: "cd-journal__empty", children: "Loading\u2026" })) : entries.length === 0 ? (_jsx("p", { className: "cd-journal__empty", children: "Nothing logged yet." })) : (entries.map((e) => (_jsxs("div", { className: "cd-journal__entry", children: [_jsxs("div", { className: "cd-journal__meta", children: [_jsx("span", { children: new Date(e.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) }), e.author && _jsx("span", { children: e.author }), e.application_name && _jsx("span", { className: "cd-journal__source", children: e.application_name })] }), e.href ? (_jsx("a", { className: "cd-journal__body", href: e.href, target: "_blank", rel: "noreferrer", children: e.summary })) : (_jsx("p", { className: "cd-journal__body", children: e.summary }))] }, e.id)))) }), _jsxs("div", { className: "cd-journal__composer", children: [_jsx("textarea", { className: "cd-journal__input", rows: 2, value: text, placeholder: "Log a note\u2026", onChange: (e) => setText(e.target.value), onKeyDown: (e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                submit();
                            }
                        } }), _jsx("button", { className: "cd-journal__submit", onClick: submit, disabled: !text.trim() || posting, children: "Add" })] })] }));
}
