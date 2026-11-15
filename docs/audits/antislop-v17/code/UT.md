# UT — utils, types, constants, test-utils
Auditor notes: the files one by one are mostly small, pure and well commented (the "why" comments, measured facts and traps are good and should stay). The trouble is between files: each platform added over time brought its own copy of the same small things (platform list, platform names, RA image URLs, day keys, date parsing, the "wantToPlay | playing | completed" union, "a game of any platform" and "an achievement of any platform" shapes). `utils.tsx` is a grab-bag carrying dead code, and a few pure utils reach up into components and hooks. Very few comments are slop; the main comment problem is stale ones from before PSN/Xbox.

## Findings

### UT-01 · HIGH · duplication — RA image URLs built by hand ~50 times
- **Where:** badge `https://media.retroachievements.org/Badge/${name}.png`: 15 places — `src/utils/utils.tsx:266` (`achievementBadgeUrl`), `src/utils/pinnedView.ts:85`, `src/utils/gameCompare.ts:39` (`raBadge`), `src/utils/gameInsights.ts:42`, `src/utils/showcase.ts:94`, `src/hooks/useShowcaseGameChoices.ts:34`, `src/components/achievement-grid/AchievementGrid.tsx:81,159`, `achievement-modal/AchievementModal.tsx:123`, `game-info-achivement/GameInfoAchievementCard.tsx:57`, `game-info-achivement/GameInfoAchivement.tsx:54`, `game-pinned-achievements/GamePinnedAchievements.tsx:117`, `main-page-charts/MainPageRarest.tsx:52`, `MainPageProfileRaAchievements.tsx:26`, `pin-achievement-modal/PinAchievementModal.tsx:82`. Image `https://retroachievements.org${path}`: 36 places, including `src/utils/library.ts:32` (`raIcon`), `src/hooks/useGameInsights.ts:33` (`raImage`), `src/utils/gameCandidates.ts:141`, `src/utils/homeHero.ts:71`, `src/utils/perfectGames.ts:47,163`, `src/utils/utils.tsx:272`, `src/hooks/useRaBoxArt.ts:22`, `src/hooks/useRaScreenshot.ts:19` and ~27 components (`StatusGameItem.tsx` ×3, `PinnedGameRow.tsx` ×2, `GameInfoHeader.tsx` ×3, `MainPageMastery.tsx` ×2, `RaGameItem`, `SortableItem`, `GroupCoverMosaic`, `LibraryEntryCover`, `UserPlatforms`, `MainPageProfileRa`, …).
- **What:** two hosts and two path shapes written out by hand everywhere; three local helpers already exist (`raIcon`, `raImage`, `raBadge`) plus `achievementBadgeUrl`/`achievementGameIconUrl`, none shared.
- **Fix:** `src/utils/raAssets.ts` (pure, the RA twin of `lib/steamAssets.ts`): `raBadgeUrl(name)` and `raImageUrl(path)`, both `null` on empty. `achievementBadgeUrl`/`achievementGameIconUrl` call them; every copy above imports them.
- **Size:** ~50 template strings → 2 functions; a host change becomes one edit.

### UT-02 · HIGH · duplication — the platform list and platform names, redefined per file
- **Where:** list: `GAME_SOURCES` in `src/utils/gameRef.ts:12` is imported only by a test, while 12 places spell `['ra','steam','psn','xbox']` again: `src/utils/showcase.ts:27`, `src/utils/library.ts:149`, `src/context/MainPlatformContext.tsx:12`, `src/components/groups/add-game-modal/AddGameModal.tsx:25`, `vault-platform-split/VaultPlatformSplit.tsx:6`, `following-card-platforms/FollowingCardPlatforms.tsx:8`, `following-toolbar/FollowingToolbar.tsx:11`, `library-platform-tabs/LibraryPlatformTabs.tsx:28`, `MainPageFriendsCard.tsx:20`, `PublicUserAbout.tsx:51`, `PublicUserGames.tsx:39`, `UserSummary.tsx:18`. `isGameSource` (`gameRef.ts:14`) re-lists them instead of using the array. Names: `PLATFORM_NAME` (`gameRef.ts:44`, 25 users) is copied identically as `NAMES` in `src/utils/vaultFill.ts:32`, `src/hooks/useVaultFill.ts:16`, `src/components/admin-panel/admin-rankings/AdminRankings.tsx:9`, `PLATFORM_NAMES` in `src/components/not-found-game/NotFoundGame.tsx:11`, and in `src/app/(main)/user/[username]/opengraph-image.tsx:13`. Console-slot constants: `STEAM_PLATFORM` (`steamMappers.ts:25`, used only in its own file), `PSN_PLATFORM` (`psnMappers.ts:5`), `XBOX_PLATFORM` (`xboxMappers.ts:6`), while `'Steam'` is a literal in `library.ts:71`, `sectionPreview.ts:57`, `gameCandidates.ts:107`.
- **What:** adding or renaming a platform (Xbox opening is planned in CLAUDE.md) means finding ~20 copies.
- **Fix:** keep `GAME_SOURCES` and `PLATFORM_NAME` in `gameRef.ts` (or a `types/game.ts`, see UT-03), make `isGameSource` use `GAME_SOURCES.includes`, import both everywhere above. `aiExport.ts:65` keeps its own map on purpose ("PlayStation Network" for the prompt): leave it, with a one-line why.
- **Size:** ~20 literal copies → 0.

### UT-03 · HIGH · duplication (types) — same concept typed 5–8 times
- **Where:**
  - `'wantToPlay' | 'playing' | 'completed'`: 8 copies — `SteamCategory` (`src/utils/steamFeed.ts:11`), `PsnCategory` (`src/utils/psnTitles.ts:3`), `XboxCategory` (`src/utils/xboxTitles.ts:27`), `LibraryStatus` (`src/utils/library.ts:13`), `LibraryCategory` (`src/components/library-game-detail/LibraryGameDetail.tsx:22`), `ValidCategory` (`src/hooks/useGamesByCategory.ts:9`), `Category` (`src/components/all-games-section/AllGamesSection.tsx:15`), inline in `MainPageConsoleNav.tsx:18`; plus runtime lists in `src/app/(main)/allGames/page.tsx:11` and `src/app/(main)/[category]/layout.tsx:3` (and the dead `CATEGORIES`, UT-06).
  - `GameSource` aliases: `MainPlatform` (`src/context/MainPlatformContext.tsx:11`), `type Platform` (`src/utils/aiExport.ts:20`, `AdminLinkedAccounts.tsx:12`), inline unions in `src/app/api/favorites/route.ts:14`, `src/hooks/useCheevoUser.ts:25`.
  - `SavedGame = { id; title; imageIcon } | null`: 6 copies — `src/types/next-auth.d.ts:5`, `src/utils/friends.ts:13`, `src/lib/userRecord.ts:6`, `src/lib/publicUser.ts:23`, `src/app/api/users/[username]/route.ts:10`, inline in `useCheevoUser.ts:25`.
  - `GameSource` and `GameProgressBase` live in `src/types/steam.ts`, so 62 files import a cross-platform type from "steam", and `psn.ts`/`xbox.ts` import their base from it.
- **Fix:** a `src/types/game.ts` with `GameSource`, `GAME_SOURCES`, `GameCategory`, `SavedGame`, `GameProgressBase` (re-export from `steam.ts` during the move so the 62 imports can follow at leisure). Delete the aliases.
- **Size:** ~20 type declarations → 4.

### UT-04 · HIGH · duplication + rule — dates and days handled in ~100 hand-written places
- **Where:**
  - Local `YYYY-MM-DD`: 5 copies — `src/utils/utils.tsx:111` (`localDay`, private), `src/utils/utils.tsx:454` (inline in `daysBetween`), `src/utils/activityInsights.ts:20` (`localDay`, exported, same name), `src/components/streak-page/streak-year-heatmap/StreakYearHeatmap.tsx:14`, `src/components/streak-page/StreakPage.tsx:30`.
  - UTC day key `toISOString().split('T')[0]` / `.slice(0, 10)`: 24 occurrences in 17 files (`utils.tsx`, `streaks.ts`, `friends.ts:69` `dayKey`, `vaultLevel.ts`, `lib/vaultMe.ts`, `lib/upstreamCount.ts`, 8 components…).
  - RA "YYYY-MM-DD HH:MM:SS" parsing: 27 `.replace(' ', 'T')` in 18 files, with five named helpers that do the same thing — `raDateToIso` (`steamFeed.ts:49`), `raIso` (`vaultScoreInputs.ts:16`), `unlockTime` (`activityInsights.ts:15`), `isoOf` (`showcase.ts:123`, plus the same expression inline at `showcase.ts:64,85`), `playedAt` (`friends.ts:150`). **They disagree on the zone**: `raDateToIso`, `raIso`, `unlockTime` append `Z` (UTC, as RA sends), while `utils.tsx` (`calcAvgPerDay:206`, `activityKpis:223`, `groupGameAchievementsByPeriod:123`, `formatDate:10`), `gameCompare.ts:147,156` and `friends.ts:75` parse the same strings as local time. A bug in waiting; which is right is the owner's call, but there should be one parser.
  - Formatting: `formatDate` (`utils.tsx:8`, 12 users) hard-codes `'en-GB'`, so every user sees English month names (`3 Oct 2026`) whatever their language — against CLAUDE.md i18n ("in their language"). Siblings: `formatDay` (`utils.tsx:440`), `formatUnlockDate` (`gameCompare.ts:154`), `formatUnlock` (`steamFeed.ts:191`), `relativeTime` (`utils.tsx:19`), `lastPlayedAgo` (`libraryShelves.ts:39`), and 54 direct `toLocaleDateString`/`RelativeTimeFormat` calls in ~30 components.
- **Fix:** one `src/utils/dates.ts`: `utcDay(date)`, `localDay(date)`, `parseUnlockDate(s)` (the one RA parser, zone decided once), `formatDate(s, lang, style)` with two or three named styles (day, day+time, relative). Move `daysBetween`, `formatDay`, `unlockSpan`, `relativeTime` there; make `formatDate` take `lang`. Components call the styles instead of building option objects.
- **Size:** 5 named parsers + 5 formatters + ~80 inline expressions → ~6 functions (~50 lines).

### UT-05 · HIGH · size/abstraction — `src/utils/utils.tsx` (523 lines) is a grab-bag: split it
- **Where:** `src/utils/utils.tsx` (45 exports, 94 importers).
- **What:** seven unrelated topics in one file, a `.tsx` with no JSX, importing types from a hook and two components (`CategoryGame`, `GameExtraData`, `StatusSortKey`), with ~70 lines of dead code (UT-06) and an unused re-export (`export { calcAllStreaks } from '@/utils/streaks'`, line 238: nobody imports it from here). Four day-bucketing functions sit side by side (`groupByDay` dead, `groupByDays`, `groupByDaySource`, `countByDay`) and `groupByDay` is `groupByDays(…, 7)`.
- **Fix (by topic, each to an existing file where one fits):**
  - dates and days (`formatDate`, `relativeTime`, `formatDay`, `daysBetween`, `localDay`, `unlockSpan`) → `dates.ts` (UT-04).
  - unlock statistics (`groupByConsole`, `groupByDays`, `groupByDaySource`, `groupGameAchievementsByPeriod`, `countByDay`, `getBestMonth`, `calcThisMonth`, `calcAvgPerDay`, `activityKpis`, `heatLevel`/`HEAT_LEVELS`, `stripCap`, `streakInsights`, `completionBuckets`) → `activityInsights.ts`, which already says it is "what the Activity section reads from the year of unlocks".
  - RA achievements (`sumAchievementPoints`, `achievementBadgeUrl`, `achievementGameIconUrl`) → `raAssets.ts` (UT-01); `pinnedKey` → `pinnedView.ts`, its only other reader.
  - list sort (`getGameSortValue`, `compareSortValues`) → `libraryInsights.ts`, their only other user.
  - text and numbers (`decimal`, `plural`, `matchParts`, `capList`, `parseReleaseYear`) → `format.ts`.
  - `mapLimit` (server-side concurrency, used by `lib/psnClient`, `lib/friendCards`, two routes…) → `src/lib/mapLimit.ts` or keep in utils as its own file; `dominantColors` → beside `useAvatarPalette`/`useImageTint`; `gameSourceFromPath` → `gameRef.ts`.
  - delete `getRandomGameIds`, `groupByDay`, `calcStreak`, the re-export.
- **Size:** 523 → 0 (≈420 lines spread over 5 topical files); CLAUDE.md's "pure transforms live in `src/utils/utils.tsx`" line would need updating to "in `src/utils/`, one file per topic" (the owner's call; the rule is the reason this file grew).

### UT-06 · HIGH · dead — exports and files nobody uses
- **Where (verified by grep over `src/` and `scripts/`, tests excluded):**
  - `src/constants/ragamesidpool.ts` (40 lines, whole file; a 15-line commented-out object on top and a duplicated id `"18067"`), only read by `getRandomGameIds` (`utils.tsx:32`), itself only read by a test.
  - `CATEGORIES` (`src/constants/index.ts:20-24`, Spanish labels outside `T`): only its test reads it; the real lists are re-declared in `allGames/page.tsx:11` and `[category]/layout.tsx:3`.
  - `getGamesInfo`, `getWantGames` (`src/utils/apiCallsUtils.tsx:11-63`): test-only; both take a `session` parameter they never read.
  - `groupByDay` (`utils.tsx:36`), `calcStreak` (`utils.tsx:87`, superseded by `streaks.ts`), the `calcAllStreaks` re-export (`utils.tsx:238`).
  - `showcaseFromUnlock` (`src/utils/showcase.ts:61`; CLAUDE.md still names it as the mapping) and `withAchievementCounts` (`src/utils/steamMappers.ts:69`): test-only.
  - `GAME_SOURCES` (`gameRef.ts:12`): test-only (should be used instead, UT-02).
- **Fix:** delete them and their tests (`constants/ragamesidpool.test.ts`, the `CATEGORIES` test in `constants/index.test.ts`, the `getRandomGameIds`/`groupByDay`/`calcStreak` blocks of `utils.test.ts`, the `withAchievementCounts` block of `steamMappers.test.ts`). For `showcaseFromUnlock`, either wire it where CLAUDE.md says it is used or drop it and the CLAUDE.md line.
- **Size:** ~170 lines of source plus their tests.

### UT-07 · HIGH · duplication — PSN grade labels mapped 8 times
- **Where:** `{ platinum: T.psn.platinum, gold: T.psn.gold, silver: T.psn.silver, bronze: T.psn.bronze }` in `src/utils/pinnedView.ts:52`, `PsnGameInfoTrophy.tsx:43`, `PsnGameInfoTrophyCard.tsx:39`, `PsnGameInfoTable.tsx:140`, `PsnRarestTrophies.tsx:32`, `PsnTrophyCounts.tsx:22`, `PsnTrophyGrid.tsx:81`, `MainPageProfilePsnTrophies.tsx:30`.
- **Fix:** `trophyGradeLabel(grade, T)` next to `TROPHY_GRADE_COLOR` in `src/utils/psnTitles.ts` (or key `T.psn` by grade so it is `T.psn[grade]`).
- **Size:** 8 object literals → 1 function.

### UT-08 · HIGH · duplication — RA game id read from a `CategoryGame`, 6 copies
- **Where:** `'GameID' in g && g.GameID ? g.GameID : (g as { ID: number }).ID` in `src/utils/libraryInsights.ts:45` (`raId`, private), `src/utils/libraryShelves.ts:23`, `src/utils/sectionPreview.ts:37`, `src/hooks/useGamesByCategory.ts:73`, `src/app/(main)/[category]/(list)/page.tsx:145,154`. `library.ts:60` and `gameCandidates.ts:87` do the same for `WantToPlayGame` as `g.ID ?? g.GameID!`.
- **Fix:** export one `raGameId(g)` (next to the `CategoryGame` type once it moves to `types/`, see UT-11) and use it in all of them.
- **Size:** 8 expressions → 1 function.

### UT-09 · HIGH · duplication/abstraction — "an achievement of any platform": 6 shapes, ~20 mappers
- **Where:**
  - `InsightAchievement` + `fromRa/fromSteam/fromPsn/fromXbox` (`src/utils/gameInsights.ts:11-88`) and `CompareAchievement` + `raCompareList/steamCompareList/psnCompareList/xboxCompareList` (`src/utils/gameCompare.ts:10-101`) are the same idea with the same fields (id, title, description, iconUrl, rarity, earned, earnedAt, points, anchor/href); the RA mappers compute rarity and the badge the same way. Also `PinnedView` (`pinnedView.ts`), `AiAchievement` (`aiExport.ts`), `ScoreAchievement` inputs (`vaultScoreInputs.ts`), `ShowcaseChoice` (`showcase.ts`).
  - Four "into RA's `RecentAchievement`" mappers: `toRecentAchievement` (`steamMappers.ts:192`), `psnToRecentAchievement` (`psnMappers.ts:12`, the file's only function), `xboxToRecentAchievement` (`xboxMappers.ts:230`), `toRecentAchievements` (`gameInsights.ts:188`); and three near-identical input types `SteamRecentAchievement` (`types/steam.ts:32`), `PsnRecentTrophy` (`types/psn.ts:101`), `XboxRecentAchievement` (`types/xbox.ts:176`).
- **Fix:** merge `CompareAchievement` into `InsightAchievement` (add `grade`, `gamerscore`, `hardcore`, `anchor`), so compare reuses `fromRa…fromXbox` and adds only `mergeCompare`/`filterCompare`. For recent unlocks, one `RecentUnlock` type (`gameId, gameTitle, gameIconUrl, key, name, iconUrl, earnedAt, rarity, native?`) and one `toRecentAchievement(source, u)`; `psnMappers.ts` then disappears. The others (pins, AI, score) have reasons to differ; leave them.
- **Size:** `gameCompare.ts` 158 → ~80; three mappers and two types (~70 lines) → one of each (~25).

### UT-10 · HIGH · duplication — "a game of any platform": 8 shapes, completion rules written 3 times
- **Where:** `LibraryGame` (`library.ts`), `LibraryEntry` (`libraryInsights.ts`), `PreviewGame` (`sectionPreview.ts`), `GameCandidate` (`gameCandidates.ts`), `PerfectGame` and `LatestPerfect` (`perfectGames.ts`), `HomeHero` (`homeHero.ts`), `LastPlayed` (`friends.ts`), each with a builder per platform (≈30 functions/blocks). The part that hurts: the completion date per platform is decided in three places with different rules — `buildEntries` (`libraryInsights.ts:73-77`), `latestPerfects` (`perfectGames.ts:145-210`) and `perfectDates` (`perfectGames.ts:216-232`). `perfectDates` takes any PSN `completedAt` without checking the game is completed, `latestPerfects` checks it; `perfectDates` re-implements `raLatestCompletionAward` (`completionDates.ts:41`) by hand.
- **Fix:** one `completedAtOf(source, game, awards)` in `completionDates.ts`, used by all three (CLAUDE.md's "Completion dates" table is the spec). Inside `perfectGames.ts`, the Steam/PSN/Xbox blocks of `buildPerfectGames` and `latestPerfects` differ only by classifier: one `perfectFrom(source, games, classify)` helper. `buildPsnCandidates`/`buildXboxCandidates` (`gameCandidates.ts:115-136`) are identical but for the classifier and subtitle: one function (and reuse `STEAM_STATUS`). Merging the 8 shapes into one is not proposed: each view needs different fields.
- **Size:** `perfectGames.ts` 270 → ~160; `gameCandidates.ts` 206 → ~185.

### UT-11 · MED · rule (layering) — pure utils import from components and hooks
- **Where:** `achievementAnchor` (runtime value) is defined in the client component `src/components/steam/steam-achievement-grid/SteamAchievementGrid.tsx:31` and imported by `src/utils/pinnedView.ts:7`, `src/utils/gameCompare.ts:7`, `src/utils/gameInsights.ts:4`, while its twins `psnTrophyAnchor` and `xboxAchievementAnchor` are in utils. Types pulled up from UI: `CategoryGame` (`hooks/useGamesByCategory`) in `utils.tsx`, `libraryInsights.ts`, `sectionPreview.ts`; `GameExtraData` (`components/statusGameList/StatusGameList`) and `StatusSortKey`/`SortDir` (`components/status-sort-control/StatusSortControl`) in `utils.tsx` and `libraryInsights.ts`; `UserSearchResult` (`hooks/useUserSearch`) in `friends.ts`; `ShapeStyle` (`hooks/useShapeStyle`) in `lookTransition.ts`; `Lang` from `context/LanguageContext` in `seoPages.ts` and `steamLanguage.ts` although it is defined in `utils/languages.ts`.
- **Fix:** move `achievementAnchor` to a `steamTitles.ts`-style util (as `steamAchievementAnchor`); move those types to `src/types/` (or the util that owns the concept); import `Lang` from `@/utils/languages`.
- **Size:** moves only.

### UT-12 · MED · duplication — `CONSOLES` turned into a lookup in 9 components
- **Where:** `new Map(CONSOLES.map(...))` in `PinnedGameRow.tsx:21`, `RaGameItem.tsx:18`, `MasteryByConsole.tsx:9`, `MainPageConsoleNav.tsx:12`, `BrowseConsoles.tsx:11`; `CONSOLES.find(...)` in `GameInfoHeader.tsx:52`, `SortableItem.tsx:52`, `MainPageGamesList.tsx:68`, `StatusGameItem.tsx:52` (by id in some, by name in others); `ConsoleFilter.tsx:15` rebuilds a map with the same four fields.
- **Fix:** export `consoleById(id)` and `consoleByName(name)` (two maps built once) from `src/constants/index.ts`.
- **Size:** 10 local lookups → 2 exports.

### UT-13 · MED · duplication — "a positive INTEGER id" checked three ways
- **Where:** `dbId` (`src/utils/dbId.ts`), `xboxNumericId` (`src/utils/xboxTitles.ts:12`, same regex `^\d{1,10}$` and its own `MAX_ID`), `parseShowcaseEntry` (`src/utils/showcase.ts:51`, literal `2147483647`).
- **Fix:** `xboxNumericId = (t) => dbId(t)`, and `dbId(o.gameId) === null` in the showcase check.
- **Size:** ~8 lines.

### UT-14 · MED · duplication/placement — the hidden-consoles JSON list parsed twice
- **Where:** `parse` in `src/hooks/useHiddenConsoles.ts:7-15` and `hiddenConsolesFrom` in `src/utils/vaultScoreInputs.ts:65-74` (a preferences helper living in the score-inputs file).
- **Fix:** `parseConsoleList(raw)` in `src/utils/consoleFilter.ts`, used by both (the server one reads `preferences['hidden-consoles:'+source]` and passes it in).
- **Size:** ~10 lines.

### UT-15 · MED · comments/placement — `src/types/types.ts` and stale type docs
- **Where:** `src/types/types.ts:5-25` holds the runtime theme list, its groups, `THEME_STORAGE_KEY` and `isTheme` (a "types" file with logic; `themeIcon.ts` imports runtime values from it). `types.ts:36` Spanish leftover `// puedes convertirlo luego a Date si quieres`. `types.ts:227-228` two stacked JSDoc blocks, the first stale ("from RA … or Steam", there are four). `types.ts:277-281` `Source`/`BadgeUrl`/`GameIconUrl` documented as "Set on Steam unlocks" (PSN and Xbox set them too). `types/xbox.ts:155` "Not read yet: Xbox sends it in a separate call" — play time has been read through `player/stats` since #87 (`xboxMappers.parseXboxMinutes`). `types/steam.ts:1-10` header says the unified model is "once RA and Steam feeds are mixed" and holds the cross-platform types; `AchievementBase` (`steam.ts:191`) has one user. `Nullable<…>` on `RetroAchievementsGameWithAchievements` (`types.ts:158`) makes every field nullable, which is why callers are full of `?? ''`.
- **Fix:** themes → `src/utils/themes.ts`; fix or drop the stale lines; fold `AchievementBase` into `SteamAchievementUnified`; consider typing only the fields RA really nulls (owner's call).
- **Size:** ~25 lines moved, ~8 comment lines fixed.

### UT-16 · MED · duplication — smaller copies inside utils
- **Where:**
  - Steam progress percent `Math.round((n / max) * 10000) / 100` in `withAchievementCounts` (test-only, UT-06) and `withUnlockCounts` (`steamMappers.ts:79,176`).
  - `toXboxAchievement`/`toXbox360Achievement` (`xboxMappers.ts:167-205`) repeat 7 of 10 fields.
  - "latest of these dates" `reduce` written 3 times in `completionDates.ts:21,34,46`.
  - `filterLibrary` (`library.ts:94`) re-implements `titleMatches` (`gameCandidates.ts:203`).
  - `library.ts:55,64,72` hand-build `/gameInfo/…` and `/steamGame/…` beside `gameHref` (used two lines below for PSN/Xbox); 21 more hand-built game URLs in 15 components (`SortableItem`, `StatusGameItem`, `PinnedGameRow`, `MainPageMastery`, `StreakCompletionCard`, `gameInsights.ts:43,59`…).
  - `formatRarity`, `formatUnlock`, `formatPlaytime` sit in `steamFeed.ts`, whose header says "putting Steam games next to RA ones"; it also merges PSN and Xbox feeds.
- **Fix:** one `pctOf(n, max)`; a shared base for the two Xbox mappers; a `latest(dates)` helper; `titleMatches` in `filterLibrary`; `gameHref` everywhere; move the format helpers to `format.ts` (UT-05) and rename `steamFeed.ts` to `recentFeed.ts`.
- **Size:** ~40 lines.

### UT-17 · LOW · comments — the few slop or broken comments
- **Where:** `src/utils/utils.tsx:425-428` orphaned JSDoc ("A counted noun in the right plural form…") stacked on top of `decimal`'s, so `decimal` shows `plural`'s doc and `plural` has none. `src/utils/xboxMappers.ts:219-220` the same JSDoc line twice. `src/utils/aiExport.ts:74-76, 229-231, 300-302` three `// ------` banner headers. `src/utils/vaultScoreInputs.ts:28` a variable named `any`.
- **Fix:** move the plural doc down to `plural`; delete the duplicate line and the banners (a plain one-line label is enough); rename `any` to `earnedAt`.

### UT-18 · LOW · naming/abstraction — small wrappers and misnamed files
- **Where:** `src/utils/utils.tsx` and `src/utils/apiCallsUtils.tsx` are `.tsx` with no JSX. `apiCallsUtils.tsx` holds `fetch` calls (not pure transforms; CLAUDE.md puts those in hooks) — after UT-06 it has `unlinkRaUser`, `fetchRaCandidateById`, `addGamesToGroup`, each with one or two users. One-line wrappers: `hasSteamAchievements` (`steamFeed.ts:19`, `= game.hasStats`), `xboxBackdrop` (`xboxTitles.ts:60`, `= game.imageIcon`), `xboxTitleId` (`= String(id)`, one user). `psnMappers.ts` is one function (folds into UT-09).
- **Fix:** rename to `.ts`; move the three fetchers into the hooks/components that use them (or `src/lib/`); the wrappers can stay where they name a rule (`hasSteamAchievements` documents one), drop `xboxTitleId`.

### UT-19 · LOW · size — `src/utils/aiExport.ts` (394) is fine
- **Where:** `src/utils/aiExport.ts`.
- **What:** ~130 of its lines are the prompt's prose, which CLAUDE.md calls "the part that decides whether the answers are any good"; the rest is four small source builders and the file assembly. Only real cut: the `game` block (`developer/publisher/genre/released/playtimeHours` via `joined` and `round1`) is written three times (`:128-137`, `:169-178`, `:206-214`): one `metaFrom(details, minutes)` helper. `type Platform` should be `GameSource` (UT-03). `aiExportFileName`'s accent strip repeats `normalizeTitle` (`gameCandidates.ts:145`).
- **Size:** 394 → ~375. Keep the prose as is.

## Cross-area notes
- **RA dates are parsed in two time zones across the app** (UT-04): whoever owns the home charts (`MainPageBestPeriod`, `MainPagePointsStats`, `MainPage*Stats`), `DayAchievementsModal`, `StreakDayRow` and `RecentAchievementsContext` should check which their counts assume.
- `formatDate` in English for every reader (UT-04) shows up in at least 10 components (PSN/Steam/RA game items, perfect tiles, trophy and achievement tooltips).
- Platform-name maps and source arrays in components (UT-02) are the component auditors' to remove; the shared versions already exist.
- `src/utils/groupValidation.ts` answers the API in Spanish (`'El título es obligatorio'`…); CLAUDE.md says Spanish UI text is intentional, but these are API error strings a modal may show to a reader in any of nine languages. Worth a decision by whoever owns the groups routes/modal (not a finding here, since the rule exists).
- Each new platform has historically added a `<platform>Titles.ts` + `<platform>Mappers.ts` pair and a builder in every "any platform" util (UT-09, UT-10). A checklist for the next platform should include "reuse the shared shapes", or the copies grow by one more each time.

## Coverage — every file reviewed
| File | Lines | Verdict |
|---|---|---|
| `src/utils/utils.tsx` | 523 | UT-05, UT-01, UT-04, UT-06, UT-11, UT-17, UT-18 |
| `src/utils/aiExport.ts` | 394 | UT-19, UT-17, UT-03 |
| `src/types/types.ts` | 335 | UT-15, UT-03 |
| `src/utils/perfectGames.ts` | 270 | UT-10, UT-01 |
| `src/utils/xboxMappers.ts` | 247 | UT-09, UT-16, UT-17, UT-02 |
| `src/utils/friends.ts` | 235 | UT-03, UT-04, UT-11 |
| `src/utils/gameInsights.ts` | 217 | UT-09, UT-01, UT-11, UT-16 |
| `src/types/steam.ts` | 216 | UT-03, UT-15 |
| `src/utils/steamMappers.ts` | 209 | UT-09, UT-06, UT-16, UT-02 |
| `src/utils/gameCandidates.ts` | 206 | UT-10, UT-01, UT-02 |
| `src/utils/steamFeed.ts` | 199 | UT-03, UT-04, UT-16, UT-18 |
| `src/utils/groupItems.ts` | 190 | ok |
| `src/utils/vaultScore.ts` | 167 | ok |
| `src/utils/library.ts` | 172 | UT-01, UT-02, UT-03, UT-08, UT-16 |
| `src/utils/gameCompare.ts` | 158 | UT-09, UT-01, UT-04, UT-11 |
| `src/utils/showcase.ts` | 148 | UT-01, UT-02, UT-04, UT-06, UT-13 |
| `src/utils/psnTitles.ts` | 145 | UT-03, UT-07 (target) |
| `src/test-utils/xboxFixtures.ts` | 134 | ok |
| `src/utils/sectionPreview.ts` | 129 | UT-08, UT-02, UT-11 |
| `src/utils/activityInsights.ts` | 125 | UT-04, UT-05 (target) |
| `src/utils/lookTransition.ts` | 122 | ok (UT-11: `ShapeStyle` type from a hook) |
| `src/utils/apiCallsUtils.tsx` | 117 | UT-06, UT-18 |
| `src/types/psn.ts` | 114 | UT-09, UT-03 |
| `src/utils/groupValidation.ts` | 111 | ok (cross-area note on Spanish API messages) |
| `src/utils/libraryShelves.ts` | 103 | UT-08, UT-04 |
| `src/utils/countries.ts` | 102 | ok |
| `src/utils/xboxTitles.ts` | 98 | UT-03, UT-13, UT-18 |
| `src/utils/themeIcon.ts` | 94 | ok |
| `src/utils/homeHero.ts` | 93 | UT-01 |
| `src/utils/pinnedView.ts` | 92 | UT-01, UT-07, UT-11 |
| `src/types/xbox.ts` | 87 | UT-09, UT-15 |
| `src/utils/libraryInsights.ts` | 85 | UT-08, UT-10, UT-11 |
| `src/utils/vaultLevel.ts` | 80 | ok (UT-04: UTC day key) |
| `src/utils/vaultScoreInputs.ts` | 74 | UT-14, UT-04, UT-17 |
| `src/utils/bentoLayout.ts` | 71 | ok |
| `src/types/next-auth.d.ts` | 66 | UT-03 |
| `src/utils/languages.ts` | 66 | ok |
| `src/utils/steamOnline.ts` | 60 | ok |
| `src/utils/authValidation.ts` | 55 | ok |
| `src/utils/streaks.ts` | 54 | ok |
| `src/utils/completionDates.ts` | 52 | UT-10, UT-16 |
| `src/utils/syncedPreferences.ts` | 50 | ok |
| `src/utils/gameRef.ts` | 49 | UT-02, UT-06 |
| `src/utils/vaultFill.ts` | 47 | UT-02 |
| `src/utils/seoPages.ts` | 42 | ok (UT-11: `Lang` import path) |
| `src/constants/ragamesidpool.ts` | 40 | UT-06 |
| `src/utils/consoleFilter.ts` | 37 | ok (UT-14 target) |
| `src/test-utils/psnFixtures.ts` | 36 | ok |
| `src/utils/vaultExamples.ts` | 32 | ok |
| `src/utils/guideLinks.ts` | 32 | ok |
| `src/utils/gameVisibility.ts` | 30 | ok |
| `src/utils/psnMappers.ts` | 29 | UT-09, UT-02 |
| `src/utils/steamLanguage.ts` | 29 | ok (UT-11: `Lang` import path) |
| `src/constants/index.ts` | 24 | UT-06, UT-12 |
| `src/utils/streakTier.ts` | 24 | ok |
| `src/utils/xboxAccess.ts` | 21 | ok |
| `src/utils/tooltipStyle.ts` | 21 | ok |
| `src/types/user.ts` | 17 | ok |
| `src/utils/sessionLook.ts` | 16 | ok |
| `src/utils/adminFetch.ts` | 16 | ok |
| `src/test-utils/libraryFixtures.ts` | 14 | ok |
| `src/utils/withSubject.ts` | 9 | ok |
| `src/utils/dbId.ts` | 7 | ok (UT-13 target) |

Tests: not audited, except `src/constants/ragamesidpool.test.ts` and the `CATEGORIES` test in `src/constants/index.test.ts` only test dead data (UT-06).
