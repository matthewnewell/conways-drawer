// Vite plugin every app adds next to react(): `plugins: [react(), conwaysDrawer()]`.
//
// Why it exists: Vite serves pre-bundled dependencies at URLs like
// /node_modules/.vite/deps/@conways_drawer.js?v=<hash> with a cache-forever header, and that
// hash comes only from the app's config + lockfile. This package is a `file:` dependency, so a
// new drawer build never changes the lockfile — the hash stays the same, and a browser that
// cached an older drawer keeps using it (blank page, "does not provide an export named ..." in
// the console). Hard refresh doesn't reliably clear it inside the demo shell's iframe.
//
// Fix: fold a fingerprint of the installed dist/ into the dep optimizer's config. Different
// drawer contents -> different config hash -> Vite re-bundles on startup -> new ?v= URL, so no
// browser, however old its cache, can ever match a stale copy.
//
// Plain JS (not compiled from src/) because it runs in Node inside vite.config, not the browser.
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIST = join(dirname(fileURLToPath(import.meta.url)), 'dist')

function fingerprint() {
  const hash = createHash('sha256')
  for (const entry of readdirSync(DIST, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isFile()) continue
    hash.update(entry.name)
    hash.update(readFileSync(join(DIST, entry.name)))
  }
  return hash.digest('hex').slice(0, 12)
}

export function conwaysDrawer() {
  return {
    name: 'conways-drawer-cache-bust',
    config() {
      // The banner is just a comment in the bundled deps; what matters is that Vite hashes
      // optimizeDeps.rolldownOptions into the dep URL's ?v= value.
      return {
        optimizeDeps: {
          rolldownOptions: { output: { banner: `/* @conways/drawer ${fingerprint()} */` } },
        },
      }
    },
  }
}
