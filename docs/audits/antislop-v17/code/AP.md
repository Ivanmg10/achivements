# AP — `src/app/` (pages, layouts, route states, API routes, globals.css)
Auditor notes: The pages are mostly thin and fine; the weight is in the 94 API routes and in `globals.css`.
The shared helpers exist (`requireSession`, `requireRaSession`/`Steam`/`Psn`/`Xbox`, `dataOwner`, `cachedJson`,
`raUnavailable`/`steamFailure`/`psnFailure`/`xboxFailure`, `visibleGamesForUser`, `requireAdmin`), but they are only partly used:
22 route files still hand-roll the session check (39 times), each platform's link/unlink SQL lives in 2–3 places, and
platform twins (PSN/Xbox routes, the three game pages) are copies. `globals.css` is mostly restatement: a 49-line palette block
that is three quarters dead, theme blocks that repeat the base, and the shape tokens written twice.
No finding below weakens a check. Where a merge would change behaviour (cache clearing, one CSS bug, one hidden-games gap), it says so.

Route boilerplate census (94 `route.ts`): inline `getServerSession` + `if (!session?.user?.id)` 39× in 22 files; `requireSession` in 11 files;
`requireRaSession` 8, `requireSteamSession` 8, `requirePsnSession` 5, `requireXboxSession` 5, `requireXboxUser` 2, `requireViewerApiKey` 2,
`requireAdmin` 8, `dataOwner(` 8; `cachedJson` 33 (14 of them with TTL 0); `raUnavailable` 12, `steamFailure` 8, `psnFailure` 7, `xboxFailure` 9;
`status: 500` 77 lines; `console.error` 105. The 401 body has five spellings (`{message:'No autorizado'}` 46, `{error:'Unauthorized'}` 17,
`{error:'unauthorized'}` 3, and double-quoted variants). The try/catch → 500 shape is fine as it is (one line each). The session check is the part to replace.

## Findings

### AP-01 · HIGH · duplication
- **Where:** inline session check in `api/account`, `avatar`, `avatar/[file]`, `changePassword`, `favorites` (POST/DELETE/PUT), `getGameSubsets`, `getWantPlayGames`, `groups` (GET/POST), `groups/[id]` (×3), `groups/[id]/games` (×4), `groups/[id]/years`, `hiddenGames` (×3), `me/bootstrap`, `me/streak`, `pinnedGames` (×4), `perfectGamesOrder` PUT, `preferences` (×2), `rankings/me`, `showcase` (×3), `unlinkRaUser`, `updateFavoriteGame` (×2), `updateRaUser` (×2), `updateTheme`, `updateUserProfile`, `auth/resendVerification`. Double session read: `follows/route.ts:31`, `follows/overview/route.ts:24`, `users/search/route.ts:43` (`requireSession`, then `getServerSession` again for `admin`); `favorites/route.ts:33`, `perfectGamesOrder/route.ts:24`, `showcase/route.ts:23` (`dataOwner`, then `getServerSession` again). `me/streak/route.ts:23-32` hand-builds a `DataOwner` from `session.user`.
- **What:** `requireSession()` returns only `id`, so every route that needs `admin`, `raid`, `name` or `psnaccountid` falls back to `getServerSession(authOptions)` plus its own 401 with its own body. `dataOwner()` called with no request (`favorites`, `users/[username]`) is `requireSession` in disguise; `me/streak` rebuilds what `dataOwner()` already returns for the viewer.
- **Fix:** make `requireSession()` (`src/lib/apiAuth.ts`) return `{ ok: true, id, user: session.user }` and use it in all of the above (`auth.user.admin`, `auth.user.raid`…), with one 401 body. In `me/streak`: `const me = await dataOwner()`. Same checks, same status codes, nothing weakened.
- **Size:** ~39 × 3 lines → 39 × 2; removes 6 second session reads and ~29 `authOptions`/`getServerSession` imports.

### AP-02 · HIGH · duplication
- **Where:** RA link: `api/updateRaUser/route.ts:31-36`, `api/admin/users/accounts/route.ts:54-58`, `api/users/route.ts:86-103` (sign-up). PSN link: `api/psn/link/route.ts:20-50` ↔ `admin/users/accounts/route.ts:95-115` (the online-ID regex is written twice: `psn/link:9` `ONLINE_ID` and `accounts:97` inline). Xbox link: `api/xbox/link/route.ts:19-43` ↔ `accounts:118-136`. Unlink: `unlinkRaUser`, `steam/unlink`, `psn/unlink`, `xbox/unlink` ↔ `accounts:161-173`.
- **What:** each platform's link and unlink SQL, with its cache housekeeping, is written in the user route and again in the admin route, and the copies have already drifted: the admin RA unlink does not `clearUserCache` (the user one does); the admin PSN/Xbox link clears the cache, the user one does not.
- **Fix:** `src/lib/platformLinks.ts` with `saveRaLink(userId, profile, key)`, `savePsnLink`, `saveXboxLink`, `unlinkPlatform(userId, platform)` (UPDATE + `clearUserCache` + `forgetUnlocks` for Steam + `forgetUser`) and `PSN_ONLINE_ID`. User and admin routes keep their own auth, validation, logging and responses. Unifying the housekeeping changes which paths clear the cache, so the owner decides which version is right.
- **Size:** ~110 lines across 7 files → ~45, plus a ~40-line lib.

### AP-03 · HIGH · duplication / library
- **Where:** `(main)/psnGame/[id]/page.tsx:38-89`, `(main)/steamGame/[appId]/page.tsx:39-112`, `(main)/xboxGame/[id]/page.tsx:42-96`; the error button in `gameInfo/[gameId]/page.tsx:31`.
- **What:** the three pages share, nearly character for character, the "not linked" screen, the loading block (`role="status"` + `GameInfoSkeletonTable`), the error card and the empty card. The card class `bg-bg-card rounded-card ring-1 ring-ink/[0.06] p-6 w-[calc(100%-2rem)] sm:w-[calc(100%-4rem)] lg:w-[calc(100%-7rem)] mt-7 mb-5` is hand-written 6×, although `SURFACE` (`ui/surface.ts`) is exactly its first half; the width trio appears 12× in `src/` (also in 5 `user-game-page/*` files). Retry is `<button className={buttonClass('secondary','sm')}>` while `Button` is already imported (each page imports `Button` and `buttonClass` on two lines). `gameInfo` uses a hand-styled underline button.
- **Fix:** `src/components/game-page-states/` with `GamePageNotLinked({ platform, connectLabel })` and `GameTableState({ loading, error, errorText, hint, emptyText, onRetry })`, built on `SURFACE` and `<Button variant="secondary" size="sm">`; one `GAME_SECTION_WIDTH` const shared with `user-game-page`.
- **Size:** 304 → ~170 lines over the three pages, plus a ~50-line component.

### AP-04 · HIGH · size
- **Where:** `(main)/[category]/(list)/page.tsx` (362 lines); `(main)/[category]/[consoleId]/page.tsx:43-89`.
- **What:** one component holds four render modes (explorer, mixed list, RA only, RA + folding sections) and ~130 lines of derived state (per-platform search, quick filters, counts, previews). The error banner is pasted twice (226-230, 280-284); the RA progress lookup `extraData.get('GameID' in g && g.GameID ? g.GameID : g.ID)` twice (145, 154); the header row (`StatusPageHeader` + search + controls) four times. `psnShown = psnLinked` is an alias that does nothing; three stacked comments say the same thing (81-83); React is imported on two lines (4, 33) with hooks, components and utils interleaved (file-order rule). `[consoleId]/page.tsx` repeats the RA-only branch (header, `CompletedFilter`, `ConsoleFilter`, empty/list) and resets its sort with a hand-made `sortFor` state instead of `useWhenChanged`.
- **Fix:** move lines 53-182 into `src/hooks/useCategoryLibrary.ts` (entries, per-platform lists, counts, previews, flags); split the views into `category-page/CategoryExplorerView`, `CategoryMixedView`, `CategoryRaView` (also used by `[consoleId]`), `CategorySectionsView`, and `CategoryErrors` for the banner. Use `useWhenChanged` in `[consoleId]`.
- **Size:** 362 → ~70 page + ~140 hook + 4 small views; `[consoleId]` 91 → ~35.

### AP-05 · HIGH · duplication
- **Where:** `ownsGroup` defined in `api/groups/[id]/route.ts:9-13` and `api/groups/[id]/games/route.ts:21-25`, inlined a third time in `groups/[id]/years/route.ts:43-44`; the block `dbId(id) ?? NaN` → session → `ownsGroup` → 403 repeated in 7 handlers (`[id]` PUT/DELETE, `games` POST/DELETE/PUT/PATCH, `years` POST). "No source means RA": `readSource` in `pinnedGames/route.ts:19-22` and `groups/[id]/games/route.ts:16-19` (identical), `parseSource` in `favorites/route.ts:14-17`, `readColumn` in `updateFavoriteGame/route.ts:22-25`.
- **What:** the same ownership gate and the same source parser, copied.
- **Fix:** `requireGroupOwner(params)` in `src/lib/groupList.ts` (returns `{ ok, groupId, user }` or the 401/403 response, same codes); `readSourceOrRa(value)` beside `isGameSource` in `src/utils/gameRef.ts`.
- **Size:** ~85 lines → ~25, plus a 15-line helper.

### AP-06 · HIGH · dead / duplication (css)
- **Where:** `src/app/globals.css:452-506`; the light-theme selector list also at 331-337 and 373-377.
- **What:** 49 rules, each repeating the 7-theme `:is([data-theme="light"], …)` list, darken palette text classes on light themes. Grep over non-test `src/`: `text-red-*`, `text-yellow-*`, `text-green-*`, `text-amber-*`, `text-orange-*` (15 rules) have 0 uses, and the guard refuses them outside `ui/`; `text-lime-*`, `text-pink-*`, `text-gray-200/400/500` and most -200/-400 shades also have 0. Used: `purple-300/400`, `violet-200/300`, `blue-300`, `sky-300`, `teal-300`, `rose-300`, `indigo-300`, `cyan-300`, `gray-300` (11). CLAUDE.md asks a new light theme to "join the light selector lists": today there are 51 of them.
- **Fix:** one rule per used hue, with the list written once through nesting: `:is(<light list>) { & :is(.text-purple-300, .text-purple-400) { @apply text-purple-700 } … }`. Drop the 38 dead rules.
- **Size:** 55 → ~14 lines; one selector list to maintain.

### AP-07 · MED · duplication (css), includes one latent bug
- **Where:** `globals.css:70-153` (base on `:root, [data-theme]`), `247-286` (`[data-shape="slanted"]`), `342-368` (DARK block), `--accent-muted` in all 24 theme declarations.
- **What:** (a) the DARK block restates the base value for value (27 lines). (b) `--accent-muted` equals `--accent` in every theme. It is read once (`MainPageHeatmap.tsx:188`), and its utility `--color-accent-muted` is never used. Another 23 lines restate base `--success/--warning/--danger/--chart-2/--info` (blue, purple, green, black-ops-2, midnight). (c) The shape tokens (~40 lines) are written on `:root, [data-theme]` and again under `[data-shape="slanted"]`. Because they sit on `[data-theme]`, `ThemePreview` (which puts `data-theme` on a div) falls back to slanted shapes inside a round page: its `rounded-box` gets 0.5rem instead of 0.75rem. This latent bug needs a look on screen.
- **Fix:** delete the DARK block (keep the selector list only if a test reads it; `themes.test.ts` compares accents). Either declare `--accent-muted: var(--accent)` once in the base, or read `--accent` in the heatmap and drop the token and its utility. Drop restated base values. Put the shape tokens on `:root, [data-shape="slanted"]` once (the round block comes later and still wins on `<html>`). That last change fixes the preview, so it is a behaviour change and the owner's call.
- **Size:** ~115 lines removed.

### AP-08 · MED · duplication
- **Where:** `api/groups/[id]/years/route.ts:21, 88-101`; `src/lib/raGame.ts` (`cachedGame`); `api/steam/gameDetails/route.ts:29-35`.
- **What:** the route re-implements `cachedGame` inline (same key `gameData_v2:`, same validator, `RA_TTL` = `GAME_TTL_MS`), and the Steam store read too (same key `steamStore:<id>:<lang>`, same `shouldCache`). With two copies of one cache key, bumping one breaks the other silently.
- **Fix:** call `cachedGame(String(row.game_id), raKey)`; move the store read to `loadStoreDetails(appId, lang)` in `src/lib/steamProgress.ts` and call it from both routes.
- **Size:** 124 → ~105; gameDetails 43 → ~35.

### AP-09 · MED · duplication
- **Where:** `api/psn/details` ↔ `api/xbox/details`; `psn/recentTrophies` ↔ `xbox/recentAchievements` (identical `DAYS = { activity: 60, year: 366 }` and scope check); `psn/trophies` ↔ `xbox/achievements`; `psn/summary` ↔ `xbox/summary`; `BROWSER_TTL_MS = 5 * 60 * 1000` with the same comment in 4 files.
- **What:** platform twins written as copies. One route per platform is right (Xbox has its telemetry wrapper); copying the constants and the scope parsing is not.
- **Fix:** `FEED_DAYS` and `parseFeedScope(params)` in one util (`src/utils/feedScope.ts`); `PLATFORM_BROWSER_TTL_MS` exported from `src/lib/httpCache.ts`, with the comment written once.
- **Size:** ~30 lines saved.

### AP-10 · MED · rule (silent failure / dead branch)
- **Where:** `api/getGameHashes/route.ts:28-30`, `api/getGameSubsets/route.ts:27, 36, 46-48`, `api/getAchievementDetail/route.ts:26-36`, `api/getGamesLastPlayed/route.ts:54-56`.
- **What:** hashes and subsets answer `200 []` on any RA error, with no log (CLAUDE.md: "a silent failure is a bug", "do not swallow"). In `getAchievementDetail` both parts `.catch(() => null)`, so `data` is never null: the 404 branch and the validator are dead, the try/catch never sees an RA failure, and a failed pair `{unlocks:null, comments:null}` is cached for 5 minutes. `getGamesLastPlayed` drops each failed game to `null` without a log.
- **Fix:** log and `return raUnavailable(err)` in hashes and subsets. In achievement detail, either let a failure reach the catch or refuse to cache an all-null result. Log in `fetchGame`. A missing RA key in subsets can stay `[]`: that is a state, not a failure.

### AP-11 · MED · duplication
- **Where:** the username rule inline in `api/users/route.ts:41`, `api/admin/users/route.ts:24-25` (`isUsername`) and `api/updateUserProfile/route.ts:55-59`, versus `checkUsername` in `src/utils/authValidation.ts` (used by `auth/steam/register`); `isValidUrl` in `admin/users:16-22` and `updateUserProfile:24-30`; the 2-letter location regex in both; "username/email already taken" queries in 5 handlers.
- **What:** `authValidation.ts` says it repeats "the rules the register endpoint enforces", but the register endpoint does not call it, so the two can drift.
- **Fix:** use `checkUsername(v) === null` and `isEmail`, and move `isHttpsUrl` and `isCountryCode` into `authValidation.ts`. Same rules, one copy.

### AP-12 · MED · rule (i18n)
- **Where:** `api/users/route.ts:20, 36, 43, 50, 58, 64, 121, 125`, read by `src/components/register-user-form/RegisterUserForm.tsx:89` (`byCode[data.error] ?? data.error`).
- **What:** the sign-up route answers with Spanish sentences ("Username ya en uso", "Demasiadas cuentas creadas desde aquí…", "La contraseña debe tener…"), and the form shows any unmapped one as is. A 409 or 429 therefore reaches readers of all nine languages in Spanish. `auth/steam/register` already answers with codes (`username-taken`, `too-many`).
- **Fix:** answer with codes (`username-taken`, `too-many`, `invalid-username`, `weak-password`, `closed`) and add them to `byCode` from `T.registerForm`.

### AP-13 · MED · rule (a11y landmarks)
- **Where:** a `<main>` inside the `<main>` of `(main)/layout.tsx:36`: `gameInfo/[gameId]/page.tsx:29,44`, `psnGame/[id]/page.tsx:40,57`, `steamGame/[appId]/page.tsx:41,69`, `xboxGame/[id]/page.tsx:44,61`, `user/(account)/page.tsx:25`.
- **What:** nested `main` landmarks. CLAUDE.md: a screen inside the layout is a `<div>`, a `<main>` only when it is full screen.
- **Fix:** a `<div>` (or `<section>`) in these pages. Cross-area: `MainPage.tsx:40`, `MainPageWithoutRa.tsx:16`, `DesignCatalog.tsx:32`, `DesignCatalogSkeleton.tsx:9`, `GameInfoSkeleton.tsx:18` and `ConnectAccounts.tsx:44` do the same.

### AP-14 · MED · duplication
- **Where:** `api/cron/psnToken/route.ts:26-33`, `api/cron/scores/route.ts:22-29`, `api/cron/sweepCache/route.ts:15-22`.
- **What:** the same 8-line `CRON_SECRET` + `timingSafeEqual` gate, with the same docstring paragraph, three times.
- **Fix:** `requireCron(req): NextResponse | null` in `src/lib/cronAuth.ts`, with the same 503/401.
- **Size:** 24 → 3 lines, plus a 12-line helper.

### AP-15 · MED · abstraction / naming
- **Where:** types exported from route modules and imported by client code: `RankRow`/`RankingsResponse` (`api/rankings/route.ts`, 9 importers), `BalanceRow`/`FlaggedGame` (`api/admin/rankings/route.ts`, 2), `VaultMe` re-exported by `api/rankings/me/route.ts:7` (2 importers; it lives in `lib/vaultMe`), and `GameComment` (`api/getGameComments/route.ts`), which the client component `GameInfoComments.tsx:5` imports **without** `import type`. `GameCommentsResponse` is exported and never imported.
- **What:** client bundles reach into server modules that import `pg` and next-auth, just for a type. It works only because the import is elided. CLAUDE.md: code the browser loads must not reach `pg`.
- **Fix:** move the types to `src/types/rankings.ts` / `src/types/types.ts`; import `VaultMe` from `lib/vaultMe`; delete `GameCommentsResponse`.

### AP-16 · MED · dead
- **Where:** `api/follows/route.ts:18-38` (GET).
- **What:** nothing in `src/` calls `GET /api/follows`: `useFollow` only POSTs and DELETEs, and the Following page reads `/api/follows/overview` and `/cards`. Only its route test covers it.
- **Fix:** delete the GET handler and its test cases.
- **Size:** 92 → 70.

### AP-17 · MED · rule (hidden games, to verify)
- **Where:** `api/steam/activity/route.ts`, `api/steam/unlockYear/route.ts`; `src/context/ActivityHeatmapYearContext.tsx:106-110`; `src/lib/friendCards.ts:37`.
- **What:** RA's year feed and the PSN and Xbox feeds pass through `visibleGamesForUser`. Steam's 60-day and year feeds do not, and the year context filters RA and Xbox but not Steam. If nothing else filters them, a hidden Steam game still feeds the heatmap and the streak, and shows on a friend's card (`friendCards` → `steam/activity`). CLAUDE.md #88: hidden games are excluded from every listing-derived aggregate.
- **Fix:** confirm first, then apply `visibleGamesForUser(id, list, 'steam', (a) => a.appId)` in both routes, as `steam/recentAchievements` does. This is a behaviour change, so it is the owner's call.

### AP-18 · MED · duplication
- **Where:** `api/favorites/route.ts:33-34`, `api/perfectGamesOrder/route.ts:24-25`, `api/showcase/route.ts:23-24`.
- **What:** `canUseXbox(admin) ? rows : rows.filter((r) => r.source !== 'xbox')`, with the same comment, three times; `sourceAllowed` already says exactly this.
- **Fix:** `rows.filter((r) => sourceAllowed(r.source, admin))`. With AP-01, `admin` comes from the single session read.

### AP-19 · MED · duplication / library
- **Where:** the page shell `flex flex-col items-center min-h-screen bg-bg-main py-6 px-4 text-text-main` + `w-full lg:max-w-[98%] flex flex-col gap-N` in the page and loading files of `[category]/(list)`, `[category]/[consoleId]`, `allGames`, `groups/(list)` and `groups/[id]` (12 times in 10 files); the page title `font-display italic font-extrabold text-4xl sm:text-5xl leading-[1.1]` 11× in `src/` (in the groups page and its loading file here).
- **What:** the layout of a list page and of its skeleton is copied by hand, so a page and its skeleton can drift; the gap already differs (`gap-3`/`gap-4`/`gap-5`/`gap-6`). `groups/[id]` already names the string `PAGE`.
- **Fix:** a `PageShell({ gap, children })` (or a `PAGE_SHELL` const) and a `PageTitle` in the library, used by both a page and its `loading.tsx`.

### AP-20 · LOW · comments (stale)
- **Where / what:**
  - `api/pinnedGames/route.ts:10-14`, `api/groups/[id]/games/route.ts:11-15`, `api/hiddenGames/route.ts:11-15`: "RA or Steam", "clients from before Steam existed" (there are four platforms now).
  - Error texts that list two or three sources while the code takes four: `pinnedGames:90` "ra o steam", `hiddenGames:78` "ra o steam", `groups/[id]/games:100` "ra, steam o psn", `updateFavoriteGame:65` "ra, steam or psn".
  - `api/admin/users/accounts/route.ts:16-24`: "RetroAchievements, Steam or PSN" (Xbox too), and "users link Steam by name too" (false since 2026-10-21: they link through Steam).
  - `api/getGameData/route.ts:15-17`: "the viewer's own, or the shared one". There is no shared key (CLAUDE.md, RA).
  - `(main)/layout.tsx:24-25`: "the only page that gets this far is the landing". `/rankings`, `/rankings/how` and `/user/<name>` do too.
  - `sitemap.ts:11-13`: "until profiles are public to visitors too". They are now (teasers).
- **Fix:** update the wording.

### AP-21 · LOW · comments (noise)
- **Where:** `globals.css:66-68, 342-344, 370-372, 508-510, 532-534, 555-557 … 789-791` (`/* ==== */` banners, ALL CAPS labels); Spanish headings in an English file (`:3-7` "Tokens que Tailwind…", `:67` "VARIABLES BASE — fallback", `:371` "Neutro suave", `:790` "Botones de tema"); `(main)/groups/(list)/page.tsx:53, 86` (`{/* Header */}`, `{/* Content */}`); `[category]/(list)/page.tsx:81-83` (three comments for one line).
- **Fix:** one plain English line per theme ("Blue: cobalt accent…") with no banners; drop the JSX labels; one comment at line 81.

### AP-22 · LOW · abstraction (consistency)
- **Where:** `cachedJson(x, 0)` 14× (several with a "Not browser-cached" comment) versus hand-written `{ 'Cache-Control': 'private, no-store', Vary: 'Cookie' }` in `follows/cards:27`, `me/bootstrap:17`, `rankings:165`, `rankings/fill:19,30`, `rankings/me:16`.
- **What:** two ways of saying "do not keep this", with different headers (`max-age=0` vs `no-store`).
- **Fix:** a `noStoreJson(data)` in `src/lib/httpCache.ts` used by both groups, with the header picked on purpose.

### AP-23 · LOW · rule (style, file order)
- **Where:** double quotes and semicolons (the Style rule is single quotes and none): `api/auth/[...nextauth]`, `getGameData`, `getGameProgression`, `getGamesLastPlayed`, `updateRaUser`, `updateTheme`, `users`, `(main)/layout.tsx`, `(main)/(home)/page.tsx`, and parts of `layout.tsx`. Relative `../../../../` imports in `[category]/[consoleId]/page.tsx:5-11`. `dynamic()` consts between imports in `groups/(list)/page.tsx:14` and `groups/[id]/page.tsx:17-18`. A `'use client'` with no client code in `groups/[id]/loading.tsx`. In `(home)/page.tsx:34`, `JSON.stringify` sits beside `jsonLdString` on the next line.
- **Fix:** mechanical; a formatter run covers the quotes.

### AP-24 · LOW · duplication (css)
- **Where:** `globals.css:835-853` (`.home-fit:has([data-stats-section="overview"])` 9×), `850-852` ↔ `1050-1051` (the same two rules for `.profile-recent`), `793-799` (`.theme-button`).
- **What:** a repeated prefix and two identical rule pairs. `.theme-button` is used once (`ThemeModalOption.tsx:16`), and its `transition: all` repeats the element's own `transition-all`.
- **Fix:** CSS nesting under one `.home-fit:has(...)`; `:is(.home-fit:has(...), .profile-recent) .home-fit-scroll > *`; replace `.theme-button` with `hover:scale-105 cursor-pointer` on the element.
- **Size:** ~25 lines.

### AP-25 · LOW · library
- **Where:** `groups/(list)/page.tsx:92`, `groups/[id]/page.tsx:60, 64, 116`, plus 12 more `text-accent hover:underline … focus-visible:ring…` in `src/components`.
- **What:** a text-link button drawn by hand 16 times with the same class string.
- **Fix:** a `link` variant on `Button` (or `quiet`, if it matches), following the design-system flow (library first, then specimen, then guard).

### AP-26 · LOW · abstraction
- **Where:** `(auth)/authPage/layout.tsx` (a pass-through layout that exists only to export `metadata`; the server page can export it itself); `compare/[slug]/page.tsx` ↔ `track/[slug]/page.tsx` (identical apart from the section string); `opengraph-image.tsx` ↔ `user/[username]/opengraph-image.tsx` (the same frame styles and colours written twice); the font class list repeated in `layout.tsx:44` and `global-error.tsx:15`.
- **Fix:** move the metadata into the page and delete the layout; add a `FONT_VARIABLES` const in `lib/fonts.ts` and an `OG_FRAME` style const shared by both images. The compare/track twins are acceptable as they are (20 lines, and Next needs two routes).

### AP-27 · LOW · duplication
- **Where:** `getPlayerSummaries(...)` + cast + `players[0]`: `auth/steam/callback:22-32`, `auth/steam/register:18-21`, `admin/users/accounts:78-81` (also `lib/steamAccount.ts:57`). The site base from `NEXTAUTH_URL`: `auth/verifyEmail:23` re-implements `siteBase()` (`lib/steamLogin.ts:21`), as do `lib/emailVerification.ts:69`, `lib/passwordReset.ts:49` and `lib/siteUrl.ts:6`.
- **Fix:** one `steamPlayer(steamid, key)` in `lib/steamClient.ts`; `siteBase` (or `SITE_URL`) used everywhere.

### AP-28 · LOW · duplication
- **Where:** `getGamesCompleted`, `getRecentAchievements`, `getRecentlyPlayedGames`, `getWantPlayGames`, `getUserAwards` (and the owner check in `getGamesLastPlayed`).
- **What:** the same RA list-route skeleton: `dataOwner(req)` → 401 → "no RA → empty answer" → `withCache` with an `Array.isArray` validator → `visibleGamesForUser` → `cachedJson(…, 0)` → `raUnavailable`. There are nine copies of `(d) => d !== null && typeof d === 'object' && 'X' in d` across the RA routes.
- **Fix:** optional. A `raListRoute({ key, ttl, load, gameId, empty })` helper would bring each route to ~8 lines, but for five ~30-line routes that is borderline, so only do it if the routes are touched anyway. The cheap part is a small `hasKey('Results')` validator in `raCache.ts`.

### Tests (one line)
- No test file in `src/app/` looks duplicated or oversized; `api/follows/route.test.ts` covers the dead GET (AP-16).

## Cross-area notes
- Nested `<main>` in components (the list in AP-13): for the components auditor.
- `src/lib/httpCache.ts`: its docstring says every user of `cachedJson` is session-scoped, but `sameForEveryone` now exists. For the lib auditor.
- `NEXTAUTH_URL` base computed five ways (`lib/emailVerification`, `lib/passwordReset`, `lib/siteUrl`, `lib/steamLogin`, `verifyEmail`): for the lib auditor.
- `useGroups.ts:58,78` and `useGroupPage.ts:272` throw the server's `message` (Spanish strings such as "Máximo 20 grupos permitidos", "El juego ya está en el grupo"). Check whether it reaches the screen (i18n, as in AP-12).
- The width trio `w-[calc(100%-2rem)] sm:w-[calc(100%-4rem)] lg:w-[calc(100%-7rem)]` in `components/user-game-page/*` (5 files): see AP-03.
- `ActivityHeatmapYearContext` filters hidden RA/Xbox games but not Steam (AP-17): for the context auditor.
- 16 hand-made text-link buttons (AP-25): for the components auditor.
- `apple-icon.tsx` still draws "CH": left as is on purpose (CLAUDE.md, #84), not a finding.

## Coverage — every file reviewed
| File | Lines | Verdict |
|---|---|---|
| `src/app/(auth)/authPage/layout.tsx` | 15 | AP-26 |
| `src/app/(auth)/authPage/page.tsx` | 12 | ok |
| `src/app/(auth)/error.tsx` | 8 | ok |
| `src/app/(auth)/resetPassword/page.tsx` | 29 | ok (its own `<main>`: full screen, no layout around it) |
| `src/app/(main)/(home)/loading.tsx` | 10 | ok |
| `src/app/(main)/(home)/page.tsx` | 48 | AP-23 |
| `src/app/(main)/[category]/(list)/loading.tsx` | 16 | AP-19 |
| `src/app/(main)/[category]/(list)/page.tsx` | 362 | AP-04, AP-19 |
| `src/app/(main)/[category]/[consoleId]/[...missing]/page.tsx` | 11 | ok |
| `src/app/(main)/[category]/[consoleId]/loading.tsx` | 11 | AP-19 |
| `src/app/(main)/[category]/[consoleId]/page.tsx` | 91 | AP-04, AP-19, AP-23 |
| `src/app/(main)/[category]/layout.tsx` | 20 | ok |
| `src/app/(main)/allGames/loading.tsx` | 13 | AP-19 |
| `src/app/(main)/allGames/page.tsx` | 45 | AP-19 |
| `src/app/(main)/design/loading.tsx` | 5 | ok |
| `src/app/(main)/design/page.tsx` | 21 | ok |
| `src/app/(main)/error.tsx` | 7 | ok |
| `src/app/(main)/following/loading.tsx` | 17 | ok |
| `src/app/(main)/following/page.tsx` | 5 | ok |
| `src/app/(main)/gameInfo/[gameId]/loading.tsx` | 5 | ok |
| `src/app/(main)/gameInfo/[gameId]/page.tsx` | 63 | AP-03, AP-13 |
| `src/app/(main)/groups/(list)/loading.tsx` | 26 | AP-19 |
| `src/app/(main)/groups/(list)/page.tsx` | 130 | AP-19, AP-21, AP-23, AP-25 |
| `src/app/(main)/groups/[id]/loading.tsx` | 13 | AP-19, AP-23 |
| `src/app/(main)/groups/[id]/page.tsx` | 149 | AP-19, AP-23, AP-25 |
| `src/app/(main)/layout.tsx` | 43 | AP-20, AP-23 |
| `src/app/(main)/not-found.tsx` | 14 | ok |
| `src/app/(main)/psnGame/[id]/loading.tsx` | 5 | ok |
| `src/app/(main)/psnGame/[id]/page.tsx` | 91 | AP-03, AP-13 |
| `src/app/(main)/racha/loading.tsx` | 19 | ok |
| `src/app/(main)/racha/page.tsx` | 9 | ok |
| `src/app/(main)/rankings/how/loading.tsx` | 6 | ok |
| `src/app/(main)/rankings/how/page.tsx` | 21 | ok |
| `src/app/(main)/rankings/loading.tsx` | 5 | ok |
| `src/app/(main)/rankings/page.tsx` | 25 | ok |
| `src/app/(main)/steamGame/[appId]/loading.tsx` | 5 | ok |
| `src/app/(main)/steamGame/[appId]/page.tsx` | 115 | AP-03, AP-13 |
| `src/app/(main)/user/(account)/loading.tsx` | 5 | ok |
| `src/app/(main)/user/(account)/page.tsx` | 41 | AP-13 |
| `src/app/(main)/user/[username]/[platform]/[id]/loading.tsx` | 5 | ok |
| `src/app/(main)/user/[username]/[platform]/[id]/page.tsx` | 26 | ok |
| `src/app/(main)/user/[username]/loading.tsx` | 5 | ok |
| `src/app/(main)/user/[username]/opengraph-image.tsx` | 101 | AP-26 |
| `src/app/(main)/user/[username]/page.tsx` | 51 | ok |
| `src/app/(main)/xboxGame/[id]/loading.tsx` | 5 | ok |
| `src/app/(main)/xboxGame/[id]/page.tsx` | 98 | AP-03, AP-13 |
| `src/app/api/account/route.ts` | 48 | AP-01 |
| `src/app/api/admin/actions/route.ts` | 25 | ok |
| `src/app/api/admin/psn/route.ts` | 69 | ok |
| `src/app/api/admin/rankings/route.ts` | 91 | AP-15 |
| `src/app/api/admin/unlock/route.ts` | 54 | ok |
| `src/app/api/admin/users/accounts/route.ts` | 182 | AP-02, AP-20, AP-27 |
| `src/app/api/admin/users/route.ts` | 226 | AP-11 |
| `src/app/api/admin/xbox/achievements/route.ts` | 30 | ok |
| `src/app/api/admin/xbox/route.ts` | 31 | ok |
| `src/app/api/auth/[...nextauth]/route.ts` | 5 | AP-23 |
| `src/app/api/auth/forgotPassword/route.ts` | 59 | ok |
| `src/app/api/auth/ra/check/route.ts` | 44 | ok |
| `src/app/api/auth/resendVerification/route.ts` | 39 | AP-01 |
| `src/app/api/auth/resetPassword/route.ts` | 40 | ok |
| `src/app/api/auth/steam/callback/route.ts` | 99 | AP-27 |
| `src/app/api/auth/steam/register/route.ts` | 130 | AP-27 |
| `src/app/api/auth/steam/route.ts` | 22 | ok |
| `src/app/api/auth/verifyEmail/route.ts` | 48 | AP-27 |
| `src/app/api/avatar/[file]/route.ts` | 45 | AP-01 |
| `src/app/api/avatar/route.ts` | 69 | AP-01 |
| `src/app/api/changePassword/route.ts` | 47 | AP-01 |
| `src/app/api/cron/psnToken/route.ts` | 77 | AP-14 |
| `src/app/api/cron/scores/route.ts` | 39 | AP-14 |
| `src/app/api/cron/sweepCache/route.ts` | 31 | AP-14 |
| `src/app/api/favorites/route.ts` | 233 | AP-01, AP-05, AP-18 |
| `src/app/api/follows/cards/route.ts` | 28 | AP-22 |
| `src/app/api/follows/count/route.ts` | 27 | ok |
| `src/app/api/follows/overview/route.ts` | 65 | AP-01 |
| `src/app/api/follows/playing/route.ts` | 75 | ok |
| `src/app/api/follows/route.ts` | 92 | AP-01, AP-16 |
| `src/app/api/getAchievementDetail/route.ts` | 42 | AP-10 |
| `src/app/api/getActivityHeatmapYear/route.ts` | 22 | ok |
| `src/app/api/getGameArt/route.ts` | 34 | ok |
| `src/app/api/getGameComments/route.ts` | 45 | AP-15 |
| `src/app/api/getGameData/route.ts` | 27 | AP-20, AP-23 |
| `src/app/api/getGameHashes/route.ts` | 31 | AP-10 |
| `src/app/api/getGameProgression/route.ts` | 37 | AP-23 |
| `src/app/api/getGameSubsets/route.ts` | 49 | AP-01, AP-10 |
| `src/app/api/getGamesCompleted/route.ts` | 35 | AP-28 |
| `src/app/api/getGamesLastPlayed/route.ts` | 67 | AP-10, AP-23, AP-28 |
| `src/app/api/getRecentAchievements/route.ts` | 56 | AP-28 |
| `src/app/api/getRecentlyPlayedGames/route.ts` | 35 | AP-28 |
| `src/app/api/getUserAwards/route.ts` | 28 | AP-28 |
| `src/app/api/getUserRankAndScore/route.ts` | 29 | ok |
| `src/app/api/getWantPlayGames/route.ts` | 38 | AP-01, AP-28 |
| `src/app/api/groups/[id]/games/route.ts` | 193 | AP-05, AP-20 |
| `src/app/api/groups/[id]/route.ts` | 114 | AP-05 |
| `src/app/api/groups/[id]/years/route.ts` | 124 | AP-05, AP-08 |
| `src/app/api/groups/route.ts` | 60 | AP-01 |
| `src/app/api/hiddenGames/route.ts` | 89 | AP-01, AP-20 |
| `src/app/api/image-proxy/route.ts` | 87 | ok |
| `src/app/api/me/bootstrap/route.ts` | 18 | AP-01, AP-22 |
| `src/app/api/me/streak/route.ts` | 43 | AP-01 |
| `src/app/api/perfectGamesOrder/route.ts` | 68 | AP-01, AP-18 |
| `src/app/api/pinnedGames/route.ts` | 152 | AP-01, AP-05, AP-20 |
| `src/app/api/preferences/route.ts` | 45 | AP-01 |
| `src/app/api/presence/route.ts` | 34 | ok |
| `src/app/api/psn/details/route.ts` | 40 | AP-09 |
| `src/app/api/psn/link/route.ts` | 55 | AP-02 |
| `src/app/api/psn/recentTrophies/route.ts` | 37 | AP-09 |
| `src/app/api/psn/summary/route.ts` | 18 | AP-09 |
| `src/app/api/psn/titles/route.ts` | 15 | ok |
| `src/app/api/psn/trophies/route.ts` | 36 | AP-09 |
| `src/app/api/psn/unlink/route.ts` | 21 | AP-02 |
| `src/app/api/public/user/profile/route.ts` | 29 | ok |
| `src/app/api/rankings/fill/route.ts` | 35 | AP-22 |
| `src/app/api/rankings/me/route.ts` | 21 | AP-01, AP-15, AP-22 |
| `src/app/api/rankings/route.ts` | 170 | AP-15, AP-22 |
| `src/app/api/showcase/route.ts` | 114 | AP-01, AP-18 |
| `src/app/api/steam/achievements/route.ts` | 92 | ok |
| `src/app/api/steam/activity/route.ts` | 30 | AP-17 |
| `src/app/api/steam/gameDetails/route.ts` | 43 | AP-08 |
| `src/app/api/steam/icon/route.ts` | 37 | ok |
| `src/app/api/steam/ownedGames/route.ts` | 58 | ok |
| `src/app/api/steam/profile/route.ts` | 25 | ok |
| `src/app/api/steam/recentAchievements/route.ts` | 31 | ok |
| `src/app/api/steam/recentlyPlayed/route.ts` | 59 | ok |
| `src/app/api/steam/unlink/route.ts` | 31 | AP-02 |
| `src/app/api/steam/unlockYear/route.ts` | 22 | AP-17 |
| `src/app/api/unlinkRaUser/route.ts` | 27 | AP-01, AP-02 |
| `src/app/api/updateFavoriteGame/route.ts` | 75 | AP-01, AP-05, AP-20 |
| `src/app/api/updateRaUser/route.ts` | 77 | AP-01, AP-02, AP-23 |
| `src/app/api/updateTheme/route.ts` | 31 | AP-01, AP-23 |
| `src/app/api/updateUserProfile/route.ts` | 139 | AP-01, AP-11 |
| `src/app/api/users/[username]/route.ts` | 73 | AP-01 |
| `src/app/api/users/route.ts` | 129 | AP-02, AP-11, AP-12, AP-23 |
| `src/app/api/users/search/route.ts` | 50 | AP-01 |
| `src/app/api/xbox/achievements/route.ts` | 36 | AP-09 |
| `src/app/api/xbox/details/route.ts` | 50 | AP-09 |
| `src/app/api/xbox/link/route.ts` | 52 | AP-02 |
| `src/app/api/xbox/recentAchievements/route.ts` | 42 | AP-09 |
| `src/app/api/xbox/summary/route.ts` | 23 | AP-09 |
| `src/app/api/xbox/titles/route.ts` | 20 | ok |
| `src/app/api/xbox/unlink/route.ts` | 22 | AP-02 |
| `src/app/apple-icon.tsx` | 30 | ok (the "CH" is kept on purpose, CLAUDE.md #84) |
| `src/app/compare/[slug]/page.tsx` | 20 | AP-26 |
| `src/app/global-error.tsx` | 23 | AP-26 |
| `src/app/globals.css` | 1051 | AP-06, AP-07, AP-21, AP-24 |
| `src/app/layout.tsx` | 62 | AP-23, AP-26 |
| `src/app/manifest.ts` | 19 | ok |
| `src/app/not-found.tsx` | 11 | ok |
| `src/app/opengraph-image.tsx` | 34 | AP-26 |
| `src/app/privacy/page.tsx` | 12 | ok |
| `src/app/providers.tsx` | 19 | ok |
| `src/app/robots.ts` | 10 | ok |
| `src/app/sitemap.ts` | 31 | AP-20 |
| `src/app/terms/page.tsx` | 12 | ok |
| `src/app/track/[slug]/page.tsx` | 20 | AP-26 |
| `src/app/welcome/error.tsx` | 8 | ok |
| `src/app/welcome/page.tsx` | 23 | ok |
