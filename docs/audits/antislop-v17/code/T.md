# T — Tests (every `*.test.ts(x)` in `src/`) and the guard tests
Auditor notes: 853 test files, 57,294 lines (the brief said ~57k). The suite is broad and mostly behaviour-first (route tests assert status codes, hook tests assert states), and it is the best-kept part of the repo. Its problems are structural: nothing runs it in CI, about 650 lines test dead code, about 3,500 lines are per-platform clones, 1,234 `jest.mock` calls repeat a handful of literals, and the guards (the project's real enforcement) have holes that match what the code and visual auditors found. Method: one `wc` listing, all guards read in full, the largest and the dead-code tests read by head and by `describe/test` titles, the rest sized and grepped. Counts below come from grep over `src/`.

## Findings

### T-01 · HIGH · rule — no CI runs the tests, the lint or the build
- **Where:** `.github/workflows/` holds only `pr-description.yml` and `pr-issue.yml`. `package.json` has no `pretest`/`prebuild`, `.githooks/` has only `commit-msg` and `pre-commit` (the version bump), `vercel.json` has no `buildCommand` (Vercel just runs `next build`).
- **What:** CLAUDE.md says "never merge a PR with failing `npm test`/lint/build", but nothing enforces it. The rulesets require only `pr-description` and `linked-issue`. So `uiGuard.test.ts`, `designTokens.test.ts`, `themes.test.ts`, the Xbox-in-public-pages test and `load.test.ts` ("a language must stay plain data") fail only if someone runs `npm test` by hand. Every guard finding below is made worse by this.
- **Fix:** one `ci.yml` on `pull_request` with `npm ci`, `npm run lint`, `npx jest --coverage=false` (see T-14), `npm run build`; add its check to the `pr description` ruleset. This is the single cheapest change in the whole audit.
- **Size:** about 25 lines of YAML.

### T-02 · HIGH · dead — tests of dead code (about 660 lines to delete with their code)
Each item was confirmed by grepping `src/` for importers other than its own file and test.
| Test | Lines | Dead code it covers |
|---|---|---|
| `components/main-page/main-page-charts/MainPageMastery.test.tsx` | 124 | `MainPageMastery.tsx` (154), no importer |
| `.../MainPagePerfectGames.test.tsx` | 113 | `MainPagePerfectGames.tsx` (128), no importer |
| `.../main-page-games-list/MainPageGamesList.test.tsx` | 77 | `MainPageGamesList.tsx` (123), no importer |
| `.../mastery-by-console/MasteryByConsole.test.tsx` | 29 | only used by `MainPageMastery` |
| `.../perfect-podium/PerfectPodium.test.tsx` | 32 | only used by `MainPagePerfectGames` |
| `.../perfect-game-tile/PerfectGameTile.test.tsx` | 29 | only used by `MainPagePerfectGames` |
| `components/games-played-pie-chart/GamesPlayedPieChart.test.tsx` | 23 | `GamesPlayedPieChart.tsx` (93), no importer; it was the only user of `groupByConsole` |
| `components/main-start/MainStart.test.tsx` | 22 | `MainStart.tsx` (21), no importer |
| `constants/ragamesidpool.test.ts` | 7 | `ragamesIds`, whose only reader is `getRandomGameIds`, which nothing calls |
| `utils/utils.test.ts` lines 4-19, 21-56, 57-79, 80-106 | about 103 | `getRandomGameIds`, `groupByDay`, `groupByConsole`, `calcStreak`, exported but never imported (`calcStreak` is the old streak, replaced by `utils/streaks.ts`) |
| `utils/steamMappers.test.ts` lines 74-103, 169-171, 192-196 | about 40 | `withAchievementCounts` (replaced by `withUnlockCounts`) |
| `utils/apiCallsUtils.test.ts` lines 19-34 and 51-68 | about 34 | `getGamesInfo`, `getWantGames` (no caller) |
| `utils/showcase.test.ts` lines 37-44 | about 8 | `showcaseFromUnlock` (the only caller is the test) |
| `app/api/follows/route.test.ts` lines 35-52 (`describe('GET')`) | 18 | `GET /api/follows`: `useFollow` only does POST and DELETE; the list is read from `/follows/overview` and `/follows/cards` |
- **Fix:** delete each test in the same change as its code (the code auditors list the code). The two-step order matters: delete the code first, then run `npx tsc --noEmit`, and the dead tests show up as import errors.
- **Prevent a return:** add `knip` (or `ts-prune`) as a non-blocking CI step. Dead exports kept alive by a test are invisible to every other check; `knip --production` ignores test files, so it would have listed all of the above. Also note `collectCoverage: true` with a global threshold: dead code that has tests raises the percentage, so removing it will move the floor slightly (the floor is "a little under" the 2026-10-09 measure; re-measure after the cleanup).
- **Size:** about 660 lines (about 456 whole files, about 200 inside kept files).

### T-03 · HIGH · duplication — per-platform test clones (about 3,500 lines that could be about 1,300)
The code is copied per platform (see `.audit/code/D1.md`), and the tests were copied with it. Normalising names (`Psn`/`Xbox`, `trophies`/`achievements`) and diffing:
- `usePsnTrophies.test.ts` (50) vs `useXboxAchievements.test.ts` (48): 16 differing lines. The five cases are identical: loads nothing without a game; loads once and loading from the first render; keeps the reason it failed and retries; a network failure is "failed"; an answer without the list is a failure.
- `usePsnGamesByCategory` vs `useXbox...` 19 differing of 30/39; `usePsnLink` vs `useXboxLink` 54 of 92/116; `usePsnGameDetails` vs `useXbox...` 51 of 58/53; `usePsnSummary` vs `useXboxSummary` 40 of 63/77; `usePsnFavoriteTrophies` vs `useXboxFavoriteAchievements` 55 of 90/91.
- `PsnGamesDataContext.test.tsx` (118) vs `XboxGamesDataContext.test.tsx` (116): the same nine cases ("without X linked", "loads once, loading from the first render", "keeps the reason it failed, and loads again on refetch", "an unexpected answer is failed", "the consoles unticked in preferences", "nothing is asked without a reader (#101)"). Steam's context test (340) repeats them again with its own twists.
- `api/psn/*/route.test.ts` vs `api/xbox/*/route.test.ts` (link, unlink, summary, titles, trophies/achievements, details, recent): 938 lines for 14 files, each with the same 401 / 403 / 429 / 502 / not-found cases.
- `psn-game-info-table` (151), `xbox-game-info-table` (138), `steam-game-info-table` (266): 235 differing lines of about 140 between Psn and Xbox after name normalisation, i.e. everything is the same but data.
- Families by size (psn+xbox+steam files, lines): Recent 690, Contexts 574, Link 554, Game-info-header 290, Favorite 274, GameDetails 203, GamesByCategory 183. The 116 psn/xbox test files total 8,126 lines, the 65 Steam ones 7,149, so about 27 % of the suite is platform-specific.
- **Fix:** after the code is merged per platform (D1's fix), one contract suite per family in `src/test-utils/` taking a config, e.g. `describeLoadHook({ name, hook, url, field })`, run with `describe.each([psn, xbox])`; the platform-specific cases (Xbox 360 merge, PSN collections, Steam batches) stay in their own files. Do this **after** the code merge, not before: a contract suite on top of three copies hides the differences the copies hold.
- **Size:** 3,500 → about 1,300 lines.

### T-04 · HIGH · guard gap — `themes.test.ts` covers 9 of 22 themes and never a tint
- **Where:** `src/app/themes.test.ts:55` (`describe.each([...9 themes])`).
- **What:** the list is the themes added in #84. Never checked: `dark, light, dark-red, dark-green, light-red, light-green, blue, purple, green, red, sakura, arctic, black-ops-2` (13, including the default). Also missing for every theme: `--hardcore`/`--softcore` on a card, the meaning colours on their own 10 % tint (this is what a `Notice` draws), and the accent text on its 15 % tint (selected `Pill`, pressed `IconButton`, `Modal` head icon). I ran the test's own `tokens()`/`contrast()` helpers over all 22 themes with those extra pairs (script in the scratchpad, not in the repo). Failures at under 4.5:1 today:
  - danger on its tint: `dark`, `dark-green`, `dark-blue`, `dark-white`, `blue`, `steam-retro`
  - success on its tint: `light-green`; info on its tint: `light-blue`, `steam-retro`
  - accent on its 15 % tint: `light`, `blue`, `purple`, `red`, `arctic`, `steam-retro`
  - softcore on a card: `steam-retro` (3.87), a theme the test calls "reads"
  - muted text on the tertiary ground: `blue`

  These match V7-01 (which used Python and also catches the same pairs). Note `steam-retro` and `dark-blue` pass the suite today and fail four pairs between them, proof that the missing pairs matter.
- **Fix:** run `describe.each(THEMES)` (the list is already exported), add the tint pairs and `--hardcore`/`--softcore`, and fix the tokens (V7 measured the replacement values) before turning the test on; or keep the new pairs in a second `describe` with a documented `KNOWN_FAILURES` map per theme so the suite is green and can only shrink. Also assert "main text vs muted text is at least 1.5:1" to catch the midnight/crimson/steam-retro case V7 found (1.20 to 1.28).
- **Size:** about +25 lines; one small helper `tint(fg, bg, alpha)`.

### T-05 · HIGH · guard gap — palette classes: the guard checks 5 hues and 5 shades
- **Where:** `uiGuard.test.ts:74-77`: `(text|bg|ring|border|fill|stroke|from|to|via)-(red|green|yellow|amber|orange)-(200..600)`.
- **What:** outside `ui/` there are 54 palette-class uses in 22 files that pass. By hue: `sky-300` 21, `zinc-*` 17, `purple-*` 15, `blue-*` 10, `teal`, `slate`, `violet` and `-900`/`-950` shades of `yellow`/`green` in 6 files (`bg-yellow-900/60`, `text-amber-950`). The `sky-300` ones are the PSN cards (C: `accent="text-sky-300"` passed through `StatCard`'s `accent` prop). The guard also misses `shadow-`, `outline-`, `divide-`, `decoration-` prefixes. All of it bypasses the theme (light themes have a 49-rule override in `globals.css` only for some shades, AP.md).
- **New rule (replaces the current one):**
  ```ts
  const HUES = 'red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone'
  expect(offenders(new RegExp(`(?<![\\w-])(?:text|bg|ring|border|fill|stroke|from|to|via|shadow|outline|divide|decoration)-(?:${HUES})-(?:50|[1-9]00|950)\\b`)).filter((f) => !PLATFORM_AND_TIER_FILES.includes(f))).toEqual([])
  ```
  with an allowlist of the one or two files that legitimately hold platform and tier hues (the documented exception in CLAUDE.md), once platform colours live in one file (see T-06 hex rule). Today it would flag the 22 files; fix them first or start with an allowlist that can only shrink.
- Also make the `accent` prop of `StatPill`/`StatCard` a union of theme tokens instead of `string`, so TypeScript stops what the regex cannot see.

### T-06 · HIGH · guard gap — five more holes the code auditors found
Each has the rule that would stop it. All additions go in `uiGuard.test.ts`; each would fail today, so start with an allowlist of the present offenders.
| Gap | Evidence today | Rule |
|---|---|---|
| Side radii | `LibraryShelfCard.tsx:41` `rounded-t-2xl` (D2) passes: the guard has `rounded-(xl\|2xl)` and `rounded-<side>-(lg\|md\|sm\|3xl)` but not `<side>-(xl\|2xl)` | widen the first regex to `/(?<![\w-])rounded(?:-[tblrse]{1,2})?-(?:xl\|2xl)\b/` (1 file) |
| Framer `variants` | `variants={` in `AuthPage`, `LibraryGameDetail`, `MobileNavModal`, `SearchModal` (4 files, plus `lib/animations.ts`); the current guard only sees `initial={{ y: }}` and `variants={fadeUp}`, so `hidden: { y: 14 }` passes (D2) | `expect(offenders(/\bvariants=\{/).filter(notClickOpened)).toEqual([])`; allowlist the click-opened ones, which are documented as allowed |
| Hand-made retry / pill buttons | 15 files draw `<button className="... rounded-full ...">` (e.g. `text-xs bg-bg-main px-3 py-1 rounded-full hover:bg-ink/10`, 11 files) instead of `Button`; D1 reports 15 files | `/<button\b[^>]*?className=\{?["'`][^"'`]*\brounded-full\b/` outside `ui/`, plus `/px-3 py-1 rounded-full hover:bg-ink\/10/`; the `IconButton` already covers round icon buttons |
| Hand-made notice boxes | 14 files combine `bg-(danger\|warning\|success\|info)/N ... ring-1/ring-inset` (D1: 8+), 27 files use `ring-(danger\|warning\|success)/N`; `Notice` exists | `/bg-(?:danger\|warning\|success\|info)\/\d+[^"'`]*ring-(?:1\|inset)/` outside `ui/` |
| `createPortal` outside `ui/` | 12 files: `GroupModal`, `AdminPanelModal`, `AddGameModal`, `GameHashesModal`, `AchievementModal`, `AchievementDetailModal`, `GameAchievementsProgressChartModal` wrap a `Modal` in `createPortal` although `Modal` portals itself (`ui/Modal.tsx` has 2 uses); `AchievementGrid`, `PsnTrophyGrid`, `XboxAchievementGrid`, `SteamAchievementGrid` portal a copied tooltip; `WelcomeCurtain` | refuse `createPortal` outside `ui/` with a two-file allowlist (the curtain, the tooltip piece once it exists in `ui/`) |
| Dialogs by `role` | the "dialogs come from Modal" rule only looks for `className="fixed inset-0 ... bg-black"`; `LayoutModal`, `SearchModal` carry `role="dialog"` by hand and `MobileNavModal` has no role at all (C) | also refuse `role="(alert)?dialog"` and `aria-modal` outside `ui/` with the same allowlist |
| Hex colours and platform brand colours | 213 hex literals in 78 non-test files; `bg-[#...]`-style arbitrary colours 145 in 64 files; `#66c0f4` (66), `#0070d1` (54), `#107c10` (20), `#1b2838` (8) are Steam/PSN/Xbox brand colours repeated across files (B-07 says 114 places) | one `src/utils/platformColors.ts` (or `ui/platform.ts`) holds them; refuse `/#[0-9a-fA-F]{6}\b/` and `/-\[#/` outside that file, `themeIcon.ts` (`LOGO`), `opengraph-image.tsx` and `apple-icon.tsx` |
- The `radius` allowlist keeps three entries that exist only for the unreachable `rounded-3xl` links (A-23): drop them with the dead branch.
- The guard matches whole files (`offenders` returns files, not lines): one allowed file hides new offences in it. For the allowlisted files (`LandingHero`, `Portada`, three `MainPageProfile*`) prefer an exact-line allowance (`// uiGuard: allow rounded-[2rem]` and a regex that honours it) so the exception cannot grow.
- **Size:** about +35 lines in `uiGuard.test.ts`.

### T-07 · MED · duplication — mocks copied instead of shared (`jest.config.js` already has the right mechanism)
`jest.config.js` already maps `@/context/LanguageContext`, `next/navigation`, `next-auth`, `next-auth/react`, `next/link`, `next/image` to `__mocks__/`. The same idea is not used for the rest:
| Literal | Files |
|---|---|
| `jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))` | 75 of 83 files that mock the db (30 of them next to the `authOptions` mock) |
| `jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))` | 67 |
| `jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))` | 34 of 37 |
| `jest.mock('@/lib/steamCache', () => ({ ...jest.requireActual('@/lib/steamCache'), withSteamCache: jest.fn() }))` | 11 of 32, same shape a dozen ways |
| `(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1', ... } })` | 215 casts in 62 files, 60 with the same `{ user: { id: '1' } }` |
| a local `makeRequest` / `request` / `req` builder | 24 definitions in route tests, 5 of them `const request = (body) => ({ json: () => Promise.resolve(body) }) as unknown as Request` |
| `global.fetch = jest.fn()...mockResolvedValue({ ok: true, status: 200, json: async () => X })` | 101 files |
| `jest.spyOn(console, 'error').mockImplementation(() => {})` + `afterEach(mockRestore)` | 163 files (99 restore) |
- **Fix:** (1) add `moduleNameMapper` entries for `@/lib/db`, `@/lib/authOptions` and `@/lib/notify` to files in `__mocks__/lib/`, exactly as `LanguageContext` is done (no test wants the real pool or the real toaster); the 75+67+34 one-liners disappear. (2) `src/test-utils/http.ts`: `jsonResponse(body, init?)`, `mockFetch(routes)`, `asSession(user?)`, `jsonRequest(method, url, body?)`. (3) in `jest.setup.js`: a global `beforeEach` that silences `console.error` unless a test opts in (`jest.spyOn(console, 'error')` then stays only where a test asserts on it); this removes about 160 setup/teardown pairs. Keep per-file overrides where the file needs a different mock; the mapper mock is replaceable with `jest.mock` in the file.
- Fixtures: `src/test-utils/` has `psnFixtures.ts`, `xboxFixtures.ts`, `libraryFixtures.ts` but no Steam one, while four Steam tests each define their own `game(...)` builder for `SteamGameProgress` (`SteamGameItem`, `SteamStatusGameItem`, `MainPageProfileStStats`, `useSteamGamesByCategory`, plus `steamProgress`). Add `steamFixtures.ts`.
- **Size:** about 800 lines of boilerplate across 250 files.

### T-08 · MED · abstraction — over-mocked "integration" tests that test the wiring against fakes
- **Where:** `main-page-charts/MainPageCharts.test.tsx` (286 lines, 28 `jest.mock`), `app/(main)/[category]/(list)/page.test.tsx` (447, 16 mocks, replaces about 12 child components with `<div data-testid=...>`), `app/(main)/groups/[id]/page.test.tsx` (178, 13), `[consoleId]/page.test.tsx` (10), `MainPage.test.tsx`, `MainPageBrowse.test.tsx` (9), `lib/scoreRefresh.test.ts` (9). In total 1,234 `jest.mock` calls, 240 of them replacing a component (`jest.mock('@/components/...')`) in 112 files.
- **What:** these tests assert that "component A passes prop p to the mocked B" and `getByTestId('steam-section')`. They pass while the real child is broken and fail on any rename or re-split of a child, which is the refactor this issue is about. The `MainPageCharts` test also mocks hooks the real one renames (`useHomeLayout` has no test of its own).
- **Fix:** where the child is cheap (cards, lists), render it for real and assert text and roles; keep mocking only the network edge (`fetch`) and the providers. A page test should read as "given these API answers, the user sees X". Do this opportunistically while each page is refactored; do not rewrite them first.
- **Size:** `page.test.tsx` 447 → about 250 (the 60-line mock block goes).

### T-09 · MED · implementation details — assertions that break on a refactor
Counts over all test files:
- `querySelector(...)` 416 times in 190 files: `'img'` 82, `'[aria-busy="true"]'` 35, `'.animate-pulse'` 15, `'.bg-skeleton'` 11, `'svg'` 14. The skeleton ones assert the class that implements loading (and `.animate-pulse` is the very class the guard forbids outside `Skeleton`), instead of the `aria-busy` the component promises.
- `toHaveClass` / `.className` 166 + 104 times: `text-success` 15 (this one documents a rule, "green only in the percentage", and is fine), `opacity-0` 9 (the cover art test in `MainPagePortada.test.tsx` checks a class instead of the behaviour "the art is hidden until it loaded"), `object-top`, `grayscale`, `skew-x-(--slant-pill)`, `sm:max-w-5xl`, `min-h-screen`.
- `data-testid` appears in 262 source/test spots and `getByTestId` 359 times in 123 files; many are the fake components of T-08.
- `mock.calls[n]` 241 times in 104 files and `toHaveBeenCalledTimes` 264 in 120: call-order and call-count asserts on `fetch`/`pool.query`. Route tests assert SQL parameters (`expect(params).toEqual(['1', 'steam', '620'])`) and, in 13 places, parts of the SQL text (`expect(sql).toContain('ORDER BY f.created_at DESC')`).
- **Fix:** do not rewrite; apply as a rule going forward. Prefer `getByRole`/`getByText`/`aria-busy`; for skeletons a single `expectLoading(container)` helper in `test-utils` so a change of the Skeleton markup is one edit; assert on the HTTP response and the visible result, and keep `mock.calls` for "was not called" and for the URL.

### T-10 · MED · rule — the database is never real in a test
- **Where:** 83 test files mock `@/lib/db`; the 94 API route tests all run against `pool.query = jest.fn()`.
- **What:** every SQL statement, `ON CONFLICT` target, unique index, `unnest` order update, cascade and migration is untested. The history in CLAUDE.md has several bugs of exactly this kind (a constraint dropped by migration 011 that old code named in `ON CONFLICT`; a `show_presence` column missing from a database fails every request; "30 of 30 past a limit of 10" in a race). A mock cannot catch any of them.
- **Fix:** one small integration job in CI (T-01) against a throwaway Postgres (service container or pg-mem for the plain SQL), running `migrations/*.sql` in order and then 10 to 15 smoke tests: pins upsert, group order, `reserveAttempt` under concurrency, follow/unfollow, `score_games` write, hidden-games filter. Keep it separate from `npm test` so the unit suite stays fast.

### T-11 · MED · rule — time- and timezone-dependent tests
- 43 test files use the real `new Date()` / `Date.now()`; only 5 use `setSystemTime`; `jest.config.js` sets no `TZ`. Cases such as `utils.test.ts` "counts consecutive days ending today", "counts achievements within the last 7 days" (using today's string), the heatmap, `PresenceLabel`, the streaks and `groupGameAchievementsByPeriod` depend on the wall clock and the machine's zone; they fail around UTC midnight, on 1 January, or on a CI runner in another zone. Several app rules are UTC-day based (CLAUDE.md: "UTC days"), so the tests should be too.
- **Fix:** `process.env.TZ = 'UTC'` in a `globalSetup` file (or `TZ=UTC jest` in the script), and a `freezeNow('2026-11-03T12:00:00Z')` helper in `test-utils` (`jest.useFakeTimers({ now, doNotFake: ['nextTick', 'setImmediate'] })`) for the 43 files, adopted as they are touched. The same change fixes the flaky `calcStreak` tests that T-02 deletes anyway.

### T-12 · LOW · naming/structure — tests detached from their file
- `app/api/getActivityHeatmapYear/route.test.ts` (106 lines for a 22-line route) spends about 45 lines on `heatmapBuckets`, a function of `lib/raYear`; those belong in `lib/raYear.test.ts`. Same for `fetchShared.test.ts` (99 lines, 4.7× its 21-line source: check it is not testing the mocks).
- `utils/utils.test.ts` (481) tests `utils/utils.tsx` (a grab bag, 523 lines); seven more small tests (`releaseYear`, `unlockSpan`, `streakInsights`, `plural`, `relativeTime`, `capList`, `dayUtils`) also import from `./utils`, so `utils.tsx` has 8 test files and no stated split. Split the source by topic (dates, streaks, sort, images) and the tests follow (A/UT own the source). `dataOwner.test.ts` (159) tests `dataOwner` from `lib/apiAuth` while `apiAuth.test.ts` (157) exists beside it.
- `library-entry-parts.test.tsx`, `libraryEntryLinks.test.tsx`, `libraryHooks.test.tsx`, `libraryPlatformLogos.test.tsx`, `library-detail-parts.test.tsx` test several modules per file, named after none of them.

### T-13 · LOW · coverage gaps against CLAUDE.md ("every new hook, utility and component gets tests")
- No sibling test: hooks `useAdminRankings`, `useGroupProgress`, `useHomeLayout`, `useLibraryKeys`, `useMediaQuery`, `usePreviewLayout`, `useRecentAchievements`, `useRecentFeed`, `useRecentlyPlayedGames`, `useToasts`, `useXboxRevealSecrets` (11 of 121); contexts `MainViewContext`, `OpenCardContext`, `ShowcaseContext`, `SubjectContext`, `VaultFillContext` (5); lib `gameVisibility.ts` (the hidden-games boundary of #88, covered only indirectly), `vaultMe.ts`, `steamUnlockYear.ts`, `raGame.ts`, `raProfile.ts`, `steamProfile.ts`, `raArtStore.ts`, `queryRows.ts` (12 of 75); utils `streaks.ts` (the header's streak, tested only through `useStreakData` and `rankings` tests), `vaultExamples.ts`.
- 154 of 664 component files have no sibling test (23 %), largest: `WelcomePageIntroArt` 187, `SteamSignupFormFields` 139, `RankingsPageLevelPanel` 134, `UserPreferencesGeneral` 126, `PsnGameInfoTrophy` 114 and `XboxGameInfoAchievement` 114 (a platform copy each), `RankingsPageTable` 103, `Tabs` 101 (a library piece with no test of its own; `Navigation.test.tsx` covers `SegmentedControl`), `AuthPage` 99. Some are covered through their parent; most do not need a file of their own.
- `jest.config.js` runs `collectCoverage: true` on every `npm test` (slow; 15-worker memory crashes are already mentioned in a comment there). Run coverage only in CI (T-01), keep the global floor, and add a per-folder floor for `src/lib` and `src/app/api` (the money and security code).

### T-14 · LOW · rule — typing escapes in tests
- `as never` 127 times in 46 files (40 in `utils.test.ts`), `as unknown as` 202 times in 115 files, `eslint-disable` 34 in 18 files. The fixtures that are not typed (T-07) are the reason. A test that builds a real `RecentAchievement` through a fixture compiles when the type changes and fails loudly; a cast silently keeps passing with a wrong shape.

## Cross-area notes
- Guard coverage depends on T-01: until the tests run in CI, none of the "never X" rules in CLAUDE.md is enforced.
- Add a **dead-i18n-key guard** (CP.md suggests it, about 40 lines next to `load.test.ts`) and a **dead-export check** (`knip`) beside the rules in T-06. Both would have caught most of what the code auditors list as dead.
- The code auditors should delete dead code in the order: code first, then `tsc`, then tests. Tests of dead code (T-02) are exact and need no further judgement.
- The welcome's "sizes in rem, never `px`" rule is clean today (0 `text-[Npx]` in `welcome-page/`): no guard needed. The "no Xbox in public pages" rule has its test in `seo.test.ts` / `seoPages`; fine.
- `__mocks__/framer-motion.js`, `recharts.js` and `tablerIconsMock.js` replace whole libraries: animation and chart behaviour is untestable in jsdom, so entrance rules (CSS) are only guarded by regex on source (`uiGuard`, `designTokens`), never by a render. That is acceptable but means a wrong class name in `.enter-*` is invisible.

## Coverage — every test file
The suite has 853 files and 57,294 lines. Files are grouped by folder; "ok" means the titles and the head were read and nothing beyond the listed findings was found. Every file named in a finding is listed with its id.

| Folder / file | Files | Lines | Verdict |
|---|---|---|---|
| `app/api/**` (route tests, 94 files) | 94 | 8,343 | ok; T-03 (psn/xbox/steam twins 938 + 1,090 lines), T-07 (mocks), T-10 (db mocked), `follows/route.test.ts` T-02, `getActivityHeatmapYear/route.test.ts` T-12 |
| `hooks/*.test.ts(x)` | 111 | 7,096 | ok; T-03 (psn/xbox/steam twins), T-07, `useWelcomeSteps`, `usePreferencesSync`, `useGroupPage` (298) read: behaviour-first |
| `lib/*.test.ts` | 63 | 6,589 | ok (best-quality tests: `xboxClient` 670, `psnClient` 593, `steamProgress` 455, `steamCache` 317, `scoreRefresh` 288, `rankings`); T-03 minor (xbox/psn call/cache/failure shape), T-08 (`scoreRefresh` 9 mocks), T-10 |
| `components/main-page/**` | 95 | 5,670 | T-02 (`MainPageMastery`, `MainPagePerfectGames`, `MainPageGamesList`, `MasteryByConsole`, `PerfectPodium`, `PerfectGameTile`), T-08 (`MainPageCharts` 286, `MainPage`, `MainPageBrowse`), T-09 (`MainPagePortada` classes), T-11 |
| `utils/*.test.ts` | 58 | 5,067 | T-02 (`utils.test.ts` 481 partly, `steamMappers.test.ts` 302 partly, `apiCallsUtils.test.ts`, `showcase.test.ts`), T-11, T-12; `lookTransition` 259, `vaultScore`, `aiExport`, `gameCandidates`, `perfectGames`: ok |
| `context/*.test.tsx` | 13 | 1,891 | T-03 (Psn/Xbox/Steam data contexts 118/116/340), T-07 |
| `components/steam/**` | 19 | 1,764 | T-03 (Steam game-info-table 266, header 131, item 164, category-section 181), T-07 (`game()` builders) |
| `app/(main)/**` (page tests) | 20 | 1,687 | T-08 (`[category]/(list)/page.test.tsx` 447, `groups/[id]/page.test.tsx` 178, `[consoleId]` 10 mocks) |
| `components/groups/**` | 29 | 1,373 | ok; T-07 |
| `components/user-page/**` | 28 | 1,228 | ok |
| `components/ui/**` (incl. `uiGuard.test.ts` 140) | 29 | 1,126 | `uiGuard.test.ts`: T-05, T-06; others ok (`Tabs.tsx` has no sibling test: T-13) |
| `components/admin-panel/**` | 14 | 1,078 | ok |
| `components/psn/**` | 17 | 1,008 | T-03 (`PsnGameInfoTable` 151 twins Xbox) |
| `components/welcome-page/**` | 13 | 827 | ok |
| `components/xbox/**` | 14 | 790 | T-03 |
| `components/public-user-page/**` | 21 | 752 | ok |
| `components/user-game-page`, `search-modal`, `library-game-detail`, `main-header`, `register-user-form`, `streak-page`, `library-explorer`, `following-page`, `ra-recently-played`, `pin-game-modal`, `game-info-header`, `rankings-page`, `achievement-grid`, `game-compare-table`, `collapsible-section`, `library-shelves`, `pin-achievement-modal`, `design-catalog`, `statusGameList`, `game-achievements-progress-chart`, `login-user-form`, `game-pinned-achievements`, `avatar-modal`, `pin-toggle-button`, `game-info-comments`, `game-info-achivement`, `ra-login-modal`, `subject-providers`, `location-modal`, `showcase-picker-modal`, `landing-page`, `achivements-line-chart` and the remaining small component folders | about 190 | about 6,300 | ok; T-09 samples (`FadeImage`, `StatPill`, `Skeleton`, `ProgressBar`, `SteamGameImage`, `GameHero` class asserts), T-12 for the five `library-*` multi-module files |
| `components/library-entry-parts.test.tsx`, `libraryEntryLinks.test.tsx`, `libraryPlatformLogos.test.tsx`, `hooks/libraryHooks.test.tsx`, `library-game-detail/library-detail-parts.test.tsx` | 5 | 436 | T-12 |
| `app/designTokens.test.ts` | 1 | 144 | ok (strong); a token-existence test, no gap beyond T-04's theme side |
| `app/themes.test.ts` | 1 | 79 | T-04 |
| `app/seo.test.ts`, `types/themeGroups.test.ts`, `translations/load.test.ts`, `components/ui/shape.test.ts`, `utils/themeIcon.test.ts` | 5 | about 300 | ok (guards of a kind; they read source files with `readFileSync`, so they too need T-01) |
| `constants/ragamesidpool.test.ts`, `components/main-start/MainStart.test.tsx`, `components/games-played-pie-chart/GamesPlayedPieChart.test.tsx` | 3 | 52 | T-02 (delete) |
| all other small folders (`types`, `constants`, `test-utils` sources, `lib/**` extras) | remainder | remainder | ok |

Rows overlap only at the small-folder boundary; the total of the table is the 57,294 lines counted by `wc -l`.
