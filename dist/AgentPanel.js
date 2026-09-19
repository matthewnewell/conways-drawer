import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
/** Chat-only for now (proposal cards / actions are a later step). History is plain React state,
 * not persisted — a working-session tool, same deliberate v1 scope every app's chat had. */
export default function AgentPanel({ chatUrl, aiConfigured, starters = [], intro, chatExtra }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [error, setError] = useState(null);
    const [pending, setPending] = useState(false);
    const listRef = useRef(null);
    function scrollToBottom() {
        requestAnimationFrame(() => {
            listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
        });
    }
    async function send(text) {
        const trimmed = text.trim();
        if (!trimmed || pending)
            return;
        const next = [...messages, { role: 'user', content: trimmed }];
        setMessages(next);
        setInput('');
        setError(null);
        setPending(true);
        scrollToBottom();
        try {
            const res = await fetch(chatUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...chatExtra, messages: next }),
            });
            const data = (await res.json().catch(() => null));
            if (data?.error)
                setError(data.error);
            else if (!res.ok || !data)
                setError(`Request failed (${res.status})`);
            else
                setMessages((m) => [...m, { role: 'assistant', content: data.reply ?? '' }]);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Something went wrong');
        }
        finally {
            setPending(false);
            scrollToBottom();
        }
    }
    if (!aiConfigured) {
        return (_jsx("div", { className: "cd-agent cd-agent--empty", children: _jsxs("div", { className: "cd-agent__not-configured", children: ["AI is not configured for this instance. Set ", _jsx("code", { children: "AI_PROVIDER" }), " to", ' ', _jsx("code", { children: "claude" }), ", ", _jsx("code", { children: "gemini" }), ", ", _jsx("code", { children: "ollama" }), ", or ", _jsx("code", { children: "depot" }), ". Everything else works fully without it."] }) }));
    }
    return (_jsxs("div", { className: "cd-agent", children: [_jsxs("div", { className: "cd-agent__messages", ref: listRef, children: [messages.length === 0 && (_jsxs("div", { className: "cd-agent__intro", children: [intro && _jsx("p", { children: intro }), _jsx("div", { className: "cd-agent__starters", children: starters.map((p) => (_jsx("button", { className: "cd-agent__starter", onClick: () => send(p), children: p }, p))) })] })), messages.map((m, i) => (_jsx("div", { className: `cd-agent__msg cd-agent__msg--${m.role}`, children: m.role === 'assistant' ? (_jsx("div", { className: "cd-agent__md", children: _jsx(ReactMarkdown, { remarkPlugins: [remarkGfm], children: m.content }) })) : (m.content) }, i))), pending && _jsx("div", { className: "cd-agent__msg cd-agent__msg--assistant cd-agent__msg--pending", children: "thinking\u2026" }), error && _jsx("div", { className: "cd-agent__error", children: error })] }), _jsxs("form", { className: "cd-agent__input-row", onSubmit: (e) => {
                    e.preventDefault();
                    send(input);
                }, children: [_jsx("textarea", { className: "cd-agent__input", value: input, rows: 2, placeholder: "Ask a question\u2026", onChange: (e) => setInput(e.target.value), onKeyDown: (e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                send(input);
                            }
                        } }), _jsx("button", { type: "submit", className: "cd-agent__send", disabled: !input.trim() || pending, children: "Send" })] })] }));
}
