# Worklog

What each working session did, so the next one (a person or an agent) starts
with the context instead of rediscovering it. **Newest first.** `git log` says
*what* changed; this says *why*, what was tried and dropped, and what is still
open.

## How to write an entry

Add it at the top, before your last commit (so it ships in the same PR).
Keep it short — a few lines per heading; leave out a heading with nothing in it.

```md
## YYYY-MM-DD — <short title> (`<branch>`)

**Did** — what changed, at the level of features or files, not every line.
**Why** — the problem or the user's request.
**Decisions** — choices made and the reason; what was rejected and why.
**Open** — what is left, known bugs, follow-ups, things to check on the preview.
**Watch out** — anything surprising the next person would trip on.
```

Merges never conflict on this file: `.gitattributes` gives it git's `union` driver,
which keeps both branches' entries. It can drop the `---` between two entries
or put them in either order; that is cosmetic, fix it if you see it.

Facts that must keep holding go in `CLAUDE.md` (a rule every task obeys) or the
area doc it links to, not here; an entry can say "added X to docs/social.md".

**Archive at each release:** once a release reaches `main`, move the entries older
than it to `archive/worklog-<from>-to-<to>.md` (the first cut is
`archive/worklog-2026-09-to-11.md`, everything before v1.7.0).

---

## 2026-11-08 — Shared helpers for dates, RA assets, platforms, types and sessions (`refactor/119-shared-helpers`, #119)

**Did** — One commit per helper (antislop audit X4 / plan S3; ids are the audit's, `docs/audits/antislop-v17/code/`):
- *Secrets (LB-07):* `src/lib/secrets.ts` — `appSecret()`, `hmacHex(payload, key?)`, `sameHex`, `sameText`,
  `cookieFromHeader(header, name)`, `cronRefusal(req)`. `secretBox`, `raKey`, `adminAuth` (its `readCookie` is gone),
  `emailVerification`, `steamLogin` and the three cron routes use them. Every derivation is unchanged:
  `secrets.test.ts` opens values sealed and checks hashes, links, tickets and unlock cookies **made with the code from
  before**, under a fixed `NEXTAUTH_SECRET`.
- *Sessions (AP-01):* `requireSession(unauthorized?)` returns `{ ok, id, user }` (the session's user, server side, with
  `raid`). Every hand-rolled check (the audit counted 39, in 25 route files) uses it, each with **its own 401 body as before** (`{ message: 'No
  autorizado' }` is the default; `{ error: 'Unauthorized' }`, `{ error: 'unauthorized' }` and `{ error: 'unauthorized',
  retryable: false }` are passed where a route answered them). `follows/overview`, `users/search`, `favorites` GET and
  `avatar/[file]` no longer read the session twice; `me/streak` passes the session's user instead of rebuilding it.
  `requireViewerApiKey` and `requireXboxUser` sit on it.
- *`useRetryingRead(url, { parse, keepFor?, attempts? })` (HK-01)* replaces the attempt/timer/`hasFetched` loop in
  `GamesDataContext`, `RecentAchievementsContext`, `RecentlyPlayedGamesContext`, `ActivityHeatmapYearContext` (RA part),
  `useUserRank`, `useUserAwards`, `useAllGamesGlobal`, `useGameProgression`, `usePinnedAchievements`, `useShowcase` and
  `MainPageAbandoned`. Only `useRetryingRead` calls `scheduleRetry` now.
- *Dates (UT-04):* `src/utils/dates.ts` adds `unlockIso`, `utcDay`, `localDay` and `formatDate(s, lang, options?)` next to
  `parseUnlockTime`. `formatDate` moved out of `utils.tsx` and its ten callers pass the reader's language.
- *`src/utils/raAssets.ts` (UT-01, D2-05):* `raImageUrl(path)`, `raBadgeUrl(name)`, `raAvatarUrl(user)` (moved from
  `lib/raProfile`, which reaches RA's client and so could not be imported by components).
- *Types (UT-03, UT-09):* `src/types/game.ts` — `GameSource`, `GameStatus`, `SavedGame`, `GameProgressBase`,
  `GameAchievement` (the core `InsightAchievement` and `CompareAchievement` now extend). `types/steam.ts` re-exports
  `GameSource` and `GameProgressBase` until their importers move.
- *Platforms (UT-02):* `isGameSource` reads `GAME_SOURCES`; `raGameId(g)` (UT-08) in `gameRef.ts`.
- *Hidden games in SQL (LB-01):* `notHidden(row, user?)` in `src/lib/gameVisibility.ts`.
- *One game's achievements on any platform (HK-05):* `src/utils/gameAchievements.ts` — `fetchGameAchievements(source,
  id, lang)`, `raAchievementList(game)`, `readJson(url)`; `useShowcaseGameChoices` and `useGameInsights` only map.
- *PSN grade labels (UT-07):* no helper: `T.psn` is already keyed by grade, so it is `T.psn[t.type]`.
- *Play-time units (D1-13):* `formatPlaytime(minutes, T.steam, lang)` — its units are `T.steam`'s own keys; all 27
  callers moved (the signature forced it).
- *Upstream fetch (LB-05):* `src/lib/upstreamFetch.ts` — `fetchUpstream(url, { platform, before?, wait429? })`;
  `fetchRA` (pacing, 429 wait) and `fetchSteam` are one line each.
**Why** — #119: each copy had drifted on its own (time zones, resets, error shapes), and the per-platform shells (#125)
need these first.
**Decisions** — API kept to what the real uses need. The 401 bodies were kept per route, as asked ("same responses"),
though no client reads them; unifying them is a one-line change per route later. `T.psn[grade]` instead of a
`trophyGradeLabel`. `raGameId` keeps the library lists' priority (`GameID`, then `ID`). The re-export in `types/steam.ts`
is temporary.
**Visible changes (drifts fixed, on purpose)** — *Dates:* `formatDate` was fixed to `en-GB`; it now uses the reader's
language, so an English reader sees "Sep 07, 2026" instead of "07 Sept 2026", and a Spanish one "07 sept 2026" (lists,
cards and trophy/achievement tooltips). *Loaders:* the copies disagreed, the hook keeps one behaviour: a new URL, account
(`keepFor`) or sign-out is a new read and drops the old data. So `useUserRank`, `useUserAwards` and the RA year now reset on
sign-out or another RA account (they never did); the RA library and want-to-play now empty when RA is unlinked (they kept
the old list); `useAllGamesGlobal` now asks for want-to-play when RA is linked after the page opened (it never did); a game's
progression shows nothing (skeleton) instead of the previous game while another one loads; `MainPageAbandoned` stops
waiting when the dates answer is malformed (it used to wait forever). `RecentAchievementsContext` is loading while the
session is read, as the other providers are (it said "not loading, nothing" for that moment). A final failure logs
`[useRetryingRead] <url>`; per-attempt logs of pins and the showcase are gone. *Upstream:* a Steam error now carries
`retryAfter` too (nothing reads it).
**Open — the list for the next agent (same branch; one commit per helper; `npx tsc --noEmit`, lint and `npx jest --ci`
after each).** Grep from `src/`, skip tests unless they import what moved.
1. **Dates** (`src/utils/dates.ts`).
   - `grep -rnE "toISOString\(\)\.(split\('T'\)\[0\]|slice\(0, 10\))"` (34 sites in 17 files) → `utcDay(d)`. *Trap:* a few
     build a **local** date and then take its UTC day (`groupByDays` in `utils.tsx`); `utcDay` keeps that exactly, do not
     switch one to `localDay` unless it is a bug you can show. Server day keys (`vaultMe`, `upstreamCount`, `streaks`) stay UTC.
   - Local `YYYY-MM-DD` built by hand in `StreakYearHeatmap.tsx:14` and `StreakPage.tsx:30` → `localDay`.
   - Move `relativeTime`, `formatDay`, `daysBetween` and `unlockSpan` from `utils.tsx` to `dates.ts` (update imports).
     Fold `formatUnlockDate` (`gameCompare.ts`), `formatUnlock` (`steamFeed.ts`) and `lastPlayedAgo` (`libraryShelves.ts`)
     into `formatDate` / `relativeTime` where they are the same thing.
   - `grep -rn "toLocaleDateString("` (51): where the input is a platform's date string, `formatDate(s, lang, options)`.
     *Trap:* a calendar day ("2026-06-05") is `formatDay` (read as local), not `formatDate`; keep each call's options.
   - *Do not touch* `raIso` in `vaultScoreInputs.ts`: it keeps an ISO string as it came and writes `…Z` without
     milliseconds; the score inputs carry it, so changing it may change stored unlock data. `unlockTime` in
     `activityInsights.ts` is already on `parseUnlockTime`.
2. **RA URLs** (`src/utils/raAssets.ts`).
   - `grep -rln "media.retroachievements.org/Badge/"` (12 files) → `raBadgeUrl(name)`; `grep -rln 'retroachievements.org${'`
     (23 files) → `raImageUrl(path)`; `UserPic` in `AchievementModal.tsx` and `GameInfoComments.tsx` → `raAvatarUrl(user)`;
     drop `raBadge` (`gameCompare.ts`), `raImage` (`useGameInsights.ts`, already gone) and similar.
   - *Traps:* the helpers return `undefined` for nothing; where the field is `string | null` write `raBadgeUrl(x) ?? null`.
     Links to RA **pages** (`https://retroachievements.org/game/…`, `/user/…`) are not pictures: leave them.
     `raAvatarUrl` encodes the name (a no-op for RA names).
3. **Platforms** (`src/utils/gameRef.ts`).
   - Lists: `FollowingCardPlatforms.tsx:8`, `FollowingToolbar.tsx:11`, `AddGameModal.tsx:25`, `LibraryPlatformTabs.tsx:28`,
     `MainPageFriendsCard.tsx:20`, `PublicUserAbout.tsx:51`, `PublicUserGames.tsx:39`, `UserSummary.tsx:18`,
     `VaultPlatformSplit.tsx:6`, `MainPlatformContext.tsx:12`, `library.ts:149` → `GAME_SOURCES`. *Trap:* where it is
     `as const` and the code needs the literal type, `GAME_SOURCES` is `readonly GameSource[]`, which is enough for a
     `.filter`/`.map`; check the result's type. `PLATFORM_STEPS` (`useWelcomeSteps.ts`) leaves Xbox out on purpose: keep it.
   - Names: `useVaultFill.ts:16`, `AdminRankings.tsx:9`, `NotFoundGame.tsx:11`, `user/[username]/opengraph-image.tsx:13`
     → `PLATFORM_NAME`. *Keep:* `aiExport.ts` ("PlayStation Network", for the prompt) and `AdminLinkedAccounts.tsx` ("PSN").
   - RA id: `[category]/(list)/page.tsx:145,154`, `sectionPreview.ts:37`, `useGamesByCategory.ts:73`, `libraryShelves.ts:23`
     → `raGameId(g)`. *Trap:* the want-to-play reads `g.ID ?? g.GameID!` (`library.ts:60`, `gameCandidates.ts:87`,
     `useAllGamesGlobal`) put `ID` first, the other way round; leave them unless you show both always agree.
4. **Types** (`src/types/game.ts`).
   - `grep -rlE "import type \{[^}]*\bGameSource\b[^}]*\} from '@/types/steam'"` (57 files) → import `GameSource` (and
     `GameProgressBase`) from `@/types/game`; then delete the re-export at the top of `types/steam.ts`.
   - Status aliases → `GameStatus`: `SteamCategory` (`steamFeed.ts`), `PsnCategory` (`psnTitles.ts`), `XboxCategory`
     (`xboxTitles.ts`), `LibraryCategory` (`LibraryGameDetail.tsx`), `ValidCategory` (`useGamesByCategory.ts`), the inline
     one in `MainPageConsoleNav.tsx:18`, `LibraryStatus` (`library.ts`). Delete each alias and update its importers.
   - `SavedGame` copies in `api/users/[username]/route.ts:10`, `lib/publicUser.ts:23`, `utils/friends.ts:14`, inline in
     `useCheevoUser.ts` → `import type { SavedGame } from '@/types/game'`.
   - `MainPlatform` (`MainPlatformContext.tsx`), `Platform` (`aiExport.ts`, `AdminLinkedAccounts.tsx`), inline unions in
     `api/favorites/route.ts` (`parseSource`) → `GameSource`.
   - Not done, and not mechanical (UT-09/UT-10, better in #125): merging the `fromRa…fromXbox` and `*CompareList` mappers.
     *Traps:* RA's date is `DateEarnedHardcore ?? DateEarned` in insights but `||` in compare (an empty string differs),
     compare sorts RA by `DisplayOrder` and insights do not.
5. **Hidden games in SQL** (`notHidden` in `src/lib/gameVisibility.ts`): `grep -rn "hidden_games h WHERE"`.
   `vaultMe.ts:53,65` and `scoreRefresh.ts:391,419` → `${notHidden('g')}`; `groupList.ts:28` →
   `${notHidden('game_group_items', 'g.user_id')}`, `:35` → `notHidden('n', 'g.user_id')`, `:40` → `notHidden('i', 'g.user_id')`;
   `api/groups/[id]/route.ts:48` → `notHidden('i', '$3')`; `api/follows/overview/route.ts:48` → `notHidden('sc', 'u.id')`.
   The text is identical, so the SQL-string tests keep passing. *Keep by hand:* the overview's four favourites (literal
   source, id from JSON), its `"hiddenGames"` list, and the `JOIN hidden_games` in `follows/playing`.
6. **One game's achievements** (`raAchievementList` in `src/utils/gameAchievements.ts`):
   `grep -rn "Object.values(.*Achievements ?? {})"` — `GameInfoHeader.tsx:57`, `GameInfoTable.tsx:56`, `SortableItem.tsx:70`,
   `PinnedGameRow.tsx:60`, `RaLibraryDetail.tsx:46`, `RARecentlyPlayed.tsx:165`, `useGroupPage.ts:134`, `aiExport.ts:82`,
   `gameCompare.ts:37` → `raAchievementList(game)` followed by the call site's own filter or sort.
7. **PSN grades:** `grep -rln "platinum: T.psn.platinum"` (7 files) → `T.psn[t.type]`. *Trap:* `PsnTrophyCounts` and
   `PsnTrophyGrid` keep a map they look up by grade; `T.psn[grade]` replaces the lookup, `TROPHY_GRADES` keeps the order.
8. **Sessions, left on purpose:** `groups/[id]` GET and `rankings` GET read an optional session (signed out is allowed);
   `perfectGamesOrder` GET and `showcase` GET read the **viewer's** admin flag after `dataOwner(req)` named someone else.
   `api/users/[username]/route.ts:20` calls `dataOwner()` with no request, which is `requireSession()` in disguise: move it.
9. Optional, judgement needed: `usePsnSummary`, `useXboxSummary`, `useSteamProfile`, `usePsnTrophies`,
   `useXboxAchievements` keep a `hasFetched` ref with no background retry; `useRetryingRead` could replace them only if
   retrying their platforms is wanted (Xbox has a 150-calls-an-hour budget: ask first).
**Watch out** — Never change a key derivation in `secretBox`, `raKey`, `adminAuth`, `emailVerification` or `steamLogin`:
`secrets.test.ts` fails, and so would every sealed key and link in production. `useRetryingRead`'s `parse` must be made
once (module level): a new function per render starts a new read every render. A route test that mocks `@/lib/apiAuth`
whole must give `requireSession` a `user`, or use `jest.requireActual` for it.

---

## 2026-11-08 — Probable bugs from the antislop audit, checked and fixed (`fix/118-audit-bugs`, #118)

**Did** — Each line of #118 was checked in the current code first; one commit per point (ids are the audit's, in
`docs/audits/antislop-v17/`). Fixed, with a test that fails without the fix where it is logic: E-06 `PlatformMark` draws
`PlatformLogo` (Xbox no longer gets PlayStation's mark); CP-02 `passwordReset.saveFailed` (and `registerForm.errorCreating`
reworded) in 9 languages; CP-01 the friends page copy (showcase not pinned achievements, followers are yours alone, the
public card) and `updated`; UT-04 `parseUnlockTime` (`src/utils/dates.ts`) is the one reader of the platforms' zone-less
unlock dates, which are UTC, and every `.replace(' ', 'T')` that read them as local now goes through it (`getBestWeek` also
counts weeks in UTC now, as the key it builds already was); AP-17 `steam/activity` and `steam/unlockYear` pass through
`visibleGamesForUser`; D1-10 Steam's rarest-earned links use `gameHref(..., subject)`; AP-02 admin unlink clears
the user cache for all four platforms; C-13 welcome phone bar is `flex` with a `flex-1` segment per step; D2-06 one
`raTypeTag` in `ui/dataTable.ts` for the four RA type tags (`win_condition` reads "Win" everywhere); D2-10 the status
skeleton reads `STATUS_GRID_COLS` (moved to `status-grid-control/statusGridCols.ts`); UT-10 `perfectDates` takes a PSN
date only for a completed game; E-15 `AuthPage` mounts the forms in the layout in use only (`useMediaQuery`; until the
browser can say, both hold it, as the server printed them); AP-06 the design tokens moved from `:root, [data-theme]` to
`:root`; V1-12 "/" opens search empty; V4-02 the `Switch` knob is `bg-bg-main` when on; V4-01 `ProfileField` names a
children-only value through its text; V3-08/V5-18/V4-03 `VaultLevelBadge compact="phone"` (one badge, tier dropped below
`sm`; podium and the account's level row); V5-16 `REGISTER_HREF` (`utils/authLinks.ts`) on every create-account link;
V2-09 `useGameInfo` exposes `missing` (RA 404) → `notFound()`, a real failure shows a sentence (`gameInfoPage.loadError`)
and `Button`, and `raUnavailable` answers RA's 404/422 with a 404 so it is not retried; V7 `ThemeContext` writes the theme
only once the account's or a pick is known (or the session is authenticated); V3-15 the public rankings guide names no Xbox
(intro text in 9 languages; the example row only for who `useXboxEnabled`); B-05 `platformStat` (loading figure, `—` only for
an absent value) on the four platform cards and the Xbox profile's play time; HK-09 pins, the perfect-games order and the home's
groups show `SectionFallback` (error + retry) instead of an empty list, `saveOrder` rolls back, reads log; AP-10 hashes and
subsets answer `raUnavailable`, achievement detail no longer swallows a half and so never caches a pair with a hole,
`getGamesLastPlayed` logs; B-02 the add-game modal says when the id lookup fails.
**Why** — #118: ~30 probable bugs found while reading the code and the screenshots, none fixed.
**Decisions** — RA's dates are UTC (every other reader already appended `Z`; `activityInsights` says "every platform
alike"), so the local readers were the bugs. Type-to-search stays (owner, 2026-11-07); only "/" is special. Steam's rarest
stays on the viewed profile like PSN and Xbox, the three components are not merged (#125). A page does not shrink: the pins
and groups error states keep their section. The Xbox mark and Venom switch fixes keep every colour. E-15's SSR is unchanged
(both layouts still render on the server).
**Did, second part (`fix/118-audit-bugs-2`, another agent, reasoned from code and tests; no OpenXBL call, no database)** —
*Level ring at 99 %:* `fillProgress` leaves Xbox out of the ring's count, but `fillComplete` waited for Xbox to leave
`reading`, which a refused Xbox read (OpenXBL's hourly quota, `busy`) never did; every other platform read, the ring sat at its
99 cap until the page's 30 passes ran out, and again on every load. `refreshSource` now settles Xbox as `estimated` (with the
busy reason) whenever its read stops, list included. *Xbox "game not found" (V2):* not a dead id (1480659447 is Minecraft:
Xbox 360 Edition, the twin `foldTwinTitles` keeps) nor the quota: the page called `notFound()` while `useXboxEnabled` was still
false because the session had not been read, so **every full load of `/xboxGame/<id>` was the not-found screen, admins
included** (a client navigation worked). It now holds the skeleton while the session loads (PSN and Steam game pages too, which
flashed "not connected"), and a failed library read shows `T.xbox.gamesError` + the error's own line + retry instead of a 404.
*LB-02:* `totalPoints` is `vaultTotals([id], canUseXbox(admin))`, the header's total; no formula number changed, no
`RULES_VERSION` bump.
**Open** — `vaultMe`'s daily and provisional queries still skip `LINKED_ACCOUNT` (LB-02's second half; rows
of an unlinked account are deleted by the next pass anyway). PSN's game page still 404s when its library read fails (Xbox's
fix not copied). A page whose fill stops (failed POST, 30 passes) keeps its last ring until the next load. Check on the
preview: a full load of an Xbox game page as an admin, and the header ring with Xbox linked. Not done, the owner has not decided: V1-01 ("Ratio
hardcore 285 %": RetroRatio or the hardcore share; the avatar ring reads it too). Not done, the owner declined: V5-09 (cookie
notice on phones stays, 2026-11-07). Unverified without an RA key: what RA answers for a game that does not exist (V2-09 handles
a thrown 404/422 and an object without `ID`). The vault guide still says "gamerscore" as one of the native values
(not a platform name); V4-23's state words beside the four switches are not added. `getGamesLastPlayed` still answers
`null` per failed game (only logged now).
**Watch out** — The shape tokens must stay out of `[data-theme]` blocks (a test fails otherwise). `raUnavailable` now
answers 404 for RA's 404/422: a client that retried that on a 503 no longer will. `withCache`'s validator throws on a
failed pair in `getAchievementDetail`, so one failing half is a 503 for the modal. `migrations/045_steam_playtime.sql`
is in pre since 2026-11-07, not in production (`docs/releases.md`).

---

## 2026-11-07 — Steam last-played for everyone, not only the key's owner (`fix/113-steam-last-played`, #113)

**Did** — One "last played" for Steam, `lastPlayedOf` (`src/utils/steamMappers.ts`): Steam's `rtime_last_played` when it
comes (only the API key's owner), else the newest of the game's last kept unlock (`steam_unlocks`), the last rise in its
hours (new `steam_playtime`, `migrations/045_steam_playtime.sql`) and `playtime_2weeks > 0` / the game in
`GetRecentlyPlayedGames`. `withLastPlayed` (`src/lib/steamProgress.ts`) adds `last_played_at` inside `loadOwnedGames` and
the score refresh's owned read, and records the hours. Readers moved onto it: `lastPlayedGames`, `toSteamGameProgress` (so
the library, recently played, the friend banner and every `lastPlayed` sort), `loadActivityAchievements` (activity, the
year, the streak, the Following and home Friends data), `/api/steam/recentlyPlayed` (the recent list now counts every game
in it, not only the ones the owned list lacks). `progressCacheKey` is keyed by minutes (`steamProgress3:`), `progressTtl` is
one hour for games with minutes in the last two weeks. `scoreRefresh`'s Steam `changeKey` is
`playtime_forever:rtime_last_played`. Unlinking deletes the kept hours too; `/privacy` says so in all nine languages.
Cache keys bumped: `steamOwnedRaw:v2:`, `steamOwned3:`, `steamRecent:v3:` (and `scripts/demo-rankings.mjs` seeds the new
ones). Tests with an account Steam does not date in every touched file.
**Why** — Steam's `GetOwnedGames` sends `rtime_last_played` only for the key's owner (measured 2026-11-03), so for everyone
else recently played, recent achievements, the counters, the streak and the friends' cards were empty, and their Steam games
were scored once and never read again (`changeKey` `''` on both sides).
**Decisions** — Dates per signal: a kept unlock is exact; a rise in hours is dated at the read that saw it when Steam counts
minutes in the last two weeks, else two weeks before that read (it cannot be later); a first sight is undated; two-week
minutes alone are `now − 14 days`, the start of the window, so a date is never later than the truth (a game played
yesterday may read "two weeks ago" until a rise or an unlock dates it). None of them reaches the streak, heatmap or counters
as a day: those count unlocks with their own dates; a date only picks which games are read. The derived date is not in the
score `changeKey`: its two-week part moves every read, its unlock part is written by the refresh's own read, and a rise in
hours already moves the minutes. The new key differs from every stored one, so each Steam game is read once more on the next
refresh (what a `RULES_VERSION` bump does). The score refresh also records hours, so the daily cron dates the games of
someone who stays away to about a day. `TWO_WEEKS_S` lives in the mappers and is reused.
**Also checked (PSN, RA, read from code and docs, no calls):** neither depends on whose credential reads. PSN reads every
profile as the app's one account anyway: `getUserTitles` gives `lastUpdatedDateTime` per trophy set and
`getUserPlayedGames` `lastPlayedDateTime`, both governed by the target's own privacy settings (`psnClient.ts`, 331/390); the
owner's measurement on #113 (39/39, 50/50, 2/2 on other accounts) agrees. RA keys are not scoped to their owner (a valid key
reads any public user, `docs/accounts.md` → RA sign-up), and the score's change key is `MostRecentAwardedDate`, not a
last-played field. Xbox, measured on #113, is fine too. Steam is the only one.
**Open** — **Apply `migrations/045_steam_playtime.sql`** to pre, then production when it reaches `main` (owner). Until then
every owned-list read logs the missing table and games with no achievements played more than two weeks ago stay undated;
nothing fails. Check on the preview with an ordinary account (not the key's owner): recently played, the counters, the
streak, a Steam-only friend's card. No `friends.ts` test was added: it reads `lastPlayed`, which is now filled upstream.
**Watch out** — Never read `rtime_last_played` directly: go through `lastPlayedOf`. The first owned read after the
migration only records hours (no dates); dates from hours start with the next rise.

---

## 2026-11-07 — CLAUDE.md slimmed to its rules, the old worklog archived (`docs/124-slim-claude-md`, #124)

**Did** — `CLAUDE.md` from 1,495 lines / 111 KB to about 565 / 38 KB: the rules every task obeys, one line each, with
an area table on top. What left it went, whole and with its reasons, to new docs: `accounts.md` (registration, RA and
Steam sign-up, sessions, email, admin), `platforms/` (`ra`, `steam`, `psn`, `xbox`, and the failure table in its
`README.md`), `performance.md` (performance rules + data loading), `social.md` (presence, Vault Points and rankings,
follows, showcase), `library.md` (synced preferences, consoles, hidden games, completion dates), `welcome.md`,
`i18n.md`, `releases.md` (milestones, release gates, environments, a migrations table) and `roadmap.md`; the design
details were appended to `design-system.md` → The rules in full. Worklog entries older than v1.7.0 (132) moved to
`archive/worklog-2026-09-to-11.md`. Finished plans moved to `archive/` (`welcome-plan`, `welcome-look-plan`,
`xbox-integration-plan`, `ui-polish-roadmap`, `ui-polish-v2-plan`) with a dated note; links to them updated.
`docs/README.md` rewritten (every doc listed); README's "two daily crons" is "daily crons" (there are three).
**Why** — Antislop audit #77 (MS-01, MS-02, MS-04, MS-06, plan S9): every session read ~28k tokens of rules mixed with
history, and the file contradicted itself.
**Decisions** — The contradictions, each checked against the code: Xbox's score pace is 2 games a pass
(`PACE.xbox.perPass`, #87), not 5; streaks are coloured by tier everywhere (the hero uses `streakTier` too), the
"accent, amber only in the hero" line is gone; `showcaseFromUnlock` was already deleted by #117; the "Spanish UI text"
line was already replaced by "every text through `T`"; new strings go in every file under `src/translations/`, not
`en.ts` + `es.ts`; pure transforms go in a topic file under `src/utils/`, not `utils.tsx`; hooks load on first reader,
`hasFetched` is legacy; toggles are `Switch` / `ToggleButton`, never a hand-made `role="switch"`; 1.5.0/1.6.0 are
history in `releases.md`, not "current on develop"; the component library is built (roadmap and plan updated); Xbox's
call cost is one figure (~4 calls a new user: gamertag search, library, play time, first game's achievements); one
Next.js block at the end, the generator's own text (`##` heading). Kept verbatim: the owner's rules (Git, the antislop
section, toasts, state and effects, testing, documentation). Above the ~370-line proposal because Git and the antislop
section stayed whole; the size that matters (tokens) is about a third.
**Open** — The owner reviews the new `CLAUDE.md` before merging (the issue says so). `migrations/README.md` (MS-11)
not made: the table is in `releases.md`, with `—` where no date was written down.
**Watch out** — A rule that changes now goes in its area doc, and in `CLAUDE.md` only when every task must obey it.
Archive the worklog again at the next release.

---

## 2026-11-07 — Dead code out (`refactor/117-dead-code`, #117)

**Did** — Deleted what nothing reads, each checked by grep first (antislop audit #77, plan S1): the old home cards
(`MainPageMastery`, `MainPagePerfectGames`, `MainPageGamesList` and their pieces), `GamesPlayedPieChart`, `MainStart`,
`ragamesidpool.ts`, `CATEGORIES`, `getGamesInfo`, `getWantGames`, `groupByDay`, `groupByConsole`, `calcStreak`, the
`calcAllStreaks` re-export, `showcaseFromUnlock`, `withAchievementCounts`, `GET /api/follows`, `modalOverlay`/`modalContent`,
`isLimited`, `FadeImage.placeholderClassName`, `IconButton`'s `accent` tone, the home's unreachable "not linked" profile
branches (and their three `rounded-3xl` guard exceptions), 39 light-theme rules for palette classes nobody uses,
`--accent-muted` (equal to `--accent` in every theme), `commit_all.tmp.sh`,
`tailwind.config.ts`, `tasks/`, `public/media/3DSa.png`; un-exported four `lib` functions used only in their file.
Then 121 translation keys no component reads, in all nine languages (~1,160 lines). About 3,200 lines in all.
**Decisions** — Kept what the audit marked as plausible or owned by a later issue: `GAME_SOURCES` (#119 uses it),
`Tabs.size` (#120 may need the small tabs), `Notice.title/action`, `StreakTag lg`, `rarityTone` (its test), the shape-token
move of AP-07 (a visible change, with #118), the DARK block (it restates the base, but
`themeGroups.test.ts` checks every theme is named in `globals.css`). No test for unread keys: dynamic access (`T.libraryLayout.shelves[id].hint`)
fools a grep, so it would fail on keys that are read. The keys were found by a script and then checked by eye.
**Watch out** — `Key` on unlocks is now set by the mappers and read by nothing (only `showcaseFromUnlock` read it); left
in place, as dropping it changes cached shapes. CLAUDE.md lost its line about it.

---

## 2026-11-07 — CI on every pull request (`ci/116-pr-checks`)

**Did** — `.github/workflows/ci.yml`: one job, `checks`, on PRs into `develop` and `main`: `npm ci`, `tsc --noEmit`,
`npm run lint`, `jest --ci`, `npm run build`, Node 24, npm cache, older runs of the same PR cancelled. CLAUDE.md → Git says so.
**Why** — #116, plan S0 of the antislop audit (#77): the guard tests only held when someone ran them by hand.
**Decisions** — No env vars or secrets: a clean checkout of `develop` with no `.env.local` passed all four on 2026-11-07
(855 suites, 5,569 tests; the build with every route). One job, not four, so `npm ci` runs once. Node 24 as Vercel's default
(`.tool-versions` is ivm's `ivm-node`, which `setup-node` does not read).
**Open** — After the first green run, add `checks` as required to the `develop` and `main` rulesets (GitHub settings, the owner).
**Watch out** — Testing the build from a git worktree with `node_modules` as a junction fails: Turbopack refuses files
outside the project root. Give a worktree its own `npm ci`.

---

## 2026-11-07 — Antislop canvas v2: page 1, identity from zero (`chore/77-antislop-pass`, #126)

**Did** — New design canvas (https://claude.ai/artifact/SZB3BhCYKkXabJMA75fz8D), as `docs/audits/antislop-canvas-v2-brief.md`
asks. Page 1 only: the owner's real crops, Hoy redrawn from today's tokens, and three identity directions (A El escudo,
B El título, C La vitrina) on the same pieces, each switchable slanted/round and Dark/Venom. Row in `docs/designs.md`.
**Why** — The owner wants identity, per-screen improvements, themes and the landing proposed again, one page at a time.
**Decisions** — Asked first (2026-11-07): both designs stay; the app takes only the logo and its colour from the MGS2
landing; three directions; the problem is "generic / AI-made" and "not recognisable", not the slant. So every direction
shared an antislop base and differed in where the signature came from (logo shape, type, game art). Rejected, see Round 2.
**Round 2** — The owner rejected the three directions: identity here means how the slant the site already has is
applied (one angle, only big gestures and the player's own marks, never data, the "/" as signature, a dot in round), not new
brand devices. They chose the old canvas's B (B v2); its `Piezas`, `SheetHoy` and `SheetB2` were brought over unchanged but
for the image ids, and A/B/C removed.
**Round 3** — B v2 confirmed after the owner asked why only some pieces slant. Page 2 started with the Home: the
old `MejHome` points re-checked against `visual/V1.md`, 14 now (month names in the browser's locale added), the ones B
already brings marked "ya lo trae B"; V1-03's cuts left out, as the owner rejected cuts.
**Round 4** — Home points approved but 10 (type-to-search is intended; only "/" typed into the box is the bug) and 14
(drawn as `Mej14`). The owner asked to cover the cover layout and the per-platform profile tabs too: `MejPortada` (12) and
`MejPlataformas` (8). Portada's point 3 (hero says AC II, the list starts with Fallout 4) must be checked in code first.
**Round 5** — Home review closed: what not to touch is in the report's §3.7 (one surface level declined, the heatmap's
entrance stays, the cover's hero by design, platform colours stay); the "99 %" ring is the level loader getting stuck.
**Round 6** — Page 2 finished: every remaining screen in one go at the owner's request (game page, /allGames, groups,
rankings, streak, dialogs). Points the owner already declined elsewhere were not proposed again (colours per platform,
boxes, shrinking, cuts). Library views came from the owner's own production captures (browser bar cropped off).
**Round 7** — Pages 3 (themes: base + accent, named eight kept, no removals) and 4 (landing: chosen screen, Fondo/Franja
page, "Qué es" redone, phone) drawn; /allGames rework proposed as the library with a "Todos" status; streak calendar widened.
**Round 8** — Landing approved with "Fondo". Last screens drawn while the owner was away: sign-in and sign-up (+ reset,
signed-out 404), the public pages and the phone. Welcome left alone; app 404 kept.
**Round 9** — Last three boards reviewed. Sign-in: all agreed, 4 (bigger covers at 2560) to try and revert if disliked.
Public pages: the owner asked whether the signed-out profile card is needed; kept (it is what a shared link and its
preview show), all nine points agreed. Phone: all agreed but 11 (cookie notice stays); 7 left to the agent: the profile
folded to one line ("Ver perfil" opens it), not moved below the games. The owner leaves phone details to the agent's
judgement. The cursor spotlight (`.spotlight`, `useSpotlight`, 26 files): the owner asked; dropped (owner,
2026-11-07; as the audit's V5/V7 said): the finished bar keeps the only glow, the links inside a card keep their own hover. The canvas is complete.
**Issues** — Opened from the canvas, 2026-11-07: #127–#136 (list and order in the report's §3.6); comments on #118
(cookie sheet stays), #120 (spotlight goes) and #126 (the result).
**Next** — #116 CI, then the plan's order (#117, #113 + #118, #119, #120, #121/#123/#122, #125, #127–#135, #115, #136).
**Open** — Captures: the Playwright MCP profile was locked by another process this session; a fresh `playwright-cli`
profile is signed out.
**Watch out** — Captures of the account page or anything over it show the owner's email (sharp, or readable behind a
dialog's blur): cover it in the image before uploading (System.Drawing in PowerShell works here; Python has no PIL).
**Open (old)** — Pages 2 (improvements per screen, from `MejHome.dc.html`), 3 (themes from
zero) and 4 (landing: screen 1 v2 kept, a second variant with Landing v2's band, and the "qué es" sections redone).
**Watch out** — The canvas sources live in the scratchpad of that session; read them back from the artifact (`read`
with `path`) before editing in a new one.

---

## 2026-11-06 — Antislop: the owner's answers, v2 of the canvas, lessons in CLAUDE.md (`chore/77-antislop-pass`)

**Did** — CLAUDE.md gained "The antislop audit (#77)": where the report is, the issue order, the owner's
decisions and the mistakes not to repeat. The report's §3.6 places #113–#115 in the plan and §3.7 records the
answers. Canvas v2 (B v2, Temas v2, Landing v2 desktop and phone); `docs/designs.md` updated.
**Why** — the owner wants every later agent to know the audit and not repeat its mistakes.
**Decisions** — identity B, with the slant on the player's own marks; the page-by-page cuts rejected (they took
the personality away); purple stays; the landing is concept 2 made functional. #114 goes inside #115's sweep;
#115 after the shells and the per-screen work; #113 with the bugs.
**Open** — the owner's verdict on v2: dark/light accents (white/black or violet), B v2, the landing. The cuts
are under debate: none is built without a yes, one by one.

---
## 2026-11-06 — Antislop audit: code, visuals, identity (`chore/77-antislop-pass`, #77)

**Did** — The deepest audit so far, report only: `docs/audits/antislop-v17.md` (synthesis: cross-cutting code
patterns, probable bugs, owner questions, visuals screen by screen, why slanted feels off, round, three identity
directions, cut proposals, the plan) with 20 auditor reports as appendices in `docs/audits/antislop-v17/` (each with a
per-file coverage table). Every file in `src/` read, 853 test files, everything outside `src/`; 391 screenshots
(git-ignored under `.audit/`). Issue #77 updated with the owner's wider scope and a coverage manifest. `.audit/`
added to `.gitignore`. Nothing in the app changed.
**Why** — The owner felt a loss of control over a largely AI-built site and wanted code a human can maintain, an
identity of its own, simplicity, and a deeper component library.
**Decisions** — antislop in "after" (audit) mode. Every screen in one theme plus a theme sample (owner); then the
per-theme visual review was cut as not worth its cost (owner, 2026-11-06), so themes are judged from tokens.
Mechanical auditing moved from Opus to Sonnet after the first rounds burned the five-hour limit (owner).
**Open** — The owner's decisions (report 3.1), then a design canvas for the identity directions A/B/C and the MGS2-
style landing, then issues for S0–S9, the per-platform shells and the screens. Nothing is fixed yet, the ~30 probable
bugs included.
**Watch out** — Signed-in screenshots take the **account's** synced shape, home layout and theme, not what a script
puts in `localStorage`: the first round shots were all slanted Venom. Re-take by intercepting `/api/preferences` and
`/api/me/bootstrap` in Playwright (and block their writes), as `.audit/shots/app2/` was. Signed out, `ThemeContext`
overwrites the stored theme with dark. Agents left on the default model inherit Opus: pass `model` for mechanical work.

---
## 2026-11-02 — Second pass: caches and moving inside the app (`perf/101-bff-by-domains`, #101)

**Did** — Measured client navigation (the first pass measured full loads only): coming back to the home asked
12 reads again. `cachedJson(..., { sameForEveryone })` for game-only answers; the home's RA and PSN 60 days
from the year (`getActivityHeatmap` and its hook removed); `raArtStore` (RA pictures in localStorage, `/privacy`
in nine languages); `lastAnswers` (paint the last answer on return, read again) in rank, awards, last game,
groups, a group, perfect order, pins and Following; `dueInThisTab` for the RA profile refresh and the arrival beat.
**Why** — The user asked for a deeper second analysis of caching and repeated reads.
**Decisions** — The user wants platforms as fresh as possible (see a game change at once, and faster later):
no client TTL on platform data, only paint-then-read; Steam keeps its own 60 days (its year is 30 min). Own data
got the same (not a TTL) because its writers are spread over many hooks: a forgotten invalidation would show
old data after an edit. `fill` left alone: its POST is the work, a GET would not save a request.
**Open** — A faster platform refresh as its own issue (the user's wish; costs each platform's budget); its text is
ready but `gh issue create` was refused by the permission check, so the user opens it. Done later the same day:
browse (want to play), Steam's feeds and every game page's pins paint their last answer (keyed by platform account
too: Steam's unlink test caught a link painting the old account); RA unlocks drop four unread fields (year 755 → 577 KB).
Left: `getGamesLastPlayed` in the home's abandoned card (its ids come from data loaded first, so painting gains
nothing); PSN's year repeats each game's icon URL per trophy (101 of 166 KB): a per-game table would cut it, but
changes the shape.
**Watch out** — `Vary: Cookie` stays on anything per user or refreshed by cookie; next-auth rewrites the session
cookie on every read, so only `sameForEveryone` answers really reach the browser cache.

---
## 2026-11-02 — Pages load only what they show: the BFF by domains (`perf/101-bff-by-domains`, #101)

**Did** — `useAuthSession` (next-auth's `update()` flipped `status` and re-ran every "signed in" effect: the
second wave on every page); `RaUserRefresher` only updates when RA's profile moved. The header's streak from
`GET /api/me/streak` (`lib/meStreak.ts`, the RA and Steam years moved to `lib/raYear`, `lib/steamUnlockYear`).
Every global data provider loads on its first reader (`request()`, `{ passive: true }`). `GET /api/me/bootstrap`
(preferences, hidden games, Vault Points; `lib/meBootstrap`, `lib/vaultMe`, `lib/bootstrapParts`). The home mounts
pins, groups and browse when idle (`useWhenIdle`). `GET /api/follows/cards` (`lib/friendCards.ts`) for both
Following lists. `scripts/measure-api-calls.js`. Rules in `CLAUDE.md` → Data loading; results in the v1.7 audit.
**Why** — #86 measured ~25 shared calls and ~1.3 MB on routes that show little (Rankings, Groups), 55 on Following.
Measured after (same environment, warm): Rankings 26 → 7 calls, 1,258 → 14 KB; Following 55 → 10; game pages
25–33 → 6–12; home 42 → 35 (its bytes stay: it draws the year and the libraries).
**Decisions** — The user asked for everything in one PR, commits per step. No `overview` per platform: the
home's profile column and overview panel compute from the whole library, so it would add requests (told the
user). `follows/cards` calls the profile routes' own handlers in-process instead of copying `dataOwner`, keys,
private checks and caches: parity by construction. The streak takes the browser's unticked consoles as
`?hidden=` (the account copy lags 800 ms). Bootstrap is DB-only so no platform can hold up start-up data.
Home sections are prefetched when idle, not on open (the user's choice: tabs stay instant).
**Open** — Injected failures/429s, a cold server cache, RA-only and single-platform accounts (the audit's
"Still to measure"). The public profile route was not measured. A daily-count DTO for the home's heatmap and
charts would be the next cut in bytes. Watch `follows/cards` duration on Vercel (ten people in one call).
**Watch out** — A new provider in `MainProviders` must load on first read, never at mount; read `status` through
`useAuthSession`. Measuring on two ports: each has its own browser cache, which moved `getGameData` between runs.

---
## 2026-11-02 — Release v1.7.0 to production (`chore/merge-main-into-develop-3`)

**Did** — Applied `migrations/043_ra_key_sealed.sql` and `044_admin_totp.sql` to production (checked first:
neither was there; checked after: `users.raid_hash`, its unique index and `admin_totp` exist). Merged `main` into
`develop` (no file changes, it only records the link) and bumped to 1.7.0 for the `develop` → `main` PR (62 commits,
#46–#109).
**Why** — The user asked to ship what `develop` holds. Without 043/044 in production, linking RA and the admin
unlock would answer 500 the moment the code is live.
**Decisions** — Minor bump: new pages, the component library and the two designs. No new environment variable
(compared the `process.env` reads of both branches); Next went from 16.3 to 16.4.
**Open** — After the merge to `main`: check `www.cheevovault.com`, and the admin panel's first unlock enrols a
second factor (the admin needs an authenticator app). Vercel WAF rules (audit v1.7) are the user's.
**Watch out** — Merge this PR with **"Create a merge commit"**, never squash: a squash drops the link to `main`.

---

Older entries (2026-09 to the v1.7.0 release): `archive/worklog-2026-09-to-11.md`.
