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
  session to `/authPage`, except the public paths listed in it and anything
  under `/compare/` and `/track/` (the public pages). API routes check for
  themselves.
- **Session**: NextAuth JWT, rebuilt from the `users` row on every read
  (`src/lib/authOptions.ts` + `src/lib/userRecord.ts`). Server code that needs
  the RA key uses `getServerSession(authOptions)`; the browser never sees it.
  Two providers: `credentials` (username + password) and `steam` (Steam OpenID via
  `src/lib/steamLogin.ts` and `api/auth/steam/*`: the callback leaves a signed ticket
  cookie, the provider and the Steam sign-up read it; `users.steam_login_id`).

## API routes (`src/app/api/`)

| Area | Routes | Notes |
|---|---|---|
| RetroAchievements | `get*` (gameData, recentAchievements, activityHeatmap…), `updateRaUser`, `unlinkRaUser` | Older flat names; keep them, the client calls them |
| Steam | `steam/*` (ownedGames, achievements, recentlyPlayed…, unlink) | Linked through Steam sign-in (`auth/steam?intent=link`); admins by name (`src/lib/steamAccount.ts`) |
| PlayStation | `psn/*` (link, titles, trophies, details…) | One app account, `src/lib/psnClient.ts` |
| Xbox | `xbox/{link,unlink,summary,titles,achievements,recentAchievements,details}`, `admin/xbox`, `admin/xbox/achievements` | OpenXBL via `src/lib/xboxClient.ts`; 1:1 with PSN but admin-only (`src/utils/xboxAccess.ts`); pages under `/xboxGame/[id]` |
| Library state | `pinnedGames`, `hiddenGames`, `favorites`, `perfectGamesOrder`, `groups` | Our own DB only |
| People | `users`, `users/search`, `public/user`, `follows/*` | Search reads our DB, never RA |
| Rankings | `rankings` (public), `rankings/me`, `rankings/fill`, `admin/rankings` | Read stored scores; `fill` runs a pass. See Vault Points below |
| Account | `account`, `auth/*`, `changePassword`, `updateUserProfile`, `updateTheme`, `avatar` | |
| Admin | `admin/*` | Every one starts with `requireAdmin(req)` |
| Cron | `cron/sweepCache` (04:00), `cron/scores` (05:00), `cron/psnToken` (09:00) | Scheduled in `vercel.json`, need `CRON_SECRET` |

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
| Postgres | `steam_unlocks` table, `src/lib/steamUnlocks.ts` | Every Steam unlock read, dated, per user and Steam account: the streak and activity use it past the games read live. Not a cache: kept until Steam is unlinked |
| HTTP | `src/lib/httpCache.ts` (`cachedJson`) | `Cache-Control` on the response |

Change the shape of a cached value → bump its key's version (`gameData_v2:` →
`_v3`) in the same change.

## Vault Points (rankings)

Scores are worked out ahead of time, not when a page asks (plan and formula:
`docs/rankings-plan.md`):

1. **Refresh** — `src/lib/scoreRefresh.ts`. Lists each linked platform's library
   once (RA `GetUserCompletionProgress`, Steam owned games, `psnTitles`,
   `xboxLibrary`), and reads again only games whose last unlock moved
   (`change_key`), a few per run per platform (`READS`); the rest score
   provisionally from the list. Each platform at its measured pace (`PACE`; PSN
   also under an app-wide budget in `attemptLimit`). Triggered when a platform is
   linked (`onPlatformLinked`), by the client while the fill is unfinished
   (`useVaultFill` in `VaultFillProvider` → `POST /api/rankings/fill`), after the
   presence heartbeat when a score is 6 h old, and by `/api/cron/scores`. Progress
   is kept in `steam_cache` (`score:fill:<user>`) for the screens.
2. **Formula** — `src/utils/vaultScore.ts` (pure), fed by the per-platform
   mappers in `src/utils/vaultScoreInputs.ts`; levels in `src/utils/vaultLevel.ts`.
3. **Storage** — `score_games` (one row per game, points before the stack
   factor, unlocks by day), `score_periods` (weeks and months, rebuilt per user),
   `score_snapshots` (Monday ranks, for the arrows). `migrations/040`.
4. **Reading** — `src/lib/rankings.ts`: `loadRanking` (global lists cached 5 min
   per instance), `weeklyTrend` (each row's last 8 weeks, from `score_periods`), `vaultTotals`
   for badges on cards and profiles, `presenceOf`, and `profileTeaser` (a listed user's public card
   at `/user/<name>` signed out, and its link preview). `GET /api/rankings` pages the list 20 at a
   time (`offset`), lists the five most active this week (`hot`) and returns the viewer's zone (`above`/`below`, 2 each by default, up to 50).
   Every request still ranks everyone in memory: fine for thousands of users; for far more, a
   table of totals per user indexed by points (one migration) would let a page and a rank be
   read straight from the database.

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
  The public comparison/how-to pages keep their prose apart, in
  `src/translations/seoPages.ts` (English and Spanish, others fall back to
  English), so every other page does not download it.
- **Public pages** (`/compare/[slug]`, `/track/[slug]`): one entry each in
  `SEO_PAGES`; the routes, the sitemap and the footer links all read that list.
  Rendered by `SeoPage`, with the FAQ as `FAQPage` JSON-LD from `SeoPageRoute`.
- **Showcase**: `ShowcaseProvider` (in `MainProviders`) holds the user's own
  achievement showcase (`useShowcase` → `/api/showcase`, table
  `showcase_achievements`); a public profile reads someone's with `useShowcase`
  under `SubjectContext`. Pinned achievements (`/api/favorites`) are own-only.
- **Presence**: `PresenceHeartbeat` (mounted in `MainProviders`) runs
  `usePresenceHeartbeat`: `POST /api/presence` on arrival, every 2 min and on
  coming back to the tab, only while it is visible. The route writes
  `users.last_seen_at` at most once a minute. `presenceColumns()`
  (`src/lib/presence.ts`) turns it into `online` / `lastSeenAt` for whoever shares
  it (`show_presence`), in every query that shows other users; `PresenceDot` and
  `PresenceLabel` draw it.
- **Themes**: `THEMES` in `src/types/types.ts`, CSS variables in
  `src/app/globals.css`, applied before paint by a script in `src/app/layout.tsx`.

## Tooling

- `.githooks/pre-commit` bumps the patch in `src/lib/version.ts` and syncs
  `package.json`; `.githooks/commit-msg` enforces Conventional Commits.
- `.github/workflows/pr-description.yml` fails a PR whose description leaves a
  section of the template blank; `pr-issue.yml` (`linked-issue`) fails one that
  resolves no open issue (GitHub closes it when the PR is merged). Issue forms:
  `.github/ISSUE_TEMPLATE/`.
- Tests sit next to the file they cover (`*.test.ts(x)`); fixtures in
  `src/test-utils/`.
- `graphify-out/` is a generated knowledge graph of the code (the `/graphify`
  skill); regenerate it rather than editing it.
