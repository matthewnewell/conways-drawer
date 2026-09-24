/** Where the app was launched from in Conway's Depot. The Depot hands an app
 * `?from=<path in the Depot>&depot=<Depot origin>` (and `from_label=<name of that page>`) when
 * it launches it. Remembered for the tab's session, since the params vanish the first time the
 * app navigates inside itself. Anything that isn't an http(s) origin plus a same-site path is
 * ignored: this builds a link, never a redirect. */

const KEY = 'cd:origin'

export interface Origin {
  depot: string
  from: string
  label: string
}

/** The back link names the page it goes to, never the brand. */
function labelFor(from: string, given: string | null): string {
  if (given) return given
  if (from === '/' || from === '') return 'Launchpad'
  if (from === '/catalog' || from.startsWith('/catalog/')) return 'Catalog'
  if (from === '/projects') return 'Projects'
  if (from.startsWith('/projects/')) return 'Project'
  return 'Back'
}

export function readOrigin(): Origin | null {
  const p = new URLSearchParams(window.location.search)
  const depot = p.get('depot')
  if (depot) {
    const from = p.get('from') ?? '/'
    try {
      const u = new URL(depot)
      if ((u.protocol === 'http:' || u.protocol === 'https:') && from.startsWith('/') && !from.startsWith('//')) {
        const o = { depot: u.origin, from, label: labelFor(from, p.get('from_label')) }
        try {
          window.sessionStorage.setItem(KEY, JSON.stringify(o))
        } catch {
          /* storage blocked: just won't survive in-app navigation */
        }
        return o
      }
    } catch {
      /* not a URL */
    }
  }
  try {
    const v = window.sessionStorage.getItem(KEY)
    const o = v ? (JSON.parse(v) as Partial<Origin>) : null
    return o?.depot && o.from ? { depot: o.depot, from: o.from, label: o.label ?? labelFor(o.from, null) } : null
  } catch {
    return null
  }
}

/** Where the Depot's API lives: the Depot the app was launched from, else the local default. */
export function depotApiBase(): string {
  return readOrigin()?.depot ?? 'http://localhost:8090'
}
