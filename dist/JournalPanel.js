import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from 'react';
const PERSONAL = 'personal';
const ENHANCE_SYSTEM = 'You polish short work-journal notes. Rewrite the note to be clear, specific, and concise while ' +
    "keeping the author's meaning, voice, and every fact in it. You may use the context ONLY to make " +
    'vague references specific (a full date, a part or order number, a project name) when the context ' +
    'states them plainly. Never add facts, causes, decisions, opinions, or next steps that are not in ' +
    'the note or the context. No greetings, no commentary, no quotation marks. Reply with ONLY the ' +
    'rewritten note as plain text.';
export default function JournalPanel({ depotUrl = 'http://localhost:8090', projectId, resolve, personId, projects = [], context, draft, onDraftUsed, }) {
    const [resolved, setResolved] = useState(!projectId && resolve ? 'pending' : null);
    const [selected, setSelected] = useState(projectId ?? (personId ? PERSONAL : projects[0]?.id ?? ''));
    const [entries, setEntries] = useState(null);
    const [text, setText] = useState(draft?.text ?? '');
    useEffect(() => {
        if (!draft)
            return;
        setText(draft.text);
        onDraftUsed?.();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draft?.nonce]);
    const [posting, setPosting] = useState(false);
    // "✨ Enhance": AI rewrites the draft in place; every rewrite is undoable and can be steered with
    // a follow-up instruction. It never posts — the person still presses Add.
    const [aiOk, setAiOk] = useState(false);
    const [enhancing, setEnhancing] = useState(false);
    const [undo, setUndo] = useState([]);
    const [refine, setRefine] = useState('');
    const [aiError, setAiError] = useState(null);
    useEffect(() => {
        fetch(`${depotUrl}/api/health`)
            .then((r) => r.json())
            .then((d) => setAiOk(!!d.ai_configured))
            .catch(() => setAiOk(false));
    }, [depotUrl]);
    // Leaving a project page (projectId cleared) drops back to the personal feed.
    useEffect(() => {
        if (!projectId)
            setSelected(personId ? PERSONAL : projects[0]?.id ?? '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, personId]);
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
    const resolvedId = resolved && resolved !== 'pending' ? resolved.id : null;
    const scope = projectId ?? resolvedId ?? selected;
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
    async function runEnhance(instruction) {
        const base = text.trim();
        if (!base || enhancing)
            return;
        setEnhancing(true);
        setAiError(null);
        const scopeLabel = scope === PERSONAL
            ? 'personal notes (no project)'
            : projects.find((p) => p.id === scope)?.name ?? (resolved && resolved !== 'pending' ? resolved.name : 'this project');
        const recent = (entries ?? [])
            .slice(0, 8)
            .map((e) => `- ${new Date(e.timestamp).toLocaleDateString()} ${e.author ? e.author + ': ' : ''}${e.summary}`)
            .join('\n');
        const system = ENHANCE_SYSTEM +
            `\n\nContext (for resolving vague references only):\nScope: ${scopeLabel}` +
            (context ? `\n${context}` : '') +
            `\nRecent journal entries:\n${recent || '(none)'}`;
        const userMsg = instruction
            ? `Current note:\n${base}\n\nChange requested: ${instruction}`
            : `Note to enhance:\n${base}`;
        try {
            const r = await fetch(`${depotUrl}/api/ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [{ role: 'user', content: userMsg }], system, max_tokens: 400 }),
            });
            const d = await r.json();
            const out = (d.reply ?? '').trim();
            if (d.error || !out || out.startsWith('[AI error'))
                throw new Error(d.error ?? out ?? 'No reply');
            setUndo((u) => [...u, text]);
            setText(out);
            setRefine('');
        }
        catch (e) {
            setAiError(e instanceof Error ? e.message : 'Enhance failed');
        }
        finally {
            setEnhancing(false);
        }
    }
    function undoEnhance() {
        setText(undo[undo.length - 1] ?? '');
        setUndo((u) => u.slice(0, -1));
    }
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
            setUndo([]);
            setRefine('');
            setAiError(null);
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
    return (_jsxs("div", { className: "cd-journal", children: [showPicker && (_jsxs("select", { className: "cd-journal__picker", value: selected, onChange: (e) => setSelected(e.target.value), children: [_jsx("option", { value: PERSONAL, children: "My day (personal)" }), projects.map((p) => (_jsx("option", { value: p.id, children: p.name }, p.id)))] })), _jsx("div", { className: "cd-journal__list", children: entries === null ? (_jsx("p", { className: "cd-journal__empty", children: "Loading\u2026" })) : entries.length === 0 ? (_jsx("p", { className: "cd-journal__empty", children: "Nothing logged yet." })) : (entries.map((e) => (_jsxs("div", { className: "cd-journal__entry", children: [_jsxs("div", { className: "cd-journal__meta", children: [_jsx("span", { children: new Date(e.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) }), e.author && _jsx("span", { children: e.author }), e.application_name && _jsx("span", { className: "cd-journal__source", children: e.application_name })] }), e.href ? (_jsx("a", { className: "cd-journal__body", href: e.href, target: "_blank", rel: "noreferrer", children: e.summary })) : (_jsx("p", { className: "cd-journal__body", children: e.summary }))] }, e.id)))) }), _jsxs("div", { className: "cd-journal__composer-wrap", children: [_jsxs("div", { className: "cd-journal__composer", children: [_jsx("textarea", { className: "cd-journal__input", rows: 2, value: text, placeholder: "Log a note\u2026", onChange: (e) => setText(e.target.value), onKeyDown: (e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        submit();
                                    }
                                } }), _jsxs("div", { className: "cd-journal__actions", children: [_jsx("button", { className: "cd-journal__submit", onClick: submit, disabled: !text.trim() || posting || enhancing, children: "Add" }), aiOk && (_jsx("button", { className: "cd-journal__enhance", onClick: () => runEnhance(), disabled: !text.trim() || enhancing, title: "Rewrite this note more clearly (you review it before adding)", children: enhancing ? 'Enhancing…' : '✨ Enhance' }))] })] }), aiError && _jsx("div", { className: "cd-journal__ai-error", children: aiError }), undo.length > 0 && (_jsxs("div", { className: "cd-journal__refine", children: [_jsx("button", { className: "cd-journal__undo", onClick: undoEnhance, disabled: enhancing, children: "\u21A9 Undo" }), _jsx("input", { className: "cd-journal__refine-input", value: refine, placeholder: "Not quite? Tell it what to change\u2026", disabled: enhancing, onChange: (e) => setRefine(e.target.value), onKeyDown: (e) => {
                                    if (e.key === 'Enter' && refine.trim()) {
                                        e.preventDefault();
                                        runEnhance(refine.trim());
                                    }
                                } })] }))] })] }));
}
