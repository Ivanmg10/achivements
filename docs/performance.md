# Performance and data loading

Moved out of `CLAUDE.md` on 2026-11-07 (#124). `CLAUDE.md` → Performance keeps the "never do X" lines;
this file has every rule with its measurement. Steam's owned list, batch counts and `steam_unlocks`:
`platforms/steam.md`.

## Performance rules — keep these true (audited 2026-10-16)

- **Nothing the first paint needs waits for JavaScript (audit v1.7, 2026-10-30).** No Framer `initial`
  with opacity 0 on what a visitor reads first; use CSS keyframes, or `AnimatePresence initial={false}`.
  That one change took the landing's LCP from 12.8 s to 1.4 s under the audit's throttling.
- **Country flags are a 78 KB flag-only font, and it only downloads when a flag is on screen (#165, F2, the owner's choice, 2026-11-14).** `public/fonts/TwemojiCountryFlags.woff2` (Twemoji Country Flags, the woff2 of `country-flag-emoji-polyfill`, taken once with `npm pack`; the package is not a dependency) is declared in `globals.css` with a `unicode-range` of the regional indicators (U+1F1E6-1F1FF) and the black flag's tags, and `font-display: swap`; it is first in `--font-sans` / `--font-display`. A browser fetches a `unicode-range` face only when a character in the page falls in the range, so a page with no flag pays nothing, and no other character ever uses it. It also draws the flags on systems that have their own (one look everywhere). The alternative, small SVG flags, was not taken. Credit is in the README (CC BY 4.0).
- **Code the browser loads must not reach `pg`.** `steamClient` and `fetchRA` are server code; picture
  and page URLs live in `steamAssets.ts` (pure). Reaching the database from something a client imports
  breaks the build even through a dynamic import.
- **Every call to a platform has a deadline shorter than the client's 20 s** (two 8 s attempts on RA
  and Steam, 8 s per PSN call through `psnCall`, since `psn-api` takes no signal). RA keeps its measured
  pace per key in `fetchRA`; every Sony call spends the app's `psn-upstream` budget and a refusal
  cools the instance down a minute. `countUpstream` counts calls per day; Steam fills wait at 85 % of its
  100,000 a day (`steamBudgetLow`).
- **Guarded work counts first:** `reserveAttempt` before a password check, never a count and then a
  record: a burst passes those together (30 of 30 past a limit of 10, measured).
- **What a user stores has an end:** a length on text, a row cap, one `unnest` statement for an order.
- **Cross-site writes stop in `src/proxy.ts`**, whose matcher takes `/api` only when the request carries
  `Origin`, so same-origin reads never pay for it.

- **recharts is only loaded through the lazy plot** (`AchievementsLinePlot`, via
  `next/dynamic`). Their `loading` and the chart's data state are the same
  `LineChartSkeleton`, or the reader sees a second skeleton between them. Never import `recharts` in
  a component that is part of a page's first render: it is ~390 KB.
- **A modal is a `next/dynamic` import wrapped in `LazyWhenOpened`**, so it is
  downloaded the first time it opens and stays mounted after (its exit animation
  plays). Do not import a modal statically into a page or the header.
  (A test waits for such a modal with `findBy…`; `__mocks__/next/dynamic.js`.)
  **Always pass `{ loading: () => null }`** (or a real fallback): without `loading`,
  `next/dynamic` adds no Suspense boundary, so the first download suspends up to the
  route's `loading.tsx` and the whole page flashes its skeleton (seen 2026-10-18).
  The jest mock always wraps one, so tests cannot catch it.
- **Several components asking for the same GET share one request while it is in
  flight**: `fetchWithRetry` does it for you; for a raw `fetch` of a GET use
  `fetchShared`. A shared answer is shared by reference: copy before changing it.
- **Read routes that are expensive upstream send `cachedJson(data, ttl)`**
  (private, `Vary: Cookie`): the PSN and Xbox reads (5 min per game, 2 min for
  recent unlocks) as RA's and Steam's already did. Mutable data (groups, pins,
  preferences) never does. **`Vary: Cookie` almost never lets the browser's copy serve:**
  next-auth rewrites the session cookie on every session read (measured 2026-11-02). An answer
  that depends only on the URL (a game's definition, subsets, comments, Steam/PSN details)
  passes `{ sameForEveryone: true }` and drops it; anything per user or refreshed by cookie keeps it.
- **A context value is memoized** when its provider reads the session (the session
  updates on every visit and would re-render every consumer).
- **A route group has an `error.tsx`** (`RouteError`), or its errors replace the
  whole app (`global-error`, which renders the same `RouteError` full screen).
  Its `Reintentar` calls Next's **`retry()`**, not `reset()`: `reset()` only
  re-renders, so a server error never recovers (measured 2026-10-18, Next 16.3).
  `(main)/not-found.tsx` takes a `notFound()` inside the app **and most URLs that
  match nothing** (`/foo` via `[category]`, even `/compare/x`); it reads the
  session on the server: signed in, under the header (a game page names its
  platform, Xbox only to whoever may see it); signed out, full screen. URLs of
  three or more segments reach it through `[category]/[consoleId]/[...missing]`
  (it cannot sit beside `[category]` or `[consoleId]`: Next refuses two dynamic
  names on one level). A game 404 answers HTTP 200: those routes stream (a
  `loading.tsx`, `notFound()` on the client), so the status is out first. The layout's
  `<main>` is a block: these screens size themselves (`STATUS_SCREEN`) and are a
  `<div>` inside it, a `<main>` only full screen.

## Data loading — what each page asks for (#101, 2026-11-02)

Every route used to pay for the home's data: `MainProviders` loaded every library, the year of
unlocks, pins and the showcase at mount, read or not (#86 measured ~25 shared calls and 1.3 MB on
Rankings). Keep these true:

- **A global data provider loads on its first reader.** Reading the hook is what asks for it
  (`request()` in the context, called by `useGamesData`, `useSteamGamesData`, `usePinnedGames`…, as
  `RecentAchievementsContext` started). A reader that only needs `isLinked` (from the session) passes
  `{ passive: true }`; `useConsoleVisibility` reads the PSN/Xbox libraries only when one of their
  consoles is unticked. **A new provider in `MainProviders` follows the same pattern; never fetch at mount.**
- **The header never reads the year.** Its streak is `useStreakSummary` → `GET /api/me/streak`, counted
  on the server from the same loaders and caches the streak page uses (`lib/raYear`, `lib/steamUnlockYear`,
  `psnRecentTrophies`, `xboxRecentAchievements`; `lib/meStreak.ts`), with hidden games and the consoles
  unticked in the browser (`?hidden=`) left out, UTC days, `calcAllStreaks` from `utils/streaks.ts`.
  Only the viewer's own (it ignores `?user=`); Xbox for admins; every platform failing is a 502.
  Anything else that only shows the streak number uses it too (the search modal does).
  Its `streak` is `null` until the first answer (the header draws `StreakTag loading`, never a 0 meanwhile).
- **A streak is drawn whole (2026-11-11):** the year's `isLoading` (`ActivityHeatmapYearContext`) is true
  before anything is asked and until every linked platform answered, and `useActivityHeatmapYear` also waits
  for the PSN/Xbox library `useConsoleVisibility` needs when one of their consoles is unticked. A reader of
  the year shows its skeleton while `isLoading`, never a streak counted from part of it.
- **`useAuthSession`, never `useSession`, wherever `status` is read.** next-auth's `update()` flips `status`
  to `'loading'` and back, which re-ran every effect keyed on "signed in" on each page load.
  `RaUserRefresher` only calls `update()` when RA's profile moved.
- **`GET /api/me/bootstrap`** is the start-up CheevoVault data in one answer: preferences, hidden games,
  Vault Points (`lib/meBootstrap.ts`, `lib/vaultMe.ts`). **Database only, never a platform**, each part on
  its own (a failed part is null). Readers take it for their **first** read only (`bootstrapPart`, 10 s
  window); every refresh keeps its own route, which shares the same loader. A new small start-up read
  of our own data can become a part; anything that calls a platform cannot.
- **`GET /api/follows/cards`** (`?who=followers`) gives the Following lists with the ten newest people's
  activity and games, in one answer that lands whole. It calls the profile routes' own `GET` handlers in
  this process with `?user=` (`lib/friendCards.ts`), so `dataOwner`, whose RA key, private profiles,
  Xbox for admins, hidden games and the caches stay exactly the routes' rules. **Do not re-implement
  those rules there**; a new list on the card is a new handler in that file. Pace: one person at a
  time for the people you follow (Xbox's budget, #87), two for followers.
- **The home mounts its self-loading sections (pins, groups, browse) when the browser is idle**
  (`useWhenIdle`, two seconds at most) or when opened: switching stays instant, the first paint does
  not wait on them. The home's own platform data still comes from the libraries: an `overview` per
  platform was not built, because the profile column and the overview panel need the whole library
  (see the worklog, 2026-11-02, #101).
- **Platforms stay as fresh as the server lets them (the user's rule, 2026-11-02):** they want a game
  change seen at once, and to make it faster later. So nothing in the browser may make a platform's
  data older than its server cache: page reads of platform data are **painted from their last answer
  and always read again** (`lastAnswers`, by user and URL, memory only), never served from a client
  TTL. Our own data uses the same (no invalidation to forget). The home takes RA's and PSN's 60 days
  from the year (refreshed as often); **Steam keeps its own** (its year is kept 30 min, its 60 days 5).
- **What runs on every load runs at most once a minute per tab** (`dueInThisTab`, sessionStorage):
  the RA profile refresh (it updates the profile's last game, so keep it short) and the arrival beat.
- **RA game pictures are kept in the browser** (`raArtStore`, localStorage `ra-art`, 400 games): they
  never change. `/privacy` says so in all nine languages; a new kind of thing kept there says so too.
- **RA unlocks are sent without the fields no page reads** (`slimUnlock` in `lib/raYear.ts`: `AuthorULID`,
  `BadgeURL`, `GameURL`, `CumulScore`; the year went 755 → 577 KB). The cache keeps them whole. A page that
  starts reading one of them takes it off that list.
- **Measure before and after** with `scripts/measure-api-calls.js` (Playwright, a signed-in browser,
  the same environment both times). Results of #101 in `docs/audits/perf-security-apilimits-v17.md`.
