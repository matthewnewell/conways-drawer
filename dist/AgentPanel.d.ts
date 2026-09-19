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
/** Chat-only for now (proposal cards / actions are a later step). History is plain React state,
 * not persisted — a working-session tool, same deliberate v1 scope every app's chat had. */
export default function AgentPanel({ chatUrl, aiConfigured, starters, intro, chatExtra }: AgentConfig): import("react").JSX.Element;
