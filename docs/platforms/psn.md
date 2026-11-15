# PlayStation (PSN)

Moved out of `CLAUDE.md` on 2026-11-07 (#124). How PSN fails: `README.md` here.

Read through `psn-api` (Sony's unofficial mobile API), all in `src/lib/psnClient.ts`.

- **The app's own accounts, never the user's.** Every call is made as one of the
  service accounts of the pool (#178, "Service-account pool" below); any of them can
  read any profile with public trophies.
  Users link by typing their online ID — nothing proves it is theirs, so
  `psnaccountid` is deliberately **not unique** (a squatter must not lock the
  owner out). `/privacy` and `/terms` say so.
- **Verification (#176, the owner's decision of 2026-11-14): only a verified PSN account counts in Vault Points, and
  only one user can have a given account verified.** Linking is unchanged (anyone sees any account's trophies);
  *verifying* is a separate step: the user gets a code (`CV-` + 8 characters from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`, 24 h,
  `src/lib/psnVerification.ts`), pastes it in the About Me of the PSN profile and presses check. `POST /api/psn/verify`
  reads the About Me **once, fresh, and only when asked** (`psnAboutMe`, through `psnCall('profile', …)`, never cached) and, if the
  code is in it (case, spaces and line breaks do not matter), sets `users.psn_verified_at`. The code and the date are
  what is stored; the About Me text is not. `migrations/046` has the columns and a **partial unique index on
  `psnaccountid` where `psn_verified_at IS NOT NULL`**: a second user verifying the same account is refused as `taken`
  (checked first, and the index's `23505` is caught as the same `taken` for two at once). The check is rate limited
  (`psn-verify`, 6 per 15 min per user; a check that succeeds or that Sony failed to answer does not count). Errors:
  `no-code` 409, `not-found` 422 (the code is not in About Me), `taken` 409, `private` 403, `rate-limited` 429,
  `not-configured` 503, `failed` 502/500, all put in words by `psnVerifyError` (`apiErrors.ts`). **Linking, unlinking or an
  admin's link or unlink clear the verification** (`platformLinks.ts`: a new account, even the same one, must be verified
  again); the admin's "Clear verification" (users tab, `DELETE /api/admin/users/psnVerification`, logged) is for disputes.
  The gate on the points is `src/lib/vaultGate.ts` (see `docs/social.md`). The UI is `PsnVerification` on the account page's PSN
  card (the tag beside its name, "Verify account" beside the disconnect) and in the welcome's PSN step (both on one line); the button opens `PsnVerificationModal` with the
  code (a dialog, the owner's call on 2026-11-15: an open panel stretched the row of platform cards). The code is asked for only
  while the dialog is open, since asking makes one. Then `PsnUnverifiedLine` where Vault Points show, and a "Verified" tag on the public profile's PSN chip.
- **The NPSSO dies 60 days after sign-in, and nothing extends it** (measured:
  refreshing returns the same 10-day refresh token; psn-api issue #171; Sony's
  sign-in has a captcha). Each account's lives sealed in `psn_service_accounts`
  (`migrations/047`, `src/lib/psnAccounts.ts`), is renewed by a person in the admin
  panel's guided "Renew", and Telegram (or, without it, `/api/cron/psnToken`'s mail)
  warns before. `PSN_NPSSO` only seeds PSN-1 of an empty pool. `psn_credentials`
  (`migrations/026`) is no longer read except to seed an empty pool; drop it after one release.
  **Do not** try to automate Sony's sign-in.
- **Games are keyed like RA and Steam**: source `'psn'`, and the trophy set's
  number as id (`NPWR20188_00` ↔ `2018800`, `psnNumericId`/`psnTitleId`).
- **A game counts by its whole set, DLC included**, as Sony's own title list
  does: a platinum with DLC trophies still to earn is "in progress", not
  "completed". (It used to count by the `default` group alone; it no longer
  does, and no per-game lookup of the groups is made for the list.)
- **Icons: the store's, not the trophy set's.** A PS4/PS3 trophy icon is a 320×176
  banner (PS5's are square); the played-games `imageUrl` is square on PS4 too, so it
  wins (`withPlayData`), except for a collection's games. The cover is only a
  `PORTRAIT_BANNER`; PS4's 16:9 hub art is a backdrop. `GameIcon` letterboxes PSN
  (no blurred fill: the user tried it and preferred plain bands).
- **A collection is one played game for several trophy sets** (Ezio Collection →
  AC II, Brotherhood), and Sony does not say which was played: its session goes only
  to the set with the newest trophy, or every game in it shows as just played. Its
  hours stay on each (the total counts them once, by `playedAs`). Each game carries
  its `collection` (the played game's id, name, icon, session, hours), and the recent
  feed folds a collection with 2+ games in the list into one card
  (`psnFeed` in `steamFeed.ts`, `PsnCollectionItem`). Opened, it is laid out like an
  opened game (`PsnCollectionExpanded`): ring, chart and rarest count the whole
  collection, and each game is a fold of trophies, as DLC are. Only the feed folds:
  stats, library, pins, pages and "completed" stay per trophy set (user's choice).
  A game of the collection never started has no trophy list, so Sony lists it nowhere.
- **Two lists, merged**: the trophy list (`getUserTitles`, the *core*) and the played-games
  list (play time, last session, store art, PS4/PS5 only, its own privacy
  setting; the *enrichment*, filled in the background since #177). `lastTrophyAt` is the trophy list's date and keys every trophy
  cache; `lastPlayed` is the last session when known.
- **Caches** live in `steam_cache` under `psn:` keys. When the shape of a
  cached value changes, bump its key's version (`psn:titles:core:vN`) in the same
  change — a dev server will otherwise serve the old shape. How they are read since #177
  (stale data, one fetch at a time, the split per game): "Fast core and call budget" below.
- **PS3/Vita games** have no play data and no Store page: their cover,
  backdrop and release year come from IGDB (`src/lib/igdbClient.ts`, a Twitch
  app in `TWITCH_CLIENT_ID`/`TWITCH_CLIENT_SECRET`), matched by title and
  platform, cached half a year. Without the keys they keep the trophy icon.
  Every PSN game page also asks IGDB for its summary, studios, genres and
  screenshots (`igdbDetails`, `GET /api/psn/details?id=`, keyed by Sony's
  title from the user's list, never by text from the request). English only;
  a 404 just means the page goes without them.
- Sony returns errors as bodies, not throws: every call goes through
  `psnCall(fn, (auth) => …)` (`fn` names the endpoint for the call counters, see Call baseline; `unwrap()`, and the pool's
  retries, `withPsnAccount`: a "too many requests" runs again on another account, or after 2 s on the same one when it is
  the only one — psn-api hides the HTTP status and `Retry-After`, so it goes by
  the message, or Sony's code `2138635`). `psnFailure()` maps them to 202 `syncing` (built in the background),
  503 / 403 (private) / 429 `busy` (the app's own budget is spent) / 429 `rate-limited` (Sony refused; both with
  `Retry-After: 60`) / 502. The client reads a 429 as a plain failure with a retry button. `psnAboutMe` (verification, counted as `profile`) is one more call of the kind: a hidden profile answers 403 `private`.

## Call baseline (#175, 2026-11-14)

How many requests reach Sony, by function, before phases 1 to 5 of the PSN epic (#174) change them. These
numbers are the yardstick for "a cold profile in about 10 calls" and "no Sony call in a read".

**Instrumented.** `psnCall(fn, call)` takes the function's name and counts every request under it, the retry
after a 429 included (`src/lib/psnCallStats.ts`): per function, per minute, in memory on the instance, a log line
per busy minute (`[psn] calls in the minute <ISO minute> <total> {"titles":1,...}`), and `psnCallsPerMinute()` /
`psnCallTotals()` for whoever reads it next (phase 5). Names and counts only: no id, no online ID, no token.
`upstreamCount` still keeps the day's total across instances. The names are the Sony endpoints:
`search`, `summary`, `profile`, `titleCount` (`getUserTitles` with `limit: 1`), `titles`, `played`, `sets`
(trophy sets of played games, 5 ids per call), `gameTrophies` (a game's defined trophies **and** the account's
earned ones, 2 requests), `gameGroups` (the same for DLC groups, 2 requests) and `auth` (the token exchange, 2
requests for an NPSSO, 1 for a refresh token, once an hour per instance). `recent`, `history` and `score` are not
endpoints, they are *readers* that fan out into `gameTrophies`; the table says which reader is which.

**Measured without Sony.** `src/lib/psnCallBaseline.test.ts` runs the real `psnClient` against a fake `psn-api`
(`src/test-utils/fakePsn.ts`, with Sony's paging limits: 800 titles, 200 played games, 5 ids per lookup) and an
in-memory cache with the real TTLs and the real in-flight sharing (`src/test-utils/memorySteamCache.ts`). No
network, no database. It asserts every number below from the library's shape and cross-checks the counters
against the fake's own request count. Rerun and print the tables:

```
PSN_BASELINE=1 npx jest src/lib/psnCallBaseline --coverage=false
```

**The model** (assumptions, not a real account; change `fakeLibrary` to try another): 70 % of the games are
PS4/PS5 with a played-games entry (the rest PS3/Vita), 85 % have a trophy earned, 15 % of those are at 100 %, 20 %
have DLC, 20 % of the started ones have the platinum; 10 % of the library had its last trophy in the last 60 days,
25 % in the last year. So 500 games = 350 played, 425 started, 110 with a trophy in the year, 30 needing a
completion date; 1,000 games = 700 / 850 / 220 / 60. The reader's language is `es-ES`; the completion dates and
the score read in the default `en-US`, so they keep their own cache entries.

### Cold profile: what the first visit costs

The home's five reads fired together (summary, library, latest trophies, last 60 days, last year for the header's
streak), every cache empty, the instance already signed in:

| | summary | profile | titleCount | titles | played | sets | gameTrophies | gameGroups | **total** |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| **500 games** | 1 | 1 | 1 | 1 | 2 | 70 | 280 | 0 | **356** |
| **1,000 games** | 1 | 1 | 1 | 2 | 4 | 140 | 560 | 0 | **709** |

Linking costs 4 more (`search`, `summary`, `profile`, `titleCount`), the summary being cached after that. The
background score fill (`onPlatformLinked`) comes **on top**, and it is the largest item of all (500 games: 790
calls; 1,000: 1,580), paced at 100 games a pass.

**Where the ~300 comes from** (500 games, one read after another; each row is what it adds):

| read | calls | share | what it does |
|---|--:|--:|---|
| summary | 3 | 1 % | `summary`, `profile` and a `getUserTitles` of one game just for the count |
| library: titles, played, sets | 73 | 20 % | 1 page of titles, 2 of played games, and 70 `sets` batches (350 played games / 5) |
| library: completion dates | 60 | 17 % | 2 requests (`gameTrophies`) for each of the 30 games with DLC that are complete |
| latest trophies | 6 | 2 % | the 3 newest games, 2 requests each |
| last 60 days | 84 | 24 % | 42 more games, 2 requests each |
| last year (streak) | 130 | 36 % | 65 more games, 2 requests each |
| **home total** | **356** | | the same, since concurrent reads share what is in flight |
| score fill (English) | 790 | | 2 requests for each of the 395 games with a trophy not already read for completion |

So **the per-game fan-out is 280 of the 356 (79 %)**: the feed, the streak and the completion dates all read a
game's whole trophy set, two requests (defined trophies + earned ones), to learn dates and a name. The library
itself is 73 (20 %), almost all of it the `sets` lookups. The summary is noise. The spike's estimate for 500 games
(about 313) and 1,000 (about 734) is right to within 15 %.

### Refresh after 15 minutes, cache warm

The home's reads again, 15 minutes and a second later (the summary and the title list have a 15 minute TTL; the
per-game entries, `sets` and the groups keep for 30 to 90 days):

| | summary | profile | titleCount | titles | played | sets | gameTrophies | **total** |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| 500 games, nothing new | 1 | 1 | 1 | 1 | 2 | 0 | 0 | **6** |
| 500 games, one game with a new trophy | 1 | 1 | 1 | 1 | 2 | 0 | 2 | **8** |
| 1,000 games, nothing new | 1 | 1 | 1 | 2 | 4 | 0 | 0 | **9** |
| 1,000 games, one game with a new trophy | 1 | 1 | 1 | 2 | 4 | 0 | 2 | **11** |

Every 15 minutes, for each active user, even when nothing changed. A game's trophy cache is keyed by its last
trophy's date, so only the game that moved is read again.

### Navigation with a warm cache

Home, then a game, then another, then the library, right after the cold load:

| step | gameTrophies | gameGroups | **total** |
|---|--:|--:|--:|
| home | 0 | 0 | **0** |
| a game with a trophy in the last year | 0 | 2 | **2** |
| a game older than a year | 2 | 2 | **4** |
| library | 0 | 0 | **0** |

The trophies of a recent game are already there from the year's read; **the groups never are** (2 requests for
every game opened, even one with no DLC), and an old game costs all 4.

### Biggest wins for phase 2 (#177)

1. **Share a game's defined trophies and groups across users.** Half of every `gameTrophies` and `gameGroups`
   request (the defined side: names, icons, grade) is the same for every user and depends only on the game and the
   language, but its cache key carries the account id. A key of `(title, language)` makes it free from the second
   player of a game: 140 of the 280 cold calls, 395 of the 790 score calls. The earned side stays per account.
2. **Do not read the whole set to count days.** The year, the 60 days and the streak need only when each trophy was
   earned: the earned request alone is enough (check what the feed and heatmap consumers read), which halves the
   220 calls of the feed to 110. Later phases make them free with a stored snapshot keyed by the game's last trophy.
3. **One entry for what is language-independent.** The earned trophies are the same in every language, but the
   cache key has the language: a Spanish reader pays them again for the 5 completion games that are also in the
   year (and, in the score fill, for the 105 year games read in English after the page's Spanish). Key the earned
   side by account and game only.
4. **Cheap change detection instead of a re-read every 15 minutes.** The summary's trophy counts say whether
   anything changed: when they did not, keep the title list and skip the `titles` and `played` pages (3 to 6 of the
   6 to 9 calls of a refresh). The `titleCount` request is redundant too: the title list already has
   `totalItemCount`, so the summary is 2 requests, not 3.
5. **Take the `sets` lookups off the first read, and put every request under the budget.** The 70 (140) trophy-set
   batches are 20 % of the cold profile for data that is the same for every user and kept 90 days; they can be
   filled in the background. And the `played` pages and the token exchange do not go through `psnCall` today: no
   deadline, no retry, no app budget (`psn-upstream`). Counted now, but not governed; phase 2's budget must
   include them.

### Left for later

- **Per account or per IP?** Whether Sony's 429 is per account or per IP cannot be measured without a second
  account. It moved to phase 3 (#178), where the pool exists.
- The counters do not say which *reader* a `gameTrophies` request came from (feed, completion or score): that
  is read from the table above, by the code path. Phase 5 can add an origin if it needs one.
- IGDB (PS3/Vita art, one request per game, cached half a year) and the Store page (release year) are not Sony API
  calls and are not counted here.

## Fast core and call budget (#177, phase 2, 2026-11-15)

Still one service account. What a page waits for is a handful of requests; the rest is done after the answer,
in the background, under one budget. Code: `src/lib/psnClient.ts`, `psnCache.ts`, `psnBudget.ts`, `psnErrors.ts`.

- **The core and the enrichment.** `psnTitlesCore` is the trophy list alone (`getUserTitles`, 800 a page): no
  played games, no trophy sets, no IGDB. Every reader that only needs the trophy list (summary, latest trophies,
  the year, a game page's lookup, the streak's hidden consoles, the score fill) reads it. `psnLibrary` (the
  `/api/psn/titles` route, a group's years) is the core with the **enrichment** laid over it
  (`psn:enriched:v1:<account>`, an hour): the whole played list, the trophy sets of **20 more played games a
  pass, most recent first** (the sets are the same for everyone and kept 90 days, so it converges), IGDB art for
  PS3/Vita, and the base-game completion dates of **20 more DLC games a pass** (kept by `titleId@lastTrophyAt`).
  The first visit gets the core; the play time, art and dates arrive on a later read. So on a first visit the
  library has no play time and a complete DLC game has no completion date yet (`null`, as a failed lookup was).
- **The summary costs 2**, not 3: its game count is the core's length (shared), no `getUserTitles` of one game.
- **No year on a first visit.** `psnRecentTrophies` (the 60 days and the year, the streak, the heatmap) reads
  one cached year (`psn:year:v1:<account>:<lang>`, 15 min) built in the background from per-game entries. With
  none, the route answers **202** `{ status: 'syncing' }` with `Retry-After: 15`; `usePsnRecentTrophies` stays
  loading and asks again (sections land whole). `/api/me/streak` counts PSN as `failed` meanwhile. The latest
  trophies (3 games, 6 requests) are the only trophies read on the visit itself.
- **Stale data instead of waiting** (`psnCached`): a live entry is the answer; an expired one up to **7 days**
  old is the answer too, and a fresh one is fetched after the answer (`runLater`, which is `after()`); with none,
  the fetch happens now (or in the background, for the year and the enrichment). A refresh that Sony refuses
  keeps the old one. `sweepExpired` keeps `psn:` rows 7 days past their expiry for this.
- **Negative caches:** `psn:private:<account>` (10 min) after Sony says the profile is hidden: visits are
  refused without asking (linking clears it, `forgetPsnPrivate`, so making the profile public and linking again
  works at once). `psn:notfound:<online id>` (1 h) when a search finds nobody.
- **One fetch at a time per key, across instances:** a lease (`takeLease` / `dropLease` in `steamCache.ts`, a
  row in `steam_cache` that expires after 60 s), not `pg_try_advisory_lock` as the issue said. A session
  advisory lock holds a pooled connection for the whole Sony fetch, and the pool has 5: the budget's own queries
  inside that fetch could then wait on the pool (and an instance that dies with the lock held keeps it until its
  connection closes). A reader that finds the lease taken waits up to 8 s for the other's answer, then answers
  `busy`. Inside one instance the in-flight promise is shared. No migration: the lease is a `steam_cache` row.
- **Manual refresh once per 10 minutes:** the refresh button (`wantsFresh`) reads Sony again only for an entry
  at least `REFRESH_MS` (10 min) old. The summary answers `syncedAt` and `nextSyncAt`; the home's PSN profile
  shows "Updated 3 minutes ago / next update in 7 minutes" (`MainPageProfilePsnSync`, `T.psn.syncedAgo` /
  `nextSync`).
- **Split caches per game.** A game's defined trophies are everyone's: `psn:defs:v1:<npwr>:<lang>` (30 days);
  the account's earned ones carry no language: `psn:earned:v1:<account>:<npwr>:<lastTrophyAt>` (30 days). The
  groups the same (`psn:groupdefs:v1`, `psn:groupearned:v1`). A DLC added after the defined half was kept
  shows as an earned id it lacks, and the defined half is read again (`splitRead`). The old
  `psn:trophies:v2`, `psn:groups:`, `psn:titles:v12` and `psn:summary:v3` keys are no longer read (they expire).
- **One budget for every request** (`psnBudget.ts`): `PSN_CALLS_PER_WINDOW` (600 per 15 minutes, in
  `attemptLimit.ts`, the one number to tune) for the whole app, counted in the database
  (`reserveAttempt('psn-upstream', 'app', max)`), now including the played pages and the token exchange
  (`auth`). Work nobody waits for (`psnBackground`: the enrichment, the year, the stale refreshes, the score
  fill) may spend only **three quarters** (450); the rest is kept for pages. Past it, `PsnBusyError`: nothing is
  asked, routes answer 429 `busy`, a background fetch is not tried again for 30 to 90 s (jitter), the score
  fill stops its pass as `busy` and resumes on the next. `psn-score` went from 300 to 200 games per 15 minutes
  to fit under the background share. **When Sony itself refuses twice**, `psnRateLimited` wrote
  `psn:cooldown` for 60 s. *Since #178 the budget and the cooldown are per service account* (`account:<id>`,
  `cooldown_until` on its row; Service-account pool below).
- **What Sony's limit is said to be** (community reports, no Sony document): a 429 with the body
  `{"error":{"code":2138635,"message":"Rate limit exceeded"}}`, about 300 requests per 15 minutes, per account
  **and per kind of request** (trophy titles, profile...), plus an unknown per-address limit. Some clients see an
  `X-RateLimit-Next-Available` header on the 429; **psn-api returns only the body** of every response, so the
  app cannot read it and waits a fixed 60 s. The per-function counters (`psnCallStats`) are what will say which
  endpoint hits 429 first. Sources: [psn-php #117](https://github.com/Tustin/psn-php/issues/117),
  [psn-php #148](https://github.com/Tustin/psn-php/issues/148), [psn-go](https://pkg.go.dev/github.com/wolveix/psn-go).

### Phase 2 numbers

Measured the same way as the baseline (`src/lib/psnCallBaseline.test.ts`, the fake Sony and the in-memory
cache, now with the background queued and run apart; the test asserts them):
`PSN_BASELINE=1 npx jest src/lib/psnCallBaseline --coverage=false`.

| | 500 games | 1,000 games |
|---|--:|--:|
| **cold home, what the visit waits for** (phase 0: 356 / 709) | **9** | **10** |
| of which | summary 1, profile 1, titles 1, gameTrophies 6 | the same, titles 2 |
| after it, in the background (played, 20 sets, the year, 20 completion dates) | 255 | 472 |
| a second player of the same games, visit and background | 134 | 242 |
| refresh after 15 min: the visit / in the background | 0 / 3 | 0 / 4 |
| navigation: a game this year, an older game, the library | 2, 4, 0 | 2, 4, 0 |
| score fill after the visit (phase 0: 790 / 1,580) | 705 | 1,450 |
| linking (search, summary, profile, titles) | 4 | 5 |

The background is still the year game by game (2 requests per game the first time anyone reads it, 1 after);
phase 4 (#179) makes it free with stored snapshots. The score fill reads the defined trophies in English while
pages read them in the reader's language: one language for the score is a follow-up.

## Service-account pool (#178, phase 3, 2026-11-16)

Several PlayStation accounts read Sony instead of one. **Built for one account and working with it alone** (the owner's
decision): today's NPSSO is PSN-1, and the owner adds PSN-2.. from the panel when they have them; no code changes then.

**Data** (`migrations/047_psn_account_pool.sql`): `psn_service_accounts` (one row per account: label, hint, online ID,
sealed NPSSO and tokens, status `active` / `paused` / `draining` / `quarantined`, weight, concurrency 4, `rate_per_min` 40,
cooldown, canary, renewal), `psn_account_leases` (a slot per concurrent call, frees itself after 30 s), `psn_account_stats`
(calls, ok, 429, auth and server errors per account and minute, 14 days), `psn_alert_state` (Telegram dedup) and
`psn_sync_jobs` (phase 4's queue, empty). The migration copies `psn_credentials` into PSN-1 when the pool is empty
(sealed values as they are); `psnAccounts.seedPsnPool` runs the same copy, then `PSN_NPSSO`, on first use of an empty pool.
No `psn_account_budget` table: the budget per account is phase 2's `psnBudget` keyed by account (the owner's call: one limiter).

**A call** (`src/lib/psnPool.ts`, `withPsnAccount`): a weighted pick (`-ln(random) / weight`) of a free slot on an active
account out of cooldown, then the account's sign-in (`psnTokens.ts`) and budget (`psnBudget.ts`, `rate_per_min` × 15 per
15 minutes, `account:<id>` in `signup_attempts`; background work three quarters of it). On failure:
- 429 / 5xx / no answer: another account, **two retries at most**; with one account, the old behaviour (wait 2 s, ask once more).
  Two 429s in a row rest the account 60 s, doubling to 5 min.
- Sony refuses the token: the tokens are dropped and the call goes to another account (or the same, signing in again). A
  sign-in that is refused (refresh token and NPSSO both) **quarantines** the account. Softer than the issue's "a 401
  quarantines": a stale token must not take the only account out.
- The account's own budget spent: another account, its health untouched.
- A hidden profile (403) or not found: never retried, no fault of the account.
- All slots taken: waits up to ~3 s for one. None usable: `PsnBusyError` (429 `busy`).

With one account the call counts are unchanged (`psnCallBaseline.test.ts` runs through the real pool with one fake account).

**Tokens** (`psnTokens.ts`), per account, under `SELECT … FOR UPDATE` on its row (`psnAccounts.lockPsnTokens`): the access
token is replaced at ~50 minutes, the refresh token (10 days, never renewed) at ~7 days by a new NPSSO exchange.

**Upkeep** (`psnMaintenance.ts`): a draining account with nothing in flight is paused, the canaries due run (every 30 min per
active account, two accounts at a time with a pause: it reads its own profile with its own token, `summary('me')` + `profile`,
which also refreshes its tokens ahead), then the alerts. It runs from `/api/cron/psn-alerts` (daily at 09:15 UTC in
`vercel.json`) and **after PSN traffic, at most every 15 minutes for the app** (a `psn:maintenance` lease): Vercel's daily
crons alone would leave the canary a day old. On a Pro plan the cron can be made `*/15 * * * *`.

**Admin** (English, `requireAdmin` + `logAdminAction` on every action, never a secret in an answer or a log):
`GET`/`POST /api/admin/psn/accounts`, `PATCH`/`DELETE /api/admin/psn/accounts/[id]`, `POST …/[id]/test`,
`POST …/[id]/rotate`, `GET /api/admin/psn/pool`. The PlayStation tab (`admin-psn-accounts/`) has the pool at a glance and the
next suggested renewal (`utils/psnPool.ts`: the first to die, on the latest day whose new 60 days end ≥ 12 days from the
others; sign-ins within 7 days of each other are flagged), a row per account (label, state, online ID, days left and date,
renewed when and by whom, weight, calls in the last hour, canary) with Renew, Test, Drain, Pause / Resume, Remove, and
"Add account". Renew and Add are one guided dialog (`AdminPsnRenewModal`): a private window or a browser profile per account,
sign in at playstation.com as that account (its label and the owner's hint), open
`https://ca.account.sony.com/api/v1/ssocookie` in that window, paste `npsso`: it is kept only if Sony gives its expiry,
the sign-in works and the account reads its own profile (`psnAccountCheck.tryPsnNpsso`). Weight, concurrency and rate are
changed through the PATCH route (the panel sets the weight when adding).

**Secrets**: with `PSN_SECRET_KEY` set, values are sealed under `psn-account:v1` with that key and stored with a `v1:` prefix;
without the prefix they are the old derivation (`NEXTAUTH_SECRET`, `psn-credentials`), still read and sealed again with the
new key when next written. `secrets.test.ts` pins both. Never change either.

**Alerts** (`psnAlerts.ts`, texts in Spanish in `psnAlertMessages.ts`): an NPSSO at 14 / 7 / 3 / 1 days (once per sign-in),
a quarantine (daily while it lasts), 429s above 5 % of ≥ 20 calls in the last hour, fewer than two usable accounts **only
when two or more are meant to serve** (active or quarantined: silent with one account, or after one is paused or removed),
sync failures above 5 % of ≥ 20 jobs, and the digest after 09:00 UTC. **Only production sends**, one message per
environment: its own pool tagged `[PRO]`, and pre's tagged `[PRE]`, read from pre's database through
`PREVIEW_DATABASE_URL` set in Production (a second pool, `src/lib/preDb.js`, inside `BEGIN TRANSACTION READ ONLY`; db.js
ignores the variable in production). Pre's dedup lives in production's `psn_alert_state` under a `pre:` prefix. Pre itself
never sends; its tokens refresh on use, and its canaries run after its own traffic. **Send-only**: the bot is the owner's
(Hermes polls it), so never `setWebhook`, `getUpdates` or `deleteWebhook`. Without Telegram, `/api/cron/psnToken` mails
the admins about every account with 7 days or less.

**Status for the owner's agent**: `GET /api/ops/psn/status` with `Authorization: Bearer $PSN_STATUS_TOKEN` (404 without
the variable, 401 for a wrong token, `psn-status` limit 30 per 15 minutes per address counted before the check). It answers
the environment and, per account, label, state, cooldown, days left, calls and 429s in the last hour, canary; never the hint,
the online ID, a token or an NPSSO.

**Pending until a second account exists**: whether Sony's 429 is per account or per IP (load one account while another sits
idle; record it in Call baseline above and the worklog), and the issue's "Done when" checks that need PSN-1..3 (one account's
429 or 401 invisible to users, the pool-down alert).
