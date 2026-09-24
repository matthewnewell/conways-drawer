# @conways/drawer

Shared UI for every app in the Conway's Depot ecosystem, one implementation so the UX is identical
everywhere: the **app header** (back link, app name and tabs, "viewing as" user menu) and the
**Agent | Journal** drawer.

## App header

```tsx
// main.tsx: <PersonaProvider><App /></PersonaProvider>
<AppHeader
  brand={<NavLink to="/about" className="ch-brand">Good Plan</NavLink>}
  right={/* optional app controls, just left of the user menu */}
>
  <NavLink to="/" end className={({ isActive }) => tabClass(isActive)}>Plans</NavLink>
</AppHeader>
```

- **Back link**: only when launched from the Depot (`?from=&depot=`), named for where it goes
  (`from_label`, else Launchpad / Catalog / Project). Replaces the old DepotBackBar, now a no-op.
- **User menu**: the Depot's own people list, read straight from the Depot's API. `usePersona()`
  gives the app who's viewing; `currentPersonId()` reads it outside React. An app that reads the
  person once at load passes `reloadOnSwitch` to PersonaProvider. An app with a richer menu of its
  own passes it as `user`.
- Same layout, spacing and type everywhere; each app's accent comes from its `--color-*` variables.

- **Agent**: chat-only for now. Each app supplies its own chat endpoint and starter prompts (the
  AI grounding is per-app); the UX is shared.
- **Journal**: the Depot's shared journal. Give it a `projectId`; or, for an app that stays
  Depot-unaware, `resolve: { applicationId, externalRef }`; or a `personId` (+ `projects`) for a
  personal "My day" feed on pages with no project in view.

```tsx
<DrawerLayout agent={{ chatUrl, aiConfigured, starters, intro }} journal={{ projectId }}>
  <YourPage />
</DrawerLayout>
```

## Install

Sibling checkout (see conways-depot's `scripts/clone-all.sh`). In an app's `frontend/package.json`:
`"@conways/drawer": "file:../../conways-drawer"`, plus `install-links=true` in `frontend/.npmrc`.

`dist/` is committed. After any change here: `npm run build`, commit, then `npm install` in each
consuming app.
