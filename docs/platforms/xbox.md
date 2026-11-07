# Xbox (OpenXBL) — admin-only for now

Moved out of `CLAUDE.md` on 2026-11-07 (#124); `CLAUDE.md` → Platforms keeps the gate and the reason.
How Xbox fails: `README.md` here. The quota contract: `../87-xbox-quota-hardening-spec.md`.

Read through OpenXBL (xbl.io, an unofficial proxy over Xbox Live), all in
`src/lib/xboxClient.ts`. It is a 1:1 of PSN's integration (link by gamertag,
summary, library and categories, `/xboxGame/[id]`, feeds, pins, favorites,
groups, collection, friends, public profiles, admin linking) **but only admins
see or use it**. Migrations 033–035 (xbox columns, `'xbox'` game source, pinned
achievements) were applied 2026-10-15. Plan and measured findings:
`archive/xbox-integration-plan.md` (Spanish, the 2026-10-15 spike).

- **Xbox stays admin-only on purpose (decided 2026-10-16), and the reason is money.**
  OpenXBL's free plan is 150 calls an hour for the whole app, and one new user costs
  about 4 calls (the gamertag search, which linking and the summary share; the library; its
  play time; the first game's achievements) plus 2 per
  Xbox 360 game opened. The user does not want to pay for a plan yet, so **do not set
  `XBOX_ADMIN_ONLY` to `false`, and do not suggest it as a next step**, until they
  say they will pay for a plan (or accept limiting cold loads). When it does open:
  upgrade the plan, then update the landing text, site title and meta description
  (they still list three platforms), the public pages and landing FAQ (`CLAUDE.md` → Public
  pages) and the terms.
- **The gate is one switch**: `XBOX_ADMIN_ONLY` in `src/utils/xboxAccess.ts`
  (`canUseXbox(admin)`, `sourceAllowed(source, admin)`). To open Xbox to everyone,
  set it to `false`; nothing else needs to change. It is enforced in three
  places and all three must keep holding: the routes (`requireXboxUser` /
  `requireXboxSession` answer 401/403; every pin, hide, favorite, group and
  order route calls `sourceAllowed`), the UI (`useXboxEnabled`), and the paths
  that show *other* people's data (public profile, follows, search, groups,
  favorites) which drop Xbox rows and fields for a non-admin viewer. A new
  place that lists games or accounts must filter Xbox the same way.
- `users.xboxxuid`/`xboxgamertag` are in the session (`xboxxuid`); users link by
  typing a gamertag, which nothing proves is theirs (like PSN), so no uniqueness.
- Secret achievements stay concealed until the viewer reveals them
  (`useRevealedAchievements`); the Ask-an-AI export uses gamerscore.

- **One app key, not the user's** (`OPENXBL_API_KEY`, server-only, never
  `NEXT_PUBLIC_`), like PSN's NPSSO. Without it the routes answer
  `503 not-configured`; a refused key answers `503 unauthorized`.
- **150 calls an hour for the whole app** on the free plan. Everything is cached
  in `steam_cache` under `xbox:` keys. The ~4-call cost above covers a first visit only,
  not a home with activity/year scans (those are what #87 hardened).
  `xboxCall` also enforces a PostgreSQL-backed 150-attempt hourly budget per
  environment: refused attempts are removed and a database failure refuses the
  call. OpenXBL headers remain authoritative across environments sharing the key.
  Bump a key's `_vN` when its value's shape changes.
- **OpenXBL answers errors with HTTP 200** and the real status in the body
  (`{ code: 400 }`): `xboxCall` checks both. It also refuses
  `Accept-Language: *`, which Node's fetch sends by default, so a language is
  always sent.
- **Data shape:** gamerscore, not trophy grades; no DLC groups. Newer games report
  `totalAchievements: 0` while their gamerscore total is real, so progress goes
  by gamerscore and the achievement total may be `null`. Xbox 360 games use
  another endpoint and shape (`is360`: Xbox's `mediaItemType` is `Xbox360Game`
  or `XboxArcadeGame`; **not** "devices is only Xbox 360", because backward-
  compatible games list newer consoles too and the modern endpoint answers them
  with no achievements), and take **two calls**: the title's whole
  list (`achievements/player/{xuid}/title/{titleId}`, all locked) and what the
  account unlocked (`achievements/x360/…`), joined by `merge360Achievements`
  (measured 2026-10-15; the x360 one alone lists only the unlocked). If a list
  still comes up short, `XboxPartialListNote` says so. Their icons are not URLs: they are built from `titleId`
  and `imageId` in hex (`xbox360Icon`).
- **Image hosts:** `images-eds.xboxlive.com` and `image.xboxlive.com` have no
  certificate for https; `xboxMappers.https()` swaps them for the `-ssl` twins.
  Keep every Xbox image going through it. `titleId` is a decimal string; the largest
  seen is under 2^31 (the `game_id` columns are INTEGER), but check before storing it.
- **Play time** comes from one `POST player/stats` (`MinutesPlayed`, up to 150
  titles per call) made inside the cached library load (`xbox:titles:v7`); a
  backward-compatible 360 game is asked under its `modernTitleId`
  (`xboxStatsTitleId`). A failure leaves the library whole, without hours, and
  `playtimeComplete: false` keeps `X-Xbox-Partial: playtime` on later cache hits.
  Many games simply have none.
- **Twin titles:** Xbox can list a game twice under one name, the game and a title with no
  achievements that launches it (Minecraft: Xbox 360 Edition, measured 2026-10-21).
  `foldTwinTitles` drops the empty twin in the library load and gives its session and play time
  to the game; a game with no achievements and no twin stays.
- **Backdrop:** a game page's wide picture is IGDB's (`heroUrl` in
  `/api/xbox/details`), fetched when the page opens. The library's shelf cards
  (`LibraryShelfBanner`) ask for the same, one card at a time as RA's screenshots,
  so at most a shelf's worth (`SHELF_CAP`); until it arrives, or with no match, they
  show the blurred tile. Lists and icons keep Xbox's own tile.
  Do not enrich the whole library from IGDB at load (135 searches).
- **Measured 2026-10-16:** an unknown gamertag answers HTTP 200 with `code: 404` in
  the body (→ `not-found`). A library the viewer cannot read answers like a
  nonexistent xuid, `titles: []` with **no `achievementSummary`**, while a public
  account with no games has the summary: that is how `xboxLibraryData` tells
  `private` from empty. A public non-friend's library and achievements read fine
  (one was 1000 titles, 1 MB), so play time is only asked for the 300 most recently
  played games.
- `/privacy` says what Xbox keeps and who receives it (gamertag, XUID, OpenXBL, Microsoft)
  in all 9 languages; the landing text, site title and meta description still say
  "RetroAchievements, Steam and PlayStation" on purpose: change them when Xbox opens to everyone.
- Admin explorer lookups and linking are logged (`xbox-lookup`, `link-xbox`,
  `unlink-xbox`). Do not add a second Xbox provider without asking.
- **Quota/failure hardening (2026-10-30, #87):** `xboxCall` has a 5 s timeout
  (504 `timeout`), a per-instance 429 cooldown and feed scans stop scheduling
  games on 429. `steam_cache` can serve the last success stale only for
  `failed`/`timeout`/`rate-limited`, never for private/not-found/disabled keys;
  nested stale is never rewritten fresh and in-flight/backoff callers recheck
  their own failure policy. Expired Xbox successes stay 30 days. Responses and
  logs use `xboxTelemetry.ts`: sanitized operations, request ids, real upstream
  counts, cache outcomes, `X-Xbox-Stale` and `X-Xbox-Partial`, never XUIDs or
  gamertags. Assembled feeds are `xbox:feed:v2:`; home derives 60-day Xbox
  activity from the shared year instead of requesting it twice. Following reads
  one detailed friend at a time and Xbox score reads two games per pass. Full
  contract: `docs/87-xbox-quota-hardening-spec.md`.
