export interface JournalConfig {
    /** Defaults to http://localhost:8090 — the Depot owns the data, this only renders it. */
    depotUrl?: string;
    /** A known Depot project id → that project's shared feed. */
    projectId?: string;
    /** For an app that stays Depot-unaware: hand over its own application id + the resource id
     * it's showing (e.g. a map id) and the Depot resolves the project (routes/applications.py's
     * /project-link) — the app never learns a Depot id. */
    resolve?: {
        applicationId: string;
        externalRef: string;
    };
    /** The active person — enables a personal "My day" feed (project-less notes only that
     * person's queries return) alongside `projects`. On a page with no project in view, pass
     * just this (plus `projects` if you want the picker). */
    personId?: string;
    projects?: {
        id: string;
        name: string;
    }[];
}
export default function JournalPanel({ depotUrl, projectId, resolve, personId, projects }: JournalConfig): import("react").JSX.Element;
