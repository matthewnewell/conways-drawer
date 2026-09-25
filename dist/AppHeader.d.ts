import { type ReactNode } from 'react';
import './header.css';
/**
 * The one header every app in the ecosystem uses, so they all look and behave the same:
 *
 *   ← <where you came from> │ <App>   <tabs>              <app controls>  (J) Jordan Park ▾
 *
 * - The back link only shows when the app was launched from Conway's Depot, and it names the
 *   page it goes back to ("Launchpad", "Catalog", a project's name), never the brand. Inside the
 *   demo shell it's dropped when the shell's own bar already links there (Launchpad, Projects,
 *   Catalog); a link back to a specific project still shows.
 * - `brand` and the tabs are the app's own router links (this package doesn't depend on a
 *   router): give the brand `className="ch-brand"` and each tab `tabClass(isActive)`.
 * - `right` is for app-specific controls (a project picker, a bell), just left of the user.
 * - The user menu is the shared "viewing as" switcher (needs PersonaProvider). An app with its
 *   own richer menu (the Depot itself) passes it as `user`.
 * Each app keeps its own accent color through its CSS variables; layout, spacing and type are
 * the same everywhere.
 */
export default function AppHeader({ brand, children, right, user, }: {
    brand: ReactNode;
    children?: ReactNode;
    right?: ReactNode;
    user?: ReactNode;
}): import("react").JSX.Element;
/** Class for an app's tab link: `className={({ isActive }) => tabClass(isActive)}`. */
export declare function tabClass(isActive: boolean): string;
/** The shared "viewing as" switcher: the same person list as Conway's Depot. */
export declare function UserMenu(): import("react").JSX.Element | null;
