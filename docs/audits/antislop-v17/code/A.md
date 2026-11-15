# A — Home page components (`src/components/main-page/`)
Auditor notes: 110 files, ~8.7k lines, all read in full. The building blocks are mostly good (the profile column's shared `MainPageProfileCard` / `NowPlaying` / `Recent` / `RecentRow`, `ChartCard`, `GameListRow`, the generic `MainPagePinnedSectionSortable`). The main problem is **copy per platform**: every time PSN and then Xbox arrived, the Steam version of a component was copied and renamed rather than turned into data (stat pills, pinned rows, nav cards, profile pieces), so the same thing exists 3–4 times and the copies already disagree (streak colour, Xbox colour, a11y of the pinned row). Second theme: **~600 lines of dead components** still shipped with tests, and comments that still say "RA and Steam" for code that covers four platforms.

## Findings

### A-01 · HIGH · dead
- **Where:** `main-page-charts/MainPageMastery.tsx` (154), `main-page-charts/MainPagePerfectGames.tsx` (128), `main-page-games/main-page-games-list/MainPageGamesList.tsx` (123), and the pieces only they use: `main-page-charts/mastery-by-console/MasteryByConsole.tsx` (57, only `MainPageMastery`), `main-page-charts/perfect-podium/PerfectPodium.tsx` (68) and `main-page-charts/perfect-game-tile/PerfectGameTile.tsx` (71, both only `MainPagePerfectGames`).
- **What:** No file in `src/` imports `MainPageMastery`, `MainPagePerfectGames` or `MainPageGamesList` except their own tests (grepped, incl. dynamic imports). The Collection section (`MainPageCollection`) replaced the first two; `MainPageGamesList` is from before `GameListRow`. The three sub-pieces are reachable only through them. Their comments are already stale ("from both platforms", "Both mastery cards show it").
- **Fix:** Delete the 6 components, their 6 tests (`MainPageMastery.test` 124, `MainPagePerfectGames.test` 113, `MainPageGamesList.test` 77, `MasteryByConsole.test` 29, `PerfectPodium.test` 32, `PerfectGameTile.test` 29) and the `main-page-games/` folder. Then check the `T.cards.*` keys only they read (`masteryAwards`, `recentMasteries`, `awardsByConsole`, `latestPerfects`, `mastered100`…) in all 9 languages. Update the `ClosestToComplete` comment ("Both mastery cards").
- **Size:** −601 lines of code, −404 of tests.

### A-02 · HIGH · duplication
- **Where:** `main-page-charts/MainPagePointsStats.tsx` (93), `main-page-steam-stats/MainPageSteamStats.tsx` (104), `main-page-psn-stats/MainPagePsnStats.tsx` (100), `main-page-xbox-stats/MainPageXboxStats.tsx` (98).
- **What:** All four build the same row: today / this week / this month / average per day / streak pills, the same `useMemo` (todayKey, monthKey, weekAgo, three filters, `calcAvgPerDay`), the same three `useState`s and the same three modals in an `AnimatePresence`. Only 1–2 platform pills and the noun differ. They have already drifted: RA colours the streak by tier (`streakInk(streakTier(streak))`, the CLAUDE.md rule for "the home's stats tile"), the other three use `text-accent`. Steam and PSN also keep an empty whitespace line where a prop was removed (lines 69, 68).
- **Fix:** One `MainPagePeriodStats({ achievements, streak, noun, isLoading, extra })` with the shared pills, the period maths and the modals, where `extra` is the platform pills (Steam level + 2 weeks; PSN level + platinum; Xbox gamerscore + total; RA global rank). The four files become ~15-line adapters or a config in `MainPageCharts`. The streak colour difference goes away; say so to the owner, since it is visible.
- **Size:** 395 → ~150.

### A-03 · HIGH · duplication
- **Where:** `main-page-pinned-games/pinned-game-row/PinnedGameRow.tsx` (172), `steam-pinned-game-row/SteamPinnedGameRow.tsx` (131), `psn-pinned-game-row/PsnPinnedGameRow.tsx` (113), `xbox-pinned-game-row/XboxPinnedGameRow.tsx` (113).
- **What:** The same card four times: `useSortable` + style, `GameCardBackdrop`, grip button, icon link, title link, platform label, `ProgressBar`, `PinToggleButton`, expand chevron, a counts line, the expanded body. `diff` of PSN vs Xbox is only names, colours and the counts line. The focus ring is a platform hex (`#66c0f4`, `#0070d1`) or `success`.
- **Fix:** One `PinnedGameCard` in this folder that takes `{ sortKey, href, backdrop, icon, platform (logo + name), pct, softPct, counts, toggleLabel, children (expanded) }` and owns the sortable wrapper and layout; each platform keeps only its data lookup and expanded body (~30 lines each). Use `focus-visible:ring-accent/70` like the rest of the site.
- **Size:** 529 → ~240.

### A-04 · HIGH · rule
- **Where:** static modal imports: `DayAchievementsModal` in `MainPageHeatmap.tsx:8`, `MainPageBestPeriod.tsx:10`, `MainPagePointsStats.tsx:10`, `MainPageSteamStats.tsx:11`, `MainPagePsnStats.tsx:10`, `MainPageXboxStats.tsx:10`; `PeriodAchievementsModal` in BestPeriod and the four stats rows; `WeekAchievementsModal` in `MainPageBestPeriod.tsx:12`; `AchievementModal` in `main-page-pinned-section-achievements/MainPagePinnedSectionAchievements.tsx:10` and `main-page-portada/MainPagePortada.tsx:20`; `AchievementDetailModal` in `MainPagePortada.tsx:19`; `PerfectGamesOrderModal` in `collection-grid/CollectionGrid.tsx:8`.
- **What:** CLAUDE.md, Performance rules: "A modal is a `next/dynamic` import wrapped in `LazyWhenOpened` … Do not import a modal statically into a page." The home loads all of them up front. The right pattern already exists in the area (`MainPageGroups`, `PinGameCard`, `MainPageGroupFeature`) and for this exact modal in `streak-page/streak-day-row/StreakDayRow.tsx:16`.
- **Fix:** `dynamic(() => import(...), { loading: () => null })` + `LazyWhenOpened` in each. After A-02 the four stats rows are one place.

### A-05 · HIGH · rule (a11y)
- **Where:** `main-page-pinned-games/pinned-game-row/PinnedGameRow.tsx:224-296`.
- **What:** The RA pinned row's header is `<div role="button" tabIndex={0} onClick onKeyDown={Enter}>` holding a `<button>` (grip), two `<Link>`s and `PinToggleButton`: an interactive element inside another, `div` used as a button (CLAUDE.md a11y rule), Space does not work, and the chevron is a `▼` character with no `aria-hidden`. The Steam/PSN/Xbox copies were fixed (a real `<button aria-expanded>` with a label) and this one was left behind.
- **Fix:** The same expand `<button>` as `SteamPinnedGameRow.tsx:96-107`, or fold into A-03.

### A-06 · HIGH · duplication
- **Where:** `main-page-charts/main-page-steam-nav/MainPageSteamNav.tsx` (91), `main-page-psn-nav/MainPagePsnNav.tsx` (88), `main-page-xbox-nav/MainPageXboxNav.tsx` (88); the platform ternary in `main-page-browse/MainPageBrowse.tsx:46`.
- **What:** PSN and Xbox differ by 7 lines (hook, colour, `noGamesInCategory` text, source); Steam differs only in its icon component. The `SECTIONS` emoji list is also copied into `MainPageConsoleNav.tsx:14`. Each shows `'—'` while loading in the count (see A-12).
- **Fix:** One `PlatformNav({ source })` using `useXxxGamesByCategory` by source (or a `byCategory` prop) and `GameIcon` (which already handles every source); one shared `SECTIONS`. Move it out of `main-page-charts/` into `main-page-browse/`, its only user.
- **Size:** 267 → ~95.

### A-07 · HIGH · duplication
- **Where:** `main-page-profile/main-page-profile-{psn,st,xbox}/`: wrappers `MainPageProfilePsn/St/Xbox.tsx` (3×33), `…Linked.tsx` (109 / 129 / 105), `…Game.tsx` (43 / 44 / 42), `…Trophies/Achievements.tsx` (52 / 49 / 51), `…Stats.tsx` (36 / 44 / 35).
- **What:** The shared pieces were extracted (good), but each platform still repeats the same glue: the three wrappers are identical but for the hook and two strings; PSN and Xbox `Linked` are the same file (skeleton → error → refresh closure → card → game → recent), PSN and Xbox `Game` are identical but for the trophy/gamerscore line, the three recent lists differ only in key/href/badge/right. The wrappers' `!isLinked` branch cannot run: `MainPlatformContext` only ever selects a linked platform (or `'ra'`), so the link is dead, and with it `T.profileSt.signIn` (its only reader) and three entries in `uiGuard.test.ts`'s `rounded-3xl` exception list (justified there as "art bigger than a card", which these links are not).
- **Fix:** Drop the wrappers (call the `Linked` component from `MainPageProfile` with the platform hook), delete the unreachable branch, its translation key and the three guard exceptions. Merge PSN/Xbox `Linked` and `Game` into one each with a small platform config (logo, colours, error texts, header chips, the game's extra line); turn the three recent lists into one mapper per platform feeding `MainPageProfileRecent`. Steam can join the merged `Linked` with its status line as `children`.
- **Size:** ~838 → ~480.

### A-08 · HIGH · library
- **Where:** `main-page-profile/main-page-profile-tabs/MainPageProfileTabs.tsx` (92); users `MainPageProfile.tsx`, `public-user-page/public-user-activity/PublicUserActivity.tsx`, `public-user-page/public-user-body/PublicUserBody.tsx`, `user-page/user-preferences-card/UserPreferencesCard.tsx`.
- **What:** A second hand-made tablist (roving tabindex, arrow keys, slanted accent line, `profileTabId`/`profilePanelId`) next to the library's `ui/Tabs.tsx`, which has the same behaviour, `size`, and `tabIds(base, value)`. It lives inside the home's profile folder yet is the account page's and public profile's tab bar. In `MainPageProfile.tsx:24-29` the four `icon`s (four logo imports) are never drawn: the component renders icons only at `size="md"`. Its JSDoc still says "The RA / Steam switch".
- **Fix:** Replace with `ui/Tabs` (label as ReactNode covers the `md` icons); if the low-key `sm` look must stay, make it a `ui/Tabs` variant. Remove the dead `icon`s from `TABS`.
- **Size:** −92 lines, 4 call sites switched.

### A-09 · MED · duplication
- **Where:** `MainPageAbandoned.tsx:128-160` (Steam, PSN, Xbox blocks identical but for source and classifier), `collection-closest/CollectionClosest.tsx:119-154` (same for 3 platforms), `MainPageRarest.tsx:272-295` (PSN and Xbox identical).
- **What:** "Map a platform library to `{ key, href, title, imageUrl, pct… }`" is written ~9 times with `key: \`${source}:${id}\``, `gameHref(source, id, subject)`, `imageIcon || undefined`.
- **Fix:** One helper in `src/utils/library.ts` (which already has `buildLibrary`/`LibraryGame` with `key`, `href`, `iconUrl`, `pct`) taking the non-RA libraries as a list of `{ source, games, classify }`; the cards filter/sort its output.
- **Size:** ~110 → ~40 across the three.

### A-10 · MED · rule
- **Where:** `main-page-charts/MainPageAbandoned.tsx:54-111`.
- **What:** The component owns a fetch (`/api/getGamesLastPlayed`), its retry timer, attempt ref, `fetchedKey` state and a `useWhenChanged` reset. CLAUDE.md: hooks own fetch and state, never inline in a component.
- **Fix:** `src/hooks/useGamesLastPlayed(ids)` returning `{ dates, ready }`, with its test; the card keeps only the `abandoned` memo. Its JSDoc is also stale ("Steam and PSN", "for PSN last played is the last trophy", while CLAUDE.md says `lastPlayed` is the last session when known).
- **Size:** 202 → ~120 (+ a ~50-line hook).

### A-11 · MED · dead
- **Where:** `MainPageGroups.tsx` + `main-page-groups-row/MainPageGroupsRow.tsx`; `main-page-best-period-row/MainPageBestPeriodRow.tsx:25,40,54-59`; `MainPageHeatmap.tsx:38,154-163`.
- **What:** `MainPageGroups`' only caller (`MainPageGroupsSection`) always passes `onSelect`, and returns its own skeleton while loading, so `isLoading` is always false there and the list mode (`slice(0, 4)`, the "+N more" link, `MainPageGroupsRow`'s `Link` branch and `href`) never runs (~40 lines). `MainPageBestPeriodRow`'s `expanded` prop is never passed (the month opens a modal now). `MainPageHeatmap`'s `onRefresh` is passed by none of its 3 callers, so its button, with the hard-coded English `aria-label="Refresh heatmap"`, is dead. `MainPageGroupFeature`'s `onEdit`/`onChanged` are optional but always passed (LOW).
- **Fix:** Make `onSelect` required and delete the list mode, `isLoading` and the skeleton branch; make `MainPageGroupsRow` a button only. Remove `expanded` and the chevron. Remove `onRefresh`. Also move `MainPageGroups` out of `main-page-charts/` to `main-page-groups-section/`.
- **Size:** ~70 lines.

### A-12 · MED · rule
- **Where:** `main-page-friends/main-page-friends-leaderboard/MainPageFriendsLeaderboard.tsx:72-74`; `main-page-profile-xbox/main-page-profile-xbox-stats/MainPageProfileXboxStats.tsx:25`; the three nav cards (`{loading ? '—' : games.length}`).
- **What:** The leaderboard draws a progress bar by hand (`bg-progress` span in a track): CLAUDE.md "Every progress bar is `ProgressBar`". The Xbox stats card shows `'—'` while the library loads instead of `loading` on `StatCard` ("a figure on its way is `loading` … never a `—`"); the Steam/PSN cards next to it already use `loading`.
- **Fix:** `ProgressBar pct={…} height="h-1"`; `<StatCard … loading={isLoading} />`; a `Skeleton` in the nav count.

### A-13 · MED · library
- **Where:** `MainPageHeatmap.tsx:182-191` (tooltip with inline `style` colours, border, shadow); `browse-search/BrowseSearch.tsx:157-167` (icon + raw `<input>`); dashed "add" tiles in `pin-game-card/PinGameCard.tsx:130`, `main-page-pinned-section-showcase/MainPagePinnedSectionShowcase.tsx:269`, `MainPageGroups.tsx:142`; chip groups `browse-search-chips/BrowseSearchChips.tsx` and `MainPageFriendsLeaderboard.tsx:41-47`; platform logos chosen by hand in `perfect-game-order-row/PerfectGameOrderRow.tsx:376-384` and `collection-numbers/CollectionNumbers.tsx:261-280`; icon-only buttons drawn by hand in `MainPageProfileActions.tsx`, `MainPageProfileActionsRefresh.tsx`, `MainPageGroups.tsx:77`, `MainPageGroupFeature.tsx:190`, `CollectionGrid.tsx:63`.
- **What:** Each has a library piece already: `TOOLTIP_SURFACE` (`ui/tooltip.ts`; `PerfectGameTile` and the portada use it), `SearchInput`, `DropSlot` ("the striped, empty place that adds another item"), `Pill` (`pressed`, `count`; `CollectionGrid` glues counts into labels instead), `PlatformLogo`, `IconButton`.
- **Fix:** Swap each in; `BrowseSearchChips` becomes a thin map over `Pill` (or goes, since `Pill` is enough) and leaves the browse folder (it is also the Collection's chip row). `chipClass = (on) => pillClass(on)` in the leaderboard is a wrapper that adds nothing.

### A-14 · MED · library (tokens)
- **Where:** platform hues in the area: `#66c0f4` (Steam: profile, nav, collection, order row, pinned row), `#0070d1` (PSN), Xbox as `#107c10` in `MainPageProfileXboxLinked.tsx:73-74` and `PerfectGameOrderRow.tsx:381` but `text-success` in `CollectionNumbers.tsx:280`, `CollectionShelf.tsx:185`, `MainPageXboxNav.tsx:50`, `MainPageXboxStats`. The card kicker `text-[10px] uppercase tracking-widest text-text-secondary` is repeated 27 times in 25 files of this area (42 in `src/`).
- **What:** Platform hues are allowed as literal colours, but there is no single place for them, and Xbox already has two different greens across the home. The kicker is the de-facto card title with no name.
- **Fix:** `--steam`, `--psn`, `--xbox` tokens (or a `PLATFORM_COLOR` map beside `PLATFORM_NAME` in `utils/gameRef.ts`) used by `PlatformLogo` and everything here; owner picks the Xbox green. A `title` prop on `ChartCard` (or a `KICKER` constant in `ui/`) for the label.

### A-15 · MED · comments
- **Where (stale "two platforms"):** `MainPageCharts.tsx:53-59` ("switch to a Steam or PSN version"), `MainPageAbandoned.tsx:27-32`, `MainPageBestPeriod.tsx:333` ("RA counts points, Steam counts unlocks"), `MainPageWithoutRa.tsx:7-12` ("Steam or PSN"), `MainPageProfileTabs.tsx:17` ("The RA / Steam switch"), `PinnedGameRow.tsx:188` ("pinned RA and Steam games"), `PerfectGameOrderRow.tsx:343` ("RA and Steam games alike"), `CollectionTile.tsx:237` ("hardcore, Steam or PlayStation"), `ClosestToComplete.tsx:125` ("Both mastery cards").
- **Where (labels / slop):** `MainPageHeatmap.tsx:13-18` (a JSDoc and a block comment saying the same thing back to back), `{/* header */}` :142, `{/* tooltip */}` :181, `{/* legend */}` :243; `MainPageBestPeriod.tsx` `{/* Best Day — purple */}`, `{/* Best Week — yellow */}` (actually the hardcore token), `{/* Best Month — red */}`, `{/* Modals */}`; `MainPage.tsx:67` `{/* Left column: either pinned games or recently played */}`.
- **Fix:** Update the stale ones to "every platform" or drop them; delete the labels. The `why` comments elsewhere (measured jumps, "a button inside a link is invalid", the profile skeleton's height) are good and should stay.

### A-16 · MED · duplication
- **Where:** `main-page-without-ra/MainPageWithoutRa.tsx` vs `MainPage.tsx` `MainPageBody` (lines 52-82).
- **What:** The non-RA home re-draws the same two-column grid by hand, and has drifted: no `home-fit` classes, no cover layout (`useHomeLayout` ignored), no pinned view, `RecentGamesList` instead of `RARecentlyPlayed`, a different column wrapper. Some of that may be intended, none of it is written down.
- **Fix:** Ask the owner whether a Steam/PSN/Xbox-only account should get the same layouts; if yes, render `MainPageBody` with the list as a slot and delete this file. Report only: this changes behaviour.

### A-17 · MED · naming / placement
- **What:** `isSteam` in `MainPageBestPeriod.tsx:324` is true for PSN and Xbox too (means "counts unlocks"). `heatmapData` in `MainPageCharts.tsx:84` and the `heatmapAchievements` prop of `MainPagePointsStats` are RA's last 60 days for the pills; the heatmap itself gets `year`. `PeriodTone` `'yellow'`/`'red'`/`'purple'` (`MainPageBestPeriodRow.tsx:4`) paint `hardcore`/`danger`/`purple-400`. `T.cards.steamRarityLabel` labels PSN and Xbox rarity (`MainPageRarest.tsx:282,294`). Generic strings are read from platform namespaces: `T.steam.totalPlaytime/statGames/lastPlayed/minutesShort/hoursShort/retry/achievementsError`, `T.profileRa.memberSince/playingNow/refreshFailed/refreshData`, `T.rankings.retry` (e.g. `MainPagePortadaSideRecent.tsx:42-44`). Folder placement: `main-page-charts/` holds pieces used only elsewhere (`MainPageGroups` → groups section, the four nav cards → browse, `MasteryMix` and `ClosestToComplete` → collection), `browse-search-chips` is also the collection's, and `main-page-favorites/` holds only the pinned-achievements unpin star (old "favorites" name).
- **Fix:** Rename (`countsUnlocks`, `raLast60`, tones by meaning), move pieces next to their user; a shared `T.common` for the generic strings is a cross-area decision.

### A-18 · MED · rule (i18n / numbers)
- **What:** Literal `'pts'` (`MainPagePointsStats.tsx:77`, `MainPageBestPeriod.tsx:337`; a `pointsShort` key exists); `${streak}d` in the four stats rows and `${g.daysAgo}d` in `MainPageAbandoned.tsx:192` (`T.rankings.daysShort` exists); `toLocaleString()` with no language in `MainPageBestPeriod.tsx:336-337` and `CollectionNumbers.tsx:264`; heatmap month names with `toLocaleString('default', …)` (`MainPageHeatmap.tsx:88`) instead of `lang`; `'Hardcore'`/`'Softcore'` literals in `CollectionTile.tsx:261` (screen-reader text) and `PerfectGameOrderRow.tsx:383` (`title`). CLAUDE.md: strings through `T`, numbers in the reader's language.
- **Fix:** Use the existing keys and `lang`.

### A-19 · MED · duplication
- **Where:** `main-page-pinned-games/MainPagePinnedGames.tsx:57-76,93-106`; `perfect-games-order-modal/PerfectGamesOrderModal.tsx:286-297`; generic version `main-page-pinned-section-sortable/MainPagePinnedSectionSortable.tsx`.
- **What:** Three hand-rolled `DndContext` + sensors + `arrayMove` setups in this area (five in `src/`, with `groups/group-cover-grid` and `groups/group-game-grid`), while a generic sortable already lives here. The left column also hand-draws its own grip button per row (see A-03).
- **Fix:** Promote `MainPagePinnedSectionSortable`/`…SortableItem` to a shared `Sortable` (e.g. `src/components/sortable/`, with a `strategy` prop for the vertical list) and use it in the three places.

### A-20 · MED · size
- **Where:** `main-page-charts/MainPageCharts.tsx` (298).
- **What:** Reads 15 hooks and picks per platform through nested ternaries in three places (overview panel 142-170, `bestPeriodData`/`bestPeriodLoading` 117-118). The four `useMemo` filters to the 60-day window repeat the same shape.
- **Fix:** After A-02, one `const byPlatform = { ra: {…}, steam: {…}, psn: {…}, xbox: {…} }` gives data/loading per platform and the overview is one component call. `const byDateDesc` should move out of the component (it is recreated every render and read in a memo).
- **Size:** 298 → ~220.

### A-21 · MED · size
- **Where:** `main-page-charts/MainPageHeatmap.tsx` (267).
- **What:** It is not bloated by much: the grid maths (padding, fitting to `weeks`, month labels with collision rule, lines 63-100) is pure and untested on its own, the tooltip is positioned by writing to the DOM with inline colours, and there are slop comments (A-15) and a dead button (A-11).
- **Fix:** Move the column and month-label computation to `utils/utils.tsx` next to `groupByDays` / `heatLevel` (unit-testable); use `TOOLTIP_SURFACE`; drop the dead button and labels. The DOM-written tooltip is a deliberate perf choice (no re-render per mouse move): keep it.
- **Size:** 267 → ~190.

### A-22 · LOW · rule (tension)
- **Where:** `main-page-profile/MainPageProfile.module.css:18,27`.
- **What:** The module's own keyframes are an accepted exception (CLAUDE.md, design-system.md), but it uses fill `both`, and the Entrances rule says "`backwards`, never `both`: a fill that stays keeps a transform, which traps `position: fixed`". The comment header (lines 1-8) is also long for what it says.
- **Fix:** `backwards` (the end state is `opacity 1; transform none`, so nothing visible changes). Note for the owner, not a design change.

### A-23 · LOW · rule (guard)
- **Where:** `src/components/ui/uiGuard.test.ts:101-103`.
- **What:** Three exceptions to the radius guard exist only for the unreachable `rounded-3xl` links in A-07.
- **Fix:** Remove them with A-07.

### A-24 · LOW · polish
- `MainPagePointsStats.tsx:49-50`: `Array.isArray` guards on typed props.
- `MainPageBestPeriod.tsx:342-345`: `useCallback` close handlers with no memoized consumer; three "no data" boxes with different padding (`px-3 py-2.5` twice, `p-2.5` once).
- `MainPageGroups.tsx:15-17`: the `dynamic()` call sits between imports (file order rule).
- `collection-shelf/CollectionShelf.tsx:139-145`: `from-warning to-warning` gradients of one colour; places 1 and 3 identical; `text-amber-950`/`text-orange-950` slip past the guard's palette regex (only 200–600).
- `MainPageFavoritesUnpinButton.tsx:19`: `text-hardcore hover:text-hardcore` (the hover does nothing).
- `MainPagePortadaSideLevel.tsx:101,115`: the same `toLevel` string built twice.
- `MainPageProfileRecentRow.tsx:21-41` and `MainPageStatsRail.tsx:179-223`: mis-indented JSX (the formatter would fix it).
- `MainPagePortada.tsx:62` and `MainPagePortadaSkeleton.tsx:208`: the cover box class string copied; a shared constant keeps the skeleton the same box.

### A-25 · LOW · tests
- Six test files cover only dead code (A-01, ~400 lines). PSN/Xbox nav, stats and pinned-row tests are near copies of each other (`MainPagePsnNav.test` 18 / `MainPageXboxNav.test` 32, `MainPagePsnStats.test` 36 / `MainPageXboxStats.test` 54 / `MainPageSteamStats.test` 82, `PsnPinnedGameRow.test` 47 / `XboxPinnedGameRow.test` 52); after A-02/A-03/A-06 they become one parametrised test each. `MainPageCharts.test` (286) is large but covers a large component: ok.

## Cross-area notes
- **Platform colours** are hard-coded in ~38 files (`#66c0f4`), ~37 (`#0070d1`), ~14 (`#107c10`), and Xbox is also `text-success` in places: needs one token map (A-14), owned by whoever audits `ui/`/globals.
- **RA image URLs** are built inline (`https://retroachievements.org${…}`, `media.retroachievements.org/Badge/…`) ~148 times across `src/`; only `achievementGameIconUrl`/`achievementBadgeUrl` exist. A `raImage(path)` helper is worth it.
- `formatPlaytime(x, { minutes: T.steam.minutesShort, hours: T.steam.hoursShort }, lang)` is repeated in 27 files: a `usePlaytime()` or a `formatPlaytime(x, T, lang)` overload.
- Generic UI strings live under `T.steam`/`T.profileRa`/`T.rankings` and are reused everywhere (A-17): a translations auditor should look at a `common` namespace.
- `MainPageProfileTabs` (A-08) is used by the public profile and the account page: whoever owns those areas should expect it to become `ui/Tabs`.
- The folder `src/components/achivements-line-chart/` has the `achivements` typo baked into its path.
- Static modal imports (A-04) probably exist outside the home too: grep `import .*Modal from` in client components.
- The card kicker class (A-14) is repeated 42 times in `src/`.

## Coverage — every file reviewed
Paths relative to `src/components/main-page/`.

| File | Lines | Verdict |
|---|---|---|
| `MainPage.tsx` | 82 | A-15, A-16 |
| `main-page-browse/MainPageBrowse.tsx` | 73 | A-06 |
| `main-page-browse/browse-consoles/BrowseConsoles.tsx` | 52 | ok (A-14 kicker) |
| `main-page-browse/browse-search/BrowseSearch.tsx` | 101 | A-13 |
| `main-page-browse/browse-search-chips/BrowseSearchChips.tsx` | 22 | A-13, A-17 |
| `main-page-charts/MainPageCharts.tsx` | 298 | A-15, A-17, A-20 |
| `main-page-charts/MainPageHeatmap.tsx` | 267 | A-04, A-11, A-13, A-15, A-18, A-21 |
| `main-page-charts/MainPageBestPeriod.tsx` | 163 | A-04, A-15, A-17, A-18, A-24 |
| `main-page-charts/MainPagePointsStats.tsx` | 93 | A-02, A-04, A-18, A-24 |
| `main-page-charts/MainPageAbandoned.tsx` | 202 | A-09, A-10, A-15, A-18 |
| `main-page-charts/MainPageRarest.tsx` | 129 | A-09, A-17 |
| `main-page-charts/MainPageTopGames.tsx` | 71 | ok |
| `main-page-charts/MainPageMastery.tsx` | 154 | A-01 |
| `main-page-charts/MainPagePerfectGames.tsx` | 128 | A-01 |
| `main-page-charts/MainPageGroups.tsx` | 165 | A-11, A-13, A-17, A-24 |
| `main-page-charts/MainPageConsoleNav.tsx` | 121 | A-06 (shared `SECTIONS`) |
| `main-page-charts/main-page-steam-nav/MainPageSteamNav.tsx` | 91 | A-06, A-12 |
| `main-page-charts/main-page-psn-nav/MainPagePsnNav.tsx` | 88 | A-06, A-12 |
| `main-page-charts/main-page-xbox-nav/MainPageXboxNav.tsx` | 88 | A-06, A-12, A-14 |
| `main-page-charts/main-page-steam-stats/MainPageSteamStats.tsx` | 104 | A-02, A-04 |
| `main-page-charts/main-page-psn-stats/MainPagePsnStats.tsx` | 100 | A-02, A-04 |
| `main-page-charts/main-page-xbox-stats/MainPageXboxStats.tsx` | 98 | A-02, A-04 |
| `main-page-charts/main-page-best-period-row/MainPageBestPeriodRow.tsx` | 62 | A-11, A-17 |
| `main-page-charts/main-page-month-compare/MainPageMonthCompare.tsx` | 63 | ok |
| `main-page-charts/main-page-habits/MainPageHabits.tsx` | 128 | ok |
| `main-page-charts/main-page-journal/MainPageJournal.tsx` | 38 | ok |
| `main-page-charts/main-page-journal-day/MainPageJournalDay.tsx` | 55 | ok |
| `main-page-charts/main-page-groups-row/MainPageGroupsRow.tsx` | 23 | A-11 |
| `main-page-charts/mastery-mix/MasteryMix.tsx` | 44 | ok (A-17 placement) |
| `main-page-charts/mastery-by-console/MasteryByConsole.tsx` | 57 | A-01 |
| `main-page-charts/closest-to-complete/ClosestToComplete.tsx` | 55 | A-15, A-17 |
| `main-page-charts/perfect-podium/PerfectPodium.tsx` | 68 | A-01 |
| `main-page-charts/perfect-game-tile/PerfectGameTile.tsx` | 71 | A-01 |
| `main-page-collection/MainPageCollection.tsx` | 80 | ok |
| `main-page-collection/collection-closest/CollectionClosest.tsx` | 85 | A-09 |
| `main-page-collection/collection-numbers/CollectionNumbers.tsx` | 122 | A-13, A-14, A-18 |
| `main-page-collection/collection-grid/CollectionGrid.tsx` | 124 | A-04, A-13 |
| `main-page-collection/collection-shelf/CollectionShelf.tsx` | 98 | A-14, A-24 |
| `main-page-collection/collection-tile/CollectionTile.tsx` | 42 | A-15, A-18 |
| `main-page-collection/collection-shelf-skeleton/CollectionShelfSkeleton.tsx` | 26 | ok |
| `main-page-collection/main-page-collection-skeleton/MainPageCollectionSkeleton.tsx` | 51 | ok |
| `main-page-favorites/main-page-favorites-unpin-button/MainPageFavoritesUnpinButton.tsx` | 17 | A-17, A-24 |
| `main-page-friends/MainPageFriends.tsx` | 143 | ok |
| `main-page-friends/main-page-friends-card/MainPageFriendsCard.tsx` | 94 | ok |
| `main-page-friends/main-page-friends-feed/MainPageFriendsFeed.tsx` | 52 | ok |
| `main-page-friends/main-page-friends-leaderboard/MainPageFriendsLeaderboard.tsx` | 98 | A-12, A-13 |
| `main-page-friends/main-page-friends-shared/MainPageFriendsShared.tsx` | 65 | ok |
| `main-page-friends/main-page-friends-skeleton/MainPageFriendsSkeleton.tsx` | 75 | ok |
| `main-page-games/main-page-games-list/MainPageGamesList.tsx` | 123 | A-01 |
| `main-page-group-feature/MainPageGroupFeature.tsx` | 202 | A-11 (LOW), A-13 |
| `main-page-group-feature-game/MainPageGroupFeatureGame.tsx` | 27 | ok |
| `main-page-groups-section/MainPageGroupsSection.tsx` | 35 | A-11 |
| `main-page-groups-section/main-page-groups-section-skeleton/MainPageGroupsSectionSkeleton.tsx` | 34 | ok |
| `main-page-pinned-games/MainPagePinnedGames.tsx` | 111 | A-03, A-19 |
| `main-page-pinned-games/pin-game-card/PinGameCard.tsx` | 37 | A-13 |
| `main-page-pinned-games/pinned-game-row/PinnedGameRow.tsx` | 172 | A-03, A-05, A-15 |
| `main-page-pinned-games/steam-pinned-game-row/SteamPinnedGameRow.tsx` | 131 | A-03, A-14 |
| `main-page-pinned-games/psn-pinned-game-row/PsnPinnedGameRow.tsx` | 113 | A-03, A-14 |
| `main-page-pinned-games/xbox-pinned-game-row/XboxPinnedGameRow.tsx` | 113 | A-03, A-14 |
| `main-page-pinned-section/MainPagePinnedSection.tsx` | 26 | ok |
| `main-page-pinned-section/main-page-pinned-section-achievements/MainPagePinnedSectionAchievements.tsx` | 99 | A-04 |
| `main-page-pinned-section/main-page-pinned-section-achievement-tile/MainPagePinnedSectionAchievementTile.tsx` | 99 | ok |
| `main-page-pinned-section/main-page-pinned-section-games/MainPagePinnedSectionGames.tsx` | 75 | ok |
| `main-page-pinned-section/main-page-pinned-section-game-tile/MainPagePinnedSectionGameTile.tsx` | 32 | ok |
| `main-page-pinned-section/main-page-pinned-section-showcase/MainPagePinnedSectionShowcase.tsx` | 89 | A-13 |
| `main-page-pinned-section/main-page-pinned-section-sortable/MainPagePinnedSectionSortable.tsx` | 49 | ok (A-19 target) |
| `main-page-pinned-section/main-page-pinned-section-sortable-item/MainPagePinnedSectionSortableItem.tsx` | 50 | ok (A-19 target) |
| `main-page-portada/MainPagePortada.tsx` | 200 | A-04, A-24 |
| `main-page-portada-skeleton/MainPagePortadaSkeleton.tsx` | 72 | A-24 |
| `main-page-portada-side/MainPagePortadaSide.tsx` | 20 | ok |
| `main-page-portada-side/main-page-portada-side-level/MainPagePortadaSideLevel.tsx` | 90 | A-24 |
| `main-page-portada-side/main-page-portada-side-recent/MainPagePortadaSideRecent.tsx` | 39 | A-17 |
| `main-page-portada-side/main-page-portada-side-streak/MainPagePortadaSideStreak.tsx` | 57 | ok |
| `main-page-profile/MainPageProfile.tsx` | 101 | A-07, A-08 |
| `main-page-profile/MainPageProfile.module.css` | 28 | A-22 |
| `main-page-profile/main-page-profile-actions/MainPageProfileActions.tsx` | 38 | A-13 |
| `main-page-profile/main-page-profile-actions/main-page-profile-actions-refresh/MainPageProfileActionsRefresh.tsx` | 58 | A-13 |
| `main-page-profile/main-page-profile-card/MainPageProfileCard.tsx` | 60 | ok |
| `main-page-profile/main-page-profile-error/MainPageProfileError.tsx` | 37 | ok |
| `main-page-profile/main-page-profile-game-skeleton/MainPageProfileGameSkeleton.tsx` | 22 | ok |
| `main-page-profile/main-page-profile-now-playing/MainPageProfileNowPlaying.tsx` | 53 | ok |
| `main-page-profile/main-page-profile-recent/MainPageProfileRecent.tsx` | 63 | ok |
| `main-page-profile/main-page-profile-recent/main-page-profile-recent-row/MainPageProfileRecentRow.tsx` | 43 | A-24 |
| `main-page-profile/main-page-profile-skeleton/MainPageProfileSkeleton.tsx` | 54 | ok |
| `main-page-profile/main-page-profile-tabs/MainPageProfileTabs.tsx` | 92 | A-08, A-15 |
| `main-page-profile/main-page-profile-ra/MainPageProfileRa.tsx` | 101 | ok |
| `main-page-profile/main-page-profile-ra/main-page-profile-ra-achievements/MainPageProfileRaAchievements.tsx` | 35 | ok (A-07 mapper) |
| `main-page-profile/main-page-profile-ra/main-page-profile-ra-game/MainPageProfileRaGame.tsx` | 38 | ok |
| `main-page-profile/main-page-profile-ra/main-page-profile-ra-stats/MainPageProfileRaStats.tsx` | 25 | ok |
| `main-page-profile/main-page-profile-st/MainPageProfileSt.tsx` | 33 | A-07, A-23 |
| `main-page-profile/main-page-profile-st/main-page-profile-st-linked/MainPageProfileStLinked.tsx` | 129 | A-07, A-14 |
| `main-page-profile/main-page-profile-st/main-page-profile-st-game/MainPageProfileStGame.tsx` | 44 | A-07 |
| `main-page-profile/main-page-profile-st/main-page-profile-st-achievements/MainPageProfileStAchievements.tsx` | 49 | A-07 |
| `main-page-profile/main-page-profile-st/main-page-profile-st-stats/MainPageProfileStStats.tsx` | 44 | A-07 |
| `main-page-profile/main-page-profile-psn/MainPageProfilePsn.tsx` | 33 | A-07, A-23 |
| `main-page-profile/main-page-profile-psn/main-page-profile-psn-linked/MainPageProfilePsnLinked.tsx` | 109 | A-07, A-14 |
| `main-page-profile/main-page-profile-psn/main-page-profile-psn-game/MainPageProfilePsnGame.tsx` | 43 | A-07 |
| `main-page-profile/main-page-profile-psn/main-page-profile-psn-trophies/MainPageProfilePsnTrophies.tsx` | 52 | A-07 |
| `main-page-profile/main-page-profile-psn/main-page-profile-psn-stats/MainPageProfilePsnStats.tsx` | 36 | A-07 |
| `main-page-profile/main-page-profile-xbox/MainPageProfileXbox.tsx` | 33 | A-07, A-23 |
| `main-page-profile/main-page-profile-xbox/main-page-profile-xbox-linked/MainPageProfileXboxLinked.tsx` | 105 | A-07, A-14 |
| `main-page-profile/main-page-profile-xbox/main-page-profile-xbox-game/MainPageProfileXboxGame.tsx` | 42 | A-07 |
| `main-page-profile/main-page-profile-xbox/main-page-profile-xbox-achievements/MainPageProfileXboxAchievements.tsx` | 51 | A-07 |
| `main-page-profile/main-page-profile-xbox/main-page-profile-xbox-stats/MainPageProfileXboxStats.tsx` | 35 | A-07, A-12 |
| `main-page-skeleton/MainPageSkeleton.tsx` | 26 | ok |
| `main-page-skeleton/main-page-skeleton-body/MainPageSkeletonBody.tsx` | 97 | ok |
| `main-page-stats-rail/MainPageStatsRail.tsx` | 102 | A-24 (hand-made vertical tablist with a motion pill; distinct from `ui/Tabs`, acceptable) |
| `main-page-without-ra/MainPageWithoutRa.tsx` | 33 | A-15, A-16 |
| `perfect-games-order-modal/PerfectGamesOrderModal.tsx` | 92 | A-19 |
| `perfect-games-order-modal/perfect-game-order-row/PerfectGameOrderRow.tsx` | 57 | A-13, A-14, A-15, A-18 |
