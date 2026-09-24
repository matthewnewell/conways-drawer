import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { depotApiBase } from './origin'

/**
 * Who's using the app: the "viewing as" persona from Conway's Depot's own people list, the same
 * list and the same switcher in every app of the ecosystem. Not a login, nothing is access
 * controlled; it's who the app credits work to. A Depot link names the person
 * (`?person_id=`), which wins on arrival; otherwise the last choice is remembered.
 *
 * Reads the Depot's API directly (it allows cross-origin reads), so an app needs no backend
 * route of its own for this.
 */

const STORAGE_KEY = 'cd:person-id'

export interface DepotPerson {
  id: string
  name: string
  title: string | null
  is_admin: boolean
}

interface PersonaValue {
  persona: DepotPerson | null
  people: DepotPerson[]
  depotReachable: boolean
  setPersonId: (id: string) => void
}

const PersonaContext = createContext<PersonaValue | undefined>(undefined)

function readStored(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

/** The persona id to use right now, outside React (e.g. an app's plain `readPersonId()`). */
export function currentPersonId(): string | null {
  try {
    return new URLSearchParams(window.location.search).get('person_id') ?? readStored()
  } catch {
    return readStored()
  }
}

export function PersonaProvider({
  children,
  reloadOnSwitch = false,
}: {
  children: ReactNode
  /** For apps that read the person once at load (not through usePersona): reload after a switch
   * so the whole app follows the new person. */
  reloadOnSwitch?: boolean
}) {
  const [people, setPeople] = useState<DepotPerson[]>([])
  const [reachable, setReachable] = useState(true)
  const [urlId] = useState<string | null>(() => new URLSearchParams(window.location.search).get('person_id'))
  const [personId, setId] = useState<string | null>(readStored)

  function store(id: string) {
    setId(id)
    try {
      window.localStorage.setItem(STORAGE_KEY, id)
    } catch {
      /* storage blocked: the choice just won't persist */
    }
  }

  useEffect(() => {
    let alive = true
    fetch(`${depotApiBase()}/api/people`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((list: DepotPerson[]) => alive && setPeople(Array.isArray(list) ? list : []))
      .catch(() => alive && setReachable(false))
    return () => {
      alive = false
    }
  }, [])

  // A Depot link that names someone wins; otherwise keep the stored choice, else the admin seat.
  useEffect(() => {
    if (people.length === 0) return
    if (urlId && people.some((p) => p.id === urlId)) {
      if (personId !== urlId) store(urlId)
      return
    }
    if (people.some((p) => p.id === personId)) return
    store((people.find((p) => p.is_admin) ?? people[0]).id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [people])

  const value = useMemo<PersonaValue>(
    () => ({
      persona: people.find((p) => p.id === personId) ?? null,
      people,
      depotReachable: reachable,
      setPersonId: (id: string) => {
        store(id)
        if (reloadOnSwitch) {
          // Drop a person_id in the URL, or it would win again after the reload.
          const u = new URL(window.location.href)
          u.searchParams.delete('person_id')
          window.location.replace(u.toString())
        }
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [people, personId, reachable, reloadOnSwitch],
  )

  return <PersonaContext.Provider value={value}>{children}</PersonaContext.Provider>
}

export function usePersona(): PersonaValue {
  const ctx = useContext(PersonaContext)
  if (!ctx) throw new Error('usePersona must be used inside PersonaProvider (from @conways/drawer)')
  return ctx
}
