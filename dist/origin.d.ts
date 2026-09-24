/** Where the app was launched from in Conway's Depot. The Depot hands an app
 * `?from=<path in the Depot>&depot=<Depot origin>` (and `from_label=<name of that page>`) when
 * it launches it. Remembered for the tab's session, since the params vanish the first time the
 * app navigates inside itself. Anything that isn't an http(s) origin plus a same-site path is
 * ignored: this builds a link, never a redirect. */
export interface Origin {
    depot: string;
    from: string;
    label: string;
}
export declare function readOrigin(): Origin | null;
/** Where the Depot's API lives: the Depot the app was launched from, else the local default. */
export declare function depotApiBase(): string;
