export interface AgentConfig {
    /** Full URL of this app's own chat endpoint. Receives `{messages}`, returns `{reply}` or
     * `{error}` — the AI's grounding/context is each app's own job, only the UX is shared. */
    chatUrl: string;
    aiConfigured: boolean;
    starters?: string[];
    intro?: string;
}
/** Chat-only for now (proposal cards / actions are a later step). History is plain React state,
 * not persisted — a working-session tool, same deliberate v1 scope every app's chat had. */
export default function AgentPanel({ chatUrl, aiConfigured, starters, intro }: AgentConfig): import("react").JSX.Element;
