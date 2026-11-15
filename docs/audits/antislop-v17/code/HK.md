# HK — hooks and contexts (`src/hooks/`, `src/context/`)
Auditor notes: The code is careful and mostly correct, but the area is the same few fetch patterns
written out again and again, each copy drifting a little from the others. There are four kinds:
the RA "fetchWithRetry + scheduleRetry" loader (9 copies), the "achievements to get" toggle (4),
the PSN/Xbox twins (library, recent feed, summary, game, details, link, error codes) and the per-platform
"one game's achievements" read (3 places). Five or six small shared hooks/helpers would remove roughly
1,000 of the area's ~8,400 lines without hiding anything. Two CLAUDE.md rules are broken in several
places: provider values that are not memoized, and setState run synchronously from effects (through
`load()` functions). There are also a few silent `catch` blocks and a run of "(#101)" changelog tags.

## Findings

### HK-01 · HIGH · duplication
- **Where:** `src/context/GamesDataContext.tsx:52-124`, `src/context/RecentAchievementsContext.tsx:32-99`, `src/context/RecentlyPlayedGamesContext.tsx:30-95`, `src/context/ActivityHeatmapYearContext.tsx:55-97,114-120`, `src/hooks/useAllGamesGlobal.ts:30-72`, `src/hooks/useUserRank.ts:16-58`, `src/hooks/useUserAwards.ts:19-61`; and the same loop with a reload key in `src/hooks/usePinnedAchievements.ts:27-75`, `src/hooks/useShowcase.ts:21-64`, `src/hooks/useGameProgression.ts:18-90` (and `src/components/main-page/main-page-charts/MainPageAbandoned.tsx`, outside this area).
- **What:** All of these repeat one block of state and logic: `attemptRef` + `retryTimer` + `hasFetched`, a `doFetch` that wraps a named `run` "so a retry can call it again", an `onFail` that calls `scheduleRetry` and then sets error/loading, `attemptRef.current = 0` on success, a cleanup effect for the timer, and a `refetch` that clears all of it. The copies have drifted. RecentAchievements' `run` checks only `rausername`, while the others also check `status`. ActivityHeatmapYear has no sign-out reset. RecentlyPlayed counts "no RA account" as `signedOut`, but GamesData keeps the two apart. useUserRank and useUserAwards are byte-for-byte the same apart from the validation line.
- **Fix:** Write one `useRetryingRead<T>(url | null, { parse(data): T | null, keepLast?: user })` in `src/hooks/`. It owns the refs, `scheduleRetry`, `lastAnswers` and `refetch`, and returns `{ data, isLoading, error, refetch }`. The providers then keep only what is theirs (the `request()` wiring, hidden filters, derived lists). Effect on each file: useUserRank and useUserAwards become about 15 lines each; GamesData, RecentAchievements and RecentlyPlayed about 45 each. usePinnedAchievements and useShowcase use the reload-key variant of the same hook. Do this first: it also removes the drift.
- **Size:** ~600 lines of copies → ~80 for the hook + ~250 at the call sites.

### HK-02 · HIGH · duplication
- **Where:** `src/hooks/usePsnFavoriteTrophies.ts` (96), `src/hooks/useXboxFavoriteAchievements.ts` (96), `src/hooks/useSteamFavoriteAchievements.ts` (117), `src/hooks/useRaFavoriteIds.ts` (86); DELETE URL built again in `src/hooks/usePinnedAchievements.ts:84-91`.
- **What:** These are four copies of "which achievements of this game are pinned + optimistic toggle + lastAnswers". They differ only in the `source` query, the row's id column (`psn_trophy_id`, `xbox_achievement_id`, `steam_apiname`, `achievement_id`), the DELETE parameter and the POST body keys. The 4-line "leading" docblock is pasted three times. The copies have drifted. Steam resets on a game change through `useWhenChanged`; PSN, Xbox and RA only use a lazy initial state, so they keep the old game's stars until the new answer lands. RA has no `error`/`canPin` and does not wait for `authenticated`. The flip helper is written twice in two shapes.
- **Fix:** Write one `useFavoriteAchievements<K extends string | number>(source, gameId, gameTitle, enabled?)` that reads the id column and parameter names from a `FAVORITE_KEYS[source]` table. Add `favoriteDeleteUrl(source, id, gameId)` to `src/utils/` and use it in both the hook and `usePinnedAchievements.unpin`. Keep the four exported names as one-line wrappers, or update the callers.
- **Size:** 395 → ~110.

### HK-03 · HIGH · rule (CLAUDE.md "A context value is memoized when its provider reads the session")
- **Where:** `src/context/SteamGamesDataContext.tsx:194-208`, `src/context/PsnGamesDataContext.tsx:121-133`, `src/context/XboxGamesDataContext.tsx:116-128`.
- **What:** All three providers read `useSession()` and pass a new object literal as `value` on every render. Every session update (one per page load after `RaUserRefresher`) therefore re-renders every reader of the three libraries, which covers most of the app. GamesData, RecentAchievements, Pinned, Hidden, Theme and MainPlatform already memoize theirs.
- **Fix:** Wrap each value in `useMemo`, as `GamesDataContext.tsx:144` does. With HK-04 this is fixed once in the shared provider.
- **Size:** +3 lines each.

### HK-04 · HIGH · duplication
- **Where:** `src/context/PsnGamesDataContext.tsx:49-137` and `src/context/XboxGamesDataContext.tsx:48-132`.
- **What:** The two providers are line-for-line the same: `generation`, `requested`, `loadedFor`, `load`, the effect, `refetch`, `current`, the `fullLibrary`/`shown`/`consoles` memos and the value. The only differences are the endpoint, the session id field, the `*ErrorFrom` function, PSN's `platinumCompletes` map and `PSN_CONSOLES`, and Xbox's `enabled` gate. Honest note: RA (retry loop, softcore/hardcore splits) and Steam (recent first, then the library with fill passes) are different enough that one four-way factory would read worse than what is there now. Merge the two twins only.
- **Fix:** Write `createConsoleLibrary({ url, errorFrom, source, extraConsoles?, transform? })` returning `{ Provider, useData }`, with the session id passed by the provider wrapper. It can live in `src/context/consoleLibrary.tsx`.
- **Size:** 293 → ~150.

### HK-05 · HIGH · duplication
- **Where:** `src/hooks/useShowcaseGameChoices.ts:15-71`, `src/hooks/useGameInsights.ts:16-68`, `src/hooks/useViewerGameList.ts:32-52` (through the four platform hooks), `src/hooks/useGroupPage.ts:130-146` (RA).
- **What:** "Read one game's achievements on any platform through the routes its page uses" is written twice in full: the same `json()` helper, the same four URLs, the same `Array.isArray(data.trophies)` checks and the same `Object.values(data.Achievements ?? {}).filter(...)`. The parse of RA's `Achievements` map appears in 5 places across `src/`: also `RaLibraryDetail.tsx:46` and `RARecentlyPlayed.tsx:165`.
- **Fix:** Add `fetchGameAchievements(source, id, lang)` to `src/utils/` (or `src/lib/`). It returns the platform's raw list, `{ ra: RetroAchievement[] } | { steam: … } …`, and `raAchievementList(data)` sits beside it. useShowcaseGameChoices and useGameInsights then only map the result. useGroupPage uses `raAchievementList`.
- **Size:** ~110 → ~60 in this area.

### HK-06 · HIGH · rule (CLAUDE.md State and effects: "nor through a function it calls before its first await … Loading is derived … not set at the start of the effect")
- **Where:** `src/context/PsnGamesDataContext.tsx:67-70`, `src/context/XboxGamesDataContext.tsx:66-69`, `src/hooks/usePsnSummary.ts:25-27`, `src/hooks/useXboxSummary.ts:24-26`, `src/hooks/usePsnTrophies.ts:26-29`, `src/hooks/useXboxAchievements.ts:24-27`, `src/hooks/useSteamAchievements.ts:28-37`, `src/hooks/useGroupPage.ts:73-74`, `src/hooks/usePublicUserProfile.ts:15-18`, `src/hooks/useCheevoUser.ts:49-52`.
- **What:** Each `load` sets `isLoading`/`error`/`status` before its first `await`, and is called from an effect. ESLint passes only because the compiler rule does not follow a call into a `useCallback`. The written rule is broken all the same.
- **Fix:** Give these the pattern the codebase already uses in `useSteamGameDetails`: a `request()` that returns its outcome, a `settle()`, loading derived from `loadedFor !== wanted`, and the reset done in `useWhenChanged`. Most are already half-derived (`loadedFor`), so the leading setState can go. HK-01, HK-04 and HK-07 fix most of these in passing.

### HK-07 · MED · duplication
- **Where:** `src/hooks/usePsnRecentTrophies.ts` (90) and `src/hooks/useXboxRecentAchievements.ts` (92); `src/hooks/usePsnGameDetails.ts` (56) and `src/hooks/useXboxGameDetails.ts` (60); `src/hooks/usePsnTrophies.ts` (62) and `src/hooks/useXboxAchievements.ts` (58), with the trophy fetch a third time in `src/hooks/usePsnCollectionTrophies.ts:18-22`; `src/hooks/usePsnSummary.ts:20-51` and `src/hooks/useXboxSummary.ts:19-50`.
- **What:** These are four pairs of twins that differ only in URL, response type and error mapper. The recent-feed pair also packs scope and language into a `key` string and then splits it back apart "from the end", where closing over `scope` and `lang` would do. Drift with the Steam versions: Steam's recent feed paints its last answer (`lastAnswers`, as CLAUDE.md "Platforms stay as fresh…" describes), but PSN's and Xbox's do not.
- **Fix:** One generic hook per pair, called with the platform's `{ url, errorFrom }`: `usePlatformFeed`, `useIgdbDetails(platform, titleId)`, `useGameList(platform, titleId)`. Also add `fetchPsnTrophies(id, lang, subject)`, shared by usePsnTrophies and usePsnCollectionTrophies. The summaries keep their own totals and share the fetch.
- **Size:** ~595 → ~330.

### HK-08 · MED · duplication
- **Where:** `/api/getWantPlayGames` fetched by `src/hooks/useGamesByCategory.ts:23-38`, `src/hooks/useAllGamesGlobal.ts:30-72`, `src/hooks/useGameCandidates.ts:31-43`. The "best per game by HardcoreMode" loop appears 3× (`useGamesByCategory.ts:58-63`, `useAllGamesGlobal.ts:84-104` twice). `isValidCategory`/`isSteamCategory` are written 2×. The "don't re-fetch /api/getGamesCompleted here too" comment is pasted 2×.
- **What:** Three hooks keep separate state for one list. Only one of them uses `lastAnswers` and retries; one swallows the error into an unused string. The playing/completed/want-to-play rules for RA are also written twice.
- **Fix:** Write one `useWantToPlay(enabled)`, built on HK-01's hook. Add pure `raPlaying(all)`, `raCompleted(all)`, `raBacklog(want, all)` and `bestPerGame(list)` to `src/utils/library.ts`, which already has a similar best-of map at line 112.
- **Size:** ~230 → ~120.

### HK-09 · MED · rule (silent failures / empty catch, CLAUDE.md "API calls" and "Toasts: an optimistic update that rolls back must say so")
- **Where:** `src/context/PinnedGamesContext.tsx:53-55` (`catch { setPins([]) }`), `src/hooks/usePerfectGamesOrder.ts:31-33` (`catch { setOrder([]) }`), `src/hooks/useGroups.ts:27-28` (`catch {` with no log); `src/hooks/usePerfectGamesOrder.ts:49-57`.
- **What:** In the first three, a failed read looks exactly like an empty list: nothing is logged and no error is exposed. `usePerfectGamesOrder.saveOrder` sets the new order and never rolls it back. The modal toasts "order failed" (`PerfectGamesOrderModal.tsx:66`), but the card keeps showing the unsaved order.
- **Fix:** Log the error and expose `error` (Pinned, PerfectGamesOrder). Roll back in `saveOrder` as `PinnedGamesContext.reorder` does.

### HK-10 · MED · naming
- **Where:** `src/hooks/useRaLinked.ts` vs `rausername` checks in `GamesDataContext.tsx:48,84`, `RecentAchievementsContext.tsx:44,63`, `RecentlyPlayedGamesContext.tsx:29`, `ActivityHeatmapYearContext.tsx:53`, `useAllGamesGlobal.ts:22`, `useUserRank.ts:26`, `useUserAwards.ts:29`, `useProfileLibrary.ts:22`, `useGameCandidates.ts:24`, `useStreakSummary.ts:57`.
- **What:** `useRaLinked`'s docblock says it is "one answer for the whole app … so the UI cannot show RA while the hooks refuse to fetch it". Yet the data hooks gate on `rausername`, and `useGamesByCategory` and `MainPlatformContext` gate on `raLinked`. A username without a key passes the hooks' check but fails the UI's.
- **Fix:** Pick one. `raLinked`, as the doc says, is probably the right one; note the tension with the CLAUDE.md RA rules before changing what fetches. Then shorten the 11-line docblock to two lines.

### HK-11 · MED · naming
- **Where:** `useRecentAchievements` exists as both `src/context/RecentAchievementsContext.tsx:110` and `src/hooks/useRecentAchievements.ts:6`; `useActivityHeatmapYear` as both `src/context/ActivityHeatmapYearContext.tsx:141` and `src/hooks/useActivityHeatmapYear.ts:11`. `psnErrorFrom`/`PsnError` live in `usePsnLink.ts`, and `xboxErrorFrom`/`XboxLinkError` in `useXboxLink.ts`, yet both are imported by the data contexts and feeds (where they are not link errors).
- **What:** Two hooks share a name and differ in behaviour (one filters unticked consoles). `ShowcasePickerModal.tsx:7` imports the unfiltered context one, and a reader cannot tell whether that is on purpose. The error mappers sit in files named for linking.
- **Fix:** Rename the context exports (`useRecentAchievementsFeed`, `useYearFeed`), or fold the console filter into the provider. Move `*ErrorFrom` and the error types to `src/utils/platformErrors.ts` and rename `XboxLinkError` to `XboxError`. See HK-13 for the mapper itself.

### HK-12 · MED · duplication
- **Where:** `src/hooks/usePsnLink.ts:20-83` and `src/hooks/useXboxLink.ts:22-87`; the unlink in `src/hooks/useSteamLink.ts:41-56` too.
- **What:** `link` and `unlink` are the same code: POST, `*ErrorFrom`, `update()`, "check the link landed". Only the route, the body key and the session field differ.
- **Fix:** Write one `useTypedLink({ route, bodyKey, sessionKey, errorFrom })`. useSteamLink can take its `unlink` from a shared `unlinkPlatform(route, update, stillLinked)`.
- **Size:** 170 → ~100.

### HK-13 · MED · duplication
- **Where:** `KNOWN.find((c) => c === body?.error) ?? 'failed'` in `src/hooks/usePsnLink.ts:10-13`, `src/hooks/useXboxLink.ts:11-14`, `src/hooks/useAdminXbox.ts:33-35`, `src/hooks/useAdminPsnToken.ts:53-55`. A `byCode[data.error] ?? fallback` map in `useRaLink.ts:29-34`, `useRaSignupCheck.ts:27-36`, `useAvatarUpload.ts:49-55`.
- **What:** The "read the `{ error }` code of a failed response" helper is written four times.
- **Fix:** Add `errorCode<C>(res, known: readonly C[]): Promise<C | 'failed'>` to `src/utils/`.

### HK-14 · MED · duplication
- **Where:** `src/hooks/useFriendsData.ts:43-104` and `src/hooks/useFollowers.ts:13-56`.
- **What:** Both run the same `loadCards` → `loadPlaying` → retry flow, once per `who`. Only useFriendsData uses `lastAnswers` and the Strict Mode guard. `detailsLoading` is always equal to `isLoading`, and its own comment says it is "kept … as before". Every caller writes `isLoading || detailsLoading` (`FollowingPage.tsx:53,65`, `MainPageFriends.tsx:79`).
- **Fix:** Write one `useFollowCards(who, enabled)` and drop `detailsLoading` along with the `|| detailsLoading` at the 3 callers. Move `loadCards`/`loadPlaying` (exported functions, not hooks) to `src/utils/friends.ts` or `src/lib/`.
- **Size:** 160 → ~70.

### HK-15 · MED · duplication
- **Where:** `src/hooks/useCheevoUser.ts:43-79` and `src/hooks/usePublicUserProfile.ts:9-45`.
- **What:** Both use the same `fetchedFor`/`load`/404 → `'missing'`/else `'failed'` structure.
- **Fix:** Write one `useNamedRead(url | null)` returning `{ data, isLoading, error: 'missing' | 'failed' | null, retry }` and keep both hooks as 3-line wrappers. This also fixes their HK-06 violation.

### HK-16 · MED · comments (stale and changelog)
- **Where:** `src/context/ActivityHeatmapYearContext.tsx:37-48`, `src/context/SteamGamesDataContext.tsx:63-73`, "(#101)" in 13 docblocks (`GamesDataContext.tsx:43`, `PsnGamesDataContext.tsx:140`, `XboxGamesDataContext.tsx:135`, `SteamGamesDataContext.tsx:215`, `PinnedGamesContext.tsx:145`, `RecentlyPlayedGamesContext.tsx:23`, `ShowcaseContext.tsx:14`, `useAuthSession.ts:8`, `useFriendsData.ts:27`, `useStreakSummary.ts:39`, `useWhenIdle.ts:9`, `ActivityHeatmapYearContext.tsx:47`), `PinnedGamesContext.tsx:35`, `useFriendsData.ts:99`.
- **What:**
  - ActivityHeatmapYear's docblock says the year exists so "the three places that read it (the header badge, the side panel, the streak page) share one load". Five lines later it says the header now uses `useStreakSummary`. The first part is no longer true.
  - SteamGamesData says "mirroring RecentlyPlayedGamesContext" and "per the plan's load strategy", which point to things that no longer exist or no longer match.
  - "(#101)" and "so RA-only callers read as before" are changelog in comments.
  - The 3-line "Reading the lists is what asks for them…" block is pasted 5×.
- **Fix:** Correct the ActivityHeatmapYear doc and drop the issue tags and the "as before" lines. The "first reader starts the load" note can go once, on the helper from HK-17.

### HK-17 · LOW · duplication
- **Where:** the `[wanted, setWanted]` + `request` + `useEffect(request)` plumbing in 9 providers: GamesData, Steam, PSN, Xbox, RecentAchievements, RecentlyPlayed, ActivityHeatmapYear, Pinned, Showcase.
- **What:** Each one writes out by hand the "a global provider loads on its first reader" pattern from CLAUDE.md, plus a `use…({ passive })` hook.
- **Fix:** Add a `useWanted()` returning `[wanted, request]` and a `useRequesting(ctx, passive?)` helper for the reader side. This is about 6 lines saved per provider, and it gives the pattern a name that can be searched for.

### HK-18 · LOW · duplication
- **Where:** `src/hooks/useRevealedTrophies.ts` and `src/hooks/useRevealedAchievements.ts` (identical apart from the id type); `src/hooks/usePsnRevealHidden.ts`, `src/hooks/useXboxRevealSecrets.ts`, `src/hooks/usePsnPlatinumCompletes.ts` (one boolean over `useStoredChoice`, 3×).
- **Fix:** Write one generic `useRevealed<T>(byDefault)` and one `useStoredSwitch(key, [off, on])`, keeping the stored values unchanged because they are synced keys.
- **Size:** 82 → ~35.

### HK-19 · LOW · duplication
- **Where:** set toggle (`new Set(prev); has ? delete : add`) in `useGroupFilters.ts:10-17`, `useConsoleFilter.ts:8-15`, the favorites hooks (×3), `useRevealed*` (×2), `useHiddenConsoles.ts:36-37`, plus `AddGameModal.tsx:105` and `PinGameModal.tsx:65`. The "latest ref" pair (`useRef` + an effect that updates it every render) in `useLibraryKeys.ts:24-27`, `useBackIntercept.ts:11-14`, `useVaultFill.ts:43-46`, `usePreferencesSync.ts:49-52`, `useWelcomeSteps.ts:84,126-128`. MRU lists in storage: `useRecentUsers.ts` and `useRecentSearches.ts` have the same shape.
- **Fix:** Add `toggled(set, key)` to `src/utils/utils.tsx`, a `useLatest(value)` hook, and one `useStoredList(key, max, isValid, sameAs)`.

### HK-20 · LOW · dead
- **Where:** `src/hooks/useGroups.ts:85-92` (`deleteGroup`, `setGroups`: no caller in `src/`); `src/hooks/useGamesInProgressPreview.ts` (one caller, it only renames `inProgress`); `src/hooks/useRecentlyPlayedGames.ts` (a one-line re-export); the hidden-games filter repeated in `useSteamGamesByCategory.ts:24`, `usePsnGamesByCategory.ts:18`, `useXboxGamesByCategory.ts:19`, `useGamesByCategory.ts:71-75` over lists the providers have already filtered (`library`/`all`). CLAUDE.md asks for a second filter at the selector layer, but the provider's output already is that layer.
- **Fix:**
  - Drop the two unused returns from useGroups.
  - Inline `useGamesData().inProgress` at `MainPageCharts.tsx` and delete the wrapper.
  - Import from the context, or make `useRecentlyPlayedGames` a real wrapper that applies the console filter like its siblings.
  - Drop the second `isHidden` pass.

### HK-21 · LOW · abstraction (pure code in hook files, hooks importing components)
- **Where:**
  - `src/hooks/useImageTint.ts:12-75`: Oklab conversions and `averageTint`, ~65 lines of colour maths.
  - `src/hooks/useStreakSummary.ts:12-24`: `hiddenParam` parses `hidden-consoles:*` again, the same parse as `useHiddenConsoles.ts:7-15`, and spells the storage keys out three times.
  - `src/hooks/useAvatarPalette.ts:20-36` and `useImageTint.ts:85-100`: the same "image → 12/32 px canvas → getImageData" read.
  - `clamp` is defined in both `useImageTint.ts:14` and `useHeatmapGrid.ts:30`.
  - `useLibraryPrefs.ts:3-5`, `useGameFiltering.ts:4-6` and `useGameExtraData.ts:4` import types from `src/components/…`.
- **Fix:**
  - Move the colour maths to `src/utils/colorTint.ts` (CLAUDE.md: pure transforms live in utils).
  - Export `parseHiddenConsoles` and use it in `hiddenParam`.
  - Add a `readPixels(src, size)` helper.
  - Use one `clamp` in utils.
  - Move the shared types to `src/types`.

### HK-22 · LOW · rule / style
- **Where:** `src/context/ThemeContext.tsx:1-73`.
- **What:** This is the only file in the area with double quotes and semicolons (CLAUDE.md Style). It also re-implements `useWhenChanged` by hand (`if (sessionTheme !== syncedTheme) { setSyncedTheme…; setTheme… }`, lines 36-40).
- **Fix:** Use `useWhenChanged([sessionTheme], …)` and the house style.

### HK-23 · LOW · duplication
- **Where:** `src/hooks/useVaultFill.ts:16`.
- **What:** `NAMES` is exactly `PLATFORM_NAME` from `src/utils/gameRef.ts:44`.
- **Fix:** Import it.

## Cross-area notes
- **RA image URLs are built by hand in 36 places** (`` `https://retroachievements.org${…}` ``) and badge URLs in ~14 (`media.retroachievements.org/Badge/…`; `src/utils/gameCompare.ts:39` already has `raBadge`). One `raMedia(path)` and one `raBadge(name)` in `src/utils/` would replace them. The components and utils auditors should list them all.
- **Platform names** are redefined in `AdminLinkedAccounts.tsx:14`, `AdminRankings.tsx:9`, `NotFoundGame.tsx:11`, `aiExport.ts:65` and `opengraph-image.tsx:13`, although `PLATFORM_NAME` exists. (Admin and aiExport use different spellings on purpose; check before merging.)
- **Relative imports into hooks** from pages: `src/app/(main)/[category]/[consoleId]/page.tsx` (`'../../../../hooks/…'`), `src/components/statusGameList/*`, and `src/hooks/useGameExtraData.ts:2-3` (`./…`).
- `src/graphify-out/cache/stat-index.json` is inside `src/` and shows up in greps; it probably belongs outside `src/` or in `.gitignore`.
- `MainPageAbandoned.tsx` has another copy of the HK-01 retry pattern.
- Tests: `src/context/SteamGamesDataContext.test.tsx` (340 lines) and `src/hooks/useGroupPage.test.ts` (298) are the largest in the area. Their size matches their subjects, so they are not flagged. The four favorites hooks and the PSN/Xbox twins each have their own near-duplicate tests, which shrink with HK-02 and HK-07.

## Coverage — every file reviewed
| File | Lines | Verdict |
|---|---|---|
| `src/context/ActivityHeatmapYearContext.tsx` | 145 | HK-01, HK-16, HK-17 |
| `src/context/BackInterceptContext.tsx` | 45 | ok |
| `src/context/GamesDataContext.tsx` | 158 | HK-01, HK-10, HK-16, HK-17 |
| `src/context/HiddenGamesContext.tsx` | 125 | ok |
| `src/context/LanguageContext.tsx` | 105 | ok |
| `src/context/MainPlatformContext.tsx` | 59 | ok |
| `src/context/MainViewContext.tsx` | 30 | ok |
| `src/context/OpenCardContext.tsx` | 17 | ok |
| `src/context/PinnedGamesContext.tsx` | 150 | HK-09, HK-16, HK-17 |
| `src/context/PsnGamesDataContext.tsx` | 149 | HK-03, HK-04, HK-06, HK-11, HK-16, HK-17 |
| `src/context/RecentAchievementsContext.tsx` | 114 | HK-01, HK-10, HK-11, HK-17 |
| `src/context/RecentlyPlayedGamesContext.tsx` | 110 | HK-01, HK-10, HK-16, HK-17 |
| `src/context/ShowcaseContext.tsx` | 34 | HK-16, HK-17 |
| `src/context/SteamGamesDataContext.tsx` | 224 | HK-03, HK-16, HK-17 |
| `src/context/SubjectContext.tsx` | 12 | ok |
| `src/context/ThemeContext.tsx` | 73 | HK-22 |
| `src/context/VaultFillContext.tsx` | 28 | ok |
| `src/context/XboxGamesDataContext.tsx` | 144 | HK-03, HK-04, HK-06, HK-11, HK-16, HK-17 |
| `src/hooks/useActivityHeatmapYear.ts` | 16 | HK-11 |
| `src/hooks/useAdminPsnToken.ts` | 72 | HK-13 |
| `src/hooks/useAdminRankings.ts` | 59 | ok |
| `src/hooks/useAdminXbox.ts` | 49 | HK-13 |
| `src/hooks/useAdminXboxAchievements.ts` | 28 | ok |
| `src/hooks/useAllGamesGlobal.ts` | 110 | HK-01, HK-08 |
| `src/hooks/useAuthSession.ts` | 16 | HK-16 |
| `src/hooks/useAvatarPalette.ts` | 44 | HK-21 |
| `src/hooks/useAvatarUpload.ts` | 77 | HK-13 |
| `src/hooks/useBackIntercept.ts` | 21 | HK-19 |
| `src/hooks/useCheevoUser.ts` | 79 | HK-06, HK-15 |
| `src/hooks/useClickAway.ts` | 25 | ok |
| `src/hooks/useConsoleFilter.ts` | 22 | HK-19 |
| `src/hooks/useConsoleVisibility.ts` | 51 | ok |
| `src/hooks/useCookieConsent.ts` | 28 | ok |
| `src/hooks/useEmailVerification.ts` | 71 | ok |
| `src/hooks/useEntrancesOnce.ts` | 28 | ok |
| `src/hooks/useExclusiveOpen.ts` | 20 | ok |
| `src/hooks/useFillViewport.ts` | 43 | ok |
| `src/hooks/useFollow.ts` | 42 | ok |
| `src/hooks/useFollowCounts.ts` | 36 | ok |
| `src/hooks/useFollowers.ts` | 56 | HK-14 |
| `src/hooks/useFontStyle.ts` | 18 | ok |
| `src/hooks/useFriendsData.ts` | 104 | HK-14, HK-16 |
| `src/hooks/useGameCandidates.ts` | 54 | HK-08, HK-10 |
| `src/hooks/useGameCardStyle.ts` | 16 | ok |
| `src/hooks/useGameExtraData.ts` | 32 | HK-21 |
| `src/hooks/useGameFiltering.ts` | 42 | HK-21 |
| `src/hooks/useGameInfo.ts` | 91 | ok |
| `src/hooks/useGameInsights.ts` | 110 | HK-05 |
| `src/hooks/useGameProgression.ts` | 94 | HK-01 |
| `src/hooks/useGamesByCategory.ts` | 78 | HK-08, HK-20 |
| `src/hooks/useGamesInProgressPreview.ts` | 6 | HK-20 |
| `src/hooks/useGoBack.ts` | 7 | ok |
| `src/hooks/useGroupDetail.ts` | 46 | ok |
| `src/hooks/useGroupFilters.ts` | 29 | HK-19 |
| `src/hooks/useGroupPage.ts` | 296 | HK-05, HK-06 |
| `src/hooks/useGroupProgress.ts` | 31 | ok |
| `src/hooks/useGroups.ts` | 93 | HK-09, HK-20 |
| `src/hooks/useHashTab.ts` | 16 | ok |
| `src/hooks/useHeatmapGrid.ts` | 86 | HK-21 |
| `src/hooks/useHiddenConsoles.ts` | 45 | HK-21 |
| `src/hooks/useHomeLayout.ts` | 15 | ok |
| `src/hooks/useImageTint.ts` | 119 | HK-21 |
| `src/hooks/useIsClient.ts` | 12 | ok |
| `src/hooks/useLibraryKeys.ts` | 50 | HK-19 |
| `src/hooks/useLibraryPrefs.ts` | 46 | HK-21 |
| `src/hooks/useLocationHash.ts` | 11 | ok |
| `src/hooks/useMediaQuery.ts` | 17 | ok |
| `src/hooks/useNavigationProgress.ts` | 45 | ok |
| `src/hooks/usePerfectGamesOrder.ts` | 62 | HK-09 |
| `src/hooks/usePinnedAchievements.ts` | 129 | HK-01, HK-02 |
| `src/hooks/usePreferencesSync.ts` | 110 | HK-19 |
| `src/hooks/usePresenceHeartbeat.ts` | 44 | ok |
| `src/hooks/usePreviewLayout.ts` | 42 | ok |
| `src/hooks/useProfileLibrary.ts` | 27 | HK-10 |
| `src/hooks/usePsnCollectionTrophies.ts` | 68 | HK-07 |
| `src/hooks/usePsnFavoriteTrophies.ts` | 96 | HK-02 |
| `src/hooks/usePsnGameDetails.ts` | 56 | HK-07 |
| `src/hooks/usePsnGamesByCategory.ts` | 25 | HK-20 |
| `src/hooks/usePsnLink.ts` | 83 | HK-11, HK-12, HK-13 |
| `src/hooks/usePsnPlatinumCompletes.ts` | 14 | HK-18 |
| `src/hooks/usePsnRecentTrophies.ts` | 90 | HK-07 |
| `src/hooks/usePsnRevealHidden.ts` | 15 | HK-18 |
| `src/hooks/usePsnSummary.ts` | 71 | HK-06, HK-07 |
| `src/hooks/usePsnTrophies.ts` | 62 | HK-06, HK-07 |
| `src/hooks/usePublicUserProfile.ts` | 45 | HK-06, HK-15 |
| `src/hooks/useRaBoxArt.ts` | 34 | cross-area (RA URL) |
| `src/hooks/useRaFavoriteIds.ts` | 86 | HK-02 |
| `src/hooks/useRaLink.ts` | 51 | HK-13 |
| `src/hooks/useRaLinked.ts` | 19 | HK-10 |
| `src/hooks/useRaScreenshot.ts` | 28 | cross-area (RA URL) |
| `src/hooks/useRaSignupCheck.ts` | 52 | HK-13 |
| `src/hooks/useRankings.ts` | 135 | ok |
| `src/hooks/useRecentAchievements.ts` | 11 | HK-11 |
| `src/hooks/useRecentFeed.ts` | 25 | ok |
| `src/hooks/useRecentSearches.ts` | 39 | HK-19 |
| `src/hooks/useRecentUsers.ts` | 38 | HK-19 |
| `src/hooks/useRecentlyPlayedGames.ts` | 1 | HK-20 |
| `src/hooks/useRevealedAchievements.ts` | 24 | HK-18 |
| `src/hooks/useRevealedTrophies.ts` | 23 | HK-18 |
| `src/hooks/useSaveProfileField.ts` | 43 | ok |
| `src/hooks/useSectionScroll.ts` | 45 | ok |
| `src/hooks/useShapeStyle.ts` | 17 | ok |
| `src/hooks/useShowcase.ts` | 155 | HK-01 |
| `src/hooks/useShowcaseGameChoices.ts` | 117 | HK-05 |
| `src/hooks/useSpotlight.ts` | 17 | ok |
| `src/hooks/useSteamAchievements.ts` | 68 | HK-06 |
| `src/hooks/useSteamFavoriteAchievements.ts` | 117 | HK-02 |
| `src/hooks/useSteamGameDetails.ts` | 71 | ok (the pattern to copy) |
| `src/hooks/useSteamGamesByCategory.ts` | 39 | HK-08, HK-20 |
| `src/hooks/useSteamLink.ts` | 66 | HK-12 |
| `src/hooks/useSteamProfile.ts` | 57 | ok |
| `src/hooks/useSteamRecentAchievements.ts` | 96 | HK-07 (reference) |
| `src/hooks/useSteamSignup.ts` | 103 | ok |
| `src/hooks/useStorageValue.ts` | 114 | ok |
| `src/hooks/useStoredChoice.ts` | 15 | ok |
| `src/hooks/useStreakData.ts` | 18 | ok |
| `src/hooks/useStreakSummary.ts` | 80 | HK-16, HK-21 |
| `src/hooks/useThemeChoice.ts` | 38 | ok |
| `src/hooks/useToasts.ts` | 7 | ok |
| `src/hooks/useUserAwards.ts` | 69 | HK-01, HK-10 |
| `src/hooks/useUserRank.ts` | 62 | HK-01, HK-10 |
| `src/hooks/useUserSearch.ts` | 68 | ok |
| `src/hooks/useVaultFill.ts` | 99 | HK-19, HK-23 |
| `src/hooks/useVaultMe.ts` | 68 | ok |
| `src/hooks/useViewerGameList.ts` | 55 | HK-05 |
| `src/hooks/useWelcomeChoice.ts` | 50 | ok |
| `src/hooks/useWelcomeEntry.ts` | 55 | ok |
| `src/hooks/useWelcomeSteps.ts` | 151 | HK-19 |
| `src/hooks/useWhenChanged.ts` | 19 | ok |
| `src/hooks/useWhenIdle.ts` | 26 | HK-16 |
| `src/hooks/useXboxAchievements.ts` | 58 | HK-06, HK-07 |
| `src/hooks/useXboxEnabled.ts` | 16 | ok |
| `src/hooks/useXboxFavoriteAchievements.ts` | 96 | HK-02 |
| `src/hooks/useXboxGameDetails.ts` | 60 | HK-07 |
| `src/hooks/useXboxGamesByCategory.ts` | 26 | HK-20 |
| `src/hooks/useXboxLink.ts` | 87 | HK-11, HK-12, HK-13 |
| `src/hooks/useXboxRecentAchievements.ts` | 92 | HK-07 |
| `src/hooks/useXboxRevealSecrets.ts` | 15 | HK-18 |
| `src/hooks/useXboxSummary.ts` | 66 | HK-06, HK-07 |
