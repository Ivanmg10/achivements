# PlayStation (PSN)

Moved out of `CLAUDE.md` on 2026-11-07 (#124). How PSN fails: `README.md` here.

Read through `psn-api` (Sony's unofficial mobile API), all in `src/lib/psnClient.ts`.

- **One app account, not the user's.** Every call is made as the PSN account
  whose NPSSO the app holds; it can read any profile with public trophies.
  Users link by typing their online ID — nothing proves it is theirs, so
  `psnaccountid` is deliberately **not unique** (a squatter must not lock the
  owner out). `/privacy` and `/terms` say so.
- **The NPSSO dies 60 days after sign-in, and nothing extends it** (measured:
  refreshing returns the same 10-day refresh token; psn-api issue #171; Sony's
  sign-in has a captcha). It lives encrypted in `psn_credentials`
  (`migrations/026`, `src/lib/psnCredentials.ts`, `secretBox`), is renewed by
  pasting a new one in the admin panel, and `/api/cron/psnToken` mails the
  admins from 7 days before. `PSN_NPSSO` only seeds the first setup.
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
- **Two lists, merged**: the trophy list (`getUserTitles`) and the played-games
  list (play time, last session, store art, PS4/PS5 only, its own privacy
  setting). `lastTrophyAt` is the trophy list's date and keys every trophy
  cache; `lastPlayed` is the last session when known.
- **Caches** live in `steam_cache` under `psn:` keys. When the shape of a
  cached value changes, bump its key's version (`psn:titles:vN`) in the same
  change — a dev server will otherwise serve the old shape.
- **PS3/Vita games** have no play data and no Store page: their cover,
  backdrop and release year come from IGDB (`src/lib/igdbClient.ts`, a Twitch
  app in `TWITCH_CLIENT_ID`/`TWITCH_CLIENT_SECRET`), matched by title and
  platform, cached half a year. Without the keys they keep the trophy icon.
  Every PSN game page also asks IGDB for its summary, studios, genres and
  screenshots (`igdbDetails`, `GET /api/psn/details?id=`, keyed by Sony's
  title from the user's list, never by text from the request). English only;
  a 404 just means the page goes without them.
- Sony returns errors as bodies, not throws: every call goes through
  `psnCall(fn, call)` (`fn` names the endpoint for the call counters, see Call baseline; `unwrap()` plus one retry after 2 s when Sony says "too many
  requests" — psn-api hides the HTTP status and `Retry-After`, so it goes by
  the message). `psnFailure()` maps them to 503 / 403 (private) / 429 (rate
  limited, with `Retry-After: 60`) / 502. The client reads a 429 as a plain
  failure with a retry button.

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
