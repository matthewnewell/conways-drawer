import { type ReactNode } from 'react';
import { type AgentConfig } from './AgentPanel';
import { type JournalConfig } from './JournalPanel';
import './drawer.css';
/** An extra tab an app adds to the drawer's rail — sits in a group at the TOP of the edge (Agent and
 * Journal stay at the bottom) and behaves exactly like them: click to pull open, click again to
 * push back in. Shown as just its `icon` (a compact square; `label` is the tooltip). The Depot uses
 * these for a project's Info / Team / Admin panels. */
export interface DrawerTab {
    id: string;
    icon?: string;
    label: string;
    content: ReactNode;
    /** A roomier panel for content that needs it (forms, tables). */
    wide?: boolean;
}
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
    /** Extra tabs, rail-top. Only tabs present here are ever shown; an open tab that disappears
     * (e.g. you navigated off the page that supplied it) just reads as closed. */
    tabs?: DrawerTab[];
}
/** Lets page content open a drawer tab — e.g. a "set this up in Admin" prompt. A no-op outside a
 * DrawerLayout. */
export declare function useDrawer(): {
    openTab: (id: string) => void;
};
/**
 * The one file-drawer every app in the ecosystem shares. Right-edge tab rail: closed, the tabs
 * rest flush against the viewport edge; open, they rest against the panel's edge and the active
 * tab pulls out further over the main content. Clicking the open tab pushes it back in. Agent
 * and Journal (bottom) are built in; apps may add more tabs (top) via `tabs`.
 */
export default function DrawerLayout({ agent, journal, children, scrollMain, storageKey, tabs }: DrawerLayoutProps): import("react").JSX.Element;
