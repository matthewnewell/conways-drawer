export interface AgentConfig {
    /** Full URL of this app's own chat endpoint. Receives `{messages}`, returns `{reply}` or
     * `{error}` — the AI's grounding/context is each app's own job, only the UX is shared. */
    chatUrl: string;
    aiConfigured: boolean;
    starters?: string[];
    intro?: string;
    /** Extra fields merged into every chat request body (e.g. project_id / person_id). */
    chatExtra?: Record<string, unknown>;
    /** Change this to start a fresh conversation (e.g. when the page's scope changes). */
    resetKey?: string;
}
/** Chat-only for now (proposal cards / actions are a later step). The conversation survives
 * collapsing the drawer, switching tabs (DrawerLayout keeps this mounted) and reloads / page
 * changes (saved per browser tab in sessionStorage, keyed by `sessionKey`, which includes the
 * scope's resetKey — so a new project or person starts fresh). Deliberately sessionStorage, not
 * localStorage: replies can contain project data and shouldn't outlive the tab. */
export default function AgentPanel({ chatUrl, aiConfigured, starters, intro, chatExtra, sessionKey, onPostToJournal, }: AgentConfig & {
    sessionKey?: string;
    onPostToJournal?: (text: string) => void;
}): import("react").JSX.Element;
