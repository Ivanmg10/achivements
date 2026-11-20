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
- **Snapshots, not caches, since #179:** what pages read is in Postgres (`migrations/048`, "Snapshots and sync
  queue" below). `steam_cache` keeps only `psn:sets:<played id>` (a played game's trophy sets, everyone's, 90
  days), `psn:notfound:` (1 h) and `psn:release:` (the Store's year); the `psn:summary:`, `psn:titles:`,
  `psn:enriched:`, `psn:year:`, `psn:defs:`, `psn:earned:` and group keys of #177 are no longer written or read.
- **PS3/Vita games** have no play data and no Store page: their cover,
  backdrop and release year come from IGDB (`src/lib/igdbClient.ts`, a Twitch
  app in `TWITCH_CLIENT_ID`/`TWITCH_CLIENT_SECRET`), matched by title and
  platform, cached half a year. Without the keys they keep the trophy icon.
  Every PSN game page also asks IGDB for its summary, studios, genres and
  screenshots (`igdbDetails`, `GET /api/psn/details?id=`, keyed by Sony's
  title from the user's list, never by text from the request), and **a PS4/PS5
  game the Store gave no cover takes IGDB's on its own page only** (`coverUrl`,
  `igdbPsnArt`, same lookup and half-year cache as PS3/Vita art, #167): never
  for the library, and no Sony call. English only;
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

*History since #179: the readers below (`psnCached`, the split per-game caches, the background year) were replaced
by the snapshots and the sync queue (next section). The budget, Sony's limits and the pool still hold as written.*

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

## Snapshots and sync queue (#179, phase 4, 2026-11-16)

**No PSN page calls Sony.** Every PSN read is a database read of what the sync worker stored; Sony is reached only
by the worker, by linking (the search and the summary) and by verification (the About Me). Still built for one
service account; the pool spreads the worker's calls when there are more.

**Tables** (`migrations/048_psn_snapshots.sql`, all SQL in `src/lib/psnStore.ts`):
- `psn_players`, one row per PSN account (users may share one): the summary (JSON), when the summary, the profile,
  the list and the enrichment were read, `year_at` (the year first whole), the language trophy texts are read in,
  and `state` (`new`, `ok`, `private`).
- `psn_player_games`: the account's trophy list, the game as the app shows it (JSON), `last_trophy_at`, and
  `trophies_at`, the `lastTrophyAt` its stored trophies belong to. **The two differing is the delta.** Also the DLC
  groups the account has, the base-game completion date, and `wanted_at` (a page asked for it).
- `psn_player_trophies`: only the trophies earned (a row is an earned trophy), with their date.
- `psn_games` and `psn_trophies`: a trophy set and its trophies, **the same for every player**: name, icon, counts,
  DLC groups per language; grade, group, icon, rarity, and texts per language (`{"es-ES": [name, detail]}`).
- Caps: 5,000 games per player (`MAX_GAMES`); trophies are bounded by the games. Rough size: a 500-game library is
  ~500 game rows (~1–2 KB of JSON each) and ~1,500 earned rows (~60 B); a set's trophies ~300 B each per language,
  shared. An account nobody links any more loses its rows in the daily sweep (`sweepPsnPlayers`).

**The queue** (`psn_sync_jobs` from `047`, `src/lib/psnQueue.ts`): one active job per user and phase; asking again
makes the queued one more urgent. A worker claims the most urgent due job (`ORDER BY priority, run_after … FOR
UPDATE SKIP LOCKED`), a job whose worker died is taken again after 90 s, a failure waits 1, 2, 4, 8 minutes and
fails after 5 attempts (the app's budget spent is not an attempt). Priorities: link/verify 0, manual 1, first sync
2, cron 3, history 4, score 5. Finished jobs are swept after a week.

**The phases** (`src/lib/psnSync.ts`, all as background work: three quarters of each account's budget):
1. `summary`: the trophy counts (1 request); the profile too (2) when the counts moved or once a day. Counts
   unchanged and the list read in the last day: done. A link, a manual refresh or a moved count goes on.
2. `titles`: the list (1 per 800 games), saved; the played list, 20 more trophy sets and IGDB art **only when a game
   moved or once a day** (`getUserPlayedGames` only when needed). A failure there keeps the old enrichment. Then
   `recent` when there is a delta or the year was never whole.
3. `recent`: the delta of the year (games with a trophy in the last 366 days that moved, asked-for ones first), 20
   games a job, queued again until none is left; then `year_at` is set, and `history` (or `score`) follows.
4. `history`: the older games that moved and any game a page asked for, 20 a job, queued again until none is left;
   then `score`.
5. `score`: a Vault Points pass (`runScoreAfterSync`), PSN read from the store (no Sony call); one already running
   is waited out (2 minutes).

A game read (`fetchPsnGame`): its earned trophies (1 request; none for a game never started), its definitions only
when the store lacks them in the player's language or a DLC brought ids it does not know (1, shared by everyone),
and for a game with DLC the account's groups (1) and the groups' definitions when missing (1). A game without DLC is
one group built from the list. One game failing fails the job (the others are kept) so nothing is marked read
without its trophies.

**The readers** (`src/lib/psnSnapshot.ts`): nothing stored yet → 202 `syncing` and a sync queued (`titles` when the
summary is already there, as after a link). Stored → the answer, and a sync queued after it when Sony was last
checked 15 minutes ago or more (`SYNC_EVERY_MS`; the refresh button's cookie makes it manual, once per 10 minutes).
A hidden profile → 403 as before, checked again on that schedule. A game page whose trophies were never read →
202 and the game asked for first; read before its last trophy or in another language → answered as stored and
asked for anew. The latest trophies → 202 until the 3 latest games are read; the year (60 days, streak, heatmap) →
202 until it is first whole, then the stored one. The language: linking stores the reader's
(`serverLanguage()`), and any reader's language becomes the one the next syncs read texts in; texts already stored
stay in the old one until their game moves or is opened.

**Routes**: the old ones answer the same shapes from the store (`summary`, `titles`, `trophies`, `recentTrophies`,
`details`), and:
- `GET /api/psn/bootstrap`: the summary, the first 50 games (most recently played, hidden games and unticked
  consoles left out), the latest trophies (`null` while first read) and the sync state; 202 before the first sync.
- `GET /api/psn/status`: `new` / `syncing` / `ready` / `private`, last check and next allowed, games waiting, jobs.
- `POST /api/psn/refresh`: 202 `queued`; 409 `syncing` while the summary or list is being read; 429 `too-soon`
  within 10 minutes of the last check, with `Retry-After`.
- `GET /api/psn/games?page=&limit=50&q=&sort=recent|title|progress`: a page of the library, at most 50.
- `GET /api/psn/game/[npwr]?lang=`: one game's trophies and groups, as `/api/psn/trophies`.
- Every answer is `private` with `Vary: Cookie` (60 s for the new ones): a PSN read depends on who asks (a private
  CheevoVault profile is refused to others), so **no shared `s-maxage` copy**, unlike the issue's wording. Images
  are Sony's and IGDB's URLs, shown through `next/image` (the optimizer is the proxy) and allowed by
  `/api/image-proxy`; the answers are the app's game and trophy shapes, no raw Sony objects.

**Draining without a frequent cron.** Vercel's Hobby plan runs crons daily at most, so the queue moves after PSN
traffic: every reader, link, refresh and verification that queues a job also starts a drain once the answer is sent
(`kickPsnSync` → `after()`, 20 s, one per instance at a time; other instances drain in parallel without overlap).
`/api/cron/psn-worker` (04:30 UTC in `vercel.json`) queues a sync for every account seen in the last two weeks and
not checked in 20 hours, sweeps, and drains for 55 s. **On a Pro plan**, schedule it `* * * * *`: the queue then
moves every minute whatever the traffic, and the kicks only make a sync start sooner.

### Phase 4 numbers

Measured as before (`src/lib/psnCallBaseline.test.ts`, the fake Sony, now with the in-memory store and queue
`src/test-utils/memoryPsn.ts` and the real worker; the test asserts them):
`PSN_BASELINE=1 npx jest src/lib/psnCallBaseline --coverage=false`.

| | 500 games | 1,000 games |
|---|--:|--:|
| linking (search, summary, profile; the list is queued) | 3 | 3 |
| **what a visit waits for**, cold or warm (phase 2: 9 / 10; phase 0: 356 / 709) | **0** | **0** |
| the worker's first sync: list, played, 20 sets, every started game (2 each) and DLC groups (2 each) | 1,027 | 2,050 |
| a second player of the same games: link, visit and sync (definitions shared) | 520 | 1,033 |
| a visit 15 minutes later, nothing new: the visit / the worker | 0 / 1 | 0 / 1 |
| one new trophy: the worker (summary, profile, list, played, sets, that game) | 10 | 13 |
| navigation with the sync done: a game this year, an older one, the library | 0, 0, 0 | 0, 0, 0 |
| a game never started, opened: 202, then its definitions | 1 | 1 |
| the score fill (phase 2: 705 / 1,450) | 0 | 0 |

The first sync reads every started game once (phase 2 read the year and 20 completion dates, then the score fill
read every started game again: ~960 for 500 games). With one account at 450 background calls per 15 minutes, the
year of a 500-game library (~260 requests) lands in one window and the rest in about 35 minutes; then every
refresh is 1 request when nothing moved. **Score parity** (`src/lib/psnScoreParity.test.ts`): the points from the
snapshot equal the old live path's, game by game, on a fixture with platinums, DLC, a dateless trophy and odd
rarities.

**Left for later:** the "Done when" items that need a real pool (PSN-4 and PSN-5 added from the panel 1–2 days
apart, each with its canary green; then the five expiries staggered; failover tested) and a load test of 100
simulated links against a real database.

## Sync on screen, numbers, alerts and the switches (#180, phase 5, 2026-11-19)

**What a person sees** (the owner's own profile column, `MainPageProfilePsnSync`; spec: `docs/psn-multi-account-pool.md`
§9). `GET /api/psn/status` now also says what the sync means (`src/utils/psnSyncStage.ts`, pure, tested):
- `stage`: `syncing_core` (the trophy list is not stored yet), `ready_partial` (trophies and library there, the year
  still being read), `enriching` (play data or older games still being read; nothing waits on it), `ready`, `private`.
- four `steps` (trophies, library, play time, history: done, in progress, waiting), a real `progress` (10 with the
  summary, 30 with the list, then 30 + 70 × games read / games with trophies; never a timer), `games` read / total,
  `etaSeconds` (the calls left: 2 for the core, 22 for play data, 2 a game, 3 for each job ahead, at the usable
  accounts' background rate; rounded on screen, "may take a while" past 30 minutes), `position` in the queue while
  none of the user's jobs runs, `stale` (data an hour old or more), `trouble` (`paused`: PSN_MODE=stale or no account
  can read; `failing`: a job failed in the last hour or keeps retrying; the app's own budget spent is not trouble).

**Only during the first sync**, above the profile column's skeleton (the card has nothing to show yet):
`MainPageProfilePsnSync` shows when Sony was last read and a **countdown** until the refresh button may read it again
(10 minutes), one line in plain words in a live region (`psnSyncMessage`: trouble first, then old data, then the
stage), the steps (shape and word, never colour alone), a `ProgressBar` with `aria-valuenow` and `aria-valuetext`
(still under reduced motion) and the wait; on a phone the steps fold behind a chip (`aria-expanded`). **Never inside
the profile card** (2026-11-19, the owner: a status line in the PSN card broke the column's look, every platform's
card stays the same; phase 4's "Updated…" line went with it). Where routine syncs, old data and "PSN is under
maintenance" are shown once the card is there is still to be designed on the canvas: today they reach the user only
as toasts (an asked-for refresh) and `/api/psn/status`. Words in all nine languages (`T.psn.sync`), never "NPSSO",
"429", "token" or "job".

`usePsnSync` reads the state again every 4 s while the core lands and every 15 s after, never once it is done (or
paused). The page's own reads wait out a first sync by themselves (202), so it refetches only after a refresh the user
asked for. Toasts: the core landing and the end of a first sync seen from its start, and the end of an asked-for
refresh; a routine sync is quiet. The refresh button posts `/api/psn/refresh`: queued (202), already running (409,
"Your PlayStation is already being updated") or too soon (429, "You can update again in N min"), each a toast, never
an error.

**The core first.** The `titles` job now only stores the list (1 request per 800 games); the played list, trophy sets
and IGDB art are their own `enrich` job at the same priority, queued after it. So a crowd of first links each gets
its library before anyone's play data: the core costs one worker call per link. Call totals unchanged
(`psnCallBaseline.test.ts`).

**Numbers** (`src/lib/psnMetrics.ts`, `migrations/049_psn_metrics.sql`, database-wide so every instance adds up):
- per account and minute (`psn_account_stats`, written with each call in the lease's own statement): calls, by
  function (`by_fn`), ok, 429, 401 (`auth_errors`), 403 (`forbidden`: a hidden profile, an answer and not the
  account's fault, so it counts as healthy), 5xx;
- `psn_timings`: one row per Sony call (`sony`, its account, its time) and per PSN page read (`read`; `ok` = the store
  answered, false = a 202). The eight read routes are wrapped in `timedPsnRead` (recorded after the answer). Swept
  after two days by the pool's tidy-up;
- `psn_sync_jobs.started_at`: the first claim's time, so the lag is `started_at - run_after` (plus the age of jobs
  due and still waiting, so a dead worker shows).

`psnPoolStatus` carries them (`metrics`), so the admin panel, the alerts (pre's too, read-only) and
`/api/ops/psn/status` (`metrics`: queue due, lag p95, read and Sony p95, 429s in 5 minutes) read the same numbers.
The PlayStation tab shows them under the accounts (`AdminPsnPoolMetrics`): Sony call p95, page read p95 (15 min),
reads served at once, queue due / queued / running, lag p95, 429s in 5 minutes, and per account calls a minute, by
function, 429 %, 401, 403, p95 and days left; with the switches this deployment runs with.

**Alerts** added (`psnAlerts.ts`, Spanish texts in `psnAlertMessages.ts`): 429s above **1 % of ≥ 20 calls in the
last 5 minutes** (replaces phase 3's 5 % in an hour), the queue's **lag p95 above 15 minutes** (≥ 5 jobs), a **page
read's p95 above 1 s** (≥ 20 reads in 15 minutes). Kept: an NPSSO at 14 / 7 / 3 / 1 days (the issue's "< 7 days"),
fewer than two usable accounts when two or more are meant to serve, quarantine, failing syncs, the digest. They are
looked at when upkeep runs (after PSN traffic, at most every 15 minutes, and the 09:15 cron): on Hobby "5 minutes" is
the window, not the frequency. On Pro, run `/api/cron/psn-alerts` every 5 minutes.

**Switches** (`src/lib/psnMode.ts`, env vars read on every call; a redeploy applies them):

| Variable | Value | What happens |
|---|---|---|
| `PSN_MODE` | `live` (default) | Everything runs |
| | `queue` | Only the core (`summary`, `titles`) is read; play data, the year and the history wait in the queue |
| | `stale` | Sony is never called (`psnCall` throws `paused`): pages serve the store, the queue waits, link and verify answer 503 `paused` ("PSN is under maintenance") |
| `PSN_POOL_ENABLED` | `true` (default) / `false` | `false`: the oldest active account does everything, no failover |

No flag for the verification gate: it is always on (the owner's decision, phase 1).

### Load and chaos (phase 5)

`src/lib/psnLoad.test.ts` runs links, the worker and the readers against the fake Sony, in memory (`PSN_LOAD=1 npx
jest src/lib/psnLoad --coverage=false` prints the table). Every link at the same moment, 6 games each; the core's wait
is modelled from the worker calls made before each list landed, at 30 worker calls a minute per account (40, three
quarters for the worker):

| links at once | accounts | worker calls a minute | core p95 | last core |
|--:|--:|--:|--:|--:|
| 10 | 1 | 30 | 22 s | 22 s |
| 100 | 5 | 150 | 38 s | 40 s |
| 1,000 | 5 | 150 | 380 s | 400 s |

No read answers 5xx in any of them (202 before the worker, 200 after). **The issue's "core p95 under 60 s" holds up
to about 140 links in the same minute on five accounts** (one call each); 1,000 at once is Sony's budget, not the
code: they queue, each sees its place in line and a wait, and the links themselves are refused with 429 `busy` once
the foreground share is spent (never a 5xx). More accounts or a higher `rate_per_min` (if Sony allows it) move the line.

Chaos, 20 users on two accounts: one account answering 429 to everything (invisible: the other carries it, the
first rests), every account's first token expired (dropped, signed in again, nobody notices), Sony's 5xx on a third
of the list reads (retried until every core lands; reads never 5xx), every account resting (stored data served, 200;
new links told 429 `busy`, never 5xx), a dead worker (synced users 200, new ones 202).

Still to do with real accounts: whether Sony's 429 is per account or per IP (two accounts needed), and PSN-4 / PSN-5.

## Runbook

**Renew an account** (an alert "caduca en N días", or the panel's "Next renewal"): admin panel → PlayStation → Renew
on that row. In a private window (or its own browser profile) sign in to playstation.com as that account, open
`https://ca.account.sony.com/api/v1/ssocookie`, copy `npsso`, paste it. It is kept only if Sony gives its expiry, the
sign-in works and the account reads its own profile. Renew about one every 12 days so they never die together (the
panel suggests which and when; "Expires near another" marks crowded ones).

**Drain an account** (to retire it, or it misbehaves): Drain on its row. It finishes what it has in flight, takes no
more, and is paused by the next upkeep. Resume puts it back. Remove deletes its sign-in (the audit keeps who did it).

**One account quarantined** (alert "en cuarentena": its refresh token and NPSSO were refused): renew it as above.
Users notice nothing while another account is active. With PSN-1 alone, Sony is not read: pages serve the store, new
links answer `busy`; renew at once.

**Too many 429s** (alert above 1 % in 5 minutes): look at the numbers per account. One account: it rests by itself
(60 s, doubling to 5 min); lower its `rate_per_min` (PATCH). All of them: set `PSN_MODE=queue` in Vercel and redeploy
(only the core is read), and lower `rate_per_min`; back to `live` when it calms down.

**The queue is late** (alert lag p95 above 15 minutes): the numbers say how many are due. Traffic drains it on Hobby;
with no traffic only the 04:30 cron does. Call `GET /api/cron/psn-worker` with `Authorization: Bearer $CRON_SECRET`
to drain 55 s by hand. Many due and Sony fine: the pool is too small for the load (more accounts). On Pro, schedule
the worker every minute.

**Pages slow** (alert read p95 above 1 s): reads are database only, so it is Neon, not Sony: check Neon's dashboard
and the read routes in Vercel's logs.

**Every account down, or Sony down**: set `PSN_MODE=stale` and redeploy. No call goes to Sony; pages serve what is
stored with "PSN is under maintenance. Your data is still here."; linking and verifying answer `paused`. Renew or
wait, then back to `live`: the queue resumes where it was.

**Sony changes something** (a call starts failing for everyone, "failing" on many profiles, odd shapes):
`PSN_MODE=stale` first (users keep their data), then read the `[psn]` and `[psnQueue]` lines in Vercel's logs and the
401 / 403 / 5xx columns of the numbers, and psn-api's issues (sources at the top of this file). Fix the fetcher in
`psnClient.ts` (the only place that calls Sony), test it against the fake (`test-utils/fakePsn.ts`), then `live`.

**The pool itself misbehaves** (leases stuck, an account picked when it should not be): `PSN_POOL_ENABLED=false` makes
the oldest active account do everything, as before the pool, until it is fixed.
