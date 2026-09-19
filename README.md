# @conways/drawer

The shared **Agent | Journal** file-drawer side panel for every app in the Conway's Depot
ecosystem — one implementation so UX and behavior are identical everywhere.

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
