# LB — `src/lib/` (server code, platform clients, caches, auth) + `src/proxy.ts`
Auditor notes: The area is in better shape than its size suggests. Most long comments record measured facts, traps or security reasons, and should stay. The problems are copies that drifted apart: the same SQL predicate in 17 places, a concurrency pool written four times, two retry loops, three HMAC/secret helpers, two cookie parsers, five readings of `NEXTAUTH_URL`, and per-platform twins (PSN/Xbox language map, completion dates). A handful of doc comments are misplaced or stale (some describe the wrong function). The four platforms' failure mappers and cache wrappers differ mostly **on purpose**; the shared parts are small (see LB-04 and LB-11).

**Answers to the four questions**
1. **What the platforms really share.** The same: the retry loop in `fetchRA`/`fetchSteam` (LB-05); the 429-plus-`Retry-After` response in all four failure mappers (LB-17); the "map per game, drop failures, throw if all failed" feed shape in PSN/Xbox `earnedSince`; the language map (LB-09); the completion-date enrichment (LB-08); the app-budget reservation, PSN through `reserveAttempt`, Xbox through a hand-made copy of it (LB-06). Different on purpose (keep them): RA's cache has a memory first level and a *throwing* validity check, while `withSteamCache` is DB-only with stale-if-error. RA turns 401 into `ra-key-invalid`. Xbox reads errors out of a 200 body, has a 5 s timeout and stops its feed on a 429 (#87). PSN retries once on Sony's message text and cools down. `scoreRefresh` keeps its own Steam owned-list cache (CLAUDE.md says so).
2. **Biggest files.** `psnClient` (746), `scoreRefresh` (676) and `xboxClient` (529) can be split by responsibility without changing behaviour (LB-12, LB-13, LB-14). Real cuts are modest, about 10–15 %. The rest is reorganisation.
3. **Comments.** Mostly good. Fix the misplaced, swapped and stale ones (LB-03, LB-15). Keep every "measured 2026-…" note.
4. **Dead exports.** `modalOverlay`, `modalContent` and `isLimited` have no caller. About 10 more are exported but only used inside their file (LB-10).

## Findings

### LB-01 · HIGH · duplication
- **Where:** `NOT EXISTS (SELECT 1 FROM hidden_games h WHERE h.user_id = … AND h.source = … AND h.game_id = …)` appears 17 times: `src/lib/rankings.ts:66,242,308,347`, `src/lib/vaultMe.ts:53,65`, `src/lib/groupList.ts:28,35,40`, `src/lib/scoreRefresh.ts:387,413`, `src/app/api/follows/overview/route.ts` (5), `src/app/api/groups/[id]/route.ts` (1). The "game that counts" predicate `g.flag IS DISTINCT FROM 'suspect' AND ${LINKED_ACCOUNT} AND <not hidden>` is repeated in `rankings.ts:65-66, 241-242, 307-308, 346-347`, and partly in `vaultMe.ts:64-65` (no `LINKED_ACCOUNT`) and `scoreRefresh.ts:412-413`.
- **What:** This is the rule CLAUDE.md sets for hidden games ("every ranking/streak/total read excludes them"). It is spelled out by hand in each query, and the copies already differ (see LB-02). One more query that forgets it leaks hidden games into a total.
- **Fix:** Put it in one place, as `presenceColumns()` does: `notHidden(alias = 'g', table = 'g')` and `const COUNTED = (g='g', u='u') => …` in a small `src/lib/scoreSql.ts` (or exported from `rankings.ts` next to `LINKED_ACCOUNT`). Every query interpolates it.
- **Size:** about 17 multi-line fragments → 17 one-word interpolations.

### LB-02 · HIGH · rule (a bug waiting to happen; confirm with the owner)
- **Where:** `src/lib/scoreRefresh.ts:527-533` (`totalPoints`), used as `FillStatus.points` → `src/hooks/useVaultFill.ts:62` (`levelOf(answer.points)` in the "your points are ready" toast). Also `src/lib/vaultMe.ts:51-53,60-70`.
- **What:** `totalPoints` sums `score_games` without the hidden-games filter and without `LINKED_ACCOUNT`. The level in the "ready" toast can therefore differ from the level the header shows from `vaultMe`/`loadRanking`, which excludes both. `vaultMe`'s daily and provisional queries also skip `LINKED_ACCOUNT`, unlike `rankings.ts`. This contradicts CLAUDE.md → Hidden games.
- **Fix:** Use the shared `COUNTED` predicate from LB-01 in `totalPoints` and in `vaultMe`'s queries. This changes a displayed number, so the owner should confirm it first.

### LB-03 · HIGH · comments (misplaced or swapped docs that lie)
- **Where:** `src/lib/steamClient.ts:96-111`, `src/lib/steamAssets.ts:37-40`, `src/lib/rankings.ts:265-270`, `src/lib/igdbClient.ts:28`.
- **What:**
  - `getAppInfo`'s JSDoc ("Official per-game artwork on Steam's CDN… cover 600×900, header…, hero…, logo") describes `steamAssetUrl`. `getAppInfo` actually fetches steamcmd.net PICS info.
  - The orphan block "The desktop-shortcut icon: a square .ico, up to 256px…" (`steamClient.ts:108-111`) is attached to nothing.
  - `clientIconUrl`'s doc ("PICS app info through steamcmd.net…") belongs on `getAppInfo`.
  - In `rankings.ts:265`, "Where each listed user stood at the start of this week" sits stacked above `orderingStreaks`'s doc; it belongs to `weekStartRanks` (line 278), which has none.
  - In `igdbClient.ts:28`, "IGDB's platform ids." labels nothing.
- **Fix:** Move each doc to its function: the artwork list to `steamAssetUrl`, the PICS note to `getAppInfo`, the `.ico` note to `clientIconUrl`, and the snapshot line to `weekStartRanks`. Delete the orphan in `igdbClient`.

### LB-04 · MED · naming
- **Where:** `src/lib/steamCache.ts` (`withSteamCache`, `readCache`, `writeCache`, `TTL`, `SteamCacheEvent`), used by PSN, Xbox, IGDB, rankings, scoreRefresh, upstreamCount and raCache's second level.
- **What:** This is the app's one shared database cache, but the module and the wrapper are named after Steam. A reader of `psnClient` sees `withSteamCache('psn:…')`. `steamCache.sweepExpired` and `raCache.sweepExpired` share a name and do different things. Its header comment is also stale: "raCache keeps RA data in process memory… This one lives in Postgres", although raCache now uses Postgres as its second level, and "100-200 calls per 5 minutes" contradicts CLAUDE.md's "100,000 a day".
- **Fix:** Rename the module and the wrapper (`dbCache.ts`, `withDbCache`, `SharedCacheEvent`); the table stays `steam_cache`. Rewrite the header in two lines: Postgres, shared across instances, keys namespaced. Make the same correction in `fetchSteam.ts:15-16`. A mechanical rename across about 25 imports.

### LB-05 · MED · duplication
- **Where:** `src/lib/fetchSteam.ts:18-43`, `src/lib/fetchRA.ts:47-81`.
- **What:** The same loop in both: 8 s AbortController, 2 attempts, 500 ms × attempt backoff, `countUpstream`, throw `{status}` on non-OK, no retry on 4xx. RA adds only `paced()` and the 429/`Retry-After` wait.
- **Fix:** One `fetchJsonWithRetry(url, { platform, before?: () => Promise<void>, retry429?: boolean })` in `fetchRA.ts` (or a new `upstreamFetch.ts`). `fetchSteam` becomes a one-line call. Keep RA's pacing and 429 logic as options. `fetchWithRetry` (client, 20 s, in-flight sharing) stays separate.
- **Size:** 48 + 81 → about 75 lines.

### LB-06 · MED · duplication / dead
- **Where:** `src/lib/attemptLimit.ts:78-80` (`isLimited`), `126-138` (`recordAttempt`), `140-155` (`allowXboxUpstream`), `163-167`; `src/lib/psnClient.ts:146-150`.
- **What:** `allowXboxUpstream` is `reserveAttempt` plus "release when refused" plus fail-closed, hand-copied. PSN's budget does the same thing through `reserveAttempt` with a manual `release()` (`psnClient.ts:146-150`). That makes two spellings of one "spend the app's budget" idea. `isLimited` has no non-test caller, and CLAUDE.md warns against the `isLimited`-then-`recordAttempt` pattern, so it is a trap to delete. `recordAttempt` is only called inside the file.
- **Fix:** `reserveAttempt(scope, address, { failClosed?: boolean })`, releasing on refusal itself. `xbox-upstream` passes `failClosed: true`. PSN keeps fail-open (today's behaviour). Delete `allowXboxUpstream` and `isLimited` (and its test). Un-export `recordAttempt`. The 28-line header that lists every scope repeats the inline comments on `LIMITS`: move each scope's line onto its `LIMITS` entry.
- **Size:** 167 → about 120.

### LB-07 · MED · duplication (security helpers)
- **Where:** NEXTAUTH_SECRET guard plus HMAC: `src/lib/adminAuth.ts:23-31`, `src/lib/emailVerification.ts:17-25`, `src/lib/steamLogin.ts:68-72`, `src/lib/raKey.ts:12-13`, `src/lib/secretBox.ts:11-12`. Constant-time hex compare: `adminAuth.ts:45-47`, `emailVerification.ts:48-50`, `steamLogin.ts:83-85`. Cookie parsing: `adminAuth.ts:54-61` (`readCookie`), `steamLogin.ts:116-119` (`cookieFromHeader`).
- **What:** There are five copies of "read NEXTAUTH_SECRET or throw", three of `createHmac(...).digest('hex')` over the raw secret, three of the `Buffer.from(hex)` + length check + `timingSafeEqual` dance, and two cookie-header parsers with slightly different splitting.
- **Fix:** In `secretBox.ts`, export `appSecret()`, `hmacHex(payload)` and `sameHex(given, expected)`. Keep each caller's key derivation exactly as it is: raKey's `:ra-key:hash` suffix and secretBox's purpose key must not change, or stored data becomes unreadable. Keep one cookie reader (`cookieFromHeader`, moved to a neutral place) and have `requireAdmin` call it.
- **Size:** about 35 lines removed across 5 files.

### LB-08 · MED · duplication
- **Where:** `src/lib/psnCompletion.ts:9-28`, `src/lib/xboxCompletion.ts:9-24`.
- **What:** Two near-identical bodies: filter eligible → `mapLimit(…, 2, load + date)` → build a `Map<id, date|null>` and log failures → map games. Only the eligibility rule, the date function and PSN's extra no-DLC branch differ.
- **Fix:** One `completionDates(eligible, load, toDate, label): Promise<Map<number, string|null>>` (in `utils/completionDates.ts` or a shared lib file). Each platform keeps a 5-line wrapper. The two files could become one.
- **Size:** 52 → about 35.

### LB-09 · MED · duplication
- **Where:** `src/lib/psnClient.ts:83-92` (`LANGUAGES`, `psnLanguage`), `src/lib/xboxClient.ts:40-46, 86-89` (`LANGUAGES`, `xboxLanguage`).
- **What:** The same 9-entry `en → en-US …` map and the same function, twice. A tenth language (a CLAUDE.md roadmap item) has to be added in both, plus `utils/steamLanguage`.
- **Fix:** `platformLocale(lang)` in `src/utils/languages.ts`, next to `LANGUAGES`. `psnLanguage` and `xboxLanguage` become aliases or callers switch to it.

### LB-10 · MED · dead
- **Where / What:**
  - `src/lib/animations.ts:9-19`: `modalOverlay` and `modalContent` are imported nowhere. Only `formTransition` is used (`AuthPage`).
  - `src/lib/attemptLimit.ts:78`: `isLimited` (see LB-06).
  - `src/lib/steamClient.ts:1`: `export * from './steamAssets'` has one user, `/api/steam/icon/route.ts:3` (`clientIconUrl`, `steamAssetUrl`). Every other caller imports `steamAssets` directly. The re-export blurs the "pure, browser-safe" boundary CLAUDE.md asks for.
  - `src/lib/steamLogin.ts:141`: `usernameFromPersona = suggestUsername` is an alias with one caller (`steam/register/route.ts`).
  - Only used inside their own file: `rankings.clearRankingCache`, `scoreRefresh.fillComplete`, `markFillPending`, `startFill`, `attemptLimit.recordAttempt`, `adminAuth.readCookie`, `verifyElevation`, `email.emailSender`.
- **Fix:** Delete the two variants. Import `steamAssets` in the icon route and drop the re-export. Import `suggestUsername` directly. Un-export the internal ones, or leave them where a test needs them.
- **Note:** About 30 exported *types* (`AdminResult`, `SessionResult`, `FillState`…) are only used in their file. That is harmless; not worth churn.

### LB-11 · MED · duplication (concurrency pools)
- **Where:** `src/utils/utils.tsx:409` (`mapLimit`, settled results), `src/lib/steamProgress.ts:133-148` (`mapWithConcurrency`, plain results), `src/lib/xboxClient.ts:422-436` (pool that stops on a 429), `src/lib/scoreRefresh.ts:321-353` (paced pool with a deadline). `src/lib/raYear.ts:58-67` batches by slices.
- **What:** `mapWithConcurrency` is `mapLimit` minus the settled wrapper. Both of its callers (`steamRecentAchievements.unlocksOf`, `enrichWithAchievementCounts`) already catch per item. The Xbox and scoreRefresh pools carry real extra behaviour (stop early, pace, deadline) and are fine.
- **Fix:** Delete `mapWithConcurrency`. Callers use `mapLimit` and read `.value`, since their workers never reject. Leave the Xbox and scoreRefresh pools.
- **Size:** −16 lines.

### LB-12 · MED · size
- **Where:** `src/lib/psnClient.ts` (746 lines).
- **What:** One file holds four jobs: (a) credentials and tokens (`storedCredentials`, `attempt`, `psnCall`, `toTokens`, `newTokens`, `authorization`, `forgetPsnTokens`, `verifyNpsso`, about 150 lines); (b) the played-games merge (`PlayedGame`, `durationMinutes`, `pickImage`, `playedGames`, `trophySetsOf`, `withPlayData`, about 170); (c) library, groups, trophies and IGDB art; (d) feeds (`toRecentTrophy`, `earnedSince`, latest and recent, about 75), plus the release year and `psnFailure`.
- **Fix:** Split, with no behaviour change: `psnAuth.ts` (a), `psnPlayData.ts` (b, all pure except two loaders), and keep `psnClient.ts` for (c), (d) and `psnFailure`. The real cuts are small: share `pickImage`/`avatarUrl`'s "first of these types" helper, and take the language map out (LB-09).
- **Size:** 746 → about 380 + 160 + 170 (about −30 net).

### LB-13 · MED · size
- **Where:** `src/lib/scoreRefresh.ts` (676 lines), `refreshSource` at `:279-406` (128 lines).
- **What:** It mixes the platform plans (`raPlan`…`xboxPlan`, `plansFor`, about 135 lines), the pass engine (`refreshSource`, `rebuildPeriods`) and the fill-status bookkeeping (`read`/`save`/`markFillPending`/`claim`/`runScorePass`/`continueFill`/`startFill`/`onPlatformLinked`/`refreshScoreIfStale`/`refreshDueScores`, about 220 lines). `refreshSource` does five things: list, diff, paced read, write and delete, and stack factors.
- **Fix:** Move the plans to `scorePlans.ts` and the fill status and triggers to `scoreFill.ts`. Inside `refreshSource`, extract `readPaced(todo, plan, deadline, report)`, `storeScores(userId, plan, writes, keep)` and `settleStackFactors(userId, source)`. Small cuts: `sum` at `:120` duplicates `countTrophies` (`utils/psnTitles.ts:40`); `process.env.STEAM_API_KEY?.trim()` at `:250` should be `steamApiKey()`.
- **Size:** 676 → about 300 + 140 + 230, and `refreshSource` → about 50.

### LB-14 · MED · size
- **Where:** `src/lib/xboxClient.ts:151-227` (`xboxCall`, 77 lines).
- **What:** The timeout/abort check is written twice (`:182`, `:205`). The `150` fallback limit is written three times (`:192, 194, 198`). The `remaining` parsing builds the same object twice (`rateLimit` and `lastRateLimit`).
- **Fix:** Add `const isTimeout = (e) => …`, a single `const HOURLY_LIMIT = 150`, and parse the headers once into `rateLimit`, then `if (rateLimit.remaining !== undefined) lastRateLimit = rateLimit`. Separately, the feed half (`toRecent`, `earnedSince`, `cachedFeed`, latest and recent, about 115 lines) could live in `xboxFeed.ts` beside the PSN one.
- **Size:** `xboxCall` 77 → about 60. The file is 529 → about 410 + 115 if split.

### LB-15 · MED · comments (stale)
- **Where / What:**
  - `src/lib/httpCache.ts:3-12`: "matching the underlying raCache TTL" and "every route that uses this returns data scoped to the requester's own session". Both are stale: PSN and Xbox use it, and `sameForEveryone` exists. Together with the 4-line inline comment that is 13 lines of comment for 6 of code.
  - `src/lib/email.ts:1-11`: "the one message this app sends" (it now sends reset, verification, email-changed, Steam-link and NPSSO reminder mails). The shouting "NOTE FOR ANYONE WORKING ON THIS" repeats CLAUDE.md → Email.
  - `src/lib/notify.ts:2-3`: "green when it worked, red when it did not". CLAUDE.md describes a dark card with the tone on its edge.
  - `src/lib/fetchSteam.ts:15-16`: "~100-200 calls / 5 min" (see LB-04).
- **Fix:** Cut each one to its fact. For example, `httpCache`: "private max-age; `Vary: Cookie` unless the answer depends only on the URL (next-auth rewrites the session cookie on every read, #101)". `email.ts`: one line pointing to CLAUDE.md → Email.

### LB-16 · MED · size
- **Where:** `src/lib/authOptions.ts:133-165` (`session` callback).
- **What:** 28 hand-written `session.user.x = token.x` lines that mirror `tokenFields`' keys. A field added to `tokenFields` but forgotten here silently never reaches the session.
- **Fix:** Derive both from one key list: `const SESSION_KEYS = [...] as const`, then `for (const k of SESSION_KEYS) session.user[k] = token[k]`. Keep `raid` (loaded fresh) and the two `=== true` coercions explicit.
- **Size:** 33 → about 10. The file also breaks the repo's style (double quotes, semicolons; CLAUDE.md → Style), as does `src/lib/db.js`. That is LOW and the formatter can fix it.

### LB-17 · LOW · duplication
- **Where:** `src/lib/raFailure.ts:3,18`, `src/lib/steamFailure.ts:3,12`, `src/lib/psnClient.ts:742`, `src/lib/xboxClient.ts:523`.
- **What:** Four copies of `NextResponse.json({ error: 'rate-limited' }, { status: 429, headers: { 'Retry-After': … } })` and two `DEFAULT_RETRY_S = 60`. The rest of each mapper differs on purpose (see the auditor notes).
- **Fix:** Add `rateLimited(seconds = 60)` in `httpCache.ts` (it already builds responses). Keep the four mappers.

### LB-18 · LOW · duplication
- **Where:** Reading `NEXTAUTH_URL` as a base: `src/lib/siteUrl.ts:6` (`SITE_URL`, falls back to localhost), `siteUrl.ts:31-39` (`configuredOrigin`), `src/lib/passwordReset.ts:49`, `src/lib/emailVerification.ts:69` (both fall back to `''`), `src/lib/steamLogin.ts:21-23` (`siteBase(fallback)`), `src/app/api/auth/verifyEmail/route.ts:23`.
- **What:** Five ways to read the same variable with three different fallbacks.
- **Fix:** `resetUrl` and `verificationUrl` take `siteBase('')` from one helper in `siteUrl.ts`. Keep each caller's fallback, since a different fallback is a behaviour change.

### LB-19 · LOW · duplication
- **Where:** `src/lib/raClient.ts:5-12`, `src/lib/steamClient.ts:5-12`.
- **What:** The same `qs()` helper in both.
- **Fix:** One `qs` in `utils/utils.tsx` (or in `fetchRA.ts`). Do not swap it for `URLSearchParams`: that encodes spaces as `+`, which is not proven safe for these APIs.

### LB-20 · LOW · duplication
- **Where:** `src/lib/apiAuth.ts:142`, `src/lib/meStreak.ts:77`, `src/lib/scoreRefresh.ts:250`.
- **What:** `process.env.STEAM_API_KEY?.trim()` bypasses the existing `steamApiKey()` (`fetchSteam.ts:46`), which four routes already use.
- **Fix:** Call `steamApiKey()`.

### LB-21 · LOW · size
- **Where:** `src/lib/apiAuth.ts:69-208`.
- **What:** The 401 response is built six times, with two body shapes (`{ message: 'No autorizado' }` for RA and Steam, `{ error: 'unauthorized' }` for PSN and Xbox). There is also a stray double blank line at `:168-169`. The bodies may be read by clients, so do not unify them without checking.
- **Fix:** `const unauthorized = (body) => ({ ok: false as const, response: NextResponse.json(body, { status: 401 }) })`.
- **Size:** about −15 lines.

### LB-22 · LOW · duplication
- **Where:** `src/lib/igdbClient.ts:247-256` (`artOn`), `:292-304` (`detailsOn`).
- **What:** Twin bodies: configured/empty guard, ®™© strip, quoted search, `withSteamCache` with a `{x: null}` wrapper. Only the field list, the key prefix and the mapper differ. Also, `[/Xbox 360/i, 12]` in `igdbXboxPlatforms` (`:129`) is unreachable after the early return at `:128`.
- **Fix:** One `lookup(kind, fields, platforms, title, map)`. Drop the dead tuple.
- **Size:** 304 → about 285.

### LB-23 · LOW · duplication
- **Where:** `src/lib/rankings.ts:113-121` (`rankEntries`), `:252-263` (`rankByStreak`).
- **What:** The same "competition rank, equal values share a place, then place the unlisted viewer by counting those above" logic, written for points and again for streaks.
- **Fix:** One `competitionRank<T>(listed: T[], unlisted: T[], value: (t) => number)`.
- **Size:** about −10 lines.

### LB-24 · LOW · rule / consistency
- **Where:** `src/lib/verificationEmail.ts:24`.
- **What:** `Hi ${username}` goes into the HTML unescaped, while `emailChangedNotice` and `steamLinkNotice` use `escapeHtml`. Not exploitable today, since usernames are `[a-zA-Z0-9_]` (`authValidation.ts:12`), but it is the one mail that does not follow the pattern.
- **Fix:** `escapeHtml(username)`.

### LB-25 · LOW · dead
- **Where:** `src/lib/raCache.ts:17-19`.
- **What:** `if (development) store.clear()` runs at module load on a Map created two lines earlier, so it can never clear anything.
- **Fix:** Delete it. The comment above `USE_DB` already explains the development behaviour.

### LB-26 · LOW · duplication
- **Where:** `src/lib/publicUser.ts:23` and `src/lib/userRecord.ts:6` (`SavedGame` type, twice); `publicUser.ts:44-57` and `:76-86` (the same NUL guard and `LOWER(username)` lookup, with different column lists).
- **Fix:** Export `SavedGame` once. The two queries can stay: their column lists are deliberately different, one public and one with the key.

## Cross-area notes
- **`src/lib` mixes browser and server code**: `fetchShared`, `lastAnswers`, `notify`, `raArtStore`, `tabThrottle`, `bootstrapParts`, `fetchWithRetry`, `resizeAvatar`, `homeFit` (a DOM ref callback), `analytics`, `fonts`, `animations` and `refreshMark` sit next to `pg`-reaching modules. CLAUDE.md's "code the browser loads must not reach `pg`" depends on nobody importing the wrong neighbour. A `src/lib/client/` folder, or a naming rule, would make that boundary visible. Not a finding here because it touches every importer.
- The hidden-games SQL (LB-01) also lives in `src/app/api/follows/overview/route.ts` (5 copies) and `src/app/api/groups/[id]/route.ts`. Whoever audits `src/app/api` should check them against the shared helper.
- **A CLAUDE.md tension, not code:** the Vault Points section says "Xbox 5 a pass", while the #87 section and `PACE.xbox.perPass` (`scoreRefresh.ts:50`) say 2. The doc should say 2.
- `rankings.streakOf` (day numbers) and `utils/streaks.calcAllStreaks`/`activeStreak` (achievements) are two streak algorithms. CLAUDE.md wants the rankings' version read from `score_games`, so the inputs differ on purpose, but the "alive if it ended today or yesterday" rule is written in both. Whoever audits `src/utils` could share the day-run core.
- `src/hooks/useVaultFill.ts:17` has its own `sleep`, as `scoreRefresh.ts:121` does. Trivial.

## Coverage — every file reviewed
| File | Lines | Verdict |
|---|---|---|
| `src/proxy.ts` | 58 | ok |
| `src/lib/version.ts` | 1 | ok |
| `src/lib/queryRows.ts` | 6 | ok |
| `src/lib/refreshMark.ts` | 11 | ok |
| `src/lib/presence.ts` | 12 | ok (the model for LB-01) |
| `src/lib/gameVisibility.ts` | 14 | ok |
| `src/lib/steamFailure.ts` | 15 | LB-17 |
| `src/lib/raGame.ts` | 16 | ok |
| `src/lib/serverLanguage.ts` | 16 | ok |
| `src/lib/tabThrottle.ts` | 16 | ok |
| `src/lib/animations.ts` | 19 | LB-10 |
| `src/lib/wantsFresh.ts` | 20 | ok |
| `src/lib/fetchShared.ts` | 21 | ok |
| `src/lib/raFailure.ts` | 21 | LB-17 |
| `src/lib/httpCache.ts` | 22 | LB-15, LB-17 |
| `src/lib/xboxCompletion.ts` | 24 | LB-08 |
| `src/lib/db.js` | 25 | LB-16 (style) |
| `src/lib/raKey.ts` | 25 | LB-07 |
| `src/lib/currentPassword.ts` | 28 | ok |
| `src/lib/psnCompletion.ts` | 28 | LB-08 |
| `src/lib/steamUnlockYear.ts` | 28 | ok |
| `src/lib/steamLinkNotice.ts` | 29 | ok |
| `src/lib/verificationEmail.ts` | 29 | LB-24 |
| `src/lib/analytics.ts` | 32 | ok |
| `src/lib/lastAnswers.ts` | 33 | ok |
| `src/lib/secretBox.ts` | 34 | LB-07 (home of the shared helpers) |
| `src/lib/steamProfile.ts` | 38 | ok |
| `src/lib/bootstrapParts.ts` | 44 | ok |
| `src/lib/avatarImage.ts` | 46 | ok |
| `src/lib/meBootstrap.ts` | 47 | ok |
| `src/lib/emailChangedNotice.ts` | 48 | ok |
| `src/lib/fetchSteam.ts` | 48 | LB-05, LB-15 |
| `src/lib/groupList.ts` | 48 | LB-01 |
| `src/lib/steamAssets.ts` | 48 | LB-03 |
| `src/lib/totp.ts` | 48 | ok |
| `src/lib/raProfile.ts` | 50 | ok |
| `src/lib/passwordReset.ts` | 51 | LB-18 |
| `src/lib/resizeAvatar.ts` | 51 | ok |
| `src/lib/homeFit.ts` | 55 | ok (client code in lib, see cross-area notes) |
| `src/lib/fonts.ts` | 56 | ok |
| `src/lib/notify.ts` | 58 | LB-15 |
| `src/lib/raArtStore.ts` | 58 | ok |
| `src/lib/steamAccount.ts` | 63 | ok |
| `src/lib/siteUrl.ts` | 65 | LB-18 |
| `src/lib/steamUnlocks.ts` | 67 | ok |
| `src/lib/email.ts` | 68 | LB-15 |
| `src/lib/upstreamCount.ts` | 68 | ok |
| `src/lib/friendCards.ts` | 69 | ok |
| `src/lib/emailVerification.ts` | 71 | LB-07, LB-18 |
| `src/lib/fetchWithRetry.ts` | 71 | ok |
| `src/lib/fetchRA.ts` | 81 | LB-05 |
| `src/lib/raYear.ts` | 83 | ok |
| `src/lib/publicUser.ts` | 86 | LB-26 |
| `src/lib/raClient.ts` | 87 | LB-19 |
| `src/lib/adminTotp.ts` | 91 | ok |
| `src/lib/vaultMe.ts` | 92 | LB-01, LB-02 |
| `src/lib/userRecord.ts` | 102 | LB-26 |
| `src/lib/raCache.ts` | 103 | LB-25 |
| `src/lib/psnCredentials.ts` | 113 | ok |
| `src/lib/steamClient.ts` | 121 | LB-03, LB-10, LB-19 |
| `src/lib/xboxTelemetry.ts` | 132 | ok |
| `src/lib/meStreak.ts` | 138 | LB-20 |
| `src/lib/steamLogin.ts` | 141 | LB-07, LB-10, LB-18 |
| `src/lib/adminAuth.ts` | 146 | LB-07, LB-10 |
| `src/lib/steamRecentAchievements.ts` | 146 | LB-11 |
| `src/lib/attemptLimit.ts` | 167 | LB-06, LB-10 |
| `src/lib/authOptions.ts` | 197 | LB-16 |
| `src/lib/apiAuth.ts` | 208 | LB-20, LB-21 |
| `src/lib/steamCache.ts` | 215 | LB-04 |
| `src/lib/igdbClient.ts` | 304 | LB-03, LB-22 |
| `src/lib/steamProgress.ts` | 321 | LB-11 |
| `src/lib/rankings.ts` | 374 | LB-01, LB-03, LB-10, LB-23 |
| `src/lib/xboxClient.ts` | 529 | LB-09, LB-14, LB-17 |
| `src/lib/scoreRefresh.ts` | 676 | LB-01, LB-02, LB-10, LB-13, LB-20 |
| `src/lib/psnClient.ts` | 746 | LB-06, LB-09, LB-12, LB-17 |

Tests (`src/lib/*.test.ts`) were not audited, as the brief says. None looked clearly duplicated in the greps; `isLimited`'s test goes with LB-06.
