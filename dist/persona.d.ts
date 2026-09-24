import { type ReactNode } from 'react';
export interface DepotPerson {
    id: string;
    name: string;
    title: string | null;
    is_admin: boolean;
}
interface PersonaValue {
    persona: DepotPerson | null;
    people: DepotPerson[];
    depotReachable: boolean;
    setPersonId: (id: string) => void;
}
/** The persona id to use right now, outside React (e.g. an app's plain `readPersonId()`). */
export declare function currentPersonId(): string | null;
export declare function PersonaProvider({ children, reloadOnSwitch, }: {
    children: ReactNode;
    /** For apps that read the person once at load (not through usePersona): reload after a switch
     * so the whole app follows the new person. */
    reloadOnSwitch?: boolean;
}): import("react").JSX.Element;
export declare function usePersona(): PersonaValue;
export {};
