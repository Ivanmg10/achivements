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

Facts that must keep holding go in `CLAUDE.md`, not here; an entry can say
"added X to CLAUDE.md".

---

## 2026-10-16 — Platform failures audited, play time, feeds, preferences on the account (`feat/xbox-integration`)

**Did** — (1) Audited how each platform reports "unknown / private / key refused /
busy" and wrote the table in `CLAUDE.md` ("How each platform fails"). Fixed what
was wrong: RA's refused key was a retried 503 (now `403 ra-key-invalid` + a notice),
a Steam profile made private after linking showed as empty (now `403 private`),
Xbox private libraries are detected (measured: `titles: []` and no
`achievementSummary`). (2) Total play time on the Xbox cards and across Steam/PSN/Xbox
in the collection numbers. (3) The consoles unticked in preferences now also leave
the feeds, the streak, the heatmap and the charts (`useConsoleVisibility`).
(4) Preferences follow the account: `migrations/036_user_preferences.sql`,
`/api/preferences`, `usePreferencesSync`, a fixed list of keys. Privacy text updated.
**Why** — The user asked for all of the above, and not to open Xbox to everyone yet
(OpenXBL's free plan, 150 calls an hour, would not hold it; recorded in `CLAUDE.md`).
**Decisions** — Xbox stays admin-only until the user decides to pay for a plan.
Preferences stay in the browser too (instant, works signed out) and mirror to the
account; the account wins on sign-in.
**Open** — `migrations/036` must run before this is deployed: without the column
`/api/preferences` answers 500 and every preference change toasts an error.
`develop` shares the production database, so it was run only with the user's OK.
**Watch out** — A new feed of unlocks must filter through `useConsoleVisibility`.

---

## 2026-10-16 — Library layout remembered; tooltips that fit; concealed tiles (`feat/xbox-integration`)

**Did** — (1) The library's Shelves / List / Cards choice is now saved in the
browser (`library-layout` in `useLibraryPrefs`, one choice for every category) and
the list opens on it; it used to go back to shelves on every visit and category.
A search typed on the shelves still moves to the list, but only while it is
there and without overwriting the saved choice. (2) Achievement/trophy
tooltips ran off the right edge on the last badges: `tooltipStyle` (new util)
flips them left/up when they would not fit, in the four grids (RA, Steam, PSN,
Xbox). (3) Secret achievements/trophies showed as an empty dark square that
looked like a broken image; `ConcealedBadge` puts a question mark in it (Xbox
and PSN grids). The three blanks in Guitar Hero III were its three secret
achievements — all 59 icons exist on Xbox's CDN.
**Decisions** — Saved in the browser like the other library prefs, not in the DB.
**Watch out** — The saved layout is read after hydration, so the first paint is
the default for a moment.

---

## 2026-10-16 — Xbox gaps against PSN: public profile, play time, backdrop, privacy (`feat/xbox-integration`)

**Did** — An audit of PSN-only code found and closed: (1) `useProfileLibrary`
ignored Xbox, so public profiles and friend comparisons had no Xbox games;
(2) play time: one `POST player/stats` inside the library load, shown in every
card/header/detail/group row like PSN's and in the AI export; (3) a wide
backdrop for the game page from IGDB (via `/api/xbox/details`, which also got
the route test it was missing); (4) `/privacy` now covers Xbox (9 languages);
(5) gamertag on the admin user card and in the admin search.
**Decisions** — Backdrop only on the game page: enriching the whole library from
IGDB would be ~135 searches on a cold load. The marketing texts (landing, site
title, description) still list three platforms until Xbox opens to everyone.
Retro 360 games report minutes under `modernTitleId` (measured: 5 of 9 had a value).
**Open** — Private profile / unknown gamertag responses are still unmeasured.
Library cache key is now `xbox:titles:v5`.
**Watch out** — The stats call is one more OpenXBL call per library refresh.

---

## 2026-10-16 — Account preferences in tabs (`feat/xbox-integration`)

**Did** — The preferences card was one long column (it grew with every platform
and stretched the identity card beside it, leaving big empty gaps). It is now
tabs, reusing `MainPageProfileTabs`: General (theme, language, gender, public
profile, hidden games) and one per platform (favourite game + that platform's
choices + its consoles). New `UserPreferencesGeneral` and
`UserPreferencesPlatform`; the PSN/Xbox/RA preference blocks lost their own
headings (the tab names them) and the console list is always open inside its tab.
Last tab remembered in the browser. Translations: `prefsGeneral`,
`prefsTabsLabel`; the unused `*Section` headings were removed.
**Why** — The user asked to redesign that part of the account page.
**Open** — Not looked at in a browser. The identity card can still leave gaps
when it is taller than the preferences (it stretches to the row).

---

## 2026-10-16 — Choose which consoles show, per platform (`feat/xbox-integration`)

**Did** — A "Consoles" preference under RA, PSN and Xbox in the account page:
a tick per console in the user's library (with its game count). New
`consoleFilter.ts`, `useHiddenConsoles`, `UserConsolesPreference`,
`UserRaPreferences`; the three data contexts filter by it and expose `consoles`;
PSN/Xbox expose `fullLibrary` too. Strings in all 9 languages. Rules in
`CLAUDE.md` ("Consoles to show").
**Why** — The user asked for a checkbox per console, per platform, to choose
what shows.
**Decisions** — Browser storage like the other PSN/Xbox preferences (no migration
on the shared DB); it does not follow the account across devices. Stored as the
unticked names. Filter in the contexts so every list, the collection and the
stats agree. Steam skipped (no consoles). Feeds and streak left unfiltered.
**Open** — If it should follow the account or show on public profiles, it needs a
column. The home "recent achievements" still include unticked consoles.
**Watch out** — Look games up by id in `fullLibrary`, never `library`.

---

## 2026-10-16 — Xbox 360 backward-compatible games had no achievements (`feat/xbox-integration`)

**Did** — 9 of the 12 Xbox 360 games in the library (Modern Warfare 3, Black
Ops II, Skate 3, Tekken 6…) showed "This game has no achievements": they list
Xbox One/Series among their devices, so `is360` was false and the modern
endpoint (which answers them with an empty list) was used. `is360` now comes
from `mediaItemType` (`Xbox360Game`/`XboxArcadeGame`); devices only decide when
the type is missing. Cache keys bumped to `xbox:titles:v4` and
`xbox:achievements:v5` (the empty lists were cached up to 30 days).
Checked on real data: both 360 lists agree on ids, scores and icons, and the
icon URLs load for locked and unlocked ones.
**Watch out** — A 360 game costs 2 calls, so feed scans that touch many of them
spend more of the 150 calls an hour.

---

## 2026-10-15 — Xbox 360 covers, icons and partial lists (`feat/xbox-integration`)

**Did** — Fixed Xbox 360 games (seen in the browser: Guitar Hero II): the cover
and the achievement icons did not load, and only 14 of 50 achievements showed.
Covers: Xbox's plain image hosts fail over https, so `https()` in
`xboxMappers.ts` now swaps them for the `-ssl` hosts. Icons: built from
`titleId`/`imageId` in hex. List: OpenXBL's 360 endpoint returns only unlocked
achievements; the locked ones come from the other 360 endpoint, the title's
whole list (`achievements/player/{xuid}/title/{titleId}`, found in
`https://api.xbl.io/docs/json`), joined with `merge360Achievements`. A 360 game
costs 2 calls. `XboxPartialListNote` stays as a net if a list still comes up
short (all 9 languages). Cache keys bumped to `xbox:titles:v3` and
`xbox:achievements:v4`.
**Open** — Check on a real 360 game that the ring and the grid show all 50.
**Watch out** — Bump the cache version whenever a mapper's output changes: the
achievements are cached for 30 days.

## 2026-10-15 — Xbox integration 1:1 with PSN, admin-only (`feat/xbox-integration`)

**Did** — Replaced the explorer-only scope with the full PSN-equivalent Xbox
integration: link by gamertag, summary, library and categories, `/xboxGame/[id]`,
recent/year feeds, pins, favorites, groups, collection and stats, friends,
public profiles, admin linking. `'xbox'` is now a `GameSource`; migrations
033–035 (applied to the shared DB 2026-10-15, with the user's OK). Tests for the
new hooks, utils, routes and components; whole suite, `tsc`, lint and build pass.
**Why** — The user asked for "1:1 with PSN, but only available and visible to admins".
**Decisions** — One switch (`XBOX_ADMIN_ONLY`) plus server 403s, hidden UI and
filtering of other users' Xbox data. Progress by gamerscore (`totalKnown` flag)
because modern games report no achievement total. Achievements are cached by
`lastPlayed`, feed scans are capped, to live within 150 calls/hour.
**Open** — Never checked in a real browser (needs an admin login). Private
profile / unknown gamertag responses and play time (`MinutesPlayed`) are
unverified. Cold year feed can spend up to ~40 calls. Rotate the API key: it was
pasted in the chat. Several edited existing components have no new xbox cases yet.
**Watch out** — A new place that lists games or accounts must filter Xbox for
non-admins (see CLAUDE.md). Repo files are CRLF.

## 2026-10-15 — Xbox via OpenXBL, admin-only explorer (`feat/xbox-integration`)

**Did** — Analysed OpenXBL (xbl.io) against the PSN integration
(`docs/xbox-integration-plan.md`), ran the Phase 0 spike with a real key, and
built an **admin-only Xbox explorer**: gamertag → profile, library with
progress and gamerscore, and each game's achievements (rarity, unlock dates).
`src/lib/xboxClient.ts`, `src/utils/xboxMappers.ts`, `src/types/xbox.ts`,
`/api/admin/xbox` and `/api/admin/xbox/achievements`, two hooks, and
`admin-xbox/AdminXbox.tsx` + `AdminXboxGame.tsx` in the admin panel. New admin
action `xbox-lookup`. Added the Xbox section to `CLAUDE.md`, a row in
`docs/architecture.md`, `OPENXBL_API_KEY` in README and `.env.example`.
**Why** — The user wants Xbox next to RA, Steam and PSN, and asked to try it
admin-only first, with few calls, before opening it to users.
**Decisions** — No migration and no user linking: nothing is stored, so the
shared production database is untouched. Progress goes by gamerscore because
modern games report `totalAchievements: 0`. Xbox 360 stays in the library list
and uses its own achievements endpoint. `Xbox` is not added to `GameSource` yet:
that would touch ~50 files and belongs to the user-facing phase.
**Open** — What a private profile and an unknown gamertag return (needs
someone else's account); play time (`MinutesPlayed`) is proven but not wired;
the user-facing phases (link by gamertag, library pages, pins/groups/feed) are
not started and need the user's go-ahead; whether the free plan's 150 calls an
hour is enough once users link. Ask first whether to rotate the API key: it was
pasted in the chat once.
**Watch out** — OpenXBL answers errors with HTTP 200 and the code in the body,
and refuses `Accept-Language: *` (Node's fetch default). The base URL is
`https://api.xbl.io/v2/`. The first spike found the SDK's field names wrong for
the profile (it is a `settings[]` list), so trust `docs/xbox-integration-plan.md`
section 6 over the SDK.

## 2026-10-14 — Release v1.4.0 (`chore/release-v1.4.0`)

**Did** — Bumped to 1.4.0 and opened the `develop` → `main` PR. Updated the
milestones in `CLAUDE.md`.
**Why** — `main` was still on 1.2.12; `develop` had 1.3.0 plus public
profiles, follows and the Following section, which are new sections, so a
minor bump per the versioning scheme.
**Decisions** — 1.4.0 rather than shipping as 1.3.x (the user's call).
Checked before opening: `main` has nothing `develop` lacks; migrations 031 and
032 are applied (read-only query on the shared DB); no new required env var.
**Open** — Merge the release PR with a **merge commit**, then check
www.cheevovault.com.

## 2026-10-14 — README and internal docs (`docs/readme-and-agent-docs`)

**Did** — Rewrote `README.md` (it still described Next 14, Steam over OpenID,
PSN "coming soon", 8 themes and the pre-1.0 gates). Added `docs/README.md`
(index), `docs/architecture.md` (map of the code and data flow) and this
worklog. Moved the old Steam plan to `docs/archive/` with a note on what no
longer holds. Added the "Documentation — MANDATORY" section to `CLAUDE.md`.
**Why** — The user wanted the docs brought up to date, and every future agent
to leave a written record of what it did.
**Decisions** — Rules stay in `CLAUDE.md` (it is loaded into every agent's
context); the README is for people landing on the repo and points there
instead of copying the Email/Sessions sections, which had gone stale twice.
The worklog is one file, newest first, so reading the top is enough.
Then, on the same branch: a rule in `CLAUDE.md` → Pull requests that a PR is
never opened without its full description and that it is updated whenever more
commits change what it says, plus `.github/pull_request_template.md` so PRs
opened on the web start from the same template. And
`.github/workflows/pr-description.yml`, the first GitHub Action in the repo: it
fails a PR whose description is missing a section or leaves one blank.
**Watch out** — For the check to block merging it must be added as a required
status check, named `pr-description`, in a ruleset on `develop` and `main` (GitHub settings,
not code). The user created it as `pr description`, **with "require branches to be
up to date" on, by choice**: every PR now has to merge its base in before it can
merge, and `version.ts`/`package.json` will conflict when the base moved (keep the
higher version). Written down in `CLAUDE.md` → Environments. The body reaches
the script through `env`, never `${{ }}` inside `run:`, so a PR description
cannot inject shell.
**Open** — Nothing from this session.
