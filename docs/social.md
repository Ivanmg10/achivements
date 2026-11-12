# Social: presence, follows, the showcase, Vault Points and the rankings

Moved out of `CLAUDE.md` on 2026-11-07 (#124). `CLAUDE.md` → Social keeps the privacy invariants. The
score's formula, balance tests and decisions: `rankings-plan.md`.

## Presence — "online" and "last seen" (2026-10-19)

`users.last_seen_at` and `users.show_presence` (`migrations/038_user_presence.sql`,
applied 2026-10-19; **any other database needs it before this code runs**:
`userRecord` reads `show_presence` on every session, so without it every
signed-in request fails).

- **Written only by the heartbeat**: `usePresenceHeartbeat` posts to
  `/api/presence` while the tab is visible (arrival, every 2 min, back to the tab);
  the route writes at most once a minute. Do not write it from the session or
  another read path.
- **Online = seen in the last 5 minutes**, decided on the server. `lastSeenAt` is
  rounded down to 5 minutes: never send the exact time. Past 30 days it says only
  "over a month ago". **One rule, one place**: every query that shows it selects
  `presenceColumns()` (`src/lib/presence.ts`) — the follows overview, the user search
  and `findPublicUser` (the public profile).
- **`show_presence` is enforced in SQL** (on by default; the switch is in
  Preferences → General). Off: `online` false and `lastSeenAt` null, to everyone.
  Not reciprocal (hiding yours does not hide others'), by the user's choice.
- **Wherever another user's picture shows, so does it** (2026-10-20, the user's ask):
  `PresenceDot` on the picture (in a `relative` wrapper; `announce` when no text beside
  it says so) and, where there is a line for it, `PresenceLabel` in place of the bio
  (the bio is its fallback). Today: Following (cards, hero), user search and the home's
  friend cards (`UserSummary`), the public profile hero (not on your own), compare,
  someone's game page banner, the friends leaderboard and shared games. A new place
  that shows other users must do the same. Never for your own picture.
- `/privacy` says signed-in users who come across you see it; change it if that grows.
- **"Now playing" on Steam** (2026-10-22, the user's ask): `/api/follows/playing` asks Steam, one
  call per 100 accounts, cached a minute per viewer, for the people you follow who share their
  presence and have a public profile; `useFriendsData` merges it after the overview (which stays
  database-only, so cards never wait on Steam) and `PresenceLabel` shows it over "Online". Steam
  only says it for a public Steam profile. `/privacy` says followers see it.

## Vault Points and the rankings (beta, 2026-10-20)

One score worth the same on every platform, and rankings of it. Formula, balance tests and
decisions: `docs/rankings-plan.md`; layout: `docs/architecture.md` → Vault Points.

- **The formula lives in `src/utils/vaultScore.ts`**, and its balance tests
  (`vaultScore.test.ts`: the same game within ±10 % on every platform, easy games about a
  third of a demanding one) must keep passing. Change a number → bump `RULES_VERSION`.
  Do not weigh native values (gamerscore, grades, RA points) more than the 25 % they have:
  that is what made platforms unequal in the tests.
- **Scores are computed ahead, never on a read.** `scoreRefresh` runs right after a platform is
  linked (`onPlatformLinked` in the four link routes), in back-to-back passes while the user has
  the site open (`useVaultFill` → `POST /api/rankings/fill`, up to 90 s each), after the presence
  heartbeat (6 h freshness) and from `/api/cron/scores` (daily, plus the Monday snapshot). One
  pass at a time per user: every trigger claims `users.score_refreshed_at` first. The rankings
  routes only read `score_games`/`score_periods`; do not call a platform from them.
- **Each platform is read at the pace measured on 2026-10-20 (`PACE`), not faster:** Steam 8 at
  once (29 games/s, no error); RA one at a time, 300 ms apart (a burst of ~7 gets 429 **with no
  Retry-After**; one every 250 ms never failed); **PSN gently**, because it is one app account for
  everyone: 2 at once, 100 games a pass, and 300 games every 15 minutes for the whole app
  (`allowAttempt('psn-score', 'app')`), stopping the pass at Sony's "too many requests"; Xbox 2 games a
  pass (`PACE.xbox.perPass` in `src/lib/scoreRefresh.ts`, lowered from 5 by #87: 150 calls an hour for the app).
  Raising any of these needs a new measurement.
- **The fill is shown, never silent.** Its progress per platform is kept in `steam_cache`
  (`score:fill:<user>`; `FillStatus`, no migration); the header, the account page, each platform's
  card (`VaultFillLine`) and the rankings show it, the viewer's own points carry "≈" until read, a
  finished fill toasts "ready" (only a fill that was pending, never a routine refresh) and a
  platform that failed says why (private profile, refused key) and how to fix it. **Xbox never holds
  the fill up:** whenever its read stops (quota spent included) it settles as `estimated`, as the
  header's ring leaves it out of its count (it sat at 99 % waiting on Xbox, #118). The total a pass
  reports (`FillStatus.points`, the "ready" toast's level) is `vaultTotals`, the header's.
- **"How Vault Points work" (`/rankings/how`, public)** explains it to users. Its prose is in
  `src/translations/vaultGuide.ts` (+ `vaultGuideMore.ts`), in all nine languages but outside `T`
  like the public pages (only this page loads it); every number
  on it (rarity and difficulty tables, examples, level thresholds) is computed from the formula
  and the examples are the same ones the balance tests use (`src/utils/vaultExamples.ts`). If the
  formula changes, reread its prose. Its parts are topics, not steps: no "01" numbers (`FaqList numbered={false}`), the rules a
  plain list, and "Beta" is said once, in the FAQ question (the small tag stays on `/rankings`, #130).
- **A shared place is marked** (`RankRow.tied`, set by the route from the listed people who hold the same rank): "3=" on the
  podium, the table and the list (`RankingsPageRank`), "tied" to a screen reader. Your own level is said once, in the ring
  (the number) with `VaultLevelBadge tierOnly` beside it.
- **Who is listed**: public profile and `show_in_rankings` (Preferences → General; not in the
  session on purpose, see the plan). Hidden games and unticked consoles do not score. A game
  counts only for the account linked now, never while flagged `suspect` (Steam unlock tool;
  admins review it in the panel, logged as `ranking-flag`). Xbox scores only for admins.
- **No ownership verification, by the user's choice (2026-10-20)**: an account linked by two
  users scores for both. The analysis of how to verify is in the plan, for later. Since
  2026-10-21 a user's Steam link is proven by Steam (one user per Steam account); PSN and
  Xbox, typed, are still unproven.
- **`/rankings` and `/rankings/how` are public** (`PUBLIC_PATHS` in the proxy, in the sitemap). Signed out: the
  global list only, no presence (the privacy policy promises it only to signed-in users).
  Responses never carry user ids and are never shared-cached.
- **A profile's public card (2026-10-20):** signed out, `/user/<name>` shows `ProfileTeaser` and
  its link preview (`opengraph-image.tsx`) shows the same, both from `profileTeaser` in
  `src/lib/rankings.ts`: **only what the rankings already show** (name, level, points per
  platform, games at 100 %, achievements), only for someone listed there, a 404 for anyone else.
  Never presence, never an uploaded picture (served to signed-in users only), and the preview
  never fetches a pasted avatar link (SSRF). The proxy opens `/user/<name>` and its image, not
  `/user` nor a game inside a profile. Adding anything to the card means changing `/privacy`.
- **A level shown for another user reads `vaultTotals`/`vaultTotalsOrNone`** (same rules as the
  rankings). Today: the rankings, Following cards, the home's friend cards, the public profile
  hero, the header (yours) and your account page. Progress towards a level is a `ProgressBar`
  or `CircularProgress` in the theme's colour; tiers have their own hue only on their badge.
- **Streaks in the rankings (2026-10-23)** are read from `score_games.unlocks` (UTC days, `streaksOf`),
  never from a platform: they lag the score refresh and may differ by a day from the streak page,
  which reads the live feed. `?sort=streak|best` orders by them (no arrows, no points gap in the zone).
- Rankings are labelled **Beta** in the UI; drop the label when the user says so.
- **Later** (from the roadmap): ownership verification (the user found code-in-bio clumsy; revisit
  with care), a history chart, and CheevoVault's own achievements (advice: they should not give points).

## Follows: who you follow and who follows you (2026-10-20)

- **Both lists are yours alone.** `/following` has two tabs, "Following" and "Followers"
  (`#followers`, opened from the account page's counts); `GET /api/follows/overview?who=followers`
  answers only for the signed-in user. Nobody else is ever shown who follows whom: do not add a
  follower list or count to public profiles without asking. `/privacy` says so in all 9 languages
  (changed 2026-10-20 at the user's request; before, followers were a number only).
- **Public profiles only**, on both sides and in both counts (`/api/follows/count`): a private
  profile drops out of the lists until it is public again.

## Achievement showcase vs achievements to get (2026-10-20)

Two different things; do not mix them up again.

- **Showcase** ("Vitrina de logros"): up to **5 earned** achievements a user chooses to
  show off. Its own table, `showcase_achievements` (`migrations/039`), one shape for every
  platform (`achievement_key`: RA id, Steam apiname, PSN trophy id, Xbox id; text and
  badge copied in). `/api/showcase` (GET own or `?user=`, POST adds while < 5 and answers
  `409 showcase-full`, DELETE `?id=`, PUT order). Earned is the client's word plus a
  required `earnedAt` (`parseShowcaseEntry`). **It is what others see**: the public
  profile (`PublicUserAchievementShowcase`), Following cards and the home's friend cards
  (overview → `showcase`).
- **Achievements to get** ("Logros por conseguir", the old "Logros fijados"): the user's
  own goals, `pinned_achievements`, `/api/favorites`. **Private**: GET ignores `?user=`,
  and nothing shows them to anyone else. Do not add a place that does.
- Managed in the Pinned section (showcase block on top, `MainPagePinnedSectionShowcase`).
  Its "+" opens `ShowcasePickerModal`: the user's games with something earned
  (`useProfileLibrary`, those with an unlock this year first), then a game's achievements
  (`useShowcaseGameChoices`, through the routes its game page uses; earned first, the rest
  greyed, hidden unearned ones concealed), with a way back; the selection spans games and
  goes in at once (`addMany`), never more than fits. Also added from any earned
  achievement through `ShowcaseToggleButton` in `AchievementModal` (RA) and
  `AchievementDetailModal` (Steam, PSN, Xbox). One shared state: `ShowcaseProvider`.
