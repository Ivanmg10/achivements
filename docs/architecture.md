# Architecture

A map, not a spec. The rules each area must follow are in `CLAUDE.md`; this
file says where things are and how they connect. Keep it current when you add
a folder, a data path or a cache.

## Request flow

```
page (src/app/(main)/…)            client component
  └─ hook (src/hooks/useXxx.ts)    owns the fetch, the state, the hasFetched guard
       └─ context (src/context/)   shared library data, so pages do not refetch
            └─ fetch /api/…        src/app/api/**/route.ts
                 ├─ apiAuth        who is asking, whose data, whose key
                 ├─ cache          memory → Postgres (steam_cache table)
                 └─ client         raClient / steamClient / psnClient / igdbClient
                      └─ external API
```

- **Auth gate**: `src/proxy.ts` (Next 16's middleware) sends anyone without a
  session to `/authPage`, except the public paths listed in it. API routes
  check for themselves.
- **Session**: NextAuth JWT, rebuilt from the `users` row on every read
  (`src/lib/authOptions.ts` + `src/lib/userRecord.ts`). Server code that needs
  the RA key uses `getServerSession(authOptions)`; the browser never sees it.

## API routes (`src/app/api/`)

| Area | Routes | Notes |
|---|---|---|
| RetroAchievements | `get*` (gameData, recentAchievements, activityHeatmap…), `updateRaUser`, `unlinkRaUser` | Older flat names; keep them, the client calls them |
| Steam | `steam/*` (link, ownedGames, achievements, recentlyPlayed…) | Linked by name (`src/lib/steamAccount.ts`) |
| PlayStation | `psn/*` (link, titles, trophies, details…) | One app account, `src/lib/psnClient.ts` |
| Library state | `pinnedGames`, `hiddenGames`, `favorites`, `perfectGamesOrder`, `groups` | Our own DB only |
| People | `users`, `users/search`, `public/user`, `follows/*` | Search reads our DB, never RA |
| Account | `account`, `auth/*`, `changePassword`, `updateUserProfile`, `updateTheme`, `avatar` | |
| Admin | `admin/*` | Every one starts with `requireAdmin(req)` |
| Cron | `cron/sweepCache` (04:00), `cron/psnToken` (09:00) | Scheduled in `vercel.json`, need `CRON_SECRET` |

Routes answer structured errors with real status codes (400 bad input, 401/403
auth, 429 rate limited, 502/503 upstream).

## Whose data, whose key — `src/lib/apiAuth.ts`

- `requireSession` / `requireRaSession` / `requireSteamSession` /
  `requirePsnSession` — the signed-in user, with that platform linked.
- `requireViewerApiKey` — the viewer's own RA key; never a fallback.
- `dataOwner(req)` — on someone else's page, whose library is being read.

## Caches

| Layer | Where | Used for |
|---|---|---|
| Memory | `src/lib/raCache.ts` (`withCache`, LRU of 5000) | First level for RA, per instance |
| Postgres | `steam_cache` table, `src/lib/steamCache.ts` | Second level for RA (`ra:` keys), Steam, PSN (`psn:`) and IGDB; swept daily |
| HTTP | `src/lib/httpCache.ts` (`cachedJson`) | `Cache-Control` on the response |

Change the shape of a cached value → bump its key's version (`gameData_v2:` →
`_v3`) in the same change.

## Database

- Pool: `src/lib/db.js` (`pg`, max 5 connections; Neon in production).
- Schema: the numbered files in `migrations/`, run in order. A migration ships
  in the same commit as the code that needs it, and gets a mention in the PR's
  Notes.
- `develop` and production share the database.

## Client side

- **Contexts** (`src/context/`): library data per platform (`GamesDataContext`,
  `SteamGamesDataContext`, `PsnGamesDataContext`), recent achievements,
  pinned/hidden games, theme, language, which platform/view is shown, and
  `SubjectContext` (whose profile is being looked at).
- **Hooks** (`src/hooks/`): one per concern; fetches live here, not in
  components. `useWhenChanged`, `useStorageValue`, `useIsClient` are the
  building blocks the lint rule pushes towards (see `CLAUDE.md` → State and effects).
- **Components** (`src/components/`): one folder each, sub-components in
  `parent-sub/ParentSub.tsx`. Shared UI primitives in `components/ui/`.
- **Utils** (`src/utils/`): pure functions — mappers per platform
  (`steamMappers`, `psnMappers`), library shelves and insights, `aiExport`.
- **i18n**: `useLanguage()` gives `T`; strings in `src/translations/<lang>.ts`.
- **Themes**: `THEMES` in `src/types/types.ts`, CSS variables in
  `src/app/globals.css`, applied before paint by a script in `src/app/layout.tsx`.

## Tooling

- `.githooks/pre-commit` bumps the patch in `src/lib/version.ts` and syncs
  `package.json`; `.githooks/commit-msg` enforces Conventional Commits.
- Tests sit next to the file they cover (`*.test.ts(x)`); fixtures in
  `src/test-utils/`.
- `graphify-out/` is a generated knowledge graph of the code (the `/graphify`
  skill); regenerate it rather than editing it.
