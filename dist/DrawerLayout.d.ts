import { type ReactNode } from 'react';
import { type AgentConfig } from './AgentPanel';
import { type JournalConfig } from './JournalPanel';
import './drawer.css';
export interface DrawerLayoutProps {
    agent: AgentConfig;
    journal: JournalConfig;
    /** The page's main content. Give the layout a parent with a definite height (flex column). */
    children: ReactNode;
    /** Main column scrolls by default; pass false if the page manages its own scrolling. */
    scrollMain?: boolean;
    /** If set, the open tab is remembered in localStorage under this key (survives navigation
     * that unmounts the layout, and reloads). */
    storageKey?: string;
}
/**
 * The one Agent | Journal file-drawer every app in the ecosystem shares. Bottom-right tab rail:
 * closed, the tabs rest flush against the viewport edge; open, they rest against the panel's
 * edge and the active tab pulls out further over the main content. Clicking the open tab
 * pushes it back in. Chat-only Agent for now; the Journal is the Depot's shared feed.
 */
export default function DrawerLayout({ agent, journal, children, scrollMain, storageKey }: DrawerLayoutProps): import("react").JSX.Element;
