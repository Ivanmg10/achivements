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

Facts that must keep holding go in `CLAUDE.md`, not here; an entry can say
"added X to CLAUDE.md".

---

## 2026-11-01 — The Layout modal, concept A, and picking a streak (`refactor/78-round-design`)

**Did** — `LayoutModal` is concept A of the canvas: every option in view (no tabs), the theme beside them, a fixed height, the sample
on top of the options on a phone (sticky, sized with container queries). The sample has real games (Steam art through the usual hosts)
and the top bar. Every change animates, see CLAUDE.md → design system. `SegmentedControl` gained `size="lg"` and `tone="outline"`, `Modal`
the `2xl` size. On `/racha`: nothing is picked by default, a streak is picked in the best streaks or on the year and picking it again
lets go; with one picked only it keeps the accent and a rail spans its weeks; each best streak's bar and place are in its tier's colour.
**Why** — the user chose A and asked for an animation per change, tried it on the page instead of the canvas; a ring around the days
and then a halo were both rejected for the streak, and the colour-only version was liked.
**Decisions** — Native first: a CSS transition for the card wipe, the view transition API for shape, font and theme, Framer only for the
card that grows into the cover. The shape first eased its corners inside the sample: the user did not like it, as the bars, the frame
and the page jumped around it. Then a bare sweep of the whole window, invisible because the two looks are nearly the same colour, so
it got a band of the accent in the shape chosen (`sweepEdge`; the two looks clipped apart, and the band is the background of the transition's pair showing between them). It
still jerked, measured frame by frame in Chrome on the GPU: 60 fps with no lost frames, the fault was the curve (14 idle frames, the dialog
crossed in 6 at up to 206 px a frame with a 20 px band). Hence the gentler curve, 1 s, no idle time off screen and a wider band. Measure this kind
of thing in a real window: headless software rendering says 7 fps, and an off-screen window adds a false 1 s. The day by day still opens on the streak going now (or the best) with nothing picked, so the
card is never empty and the page does not jump. The year stays in the accent, not the tier's colour: the user asked for tier colours
on the best streaks only. The theme shortlist is six swatches, the person's own always among them, and the rest in `ThemeModal`.
A theme picked in the modal gets no toast (the dialog stays open and nothing else there toasts); a failed save says so inline.
The font is tried in the sample and reaches the page when the modal closes: the user did not like seeing the page change behind.
The theme went into the modal as swatches, then as a strip under the sample (concept C, v2 broken on the canvas, v3 built); tried on the page, the user
preferred it in its own dialog, so `ThemeModal` stays open on a pick, spreads from the tile and says what is on and saved. The modal's options went back together.
The home's heatmap: the height sets the cell and it stops at 53 weeks, so a row shortened by `--home-fit-trim` left gaps at both sides (cells 30 px → ~22). Cells may now
grow up to 1.5× wider to fill the card (`cellWidth`), and the trim comes back when the profile shrinks (a `MutationObserver`, which was the `ponytail:` ceiling).
The header's account link is cut on the slant like a button (only its background, as `Button` does), the one square piece left beside the level and the streak.
The home's skeleton now draws the two charts' own loading states: it drew its own grid and bars, which were then swapped for theirs. Daily loads as a line (`LineChartSkeleton`),
not bars, and no longer shows a "0" that is not known yet.
**Open** — The user sees the background light up on each change in a modal; not reproduced. Frame by frame in Chrome and Brave the page behind the Layout modal only shows the band
passing, and the theme modal's overlay neither remounts nor changes opacity. `npm run build` not rerun since these changes (it breaks the running dev server's CSS, see the entry below); run it before the
PR. #102 still lists the Layout modal.
**Watch out** — `sharp(buf).extract(a).stats()` ignores the extract: it measures the whole image, which here read as a page lighting up (the band's own share of the frame). Crop to a
buffer first. A dev server can stop picking up `globals.css` with no error: compare the served CSS before believing a measurement. Translations are CRLF in the working copy: a script that rewrites one line must keep that, or git shows the whole file changed.

---

## 2026-11-01 — The round design on every control and surface (`refactor/78-round-design`, #78)

**Did** — New round scale in `globals.css`: surfaces a step softer than slanted, one-line controls as pills, icon buttons as
circles. New tokens `--r-sheet`, `-area`, `-icon`, `-box`, `-box-md`, `-box-sm`, `-tag-sm`, `-badge`, `-cell` and
`--button-inset`, and `--r-control` restated in the slanted block, where it was missing. The header search follows
`rounded-field`. About 245 fixed radii moved to tokens by what each thing is. `uiGuard.test.ts` now refuses `rounded-lg`,
`-md`, `-sm`, `-3xl` and arbitrary values on anything painted, and `designTokens.test.ts` fails if a surface is not rounder
in round than in slanted. `MainSidePanel` and `UserCharts` are deleted (dead, only their tests imported them).
**Why** — #78: round did not feel round. Measured on 96 captures, 946 elements were *less* round than in slanted and 366
more: its values were copied from the site before the slant, and slanted grew past them.
**Decisions** — Buttons are pills too (the user's call, 2026-11-01), though the issue only asks for fields. `rounded-full`
chips stay: right in round, and moving them would change slanted, which the issue rules out; if slanted wants corners there
it is #77's. The search panel is `rounded-sheet`, not `--r-field`: its input draws no box and it holds results. 103 bare
`rounded` stay, as they only show as a focus ring's corner. Tokens are named for the use, and slanted's values restate what
it drew, so several look redundant there (`--r-box-sm` and `--r-tag-sm` are both 4 px) but differ in round.
**Verification** — The computed radius of every boxed element, on 96 captures at 390 and 2560 px, before and after, with a throwaway
account on pre (deleted after; pre back to 68 users). Round compared with slanted went from 946 less round to 0, and 3,797 are now rounder.
Slanted: of 1,061 elements compared, only the header search changed (12 to 14 px, on purpose). 2 more showed up as a change but were
my comparison: a swatch absent from the second run, as the new account had no points yet, paired with a presence dot of its size. 834 suites
/ 5,307 tests, tsc, ESLint and the build pass. Screenshots: `docs/audits/78-round-design/`.
**Open** — Not seen by eye: RA and Xbox pages, generic modals, tooltips, an open `Select`, the admin panel, `/design`, the light
themes. The audit comment for the issue was posted once the user authorised it (it is what closes #78's "audit comment posted"
criterion). The full-width pill buttons are the most debatable part; the user said to look
at it again if it does not convince them.
**Then, from the user's screenshots** — The Following, group and library skeletons asked for `tag` plus `rounded-none`, and the pill won: `Skeleton` has `radius="none"`.
The account's description was an oval: it, `GroupModal` and `GameAiExportDialog` draw a raw `<textarea>` with `fieldClass`, so they got the pill. `multiline: true` is now
required by the guard, and a round corner cuts a textarea's grip, so `--area-resize` is none in round. The header's account link is `rounded-nav`. The favourite game, pin
game and pin achievement modals were a card inside `Modal` (a double frame): now the library's own dialog, with `SearchInput`, and without their own Escape handler. The year's
streak on `/racha` was a white ring per day: each picked day now fills the gap around it in an opaque tone, so the streak reads as one shape, and has `aria-pressed`.
**Watch out** — Do not run `npm run build` with `next dev` running: measured 2026-11-01, the dev server stopped seeing `globals.css` afterwards (it kept the old tokens while
Tailwind picked up new classes) until restarted. `rounded-control` is a soft surface despite its name: it must never become a pill. Tailwind's `rounded-sm` is 4 px, the same as a bare
`rounded`. The audit's preference must be set on the account too: the account wins over `localStorage` on sign-in, so a test
that only sets the browser's value renders the other design.

---

## 2026-10-31 — Expanded card stats and the cover's art (`fix/89-hero-art-expanded-stats`, #89)

**Did** — The RA and Steam stats under an expanded game's ring are one line each (`GameExpandedStatList`, shared), not
three columns in a 142 px cell. The cover (`MainPagePortada`) shows art only once it has loaded and been judged for
its box (`artVerdict`); each source is tried once, the first too small for the box is the background if none fits,
and only a game with no wide picture gets the poster, then its colour alone. RA now reads IGDB too (`/api/getGameArt`,
`igdbRaArt`, `src/lib/raGame.ts`). IGDB's
backdrop is the widest landscape picture, asked for at its real size, and a search hit that shares no title with the
game is no match (`igdb:art:v3`, `igdb:details:v2`).
**Why** — #89: stats piled up, and the cover showed blurred or stretched art.
**Decisions** — The issue says low-resolution art must not be stretched into the background. The user overrode that
on 2026-10-31: a soft wide picture beats a cover with only a box art, so it is set aside and comes back as a last
resort. A portrait is still never cropped in. Source order: Steam library hero → store header; RA IGDB → in-game →
title screen; Xbox IGDB; PSN `heroUrl`
(no longer its portrait cover); then the poster (Steam/PSN box art, RA box art → icon, Xbox IGDB cover through
`/api/xbox/details` → its tile, the user's call), then the tint, or
`NEUTRAL_TINT` if unreadable. Fit depends on the box (at most 2× stretch, aspect 8:7 to 4:1), so a 460 px header fits
on a phone and not at 2560 px. IGDB for RA measured 2026-10-31 with 16 well-known games of 11 consoles: 16 matched, 14
fit at 2560 px. Hacks and subsets skip IGDB; consoles outside `RA_PLATFORMS` keep RA's pictures. Art stays a direct image, not
through `/api/image-proxy`: only the colour needs a canvas, and the 3 MB cap would refuse large backdrops. The proxy
keeps reading the tint, where a failure is neutral and never asked again.
**Verification** — Stats measured in a browser at 390, 1024 and 2560 px, both designs, nine languages, long values: no
overlap or overflow. The real `next/image` was checked with Steam art, cold and cached, including low-res, portrait and
404: the box height never moved. The whole cover was not seen signed in with real data: its behaviour is in Jest.
**Open** — A DLC whose name contains the game's ("Minecraft: Master Chief Mash-up" for "Minecraft") still passes the
title check; IGDB's parent-game field could refuse it, unmeasured.
**Watch out** — IGDB's `t_1080p` stretches a smaller original (1000×562 served as 1920×1079, measured 2026-10-31), so
the file's size says nothing there: that is what made Minecraft: Xbox 360 Edition look blurred. Use `pictureUrl`.

---

## 2026-10-31 — `/user` enters as a whole (`feat/61-entrance-rollout`, #61)

**Did** — `UserIdentityCard`'s `<section>` has `enter-card`, and the preferences and delete cards went from `--i` 3 and 6 to 1 and 2.
**Why** — The user found reaching `/user` abrupt. Measured at 2560 px from `/racha` and `/rankings`: the skeleton lasted ~45 ms, then
the identity card and its banner were at full opacity in one frame, while its two neighbours stayed invisible for up to 240 ms more.
**Decisions** — `/user`'s `loading.tsx` stays, though its skeleton shows only for a moment: without it, a slow connection gets just the thin
top line. View Transitions were rejected: they touch every route, and #61 left page transitions as they are.
**Verification** — Production build, client navigation from `/rankings`, two warm runs at 2560 px and one at 390 px: the page is drawn at
70–90 ms and the three cards are done at ~500 ms. 835 suites / 5,277 tests, tsc and ESLint on the three components pass.
**Then** — The user found it far too fast, since the shorter delays took it from ~850 to ~500 ms and the curve does most of its work
early. `.enter-slow` on the page's `<main>` sets 800 ms and 70 ms apart, and only there: the global tokens also time the shelves, whose
restored cascade must not change. It sits under `prefers-reduced-motion: no-preference`, or it would undo reduced motion's 200 ms fade.
Measured: the cards end at ~800 ms (rounded to two decimals), and at ~220 ms with reduced motion.
**Open** — The brief skeleton is still there, and may last longer in production than on localhost. If it bothers the user, that is the next thing to look at.
**Watch out** — Vercel builds fail now and then (2026-10-31, three times on this PR) with `Can't resolve
'@vercel/turbopack-next/internal/font/google/font'` / `next/font/google queries have exactly one entry`, on a font that changes between
runs (Sofia Sans, then Sofia Sans Extra Condensed). It is intermittent: a later build restoring the same cache as a failed one passed, so
the cache is not the cause, and the commit's code neither (fonts untouched, the same commit passed). Root cause not found. To retry,
`npx vercel redeploy <deployment url>`, which turns the commit's status green; a `develop` → `main` release may need it too. Local
`node_modules` was on Next 16.3.6 while the lockfile says 16.4.2, so a local build is not proof of what Vercel builds: use a clean
`npm ci` copy to compare.

---

## 2026-10-31 — The user's first round on the entrances (`feat/61-entrance-rollout`, #61)

**Did** — Shelves: `.enter-shelves` brings back their cascade in CSS, with the old timings (160 ms between shelves, 55 ms
between cards, title sliding in, bounce). `/user`: `UserVaultLevel` holds its room with `UserVaultLevelSkeleton`, which
`UserPageSkeleton` uses too, and the rankings switch renders unseen until it is known. `useVaultMe`'s `isLoading` now covers
the session read, but not `update()`'s brief `loading` once it has answered.
**Why** — The user preferred the shelves as they were, and on `/user` the level came last and pushed the page down. The home
stays as it is (the user's answer).
**Decisions** — The switch's room is the same row, `invisible` and `inert`, not a fixed height: a guessed 54 px was 17 px
short (real rows are 71 px, up to 132 px on a phone), and any height would fail in another language. An `&nbsp;` in the empty
`h1` was tried and removed: it changed nothing measurable.
**Verification** — With `/api/rankings/me` held back 1.5 s: the card went from a 118 px jump (471→589 px) to none (1009 and
589 px throughout), the platforms from moving 17 px to not moving, and that moment's CLS to 0.0003. Shelves' delays read from
the browser match the old ones, and `data-entered` ends them.
**Then** — The last jumps of a full load of `/user`: the page holds `UserPageSkeleton` until the session is known, as the home
does (`status === 'loading' && !session`), and the follow counts' block is as wide as the text, so it wraps with it on a phone.
CLS went from 0.13 to 0.0004 at 390 px (four loads) and from 0.024 to 0.0004 at 2560 px. Handing the session over from the
server was read and rejected: a nested `SessionProvider` shares next-auth's module-level `__NEXTAUTH`, so the root one would
never fetch, read as `unauthenticated` (`ThemeContext`, `ShapeSync`), and lose its state when the nested one unmounts; in the root
layout it would make every page dynamic; moving it down touches every segment. The layout's own session has `raid`, too.
**Open** — A single load of other pages, signed in as an admin: `/racha` at 390 px has CLS 0.19, the footer moving at 184 ms;
`/following` at 2560 px 0.018; `/rankings`, `/groups` and `/playing` under 0.001. Not looked into.

---

## 2026-10-31 — Entrance animations on every page (`feat/61-entrance-rollout`, #61)

**Did** — One set of CSS entrances in `globals.css` (`.enter-rise`, `-card`, `-rows`, `-cards`, `-grow-x/y`, `--enter-*`
tokens) applied to every route with the families agreed on 2026-10-25; `/user` first as the reference. Replaced every
first-load Framer entrance with it (whole pages fading in, `useRise`, `rankingsMotion`, the shelves' cascade, `ChartCard`'s
`whileInView`, the landing's module). `useEntrancesOnce` ends a list's entrance. `CountUp` gained `format`; `StatPill`,
`GameHeroTile` and the big figures count up. Guard in `uiGuard.test.ts`, specimen in `/design`, docs in `docs/design-system.md`.
**Why** — `/user` felt static next to the home. Most other pages did animate, but through Framer: hidden until hydration,
which the issue forbids.
**Decisions** — A class on the list plus one document listener for `data-entered`, not a wrapper component: a one-word
change per list, and it works in server components. Reduced motion restates the tokens instead of a second set of rules.
A `ProgressBar` grows by being inside an entering element, so no prop. The home's left card and profile column and the
welcome keep their own keyframes (the first are what the user liked, the second is timed to the curtain). `/design` got
its title only; a reference page should not make you wait.
**Verification** — 834 suites / 5,269 tests, ESLint, tsc and the build pass. In a production build, signed in, every route
at 390 and 2560 px in both designs: entrances play, no horizontal overflow, nothing visible stays faint. Reorder: 0 rows
replay with `data-entered`, 12 without. Reduced motion: 200 ms fades, no delay, no movement. Against a build of `develop`, 3
runs each: game page CLS 0 (390) and 0.015 against 0.016–0.037 (2560); no long tasks. Home long tasks equal. Landing LCP
at 4× CPU 836–972 ms against 816–944 ms, CLS 0.
**Open** — Home CLS moved a little: 0.098 against 0.094 at 2560 px, 0.25–0.31 against 0.29 at 390 px. The home's CLS was
already high and comes from data arriving; the Framer fade that was removed probably hid part of it. On a phone the level
badge overlaps the points on `/user` (`UserVaultLevel`), the same on `develop`; not touched here.
**Watch out** — Xbox's game page and someone's game page (`/user/<name>/<platform>/<id>`) were not opened in the browser (same `GameHero` and table classes as the others). The issue's
comment has the route inventory. A list that mounts with a skeleton as its child would play on the skeleton. Measuring in one
Playwright page, init scripts pile up and CLS counts several times: use a new page per run.

---

## 2026-10-31 — Hidden-game visibility and completion dates (`fix/88-hidden-games-completion-dates`, #88)

**Did** — Applied source-qualified hidden filtering at listing BFF and shared client boundaries, including
public subjects, groups, friends, searches, awards, activity, stats and score reads. Hide/show rebuilds
periods and versions ranking caches without deleting curated or score rows. Added nullable base-completion
rules, PSN/Xbox `completedAt` enrichment through existing achievement caches, and matching collection/detail/Vault consumers.
**Why** — Hidden games leaked through recently played and other raw listing paths, and PSN DLC activity moved
base completion to a later year.
**Decisions** — Raw `fullLibrary` and direct game URLs keep their behavior; hidden is not authorization. PSN uses
platinum/default-group dates and RA completion awards. At the user's explicit decision, Steam uses `lastUnlock`
and Xbox the latest `unlockedAt` when the current set is 100%, without attempting base/DLC separation. Activity
and cache fingerprints remain unchanged. Vault rules version 3 recomputes persisted scores on normal refreshes;
historical snapshots and display data need no migration.
**Verification** — 826 Jest suites / 5,227 tests after merging current `develop`, focused cache and platform regressions, ESLint, TypeScript,
`git diff --check` and the Next.js production build all passed.
**Open** — Exact PSN dates with DLC and all completed Xbox dates require per-game achievement reads;
enrichment failures leave only that date unknown. Missing timestamps remain in collections under Undated.
**Watch out** — Do not move the filter into canonical upstream caches or direct-detail loaders. Hidden rows must
stay available for unhide, while visible stack factors, periods and rankings must not include them.
## 2026-10-30 — Fixes from the v1.7 audit (`fix/96-audit-v17-findings`, from #90)

**Did** — Fixed what the audit found that needed no decision: Steam's sign-in answer refused when a
parameter repeats, image proxy, private-profile leaks, attempt limits, write caps, cross-site writes,
platform deadlines and budgets, landing and sign-in first paint, languages in chunks, `next` 16.4.2.
`docs/audits/perf-security-apilimits-v17.md` → Fix status lists each finding.
**Why** — The user asked to fix everything the report found, in a development branch based on #90's.
**Decisions** — `next` 16.4.2, not the newest, as 16.4.3 is under two weeks old. Steam stays reachable
with "forgot password" after an unlink. Two token-style counters would need a migration, so streak
orderings got a cache and Steam's count lives in `steam_cache`.
Linking Steam stays without a password, by the user's choice (2026-10-31). Admin TOTP needs no new
dependency and has no QR: a key to type and a link for the app on the same device.
**Open** — See Fix status. `migrations/043` and `044` were applied to pre on 2026-10-31 and go to production
with the release. Vercel WAF rules are the user's.
**Watch out** — Nothing here ran on Vercel, and platforms were mocked. The first cold streak ordering took
about 23 s at 600,000 rows. Unlinking Steam now ends sign-in with it.
## 2026-10-30 — Stricter reading of Steam's sign-in answer (`fix/steam-openid-strict`)

**Did** — `verifySteamLogin` refuses an answer with a repeated parameter before reading it or asking
Steam, with tests. Added the rule to CLAUDE.md.
**Why** — Hardening from the security audit of #90 (its hypothesis H-01). Steam's own behaviour was not
tested, on purpose, so this does not say a bypass existed.
**Decisions** — Fixed in `verifySteamLogin`, the one function sign-in and linking both go through.
**Watch out** — This code is on `develop` only, not on `main`.

---

## 2026-10-31 — Completed lists by completion date, and the skeleton leftovers (`fix/99-completed-dates-skeletons`, #99)

**Did** — `/completed` now orders by completion date by default, with a new `completed` sort key, and its rows, cards and shelf
cards say "Finished" with that date. Skeletons: Activity, Pinned, Browse, game pages (tiles on a phone, ten rows), public profile,
group detail and the home's phone stats measured against real pages. The root script now also carries the library layout
and whether a session is expected, so full loads paint the right variant. New `RememberedHeight` for data-sized blocks.
**Why** — The user's Marvel's Spider-Man (platinum 2021-12-23, DLC trophies 2026-10-25, 74 %) topped Completed dated 2026. The API
was already right (`completedAt`, #88): the list sorted and dated by last activity. Also, `main` has neither #93 nor this.
**Decisions** — Fall back to the last session when no completion date exists. RA's own list keeps its orders: it has no key
for this. `RememberedHeight` stores `width:height` per block, device-bound, and is not a synced preference.
A lazy chart's stages (page skeleton, data, plot download) now draw one `ChartSkeleton`, not bars and then a solid block.
**Open** — Production needs a release to show any of this. First visits still adjust on data-sized blocks. Modals were not
measured in a browser. Followers' cards are shorter than the skeleton's, and the list relies on its remembered height.
**Watch out** — The session look reads the last visit, so right after signing out in another tab a full load can show the
signed-in variant until the session is read.

---

## 2026-10-31 — A skeleton for every screen (`feat/70-skeleton-every-screen`, #70)

**Did** — Audited every loading state (inventory on issue #70), added `ui/Skeleton` with the `--color-skeleton`
token and its catalogue specimen, moved every hand-made pulse onto it and extended `uiGuard.test.ts`. New composed
skeletons: cover hero and side, Friends, Collection, Groups section, rankings route, `/rankings/how`, `/design`, auth forms,
admin users. Figures on their way are blocks (`loading` on `StatPill`, `StatCard`, `PlatformStat`), not `—`.
**Why** — Screens shared grey boxes and spinners, and the page jumped when content landed.
**Decisions** — The home's whole Friends section and both Following lists hold the skeleton until `detailsLoading` is
false: the user does not want a section loading in fits and starts, even if the wait is longer (details are read one
friend at a time). The home's skeleton draws both layouts and `data-home-layout` on `<html>` picks one before the first
frame, so a full load in the cover layout does not flash the classic one. `useFollowers` gained a derived `detailsLoading`; no fetch changed. The skeleton reads the view with
`useOptionalMainView` because `(home)/loading.tsx` also renders signed out without `MainProviders`. Spinners inside
buttons stay: they report an action, not content. No canvas: the issue rules it out.
**Open** — Measured signed in as an admin with all four platforms, skeleton against the settled page at 390 and 2560 px.
Exact or within 1 px: Following, account, groups (2560), rankings, the streak page, `/rankings/how`, the classic home's top
and the cover. Heights that depend on how much an account has (Collection's grid, pinned games, friends' cards, shared games, a
library's list) cannot match every account and were not pinned to one. On a phone the home's stats sit about 40 px high.
On a full load the platform tabs over the home's profile and the rankings' tabs wait for the session, and a saved list
layout in the library shows the shelves until hydration; a client navigation has neither. The stats of the page
below the rankings' list still add height.
**Watch out** — Stop `next dev` before `npm run build`: the build overwrites `.next` under it and every route answers 500.
`/rankings/how`'s section heights are measured desktop numbers; a large rewrite of the guide needs them
remeasured. On `/rankings`, the rows' heights also come from real data (102.7 and 69.4 px).

---

## 2026-10-30 — Xbox quota and failure hardening (`feat/87-xbox-quota-hardening`, #87)

**Did** — Added bounded OpenXBL calls, a PostgreSQL hourly budget, 429 scan stops,
explicit stale/partial cache semantics, sanitized request telemetry, aggregate feed caches,
home activity reuse, and Following/score limits. Updated the Xbox rules, architecture and spec.
**Why** — Eager scans and retry/failure behavior could spend the shared Free quota while admin-only,
and OpenXBL outages left routes waiting without a usable last good response.
**Decisions** — Home derives 60-day Xbox activity from the shared year so cross-platform cards stay
complete. Stale never applies to private/not-found/disabled keys, never becomes fresh on nested writes,
and each in-flight/backoff caller rechecks its own failure policy. The DB counter fails closed and
refused attempts do not extend the lockout. Following keeps its full 60-day window, loading one friend
at a time; Xbox score reads two games per pass.
**Open** — Nothing is pushed or deployed to pre. Cold-cache before/after quota measurements remain open;
the local check was warm and is not presented as a benchmark.
**Watch out** — Verified 812 suites / 5,076 tests, TypeScript and production build. Local warm admin
checks rendered Xbox profile and Activity; telemetry logged one 624 ms account call for summary with
147 remaining. ESLint still has two pre-existing `.playwright-mcp` warnings and the browser has the
existing Recharts width warnings. Expired Xbox cache rows are retained for 30 days for stale fallback.

---

## 2026-10-30 — UI polish plan becomes historical (`docs/67-ui-polish-v2-plan`)

**Did** — Marked the UI polish roadmap and v2 plan as historical records, removed the old execution
sequence, recorded which issues were built or dropped and updated the design register. Updated the
antislop issue with the user's concerns about how slanted is applied and what round lost.
**Why** — #67 was documentation, not another implementation block, and its old order made the
remaining work look duplicated. Open issues now own scope and execution order.
**Open** — Finish #61, #70, #78 and their current prerequisites before #77; create a dedicated
release issue only when the user asks to ship the collected polish.

---

## 2026-10-29 - Portada review fixes (`feat/74-portada-improvements`, #74)

**Did** - RA hero targets now open gameInfo's own achievement modal. Classic's platform tab no longer changes Portada's global stats, and large stat-pill hover backgrounds lean with the slanted design.
**Why** - Follow-up to the user's modal, hover and cross-layout state bug reports.

---

## 2026-10-29 - Portada targets and unlock counts (`feat/74-portada-improvements`, #74)

**Did** - Hero target tiles now have descriptive tooltips and open their achievement detail; the remaining tile links to the game. Portada's activity figures count unlocks instead of RA points.
**Why** - Follow-up to the user's interaction review and to keep cross-platform stats meaningful.

---

## 2026-10-29 - Portada target tile polish (`feat/74-portada-improvements`, #74)

**Did** - Limited the hero preview to five grey unearned achievements in one row, with the remaining count in a matching square tile.
**Why** - Follow-up to the user's visual review.

---

## 2026-10-29 - Global Portada stats and hero targets (`feat/74-portada-improvements`, #74)

**Did** - Portada's five activity figures now read every platform. The hero keeps one game link and shows up to six unearned achievement icons plus the remaining count.
**Why** - Follow-up to the user's review: the figures must be global, the duplicate action was redundant, and the hero needed a useful next-target preview.

---

## 2026-10-29 - Portada stats refinement (`feat/74-portada-improvements`, #74)

**Did** - Removed Portada's platform tabs and global-rank figure, leaving five wider activity figures. The cover no longer trims the shared chart height, so its heatmap cells stay the same size as Classic's.
**Why** - Follow-up to the user's screenshot review: simplify the cover stats and fix its smaller heatmap.

---

## 2026-10-29 - Portada layout improvements (`feat/74-portada-improvements`, #74)

**Did** - Added the level ring and a seven-day "Your week" summary, removed the hero from Portada's recent feed, put shared platform tabs in Stats & Activity, and slanted the shared level, streak and platform tags. The home columns explicitly stretch together.
**Why** - #74: make Portada's level useful, clarify the stats source and remove repeated content while keeping the slanted design consistent.

---

## 2026-10-29 - Vivid game card tint (`feat/76-vivid-game-tint`, #76)

**Did** - `averageTint` now selects the most colourful hue cluster and caps its OKLCH chroma and lightness; colourless artwork falls back to the neutral tint.
**Why** - #76: keep the game's own colour vivid without muddy averages, neon highlights or near-black card tints.
**Decisions** - The gradient and card styling stay unchanged; only tint extraction and its focused tests changed.

---

## 2026-10-29 — Layout chooser and fonts (`feat/75-layout-chooser-fonts`, #75)

**Did** — The Layout dialog is now an `xl` chooser with a fixed sample home on the left (shape, font, home layout and game-card style scoped to it) and the choices in a side panel; the Page tab adds the font preference, and the welcome's preferences step offers it too. `font-style` is synced, painted before the first frame with `data-font`, and swaps `--font-ui` / `--font-barlow`. Sofia Sans and Fira Sans ship with their condensed italic display faces and `preload: false`. After the user's screenshot, `Modal` gained `backdrop="opaque"` (`bg-black/80` with `blur-sm`) and the Layout chooser uses it. A second screenshot showed the font cards too narrow in the side panel: they render two per row there now, and choice-card text wraps instead of spilling.
**Why** — #75: choices apply at once and need a live dummy main page, and the person can pick a type family beside Barlow.
**Decisions** — The sample uses fixed game data and library pieces, never the person's own page. Barlow remains the default; `data-font="sofia"|"fira"` are the only overrides. On a phone the sample sits above the options.
**Watch out** — Barlow has no Cyrillic and Japanese still falls back with every pair; only `latin-ext` was added where the face supports it.

---

## 2026-10-28 - CheevoVault favicon (`feat/79-cheevovault-favicon`, #79)

**Did**: Replaced the `CH` placeholder in `src/app/icon.svg` with the existing CheevoVault mark.
**Why**: The new logo belongs in the favicon only.
**Decisions**: Kept the four traced paths after checking their overlay against the source drawing. The C follows the browser's light or dark scheme; the three V facets use steps of the default violet accent. Apple icons, manifest icons and the OG image stay unchanged.
## 2026-10-28 — UI polish quick wins (`feat/68-polish-quick-wins`, #68)

**Did** — El estilo tinted de `GameCardBackdrop` conserva el gradiente del juego pero usa la hairline
neutra del flat; `StreakTag` ganó `glow={false}` y solo el header la usa; Barlow y Barlow Condensed
cargan `latin-ext`. Tests, lint y `tsc` en verde.
**Why** — Decisiones de `docs/ui-polish-v2-plan.md` §1, §6 y §12.
**Watch out** — El glow sigue activo por defecto en `StreakTag`; no cambiarlo para todos.

---

## 2026-10-29 — Component-library leftovers (`refactor/73-ui-library-leftovers`, #73)

**Did** — Added `Shelf` and `DropSlot` to `src/components/ui`, with tests and catalogue specimens;
`LibraryShelf` and both group add tiles now use them. Replaced every old `rounded-xl` / `rounded-2xl`
in `src` with `rounded-tile` / `rounded-card`, and made the guard refuse them. Documented the welcome
curtain's fixed decorative clip paths in the guard, design-system doc and `CLAUDE.md`.
**Decisions** — The generic `Shelf` owns the title and optional action while `LibraryShelf` keeps its
seeded card layout. `DropSlot` owns the striped surface; callers supply only their layout and content.
No total-hours kicker was added to Portada.

---

## 2026-10-28 — Fixes from the user's site review (`fix/69-user-review-fixes`, #69)

**Did** — Fixed the round Overview stat tiles, equal heights for pinned and showcase achievements,
the library list's bottom fade, failed search artwork, the New group dialog's desktop width, the
streak heatmap's clipped selection ring, and the late rankings preference row.
**Decisions** — Steam's missing `library_600x900.jpg` was the empty search tile; `FadeImage`
keeps a placeholder on that failure and on any other failed search request. Achievement
rows and showcase slots use fixed heights so mixed content cannot resize a card. The rankings
preference reserves its row while loading rather than mounting General in the background.
**Open** — No Steam or PSN year-feed change was needed after measurement: the account had 33 Steam
games eligible for the 365-day window, all within the live-80 cap, so no older game depended on
`steam_unlocks`. PSN reads every title with a trophy in the last 366 days, without a game cap; the
account's score data covered 21 games and 207 unlock entries. Steam still cannot include a game
outside the live cap until its unlocks have been recorded, and a game last played before the window
is excluded by design.
## 2026-10-26 — Design round for the UI polish blocks (canvas, )
## 2026-10-25 — UI polish v2: design round and build plan (`docs/ui-polish-v2-plan`)

**Did** — A new design canvas (`docs/designs.md`, "UI polish v2") drawn from the code with real game
art: tint variants, streak tiers and progress in a top bar replica, Layout chooser (centred modal,
then three in-page panels), fonts, landing (details, then v2) and login/register details. Wrote
`docs/ui-polish-v2-plan.md`, the build plan for the next agent. No code changed.
**Why** — The user rejected the first polish canvas as generic ("no me gusta nada") and wanted
proposals rooted in the project; they ran out of usage before building.
**Decisions** — Tint: no border. Landing v2 and the login/register details: agreed. Fonts: Sofia
Sans and Fira Sans liked as options, which ships is open. Layout: a new concept (blurred page,
floating full-page preview, side panel), to design first.
**Open** — Everything in the plan; the streak tag / top bar variant; average vs vivid tint colour.
**Watch out** — Playwright's browser was held by another session, so no screenshots of the live site
were taken; the "Hoy" boards are redrawn from the code. PR #66 (`feat/65-ui-surfaces`) was already
merged into `develop`; its four later docs commits were carried onto this branch.

---

## 2026-10-26 — Design round for the UI polish blocks (canvas, `feat/65-ui-surfaces`)

**Did** — A design canvas with 11 boards for roadmap §4–§7 and the streak tiers
(https://claude.ai/artifact/3AdM2avNDWS2A2VshH8Cbd, recorded in `docs/designs.md`): the tinted style in
six treatments over the same six games in dark and light, the Layout modal (interactive and phone), the
three font sets, three landings, three login/register proposals and a streak-tier sandbox with three
top-bar progress variants. No app code changed.
**Why** — The user could not say what bothers them about the tinted style, so they asked to see options,
and asked for the Layout modal, fonts, landing, login/register and streak colours to be drawn first
(`docs/design-process.md`).
**Decisions** — Fonts are proposed as Exo 2 (Tech) and Manrope (Calm) next to Barlow; subsets are from memory
and must be checked before building. The landings avoid invented numbers and "free" claims; no Xbox.
**Open** — The user picks per block; then the plan doc and the build, one branch per block.
**Watch out** — The canvas uses CSS clip-paths and fixed pixel sizes: it is a spec of look, not of code.

---

## 2026-10-25 (night, 4) — Roadmap to finish the new look (`feat/65-ui-surfaces`, #65)

**Did** — `docs/ui-polish-roadmap.md`: what is left before the new look is done and can go to `main`
(the user's own review, skeletons, entrance animations #61, fonts and the Layout modal, the tinted card
style, leftovers, shipping) with `YOUR NOTES` slots for the user to complete. Listed in `docs/README.md`.
Also two lint warnings fixed (`MainPageRarest` memo deps, an unused import).
**Why** — The user is near the weekly budget and wants the context kept for when they return; entrance
animations (#61) were added to the pending work.
**Decisions** — The library's three parts go to `develop` as one PR (the branches were stacked and never
had PRs); `develop` → `main` waits until the pending blocks are done.
**Decisions (added later the same night)** — The roadmap also holds the signed-out landing redesign (login and register: review only), a font proposal (Exo 2 "Tech" and Manrope "Calm" next to today's Barlow, as its own preference, independent of the shape), a proposed Layout modal (live preview, sections on the left, reset) and an explanation of the tinted card style with four concepts to draw. Found while writing it: `src/lib/fonts.ts` loads only the `latin` subset, so Polish letters and all of Cyrillic and Japanese fall back to system fonts; adding `latin-ext` is a one-line fix still to do.
**Open** — Everything in the roadmap; the PR into `develop` must be opened and checked on the preview.
**Watch out** — `origin/main` has a commit `develop` lacks (PR #37): merge `main` into `develop` before the release.

---

## 2026-10-25 (night, 3) — The round design as it was, tiers everywhere, Disclosure (`feat/65-ui-surfaces`, #65)

**Did** — (1) The round design is the old look: buttons, fields and cards keep soft corners (not
pills), tags and chips are pills, the switch is a pill with a round knob. New radius tokens
`--r-tag/-pane/-tile` and `rounded-tag/-pane/-tile`; 52 files swapped their fixed `rounded-[..rem]`
for tokens, and the guard refuses the fixed values. (2) Streak tiers also colour the home's stats
tile (`StatPill.accentColor`), the rankings' streak column and the live bar on `/racha`.
(3) Disclosure in the library: `Accordion` (the FAQ's item), `ShowMore` (the two "show the rest"
buttons), `ToggleButton` (the Steam / PSN / Xbox pin star, now `aria-pressed` instead of
`role="switch"`; the guard's exception is gone); all three in the catalogue.
**Decisions** — `ShowMore` replaces the small pill of `ShowAllButton` with a secondary button (small
size) so there is one look for "show the rest".
**Open** — `Shelf` and the striped drag slot stay page-specific (`LibraryShelf`, the groups' sortable
rows): moving them needs their own pass.
**Watch out** — The pin star is a button with `aria-pressed` now: tests look for `button`, not `switch`.

---

## 2026-10-25 (night, 2) — Review round 4: round switch, Layout modal, catalogue (`feat/65-ui-surfaces`, #65)

**Did** — (1) The round design's switch is a pill with a circular knob (tokens `--r-track`,
`--r-knob`, `--knob-w/h/shift`), buttons and icon buttons are pills and circles (`--r-button`,
`rounded-button`); the font is the same in both designs again (the upright face and its CSS rule are
gone). (2) The preferences row is **Layout** and opens `LayoutModal` with two tabs: *Page* (the
shape, as two cards with a drawing each) and *Home* (home layout and game cards). The welcome keeps
the choices inline. (3) The catalogue was redone: a left menu that follows the reader, one card per
piece (26) fed by `catalogue.ts`, and **both designs side by side** for every piece whose shape
matters (`Compare`; the designs are now scopable: `[data-shape="slanted"|"round"]` on any element).
**Decisions** — Scoping a design to an element needed the slanted values restated in
`[data-shape="slanted"]`; `designTokens.test.ts` checks they equal the base. The registry throws on an
unknown piece id, so a card cannot exist without its menu entry.
**Open** — The streak tile in the home's stats is still the accent, not the tier's hue. Fields and
cards keep their radii in the round design (only controls, chips, bars and switches change).
**Watch out** — `/design` hydration errors in dev right after a recompile come from
`NavigationProgress`, not from the catalogue.

---

## 2026-10-25 (night) — Review round 3: shape design, tiers, cover art, catalogue (`feat/65-ui-surfaces`, #65)

**Did** — (1) The group ring's number is centred (a `pr-1` was pushing it 2 px left). (2) The
Followers tab draws the same card as Following: `useFollowers` now reads the newest fans' activity
and games and "playing now" like `useFriendsData`. (3) Streaks by tier (`streakTier`: 0, 5, 10, 20,
30, 40, 50+ days, a hue each) in `StreakTag`, the `/racha` hero and the cover's streak card.
(4) The cover: `homeHeroOf` gives `art[]` (Steam hero then its store header, PSN's backdrop) and
`icon`; `useGameInsights` adds RA's in-game screenshot and Xbox's IGDB art; the cover tries each and,
with none, shows the game's picture as a poster over its colour: never an empty box. (5) The
**shape design**: slanted or round as tokens (`--clip-*`, `--bar-radius`, `--slant-*`), `data-shape`
on `<html>` (`ShapeSync` + a layout script), a row in Preferences and in the welcome; the display
face loads upright too (round titles are not italic). (6) The catalogue at `/design` (admins only,
checked against the database) and `docs/design-system.md`; the guard test now also refuses fixed
polygons and skews.
**Decisions** — The round design is only overrides of tokens: no component knows about it. A hard
rule ("never a literal polygon") beat a convention. The catalogue is English (admin-only, like the
admin panel).
**Open** — The home's streak tile (the `48d` in Stats) is still the accent, not the tier's hue. The
round design is a first pass: look for a hand-made shape the guard cannot see (CSS modules, e.g. the
welcome's curtain, are untouched). The Disclosure pieces still have no page.
**Watch out** — Editing `globals.css` sometimes leaves the dev server on stale CSS: change the file's
content (touching it is not enough). `font-display italic` titles are upright in the round design by a
CSS rule, not by the component.

---

## 2026-10-25 (later) — The user's review round 2 (`feat/65-ui-surfaces`, #65)

**Did** — (1) The group hero is a ring again (`CircularProgress`, already in `ui/`) with the
percentage in the display face. (2) Following's hero has its old structure back (icon, title and
line top left; the count in big with faces and "online now" at the bottom); its rankings card is a
real podium (gold ring, slanted steps, display-face places). (3) More air under Rankings' title.
(4) `/rankings/how`: a hero, eight numbered cards (`RankingsGuideBlock` takes `index`), rules as
marked cards, tables with slanted bars (`weights`). (5) `ui/StreakTag`: flame and days, lit with a
glow while a streak is going, dimmed with an outline flame at 0; it is the header's streak badge.
(6) The home layout moved into a modal (`HomeLayoutModal`, opened by one row in Preferences →
General, which shows "Classic · Colourful"); the welcome keeps the cards inline. (7) New synced
preference `game-card-style` (`useGameCardStyle`: `tinted` default / `flat`); `GameCardBackdrop`
draws a plain surface and a hairline when flat and then reads no colour from the art. It applies to
every game card (home, pinned, groups, library rows, now playing), not only the home's.
**Decisions** — The card style is global rather than per page, so the site does not mix two looks.
The rounded-vs-slanted style the user wants next is the same kind of switch: put it beside
`game-card-style` and read it from the tokens (`--slant-*`), not from each component.
**Open** — Discuss with the user: a design-system home for the components (canvas + `docs/designs.md`
+ a living catalogue page), and how future agents get the rules.
**Watch out** — Choosing a card style by writing `game-card-style` in localStorage by hand syncs to
the account; the values are `tinted` and `flat`.

---

## 2026-10-25 — Every page checked again against the final boards (`feat/65-ui-surfaces`, #65)

**Did** — The user said half of the boards were not on the site. Each page was compared in the
browser (Playwright) against its board (`.playwright-mcp/canvas/project`, Final01–Final12) and
rebuilt where it differed:
- **Fonts:** Barlow (UI) and Barlow Condensed (display) load at the root (`src/lib/fonts.ts`); the
  display face had only loaded in the welcome.
- **Top bar, game page (`GameHero`, `dataTable.ts`, table toolbar, missables notice), search
  panel, home profile column, groups, Following:** see the commits before this entry.
- **Rankings (board 10):** podium cards with slanted steps (first in the accent, a gold ring), the
  toolbar on the tabs' hairline (platform chips, `Select` with a `prefix` label), the split under
  the points, a two-line streak, delta tags; level, "where your points come from" and the week's
  most active as three side cards.
- **Library (board 06):** the platform switch is the library's `Tabs` with counts (the list is its
  tabpanel when two platforms or more have games), one toolbar row (search, quick filters, order,
  layout), rows with a platform tag and the selected bar, the detail panes at the board's widths.
- **Account (board 12) and the home picker (board 03):** hero with "ID · country · following ·
  followers", the level box, labelled fields, plain count tiles, preferences as rows, the home
  layout as two cards with a drawing each (`ChoiceCards` gained `preview`); the delete card under
  the account card (a library `Button`, its modal now lazy).
- **Cover home (board 02):** the next easiest achievement (`useGameInsights`: any platform, through
  the routes the game page uses) and "see the N left"; in the cover layout the right column is
  level, streak and recent achievements on every platform (`MainPagePortadaSide`).
- **Group (board 08):** the percentage in big, the line above the name, tabs in the board's order,
  console and decade with their label inside, covers with the console above the name, an add tile.
- **Streak (board 11, v3):** it had not been built to the board. Hero with the days in big and the
  year's four figures as tiles; best streaks as slanted bars ("ongoing" on the current one); the
  day card (the day in big, the game and the achievement); slanted weekday bars; card titles with a
  line on the right (`StreakSectionHead`).
- **Numbers:** `decimal()` and `formatRarity(pct, lang)` give "0,8" in Spanish (every `toFixed(1)`
  shown to a reader goes through them); country names in the reader's language (`countryName`).
- **Small truths fixed:** a game with no achievements says so (not "nothing matches"); the comments
  button says "the latest N" when RA sent fewer than its total; Spanish "Pinear" became "Fijar".

**Why** — The user's review: the boards were not applied in full.
**Decisions** — Where a board and an agreed rule disagree, the rule wins (no key hints in the
library search; tinted, not solid, danger buttons). In the cover layout the platform profiles leave
the home (the board and the picker's own text say so); they are still on the account page.
**Open** — The V6 component boards were only spot-checked (the modal matches). The cover's kicker
does not give total hours (the feed does not carry them for every platform). Spanish does not group
four-digit numbers ("4930"): that is the language's rule, not a bug.
**Watch out** — `npm run build` while `next dev` runs leaves the dev server with stale CSS (they
share `.next`): stop dev, build, start it again. The library page's test mocks `LibraryExplorer`;
the search and layout controls are now its props (`search`, `layoutToggle`), so the mock draws them.

---

## 2026-10-24 — Component library, part 3: surfaces, data and the colour sweep (`feat/65-ui-surfaces`, #65)

**Did** — Game rows (recent, pinned, groups, status lists) take a flat tint and border of the
game's colour instead of the blurred art (`GameCardBackdrop` + `useImageTint`, a canvas read when
the image host allows CORS, a neutral grey otherwise). Streaks in the accent, amber only in the
streak hero. No bar under a group's covers. `RarityBadge` in the four achievement tables. The home
layout preference (`home-layout`: classic / cover) with `MainPagePortada`, in Preferences and the
welcome; the recent feed moved to `useRecentFeed`. `StatPill`'s large size without a box. Card
shells on `rounded-card`. Progress bars bevelled, glowing only when finished. The palette sweep
(81 files) and its guard; RA softcore rings on `--softcore`.
**Why** — PR 3 of the agreed design.
**Decisions** — The tint applies to every game row, not only recently played (homogeneity). The
Following cards already had the last game's art in code (only the canvas lacked it). Tables already
centre headers and values in code; no change.
**Then, page by page against the canvas's final boards (same day):** header (slanted nav line,
sunken search with the accent slash, chips) and the home profile column; game pages (chips, title in
the display face, facts row, actions as library buttons, table filters as line tabs); library rows
tinted and the detail panes; page titles in the display face; rankings period and order as
`Select`s; the streak page v3 (`StreakStatsBanner` is now the hero with the amber flame and the
year's figures under it, `StreakChart` a ranked list, `StreakDayStrip` replaces the calendar: a bar
per day, square-root scale capped at the 90th percentile by `stripCap`, cut days marked with their
figure); the account page (identity fields sunken, buttons from the library, preference rows
divided, platform cards with a status dot); the group detail (taller hero, title and ring in the
display face, state chips, filters as line tabs with counts); the opened game (bold pane titles,
the ring's mini figures under it on desktop, the goal slot striped in the accent).
`useImageTint` reads every image through `/api/image-proxy` (allowlisted hosts), so the tint works
on every platform. `Button`'s `danger` variant is tinted (danger text, ring and soft fill), as on
the agreed account board, not solid.
**Open** — The review pass with the user (their screenshots, 2560 px). Not built, on purpose: the
Disclosure pieces (`Accordion`, `ShowMore`, `ToggleButton`, `Shelf`) have no place that uses them
yet. The cover layout's art is RA's small screenshot, blurry at that size: a wider picture (IGDB's
hero, as Xbox uses) would fix it.
**Watch out** — The cover layout is checked: the home grows by the cover's height (the list and
profile still share the rest). Writing `home-layout` by hand in the browser syncs to the account:
the values are `classic` and `cover`.

---

## 2026-10-24 — Component library, part 2: overlays and feedback (`feat/64-ui-overlays`, #64)

**Did** — `Modal` in `src/components/ui` (dialog role, head / footer, danger variant, sizes, a sheet
on phones, Escape and outside click, focus trap and return, only the top dialog answers Escape);
`CommonModal` became a wrapper over it, and the 14 hand-built dialogs (achievement, detail, hashes,
AI export, groups, add / pin games, pin achievement, showcase picker, favourite game, forgot
password, delete confirmation, admin panel, day / week / period lists) dropped their own overlay,
Escape and focus code. `Notice` for tinted inline notices; inline errors in the theme's danger
colour. One dark tooltip surface, one menu surface (header status menu, sort menu, Select). The
toasts are a dark card with the tone on the edge and icon and a line for the time left. The search
panel uses the dialog surface, the segmented control and pills (still opens on typing). The cookie
banner on the dialog surface. The guard refuses a hand-built dialog overlay.
**Why** — PR 2 of the agreed design.
**Decisions** — A dialog focuses itself (its name is read first) unless a field has `autoFocus`.
`CommonModal` keeps no corner close by default (those modals have their own way out). Branch stacked
on #63's (it needs its components); rebase onto `develop` once #63 is merged.
**Open** — The search panel, the phone menu drawer and the sign-in backdrop keep their own overlays
(allowed in the guard). Skeletons and the empty state were left as they are. PR 3.

---

## 2026-10-24 — Component library, part 1: foundations and controls (`feat/63-ui-library`, #63)

**Did** — Design tokens in `globals.css` (slants, radii, control heights, motion, `--hardcore` /
`--softcore`, one set for every theme). In `src/components/ui`: `Button` / `IconButton`
(slanted primary), the fields (`Input`, `Textarea`, `SearchInput`, `Field`, `PasswordInput`
moved here), `Select` (own listbox), `Switch` (slanted), `Checkbox`, `ChoiceCards`,
`SegmentedControl`, `Pill`, `Tabs`, each with tests. The whole site moved to them: every primary
button and the cancel / delete beside them, every text field, the three native selects, the five
hand-made switches, the console ticks, group visibility, the view / layout / grid toggles, the
filter chips, the tab rows. `uiGuard.test.ts` refuses hand-drawn primary buttons, fields,
selects, switches and checkboxes. CLAUDE.md has the rules ("The component library").
**Why** — The agreed design (`docs/designs.md`), PR 1 of three.
**Decisions** — The button's shape is a skewed `::before` inset by the slant (a full-width button
lines up with the fields). The Steam pin star keeps `role="switch"` until PR 3's `ToggleButton`
(allowed in the guard). The library's platform pill keeps its own Framer slide (labels of different
widths). The search panels' bare inputs (header search, pin and favourite game) wait for PR 2.
**Open** — A pass over the whole site with the user's screenshots (the user asked to build
everything first, then fix). PR 2 and PR 3.
**Watch out** — A missing space between two classes once put the button's shape over its label:
`Button.test.tsx` now checks the shape stays behind.

---

## 2026-10-24 — Component library designed and agreed; build plan (`feat/63-ui-library`, #63)

**Did** — Designed the internal component library and every page in its style on the design canvas
(`docs/designs.md`), over several rounds with the user, then wrote the build plan
(`docs/ui-library-and-designs-plan.md` → Build plan). The canvas's last section, "Todo lo acordado,
página a página", holds the agreed version of each page. CLAUDE.md now says the design is agreed and
being built; roadmap entries added for the shareable card, `/diario` and styles to taste.
**Why** — The user wants the whole site drawn by its own components, homogeneous between them, so
future visual designs only change tokens.
**Decisions** — Components only, never page structure. Concept A (the welcome's), slanted primary
button, slanted switch, own select, sunken fields, dark tooltip. Streaks in the theme's colour
(amber only in the streak page's hero). The search opens on typing as today, no Ctrl+K. Tables align
headers like their values; rarity is a tinted figure, no bar. The statistics section keeps today's
layout. Three PRs: foundations and controls (#63), overlays and feedback, surfaces / data / colour sweep.
**Open** — PR 1 code. Issues for PRs 2 and 3 to open when they start.
**Watch out** — The canvas saves itself from the page: re-read `project/canvas.json` before publishing.

## 2026-10-23 — The home's Recent / Pinned switch is its title, and entrance animations (`feat/60-home-view-tabs`, #60)

**Did** — `MainViewToggle` no longer draws two 28 px icon buttons beside the title: it *is* the title,
"Recently played" and "Pinned games" side by side as tabs (bold, bright and an accent underline that
slides with `layoutId` for the selected one; pinned shows its count). Roving tabindex and arrow keys
(focus survives the header remount through a module flag). `RARecentlyPlayed` and
`MainPagePinnedGames` render it in place of their `<p>` title; another user's page keeps the plain
title. Switching animates: the underline springs to the other tab, and each view has its own entrance when its list appears, after loading too (`ViewEntrance`, CSS keyframes in `ViewEntrance.module.css`): recently played rows run in from the left one after another (once; rows that mount later just appear), pinned tiles rise and settle; a fade with reduced motion. **CSS on purpose**: Framer's `x`/`y` run on the main thread and stuttered on the first load, which is busy mounting the whole home. The class is on from the first render, like the heatmap's cells, so the compositor plays it while the first load keeps the main thread busy. **Never hide the rows until a frame or idle time**: both were tried and the card showed empty for a moment after loading (the main thread is blocked then, rAF and idle callbacks wait). A CSS module, not `globals.css`: the dev server kept serving a stale `globals.css` after the change (2026-10-23). Tabs are `text-xl`. The back arrow beside the title with a game open is gone (the user's ask): the card's own chevron closes it. `T.pinnedGames.viewRecentAria`/`viewPinnedAria` removed (the tabs have visible text).
The profile column (right) got an entrance too, on load and on each platform tab: its card's blocks come down into place one after another (`MainPageProfile.module.css`, `.enter > * > *` staggered by `nth-child`; the panel is keyed by tab). CSS for the same reason as the left card.
The pinned grid's "+" is now a dummy row shaped like the pinned games (dashed, a "+" where the cover goes, "Pin a game", a blank bar); it shrank to the icon once `ViewEntrance` wrapped it, so its wrapper is `flex` and the button `flex-1`.
**Why** — The user asked to improve the switch: icon-only, tiny, far from the title, selection by colour only.
**Decisions** — Option A of the design canvas (`docs/designs.md`), chosen over B (a segmented pill).
**Open** — Check it at 2560 px and on a phone (the tabs wrap). The same kind of entrances for every other page and component: #61 (added to the roadmap in CLAUDE.md).

---

## 2026-10-23 — Streaks in the rankings, and ordering by them (`feat/58-rankings-streaks`, #58)

**Did** — Each rankings row (table, phone list, podium, your zone) shows the current streak and the
longest one (`RankingsPageStreak`), and the toolbar orders by points, current streak or longest
streak (`?sort=points|streak|best`). `streakOf`, `streaksOf` and `rankByStreak` in
`src/lib/rankings.ts`; the route fills `streak`/`bestStreak` on every row. Texts in all nine languages.
**Why** — The user asked for streaks in the leaderboard and in the Following rankings.
**Decisions** — No migration and no platform call: the days come from `score_games.unlocks` (UTC
days, the same data weeks and months use), read at request time. Ordered by points, only the rows
shown are read; ordered by a streak, everyone in the view is. Ordered by a streak there are no
weekly arrows and your zone does not say how far ahead in points the others are. The period chips
still decide the points column and who is in the list.
**Open** — Checked on the dev server against pre (all three orders answer; the demo users have
no current streak, their data is old). If the list grows large, store the streaks per user at refresh instead of reading every day.
The Following page's rankings teaser still shows points only.
**Then (same day, from the user's screenshot)** — The table's level moved under the name (as on phones),
columns grouped as points (points · platforms · trend) then play (streak · 100 % · achievements);
the streak cell is a pill ("12d", lit flame while it runs) with the record beside it (crown, gold while
the current streak is the record). The demo users got varied current streaks (`STREAKS` in
`scripts/demo-personas.mjs`, one unlock a day on the favourite game) and pre was reseeded; the
streaks often come out longer than asked, joined by other recent unlocks, and two are shorter (a
favourite with few achievements).
**Watch out** — These streaks follow the score refresh (up to 6 h behind) and count UTC days, so
they can differ by a day from the streak page, which reads the live feed.

---

## 2026-10-23 — Steam sign-up in the welcome, and the fill running there (`feat/welcome-onboarding`, committed locally, not pushed)

**Did** — Ran the real flow on the dev server against pre (the Steam callback simulated with a
ticket cookie signed with `NEXTAUTH_SECRET`; the test account was deleted after): a Steam sign-up
already reached `/welcome` linked: the bar's Steam pill, the Steam step's "Connected", the profile
step's avatar from Steam, and "Connected" in the done summary. Added: `VaultFillProvider` in
`src/app/welcome/page.tsx`, so the Vault Points fill runs during the welcome; `VaultFillLine` in
the linked view of the Steam, RA and PSN steps ("21 games counted", or a private profile and how
to fix it); the Steam picture on the Steam step's card. New `WelcomePageSteam.test.tsx`.
**Why** — The user asked to integrate Steam (sign-up) with the welcome. The linked state already
worked by the code; what was missing was the picture and saying how the account is being read
(the test account's achievements are private on Steam while its profile reads as public, which
only the fill can tell).
**Watch out** — On the dev server, editing files while the page is open fills the log with
Turbopack HMR "Cell … no longer exists" panics: noise, not the code. The local `.env.local` Resend
key answers 401, so no mail leaves from local runs.

---

## 2026-10-23 — Sign up with RetroAchievements (`feat/welcome-onboarding`, committed locally, not pushed)

**Did** — "Create account with RetroAchievements" under the register form opens
`RegisterUserFormRa`: RA username + Web API key, checked with `POST /api/auth/ra/check`
(`useRaSignupCheck`; signed out, `ra-check` limit of 10 per 15 min per address, refuses a key in
use), with the welcome's three key steps and RA's settings link in a fold. Checked, it shows the RA
account, fills the username from RA's name (`suggestUsername`, now shared with Steam's sign-up)
and a "change" / "sign up without RA" way out; the account button waits for the check.
`POST /api/users` takes `ra`, asks RA again and inserts `rausername`, `raid`, `raUser` and RA's
picture as avatar, then `onPlatformLinked`. Texts in nine languages; `/privacy` says it.
**Why** — The user asked for an RA sign-up (option A of the proposal: more ways in) with the
welcome's RA step showing "linked as", not skipped.
**Decisions** — Measured 2026-10-23 against RA: any valid key reads any user's profile, and there
is no "whose key is this" (no `u` → 422). So it is a sign-up only: the account still has an email
and password, and there is no sign-in by RA key (keys get pasted into other tools). The RA
username is as unproven as when linking later. The welcome's big key guide did not fit the auth
card; its texts are reused in a `<details>`.
**Open** — Try it on the preview with a real key. When RA ships OAuth, this can become a real
"Continue with RetroAchievements". Still queued: Steam sign-up showing linked in the welcome
(by the code it already does; check the real flow).

---

## 2026-10-23 — Welcome: browser back through the steps; the app's first paint in the person's language (`feat/welcome-onboarding`)

**Did** — Each welcome move is a browser history entry (its step in `history.state`, spread over
Next's own), so the browser's back and forward go through the steps under the curtain. The
language: a pick is also kept in the `app-language` cookie; `serverLanguage()` (cookie, else
`Accept-Language`, parsed by `parseAcceptLanguage`) feeds a `LanguageProvider initial` in
`(main)/layout.tsx`, so the landing and the whole app paint in the right language from the first
byte. `/privacy` (nine languages, dated 23 October 2026) lists the cookie; while there, its
French, Italian and Polish "keeps you signed in" became gender-neutral. The welcome's first point
says only Steam and PlayStation give hours played.
**Why** — The three "later" items the user asked to handle.
**Decisions** — Not in the root layout: `headers()` there would make every static page dynamic;
`(main)` is dynamic already. The cookie holds only a person's pick, as storage does.
**Watch out** — Spread `window.history.state` into any `pushState`/`replaceState`: Next's app
router reloads the page on a popstate whose state lost its own keys.

---

## 2026-10-23 — Design register started, library as its own development, more languages on the roadmap (`feat/welcome-onboarding`)

**Did** — `docs/ui-library-plan.md` became `docs/ui-library-and-designs-plan.md`, a separate
development with two parts: the component library and a record of every design. `docs/designs.md`
started, with the welcome's canvas as its first entry; `CLAUDE.md` and `docs/design-process.md`
now require an entry for every design. "More languages" added to the roadmap with what a new one
needs. The welcome plan says what is left of this development.
**Why** — The user wants every Figma/canvas design to stay findable, the library done apart, and
more languages in the future.
**Decisions** — The register holds links, never copies (the designs are private to the user's
account). The browser-language detection was checked: it is this branch's own (`c6ccf86`); the
`happy-koala` worktree is another agent's (PSN docs, uncommitted) and was left untouched.
**Open** — See `docs/welcome-plan.md` → "State on 2026-10-23".

---

## 2026-10-23 — How UI work is done, and the component library idea (`feat/welcome-onboarding`)

**Did** — `docs/design-process.md` (idea → references → design canvas with several concepts →
iterations → plan → build and fix from the user's screenshots, plus the lessons from the
welcome); `docs/ui-library-and-designs-plan.md`, then `ui-library-plan.md` (an internal component library in the welcome's style:
inventory of today's duplicates, the visual language, a first shape, how to migrate, open
questions); both linked from `CLAUDE.md` (a section, and a roadmap item) and `docs/README.md`.
**Why** — The user liked the welcome's style and the way it was reached, and wants future agents
to work the same way and, in time, make the whole site homogeneous.
**Open** — The library is not started: design it on a canvas and agree it with the user first.

---

## 2026-10-22 — Welcome: done-step row overlap, language select arrow (`feat/welcome-onboarding`)

**Did** — In "Done", a long platform name ("RetroAchievements") truncates and its button no
longer shrinks into it; the Preferences language select draws its own chevron with room
(`appearance-none`, `pr-11`) instead of the browser's, which sat against the edge.
**Why** — Two visual bugs the user found trying it.

---

## 2026-10-22 — Welcome intro: shorter cards, a close button on the opened point (`feat/welcome-onboarding`)

**Did** — The intro's cards show only their number and title (their line moved to the opened
point); the opened point has a ✕ in its corner, besides Back and Escape.
**Why** — The user's ask: cards less tall, and a clear way to close what opens.

---

## 2026-10-22 — Welcome intro: points open over the whole step, with sketches (`feat/welcome-onboarding`)

**Did** — A point's card now grows (Framer `layoutId`) into a panel over the whole step
(`WelcomePageIntroDetail`): number and title, the full explanation, three highlights, a drawn
sketch (`WelcomePageIntroArt`: library, pins/groups/showcase, streak map, level and ranking,
friends online), arrows through the points, back/Escape (the card takes the focus again), and
Start. Texts in nine languages. Big-screen scaling changed from CSS `zoom` to the root font size.
**Why** — The user wanted an opened card to take the whole component, to explain better with
images. `zoom` would have thrown the card-to-panel animation off.
**Decisions** — Drawn sketches in the theme's colours, not screenshots (none in the repo; they
would go stale and show someone's data); any can be swapped for an image later. Text sizes in
the welcome are rem so the scaling reaches them.

---

## 2026-10-22 — Welcome intro: thanks, and points that open (`feat/welcome-onboarding`)

**Did** — The intro's text now starts by thanking the person for choosing CheevoVault; each of
its five points opens (`WelcomePageIntroPerk`, one at a time) to explain it in a few sentences:
the library, pins/groups/achievements to get/showcase, streak and stats, Vault Points and
rankings, following. Nine languages, gender-neutral.
**Why** — The user's ask.
**Watch out** — Those details describe real features: when one changes (or a platform is added),
update its line (CLAUDE.md → Welcome).

---

## 2026-10-22 — Welcome ready for more platforms; gender-neutral greetings (`feat/welcome-onboarding`)

**Did** — `PLATFORM_STEPS` / `isPlatformStep` and `platformKicker` (the "n of total" count comes
from the list, no longer a "3" in nine translations); CLAUDE.md lists what a new platform must
touch in the welcome. Greetings made gender-neutral: the welcome's title ("Esta es tu bóveda",
"Este é o seu cofre", "Questa è la tua cassaforte"), its giant word and the first step's name in the bar ("Inicio", "Início", "Inizio", the user's pick: "Bienvenida" still read as clashing with the title), a
Polish line, and the app's "Bienvenido/Bem-vindo/Benvenuto + name" → "Hola/Olá/Ciao".
**Why** — The user will add platforms and wants the welcome to always include them (and to
follow changes to the site); they noticed "Bienvenida" in the bar against "Bienvenido" below.
**Decisions** — Two standing rules in CLAUDE.md: the welcome follows every new platform and
feature; texts never assume the reader's gender.

---

## 2026-10-22 — Welcome curtain, smoother (`feat/welcome-onboarding`)

**Did** — The curtain glides in over 26 % of its 2.2 s easing out and leaves over the last 26 %
easing in (was 18 % each, one sharp curve); what rides on it (nodes, line) fades in and out with
it; the band travels with an ease-in-out; the new step's content waits for the curtain to start
leaving (`--enter-delay`, set by `WelcomePageStep`) instead of finishing hidden under it.
**Why** — The user found the animation abrupt ("de golpe").
**Decisions** — Same total length (2.2 s) and same swap point (50 %), so the sign-up hand-off
and the hook's timers did not change; only the curves inside.

---

## 2026-10-22 — Welcome curtain on <body>, not inside the sign-up card (`feat/welcome-onboarding`)

**Did** — `WelcomeCurtain` renders through a portal into `<body>`; `underBar` keeps the
between-steps curtain under the welcome's bar (z-20), the one from sign-up covers all (z-50).
**Why** — On sign-up the curtain showed inside the form card: the card's `backdrop-filter`
(like any `transform`) makes `position: fixed` relative to it.
**Watch out** — Anything meant to cover the screen from inside a card or an animated box needs
a portal (as `CommonModal` already does).

---

## 2026-10-22 — Welcome: bigger on big screens, slower curtain, a way in from sign-up, new avatar modal (`feat/welcome-onboarding`)

**Did** — After the user tried `/welcome` on a 2560 px screen: content and bar scaled with CSS
`zoom` on 2xl and ≥2200 px; curtain 2.2 s (was 1.1 s); the same curtain now runs from the
sign-up page into the welcome (`WelcomeCurtain` shared, `useWelcomeEntry`/`useWelcomeArrival`);
a new `AvatarModal` (big preview, pick or drop, link folded away) for the account page and the
welcome, `AvatarUpload` turned into `useAvatarUpload`, the avatar taken out of `EditProfileModal`.
**Why** — The user's four points: text tiny on 2K, change too fast, no feedback between sign-up
and welcome, the avatar modal (a URL plus "confirm URL", the current address in mono) was poor.
**Decisions** — `zoom` over per-element sizes (keeps the design's proportions; supported in all
current browsers). The sign-up side holds the curtain once covered (`holdAtMs`), so a slow
route load never shows the old page; the welcome restarts it at the same point with a negative
`animation-delay`. No "confirm" field for an avatar link: the preview is the check.
**Open** — Same as before: browser back between steps, first paint in the detected language.

---

## 2026-10-22 — Welcome after sign-up, first integration, and the browser's language (`feat/welcome-onboarding`)

**Did** — `/welcome` built from design v4: seven steps (intro, RA with the key guide, Steam,
PSN, profile, preferences, done) under the app-styled top bar, the Inazuma-style curtain
between them, back on every step, skip everywhere. Sign-up now signs in and goes there (form
and new Steam accounts). The language is taken from the browser (`navigator.languages`) until
the person picks one. `useRaLink` and `useThemeChoice` pulled out of their modals so the
welcome reuses them. Texts in all nine languages; tests for every new hook and component.
Also fixed two visual bugs the user found in the prototype (a long description overflowing
its preview, theme names wrapping).
**Why** — The user wants new accounts to link platforms right away instead of meeting the
login form again and then an empty `ConnectAccounts`.
**Decisions** — No app header in the welcome (its own bar only), by the user's choice: the
route is `src/app/welcome/`, outside `(main)`. Step kept in sessionStorage, not the URL hash,
because Steam's callback answers with its own `#steam-…`. Detected language never saved; no
server-side `Accept-Language` (would make the root layout dynamic). Theme picks in the
welcome do not toast (the change is visible; a failure is said in place).
**Open** — Browser back between steps; the first paint in the detected language. Not
checked in a browser with a real account yet (needs signing up on pre).
**Watch out** — `LanguageContext` no longer defaults to English for everyone: tests that
expect English get it because jsdom's `navigator.languages` is `en-US`.

---

## 2026-10-22 — Welcome v4: top bar in our style, RA guide page, browser language (`feat/welcome-onboarding`)

**Did** — No code. v4 on the canvas (desktop, mobile, a notes board) and the plan updated:
v4 is the design to build.
**Why** — The user found flaws in v3, still did not like the side rail (wants a top bar as in
E, styled like the app), wants RA's step to be a page explaining how to get the key, and wants
the language taken from the browser when possible.
**Decisions** — The bar is `MainHeader`'s floating bar with the steps as its nav pills and a
2 px progress line. RA: the form beside an animated three-step guide, not the modal. Language:
saved choice, else `navigator.languages`, else English; detection never saved as a choice;
`Accept-Language` on the server for the first render. Found: today the app starts in English
for everyone until they pick (`LanguageContext`).
**Open** — The header question; whether language detection ships first on its own.

---

## 2026-10-22 — Welcome v3: E as it was, with the side rail (`feat/welcome-onboarding`)

**Did** — No code. v3 on the canvas (desktop and mobile prototypes) and the plan updated: it is
now the design to build.
**Why** — The user clarified that they liked E's look and animation as they were and only
wanted its top step bar replaced; v2 had restyled everything.
**Decisions** — Keep E entire (full-screen curtain, Barlow italic, giant word, preview cards);
take from v2 only the side rail, back on every step, the profile and preferences steps, and no
achievements.
**Open** — The header question and RA inline vs modal (see the plan).

---

## 2026-10-22 — Welcome v2: back, profile and preferences, the app's own step bar (`feat/welcome-onboarding`)

**Did** — No code. v2 of the welcome on the design canvas (style audit and three step-bar
options, the 7 steps and what each saves, the prototype, mobile, updated motion spec) and
`docs/welcome-plan.md` rewritten around it.
**Why** — The user liked concept E and asked for: back on every step, profile and preferences
in the welcome, a step bar that matches the app (v1's did not), and no achievements for now.
**Decisions** — A side rail of steps like the account page's Preferences rows (tabs did not fit
7 steps; pills looked like a second header). Platforms before profile/preferences so the games
are read meanwhile. Back mirrors the curtain. CheevoVault's own achievements: a future idea,
written down in the plan, not in the welcome.
**Open** — The header question and RA inline vs modal (see the plan); then build it.

---

## 2026-10-22 — Welcome after sign-up: design exploration (`feat/welcome-onboarding`)

**Did** — No code. A design canvas with clickable prototypes (four concepts, a recommended
mix, the RA step, mobile and a motion spec) and `docs/welcome-plan.md`: the reference
analysed frame by frame, and how the welcome would be built.
**Why** — The user wants a welcome after sign-up that explains the site and walks through
linking each platform with animations, instead of sending people back to the login form and
then to `ConnectAccounts`; the reference is Inazuma Eleven: Victory Road's day change.
**Decisions** — Prototypes in a design canvas, not Figma: the Figma connector was not
authorised in this session. Recommended concept E (A's curtain between steps + B's unlock on
link). No Xbox in the welcome (admin-only). Branch cut from `feat/steam-sign-in` (PR #46, not
merged), as the user asked; nothing pushed.
**Open** — The user picks a concept; then build it as the plan says.
## 2026-10-20 — A profile's public card and link preview (`feat/profile-og-image`)

**Did** — Signed out, `/user/<name>` shows a card (`ProfileTeaser`: picture or initial, level,
Vault Points, split per platform, games at 100 %, achievements, "Create an account" and "See the
rankings") inside `PublicShell`, and the link preview is a per-profile image
(`user/[username]/opengraph-image.tsx`) plus title and description (`generateMetadata`). All of it
from `profileTeaser` (`src/lib/rankings.ts`). The proxy opens `/user/<name>` and its image. Names in
the signed-out rankings now link to that card. One string, `rankings.profileTeaser`, in 9 languages.
**Why** — To promote the site: a shared profile link was redirected to `/authPage` (Discord's and
Reddit's crawlers too), so every preview was the generic card.
**Decisions** — The user chose a teaser over a fully public profile. It shows only what the
public rankings already show and only for users listed there (public profile and
`show_in_rankings`), so `/privacy` did not change; a private or opted-out user and a missing one
both 404. Uploaded pictures stay signed-in only (the card shows the initial); the preview never
fetches a pasted avatar link (SSRF), so it always shows the initial.
**Open** — The route's `loading.tsx` (the full profile's skeleton) flashes before the card for a
visitor; harmless, a lighter skeleton if it bothers. Check the preview on Discord or
opengraph.xyz once deployed.
## 2026-10-23 — Issues: drop the close workflow, `linked-issue` required (`chore/56-drop-issue-close`)

**Did** — Removed `.github/workflows/issue-close.yml`; CLAUDE.md (Issues, Environments) and
`docs/architecture.md` say GitHub closes the issues and that the ruleset requires `linked-issue`.
**Why** — Merging #52 into `develop` showed GitHub closing #47 itself (`closedByPullRequestsReferences`),
although `develop` is not the default branch. The workflow also failed: it read an example
"closes #123" in #52's prose as an issue.
**Decisions** — Deleted rather than fixed: GitHub does the job. The user added `linked-issue` to the
`pr description` ruleset (develop and main).
**Watch out** — `linked-issue` reads the first `Closes/Fixes/Resolves #n` anywhere in the
description: keep example numbers out of the text, or in `<!-- -->`.

---

## 2026-10-22 — Steam: batched library counts, the whole year's streak, "now playing" (`feat/steam-sign-in`)

**Did** — (1) `fetchBatchCounts` (`GetTopAchievementsForGames`, 100 games a call) counts a
library's in-progress and unstarted games at once; only finished games are read one by one, for
their completion date. (2) `steam_unlocks` (`migrations/042`, `lib/steamUnlocks.ts`): every
per-game read keeps its dated unlocks; the streak/activity read the `maxGames` played last live
and the rest of the window from the table. Unlinking deletes them. (3) `/api/follows/playing` +
`PresenceLabel`'s `playing`: "Now playing: <game>" on the Following and home friend cards.
`/privacy` (9 languages) says both what is kept and who sees the game.
**Why** — The user picked these from a list of Steam improvements (they declined refreshing the
stored Steam name and a "verify with Steam" for old typed links).
**Decisions** — Measured 2026-10-22: the batch returns exactly the unlocked achievements when
`max_achievements` ≥ the total (40/50, 84/84, 43/43 against the per-game calls), 192 games in
0.6 s, but **no unlock times**, and it answers even when Steam says "Profile is not public" per
game; so a per-game probe must agree before it is used. The unlocks table is fed by the score
refresh, which already reads every played game; no extra Steam calls. "Now playing" lives in its
own route so the overview stays database-only.
**Open** — 042 applied to pre and production (2026-10-22); without it the
writes/reads just log. Days older than the table's first fill stay missing for games past the
live cap until the score refresh reads them.

---

## 2026-10-22 — Steam review: one owned-list read, private profiles said aloud (`feat/steam-sign-in`)

**Did** — `loadOwnedGames` (`lib/steamProgress.ts`): Steam's owned list cached 5 min under
`steamOwnedRaw:<steamid>` (refreshable, a private answer not kept), now read by the library,
recently played, recent unlocks, activity and the year's unlocks. `recentlyPlayed` answers
`403 private` for a private profile (`isPrivateLibrary`, `SteamPrivateError`, shared with
`ownedGames`), so the home's "recently played" says why it is empty. The Steam sign-up warns
when the Steam profile is not public (`isPublic` from the summary it already reads).
**Why** — The user asked to look for more ways to improve Steam. A home page load downloaded the
whole owned list up to five times (one per route) against an app-wide budget of ~100–200 Steam
calls per 5 minutes; and since linking no longer refuses private profiles, the home showed an
empty list where it should say "private".
**Open** — `scoreRefresh` still keeps its own owned-list cache (`score:steamOwned`, its own TTL);
left alone, it runs in the background. The community visibility state says nothing about
"game details" being private; only the owned list does.

---

## 2026-10-21 — Users link Steam through Steam's sign-in (`feat/groups-redesign`, uncommitted)

**Did** — The Steam card's typed box is replaced by "Connect Steam" (`UserSteamCardLink`) →
`/api/auth/steam?intent=link&next=/user|/` → Steam → the callback links the proven account
(`steamid`, `steamusername`, `steam_login_id`) and returns with `#steam-linked|taken|failed`,
which `useSteamLink` toasts. `/api/steam/link` and `UserSteamCardForm` removed; the `steamLink`
strings kept only `errors.private`. A random `state` (cookie + signed `return_to`) now guards
both the sign-in and the link. Texts that said Steam is linked by name (account card hint, landing
FAQ, privacy, the "track" SEO page) updated in every language they exist in.
**Why** — The user signed up with Steam on a second account while their admin account had the
same Steam typed in: nothing broke (separate columns), but a typed link proves nothing, so a
Steam account could score on several users. They chose "only through Steam".
**Decisions** — The three existing typed links (the user's test accounts) are left as they are,
by the user's choice. Admins still link by typing (logged). A private profile is no longer refused
at link time: ownership is proven, and the library page already says "private".
**Watch out** — Without the `state` check, a callback URL made with another person's Steam would
link it to whoever opens it, and then let that person sign in as them.

---

## 2026-10-21 — Steam "recently played" no longer limited to two weeks (`feat/groups-redesign`, uncommitted)

**Did** — `/api/steam/recentlyPlayed` builds its list from the owned list's `rtime_last_played`
(`lastPlayedGames` in `utils/steamMappers.ts`), the 20 played last; games only in Steam's recent
list (family sharing) are appended. Cache key `steamRecent:v2`. `loadRecentAchievements` scans the
10 games with stats played last, from the owned list too. `loadOwnedFacts` removed (unused).
**Why** — Steam's `GetRecentlyPlayedGames` covers only the last two weeks: the user saw 4 games, and
a user who had not played in months saw none after linking.
**Watch out** — A failed owned lookup still falls back to Steam's recent list, undated.

---

## 2026-10-21 — Sign up and sign in with Steam (`feat/groups-redesign`, uncommitted)

**Did** — "Continue with Steam" under the sign-in and register forms. Steam OpenID
(`lib/steamLogin.ts`, `api/auth/steam`, `/callback`, `/register`), a second NextAuth provider
`steam`, and `/authPage?steam=…` (`SteamSignupForm`, `useSteamSignup`): a known Steam account
signs in at once; a new one picks a username (suggested from the Steam name) and an email, and
gets Steam's picture as avatar and Steam linked. `migrations/041_steam_login.sql`. Privacy policy
(9 languages) says what Steam sign-in keeps. CLAUDE.md → Registration.
**Why** — The user asked for sign-up with Steam carrying over the Steam picture, name and email,
as a first step of a larger integration.
**Decisions** — Steam never shares an email (OpenID gives only the SteamID64; the Web API name and
picture), so the email is still asked for: it is the only recovery path. A new column, not
`steamid`, because `steamid` is typed and unproven (migrations/028). Random password, so the
account has none until "forgot password"; rejected a nullable password (every `passwordVersion`
and current-password check assumes one). The ticket goes in an httpOnly cookie, not the URL.
**Open** — 041 applied to pre (2026-10-21) and production (2026-10-22). No "link Steam sign-in" for existing accounts.
Changing the email or deleting the account asks for the current password, which a Steam-only
user has to set through "forgot password" first. Not tried against real Steam yet: try it on the
preview (Steam needs to reach `NEXTAUTH_URL`'s host, any public or localhost URL works as realm).
**Watch out** — `return_to` is built from `NEXTAUTH_URL`; if it differs from the host the user is
on, the ticket cookie lands on another host and every Steam sign-in "expires".
## 2026-10-23 — Every PR resolves an issue (`chore/require-linked-issue`, committed locally, not pushed)

**Did** — Issue forms (`.github/ISSUE_TEMPLATE/`: Feature, Bug, blank issues off); `## Issue` →
`Closes #` at the top of the PR template; `pr-issue.yml` (check `linked-issue`): fails a PR that
names no open issue, takes the number from a `type/123-slug` branch and writes `Closes #123` into
the description; `issue-close.yml` closes the issues when the PR is merged into `develop`.
CLAUDE.md → Git → Issues, and the template there; `docs/architecture.md` → Tooling.
**Why** — The user wants every PR linked to a GitHub issue, automated.
**Decisions** — `main` stays the default branch, so GitHub's own `Closes #` does nothing for PRs
into `develop`: a workflow closes them instead (making `develop` the default was the other
option). The branch-name fill edits the body through the API with `GITHUB_TOKEN`, which does not
retrigger workflows, so no loop; it uses REST, not `gh pr edit` (which has broken on Actions'
token over classic Projects). Releases and main → develop merges are skipped (a skipped required
check counts as passed). The board is GitHub's own Project workflows, no Action and no PAT.
**Open** — On GitHub, by the user (nothing of this works until then): (1) open an issue for this
work and put `Closes #<n>` in this PR's description, or `linked-issue` fails on its own PR;
(2) after merging, add `linked-issue` to the `pr description` ruleset's required checks
(develop and main) and update the line in CLAUDE.md → Environments; (3) create a Project (board)
linked to the repo, and in its Workflows turn on "Auto-add to project" (filter `is:issue,pr is:open`)
and "Item closed" / "Pull request merged" → Done. Labels `bug` and `enhancement` are GitHub's
defaults; recreate them if they were deleted.
**Watch out** — The check reads only the first `Closes/Fixes/Resolves #n`; the close workflow
closes all of them (but never a PR). Text inside `<!-- -->` is ignored by both.

---

## 2026-10-21 — Xbox: a game's empty launcher twin no longer shows as a second game (`feat/groups-redesign`)

**Did** — `foldTwinTitles` (`utils/xboxTitles.ts`), applied in `xboxLibraryData`: a title with no
achievements that shares its name with one that has them is dropped, its last session and play
time folded into the game. Library cache key bumped to `xbox:titles:v6`. CLAUDE.md (Xbox) says so.
**Why** — "Minecraft: Xbox 360 Edition" showed twice in Recently played, once 5/93 and once 0/0.
Read from pre's cache: Xbox lists two 360 titles with that name, 1480659447 (93 achievements) and
1297287809 (0x4D53…, none), played six seconds apart: the game and what launches it.
**Watch out** — Only same-name twins are folded; a game with no achievements and no twin stays.
If the twin was ever pinned or put in a group, that row no longer finds its game.

---

## 2026-10-21 — Opening a home section keeps its top in view while it loads (`feat/groups-redesign`)

**Did** — New hook `useSectionScroll` (used by `MainPageCharts`): opening a stats section scrolls
its top under the header as before, then keeps asking again while the section resizes, for up to
`SETTLE_MS` (3 s), and lets go as soon as the user scrolls (wheel, touch, keys).
**Why** — "Siguiendo" (Following) scrolled badly: it loads only once opened, so at the moment of
the scroll the page held a short skeleton, could not scroll that far, and stopped short; the
friends then arrived and nothing corrected it.
**Decisions** — Rejected a minimum height on the panel area (always tall enough to scroll): it
left a blank screen under every short section.

---

## 2026-10-21 — More group icons; the edit preview shows the group (`feat/groups-redesign`)

**Did** — `GroupModalIconPicker` offers 80 icons in five categories (`ICON_CATEGORIES`: games,
trophies, mood, lists, nature) and opens on the category of the current icon; the own-emoji/link
field stays. Editing a group, `GroupModalPreview` now shows its own covers and game count (it said
"0 games": it only counted the games picked while creating).
**Why** — The user asked for a bigger icon choice, and to improve the edit modal.

---

## 2026-10-21 — Edit a group from the home page (`feat/groups-redesign`)

**Did** — The featured group on the home (`MainPageGroupFeature`) has an edit button that opens
`GroupModal` with the group; saving goes through the section's `updateGroup` (so the list beside
it updates too) and toasts "Group saved"; a refused save stays in the modal. `updateGroup` no
longer throws a JSON parse error when an error answer has no JSON body.
**Why** — The user asked for an edit button there.

---

## 2026-10-21 — A friendlier new-group modal (`feat/groups-redesign`)

**Did** — `GroupModal` rebuilt: a titled dialog on `<body>` (portal), Escape closes it. Creating is
two columns: a live preview (`GroupModalPreview`: chosen games' covers, icon, name, privacy),
name and description with character counters (limits from `groupValidation`), the icon as a row
of one-tap emoji plus "none" and a field for your own emoji or image link
(`GroupModalIconPicker`), and private/public as two radio options that say who sees it
(`GroupModalVisibility`, replaces the switch). The games column (`GroupModalGamePicker`) is now
suggestions and matches as covers to tick (`GamePickerTile`, `suggestCandidates`), chosen games
stay ticked in place. A missing name is an inline error on the field (it used to say only
"Title"); the button reads "Create with N games". Editing keeps the first column only.
**Why** — The user asked to improve the new-group modal after the add-games one.

---

## 2026-10-21 — Home page Groups section in the new style (`feat/groups-redesign`)

**Did** — `MainPageGroupFeature`: covers faded behind a progress ring (was an amber `text-warning`
number), finished / started / not started counts, a "Closest to done" link to that game
(`closestItem`), the first six games as covers (`MainPageGroupFeatureGame`), and an empty group
offers "Add games" (the new modal) right there. `MainPageGroups` (the list beside it): a progress
bar and % per group, **no delete** any more (it is on the group page), and it takes the groups
from `MainPageGroupsSection` instead of fetching them itself (it asked twice before). New hook
`useGroupProgress(items)`: one reading of progress (RA live, the libraries, then stored) shared by
the group page and the home, which used to show the stored `pct_won` and could disagree.
**Why** — The user asked what to improve in the home's Groups section and approved the list.
**Decisions** — Until the featured group's games load, its ring uses the stored totals from the list.

---

## 2026-10-21 — A friendlier "add games" modal for groups (`feat/groups-redesign`)

**Did** — `AddGameModal` rebuilt: a titled dialog ("Add games", "to <group>"), on `<body>`
through a portal; it opens on **suggestions** (`suggestCandidates` in `gameCandidates.ts`: being
played, closest to done first, then wanted, then the rest), narrows by title and by platform
(`AddGameModalPlatforms`, only platforms the user has games on), and shows games as selectable
covers (`GamePickerTile`, `aria-pressed`, a check besides the ring). "No games match" when a search
finds nothing; the footer is always there (count, clear, "Add N games", disabled at 0). RA id/link
lookup kept. Cover tiles on the group page now top out at 9rem (the user found 11rem still blurry).
**Why** — The user asked for a friendlier modal: before, it showed nothing until typed, said
nothing when a search failed, and the add button appeared only after a pick.
**Decisions** — `GamePickerRow` stays for the pin and favourite pickers; only this modal moved
to covers.

---

## 2026-10-21 — Group page redesign: banner, one filter bar, covers or list (`feat/groups-redesign`)

**Did** — `/groups/[id]` follows mock-up C. `GroupDetailHero` (replaces `GroupDetailHeader`): the
first covers faded behind, a progress ring, title, privacy, description, finished / started / not
started counts, add-edit-delete. `GroupToolbar` (replaces `GroupFilters`): progress states as
pressed buttons, consoles as a checkbox menu (`<details>`), decade as a `<select>`, and a view
switch saved as `group-detail-view` (synced). **Covers** (default): `GroupCoverGrid` +
`GroupCoverTile`, sortable like the list, each opening its game, a finished one ringed in the
theme's colour. **List**: the old `GroupGameGrid` cards, two per row; the 1/2/3 control is gone.
`itemProgress` / `groupStateCounts` in `groupItems.ts` give one reading of a game's progress (RA
live, then the platform libraries, then what was stored) for the tiles, the counts and the filters;
`GroupViewToggle` became generic (options passed in) for both pages. Skeleton reshaped.
**Why** — The user picked option C for the group page after the list redesign.
**Decisions** — The progress filter now reads RA's live progress too (before, only the stored
fraction), so the filters, the counts and the tiles agree.
**Watch out** — A Steam item's stored art can be a wide header; on a square tile it is cropped.

---

## 2026-10-21 — Groups list: covers or shelves (`feat/groups-redesign`)

**Did** — `/groups` has a view switch (`GroupViewToggle`, saved under `groups-view`, a synced
preference): **Covers** (`GroupAlbumCard`: the first games as a banner, a progress ring, completed /
in-progress counts) or **Shelves** (`GroupShelfRow`: progress, "closest to done", and the first five
games each with its own bar and link). An empty group asks for games; a last tile (`GroupNewTile`)
makes a new group while any fit. The old 1/2/3-column control is gone from the list. `listGroups`
now returns five covers with title and progress, `completed_count`, `started_count` and `next_up`.
`GroupPlatformLogos` was split out of `GroupCard` (still used on public profiles).
**Why** — The user found the list plain. Mock-ups (canvas "Rediseño de Grupos", options E and F)
were drawn first; the user picked both, with a switch between them.
**Decisions** — Per-game progress in the list is the group's stored `num_awarded`/`max_possible`
(what the old card's bar already used), not the live library values the group page reads. The
"Add games" and "+N more" tiles open the group instead of the add modal on the list page.
**Open** — The group page redesign (option C: banner, ring, one filter bar, cover grid) is chosen
but not built. Reordering groups by drag is not offered (it never was).

---

## 2026-10-21 — Library detail scrolls, modals above the heatmap, home ends at the screen (`fix/library-scroll-heatmap-layers`)

**Did** — The list view's detail panel (`LibraryEntryDetail`) is `grow shrink-0` instead of `flex-1`,
so it no longer shrinks to its sticky column and the column scrolls. `AchievementModal` and
`AchievementDetailModal` render through `createPortal` into `document.body`.
**Why** — The user could not scroll the right panel of the library lists (a long RA game cut off at
the bottom), and an achievement opened from "Recently played" on the home was covered by the
heatmap below it.
**Decisions** — `flex-1` (basis 0, shrinkable) plus the card's `overflow-hidden` (which drops its
min-height to 0) squeezed the card to the column and clipped the rest. The modals were trapped in a
transformed ancestor's stacking context (framer-motion sections), so their `z-50` only counted
inside it; a portal fixes it for every place they open from, as `CommonModal` already did.
**Also** — On the home's one-screen Overview (`home-fit`, ≥1024×1000), the profile column never
shrinks, so a profile a little taller than its share made the page ~20 px longer than the screen and
the end of the stats panel sat below the fold (the user wants the first view to end exactly at the
panel's bottom, footer just below). `homeFit` (`src/lib/homeFit.ts`, a ref callback on the home's
`<main>`) measures how far the box runs past the screen and takes it off the daily chart through
`--home-fit-trim` (at most 100 px, the chart never under 160 px; the heatmap follows the chart's box).
Rejected: letting the profile scroll again (that was the cut-off fixed before) and a smaller fixed chart
height (only right for one profile and one screen).
**Watch out** — Other hand-made modals (day/week/period achievements, showcase picker) still render
in place; if one is ever opened from inside a transformed section and something later covers it,
portal it the same way.

---

## 2026-10-21 — An error card for a platform profile that does not load (`feat/platform-load-error`)

**Did** — `MainPageProfileError` (`main-page-profile/main-page-profile-error/`): the error screens'
`StatusBadge` (danger, a cloud-off icon, the platform's logo on its corner), the message and the
platform's reason, and a Retry button (`STATUS_BUTTON.secondary`). Fills the profile column. Used by
the Steam, PSN and Xbox profiles on the home in place of their red line and small pill.
**Why** — The user saw the Xbox profile fail ("limited right now") as a bare line of red text and
asked for a proper component for when a platform cannot load.
**Decisions** — No new strings: each platform's `profileError`, reason (`errors.*`, Steam's private
hint) and `retry` are reused. RA's profile on the home has no error state of its own, so it is untouched.

---

## 2026-10-21 — The worklog and the version no longer conflict on merge (`chore/worklog-union-merge`)

**Did** — `.gitattributes`: `docs/worklog.md merge=union`. A rule for it in CLAUDE.md
(Documentation) and a note in this file's instructions.
**Why** — Every branch adds its entry at the top, so bringing any branch up to date with
`develop` conflicted here (it happened twice on 2026-10-21, PR #41 among them).
**Decisions** — Git's built-in `union` driver: no config, no script, works for every clone.
Tested on a toy repo: both entries kept, the `---` between them lost (cosmetic). The version
files (`package.json`, `version.ts`) get their own driver, `scripts/merge-version.js`: it
sets both sides to the higher version, then lets git merge the rest of the file, so a real
conflict elsewhere in `package.json` still shows. Registered by `npm run prepare` (a custom
driver lives in `.git/config`, not in the repo). Tried on a real merge with
`feat/platform-load-error`: no conflicts at all.
**Watch out** — Run `npm run prepare` once in each clone, or the version still conflicts.
GitHub's "Update branch" button does not run the version driver: merge locally.

---

## 2026-10-21 — PS3 and PS Vita always in the PSN consoles preference (`fix/psn-consoles-preference`)

**Did** — `PsnGamesDataContext` lists PS3, PS Vita, PS4 and PS5 in the consoles preference always
(`PSN_CONSOLES`, through a new `always` argument of `consoleOptions`), with 0 for a console the
library does not have. Tests: `consoleFilter.test.ts`, `PsnGamesDataContext.test.tsx`.
**Why** — The user wanted PS3 and Vita in the PSN tab to show or hide, like PS4/PS5 and Xbox's.
**Decisions** — The list was already built from the library, so PS3/Vita showed only when the
library had them; now the four are fixed. Nothing listed while the library is empty (loading).
**Open** — Could not read the cache to check whether the user's library has PS3/Vita games at all
(the `.env.local` database password was refused).

---

## 2026-10-20 — Xbox shelf cards with sharp art (`fix/xbox-shelf-art`)

**Did** — `LibraryShelfBanner` asks `/api/xbox/details` (through `useXboxGameDetails`) for an Xbox
game's IGDB `heroUrl` and shows it sharp, as RA's screenshots; the shelf detail backdrop follows,
since it draws the same banner. Test: `LibraryShelfBanner.test.tsx`.
**Why** — The user saw every Xbox card in the library shelves blurred: Xbox sends only a square
tile, and the banner blows a tile up and blurs it.
**Decisions** — Reused the game page's route (cached half a year on the server, `cachedJson` in the
browser) instead of a new art-only one. One request per visible card, so at most a shelf's worth.
**Open** — Cold, the route makes two IGDB searches per game (details and art) and `searchGames`
does not retry a 429, so a first load with many Xbox cards may leave a few blurred until the next
visit. Games IGDB does not match stay blurred.
**Also fixed** — The 360 MW3 showed the 2023 game: Xbox names it "Modern Warfare® 3" and lists it on
360, One and Series (backward compatible), so the IGDB search took the newer game. A game with
Xbox 360 among its consoles is now searched on 360 alone (`igdbXboxPlatforms`), and `bestMatch`
prefers a title that ends with the name ("Call of Duty: Modern Warfare 3") over IGDB's first hit,
which on 360 alone was a DLC pack. Affects the game page's details too. New cache keys (the
platform list is in them), so nothing to bump.

---

## 2026-10-20 — See who follows you (`feat/rankings-zone-and-personas`)

**Did** — `/following` has tabs (`FollowingTabs`): Following and Followers (`#followers`, read
when opened through `useFollowers` → `GET /api/follows/overview?who=followers`). The list, its
search and its states moved to `FollowingList`, shared by both tabs. The account page's
"Followers" count is now a link like "Following". Followers are counted and listed only when
their profile is public, as the people you follow already were. The privacy policy's follows
sentence changed in all nine languages: you see both lists, nobody else sees who follows whom.
**Why** — The user wanted to see who follows them and to change the policy for it.
**Decisions** — Only you see your followers; no follower list on public profiles. Added a
"Follows" section to CLAUDE.md so that stays true.

## 2026-10-20 — Following section: cards across the width (`chore/demo-personas`)

**Did** — In the home's Following section (`MainPageFriends`), "Who you follow" left the
leaderboard's column and spans the width (3 columns on xl); "Latest from who you follow" sits
beside the leaderboard, exactly as tall (out of the flow on xl, its list scrolling inside with a
thin scrollbar in the accent). The old sticky/stretched switch (`quiet`) is gone.
**Why** — With 11 follows the cards made the left column long and left a blank hole under the feed.

## 2026-10-20 — Rankings: 20 at a time, most active this week, 60 demo users (`chore/demo-personas`)

**Did** — The list pages 20 at a time. `/api/rankings` adds `hot`, the five who earned most this
week (global, every platform, whatever the view), shown under your level as `RankingsPageHot`
with a button to the weekly ranking (strings `hotTitle`, `hotSee`, nine languages). The demo seed
gives each persona a twin (`TWINS` in `demo-personas.mjs`: same tastes, another name and another
of its badges as picture) and multiplies demo points by `SCALE` = 30, so the user (116 k) ranks
about mid-table and "your zone" can be seen. Reseeded pre: 60 users, 24.7 MB of cache.
**Why** — The user asked for 20 at a time, to see their zone, twice the users and something to
fill the empty space under "Your level".
**Watch out** — The pre-commit hook rewrites `package.json`; once, the dev server read it half
written and kept failing with "Invalid package config" until restarted.

## 2026-10-20 — Rankings: top 30, your zone and a trend per row (`chore/demo-personas`)

**Did** — `/api/rankings` pages 30 at a time and returns `zone`/`zoneStart` (the viewer and who
stands around them; `above`/`below`, 2 by default, up to 50) and each row's `trend` (last 8
weeks, `weeklyTrend` in `src/lib/rankings.ts`); `near` is gone. The page shows `RankingsPageZone`
below the list when you are not in it (each other row says how far ahead or behind you they are;
"N more above/below" widen it through `useRankings().widen`, never past where it meets the list),
and the table a Trend column (`VaultSparkline`, from lg up). "Close rivals" (`RankingsPageNear`)
is removed; the pinned bar now shows only when you are not listed (it says why).
**Why** — The user picked option A of the canvas (top 30 plus your zone), kept the level panel as
it was and the rows as they were, plus the trend line of the third row design.
**Decisions** — The ranking is still computed in memory per request (cached 5 min): fine now; a
totals table indexed by points is the step for very many users (noted in `architecture.md`).
Strings: `near` became `zone` (+ `zoneOf`, `zoneUp`, `zoneDown`, `colTrend`, `trendA11y`) in all nine.
**Watch out** — Checked locally with the page size lowered to 5 for a moment (you rank #1 with
30 personas): the zone met the list and offered "4 more below".

## 2026-10-20 — Rankings entry animation (`chore/demo-personas`)

**Did** — `/rankings` comes in: the podium rises third, second, first, its steps grow and the
points count up (`CountUp`, which gained `locale` and `delay`); table and list rows stagger in
(capped after 14 rows); the side panel slides in, the level ring fills from empty
(`CircularProgress animateIn`, CSS `ring-in` in `globals.css`) and the level counts up; your
pinned bar rises from the bottom. Variants in `rankings-page/rankingsMotion.ts`;
`MotionConfig reducedMotion="user"` leaves only the fades under reduced motion. The jest mock of
framer-motion gained `MotionConfig` and drops `custom`.
**Why** — The user asked for an entry animation.
**Open** — Proposals for pagination at scale, "Tu zona" instead of "Rivales cercanos", the level
panel beside the podium, and the row design are on a canvas for the user to choose; nothing of
that is built yet.
**Watch out** — Playwright's window here renders at ~2 fps (in the background), so animations
cannot be judged from it; check them in a real browser.

## 2026-10-20 — Rankings avatars load gracefully (`chore/demo-personas`)

**Did** — `RankingsPageUser` draws pictures through `FadeImage` (a pulse in the circle while
loading, then a fade-in) and shows the user's initial, in the theme's accent, when there is no
picture or it fails. `FadeImage` gained a `fallback` prop for that.
**Why** — The user found the cold load cheap-looking: empty circles, then pictures popping in.
Signed out, uploaded avatars (`/api/avatar/…`, sign-in only) answered 401 and stayed empty.
**Open** — Other lists of users (Following, search, compare) still use a plain image; move them
to the same pattern if the user wants it everywhere.

## 2026-10-20 — Demo personas with full profiles (`chore/demo-personas`)

**Did** — The 45 `demo_*` users are now 30 hand-written personas (`scripts/demo-personas.mjs`:
name, country, bio, theme, gender, hours they play, weekends only, presence, showcase size, the
games they play and how far). `scripts/demo-rankings.mjs` builds their Steam and PSN libraries,
recent unlocks, year feeds, each game's list and the PSN summary, and writes them into pre's
`steam_cache` under their made-up accounts, never expiring; their Vault Points, weeks and
showcase come from the same lists through the real formula (`vaultScore.ts`, imported by Node).
Checked on localhost: spex_guy (Steam, 41-day streak, showcase, completed shelf), ratman (PSN,
platinums, hours, Spanish trophies), a PSN and a Steam game page, the rankings.
**Why** — The user wanted to review public profiles with data and the demo users to have personality.
**Decisions** — No "demo mode" in app code: the app reads its cache as for anyone. Games are
real ones whose definitions pre already had cached for real users (15 Steam, 27 PSN), so names,
badges and rarity are real; only who earned what and when is invented. No RA (the dev server
skips RA's DB cache; a made-up RA name may be a real person). PSN trophy lists in English and
Spanish only (a copy per language; 12 MB in all). Online personas have `last_seen_at` in 2100.
Monday's ranks are computed among real users too, so the arrows are right.
**Open** — Check dev.cheevovault.com once merged (same database, so it should already show them).
**Watch out** — "Ver en PSN" links to a PSN profile by the persona's name, which may be someone
real. If pre loses the cached games (reset from production, an unlink of the user's accounts),
re-seeding warns and leaves those games out. Steam game pages refetch the global schema from
Steam when it has expired (slow first load, then cached).

## 2026-10-20 — Demo users on the preview database (`feat/social-rankings`)

**Did** — The user created the Neon branch and set `PREVIEW_DATABASE_URL`; checked that local
work reads it (a marker written only on pre showed on localhost; production unchanged; marker
removed). Added `scripts/demo-rankings.mjs` (`seed` / `clear`, preview database only) and seeded
40 `demo_*` users with scores, weeks, Monday ranks, presence and follows; `ivanxmarine` follows
ten of them on pre. Checked the Following rankings in the browser.
**Open** — `dev.cheevovault.com` uses pre only once this branch reaches `develop`.

## 2026-10-20 — A database of its own for pre (`feat/social-rankings`)

**Did** — `src/lib/db.js` reads `PREVIEW_DATABASE_URL` before `DATABASE_URL`, except in production
(`VERCEL_ENV`), so `develop` and local work can use a Neon branch of production (`preview`).
Documented in `.env.example`, README and CLAUDE.md (Environments).
**Why** — The user wants a pre that does not touch production (and fake users to test the
rankings with). The Neon integration owns `DATABASE_URL` for all environments, and Vercel refused
a branch-scoped `DATABASE_URL` for `develop` ("already exists for production, preview, development").
**Open** — The user creates the Neon branch and sets `PREVIEW_DATABASE_URL` (Vercel: Preview →
develop; and `.env.local`), then redeploys develop. Until then nothing changes. Then: a seed
script for demo users, run only against the branch.

## 2026-10-20 — Fill stuck at 99 %, a history chart, the guide in nine languages (`feat/social-rankings`)

**Did** — The user's fill stayed at "Calculating 99 %": Steam answers HTTP 500 every time for two
games with no achievements (Pavlov VR, Lethal Company; checked live), so they were re-read each
pass and the fill never ended. A game that fails on its own is now *skipped* (`FillPlatform.skipped`;
it does not hold the fill up and is retried at the next refresh); if every read of a platform
fails, it is `unavailable`, not done. The per-platform progress was redrawn as small cards (four
in a row on the account page) instead of bars across the whole card; platform cards say how many
games counted and how many were skipped. Added the weekly history (`weeks` in
`/api/rankings/me`, `VaultWeeksChart`, plain SVG) to the rankings' level panel. "How Vault Points
work" now in all nine languages (`vaultGuideMore.ts`). The podium keeps first in the middle when
fewer than three people rank. Checked in the browser with the real account: guide, rankings,
account page, header level.
**Decisions** — No fake users in production: `/rankings` is public, so they would show to
everyone (and in search, Following, profiles). Proposed instead: a Neon branch for a test copy.
**Open** — Testing with many users needs that separate database.

## 2026-10-20 — Points at once when a platform is linked, and a guide (`feat/social-rankings`)

**Did** — The fill of a new account no longer waits for heartbeats: `onPlatformLinked` (in the
RA, Steam, PSN and Xbox link routes) marks the platform "calculating" and runs a pass right after
the answer; `useVaultFill` (`VaultFillProvider` in `MainProviders`) asks `POST /api/rankings/fill`
for pass after pass until it is complete, polling `GET` for progress. Each platform is read at a
measured pace (`PACE` in `scoreRefresh`; PSN gentle, with an app-wide `psn-score` budget in
`attemptLimit`), and errors are classified (`private`, `key`, `busy`, `unavailable`). Progress
shows in the header (a ring), each platform card (`VaultFillLine`), the account page and the
rankings panel (`VaultFillProgress`); the viewer's points carry "≈"; toasts when ready or when a
platform fails. Also fixed: the viewer's own rankings row is read fresh (it came from a 5-minute
cache). New public page `/rankings/how` ("How Vault Points work", EN/ES in
`src/translations/vaultGuide.ts`, numbers from the formula; examples shared with the balance
tests in `src/utils/vaultExamples.ts`); the rankings' "how points work" now links to it (the
modal is gone).
**Why** — The user disliked a fill that took an hour unseen ("if I sign up I expect to be in the
rankings at once"), asked to be careful with PSN, and wanted the explanation of the weighting
for users.
**Decisions** — Measured before choosing paces (numbers in the plan). Progress kept in
`steam_cache` rather than a migration. "Ready" toasts only for a fill that was pending, never a
6-hourly refresh. Xbox's estimate counts as settled. The guide follows the public pages' rule
(EN/ES outside `T`).
**Open** — Not tried in a browser. RA per-key vs per-IP limit unknown. If PSN starts answering
"too many requests" in production, lower `PACE.psn` or the `psn-score` budget.

## 2026-10-20 — Vault Points and the rankings, a beta (`feat/social-rankings`)

**Did** — Built the whole plan in `docs/rankings-plan.md`:
- Engine: `src/utils/vaultScore.ts` (formula, stacks, unlock-tool check), `vaultLevel.ts`
  (levels, tiers, weeks/months), `vaultScoreInputs.ts` (per platform); `src/lib/scoreRefresh.ts`
  (lists each library once, reads only games that moved, provisional scores meanwhile);
  `src/lib/rankings.ts`; `migrations/040_vault_points.sql` (`score_games`, `score_periods`,
  `score_snapshots`, `users.show_in_rankings`, `users.score_refreshed_at`).
- Triggers: `after()` in `/api/presence` (6 h freshness) and `/api/cron/scores` (daily 05:00,
  takes the Monday snapshot). Routes: `/api/rankings` (public), `/api/rankings/me`,
  `/api/admin/rankings` (balance per platform, review of flagged Steam games).
- UI: `/rankings` (public; design A with B's level panel and C's close rivals), "Beta" label,
  "how points work" modal; level badge in the header, Following cards, home friend cards,
  public profile hero and your account page; "Appear in the rankings" switch in Preferences;
  the Following teaser is now its link; rankings in the nav; admin "Rankings balance".
- 9 languages, `/privacy` paragraph (and its sitemap date), sitemap and proxy entry for `/rankings`.
**Why** — The user asked for an internal score where every platform is worth the same, levels,
and rankings of everyone and of whom you follow, all of it at once rather than in phases.
**Decisions** (the user's) — no ownership verification for now ("trust people"; an account
linked twice scores for both); periods all-time, month and week; public without a session;
hidden games and consoles do not score; 1.6.0 with only the rankings marked beta.
Mine: `show_in_rankings` kept out of the session so a missing migration breaks only the
rankings; levels on cards read through `vaultTotalsOrNone` for the same reason; RA and Steam
games read straight from the platform (their page caches can predate the unlock that moved
the game); no per-platform factor until real data asks for one.
**Open** — `migrations/040` applied to the shared database 2026-10-20 (with the user's OK).
Watch the first refreshes (Vercel logs `[scoreRefresh]`) and the admin balance table; the formula was only tested on
illustrative data. Not checked in a browser yet.
**Watch out** — A first fill reads 25 RA / 40 Steam / 15 PSN / 5 Xbox games per run and comes
back after 10 minutes while unfinished, so a big library takes a few visits (or days of cron)
to settle; until then games count provisionally. RA refreshes spend the user's own key.

## 2026-10-20 — Branch split, rankings designed (`feat/social-rankings`)

**Did** — `improvements_11` held two unrelated sets of work. The social one (Following
restyle, presence, achievement showcase: 7 commits) was cherry-picked onto `develop` as
`feat/social-rankings`; `improvements_11` was rebuilt on `develop` with the rest (progress
chart periods, 404/error screens, lazy modal suspense, PSN-only header) and force-pushed. The
code of every commit is byte-for-byte the original; only worklog, version and conflicts in
shared files were re-resolved. Added `docs/rankings-plan.md`: the Vault Points formula,
levels, the user's decisions and the verification analysis.
**Why** — The user wanted the friends/online work in its own PR, where the rankings will be
built too.
**Decisions** — The showcase went with the social branch: it changes `FollowingCard`, the
follows overview and the friends card, all on top of the Following and presence commits, and it
is what friends see. Older worklog entries keep saying `improvements_11`; read them as this
branch for Following, presence and the showcase.
**Open** — How ownership is verified (the user is weighing a return to sign-in per platform;
see the plan). Rankings not started.
**Watch out** — Both branches bumped the version from 1.5.18, so whichever merges second
conflicts on `version.ts`/`package.json`: keep the higher. A local backup of the old branch is
`backup/improvements_11-pre-split` (not pushed).

## 2026-10-20 — Showcase picker by game, multi-select (`improvements_11`)

**Did** — `ShowcasePickerModal` rebuilt as two views: the user's games with an achievement
earned (`useProfileLibrary`, played this year first, searchable), then one game's
achievements (`useShowcaseGameChoices` → RA `getGameProgression`, Steam `achievements`, PSN
`trophies`, Xbox `achievements`, mapped by `showcaseChoices`: earned first, newest first; the
rest greyed with a lock; hidden unearned ones concealed), with "back to the games". The
selection spans games: a game holding selected achievements gets a ring and "n selected";
selected achievements a ring and a tick; the footer says how many fit and adds them all at
once (`useShowcase.addMany`, one message). The old one-list row is gone.
**Why** — The user wanted to browse by game, see what is left, and pick from several games in
one go.
**Checked** — with the real account, nothing added: games list, a selection in one game and
its badge back in the list; RA, PSN, Steam and Xbox games all load.

## 2026-10-20 — Achievement showcase, and "achievements to get" (`improvements_11`)

**Did** — Split what used to be "pinned achievements" in two (rules in CLAUDE.md → Achievement
showcase):
- **Showcase** ("Vitrina de logros"): `migrations/039_showcase_achievements.sql`, **applied to
  the shared Neon database 2026-10-20**; `/api/showcase`; `useShowcase` + `ShowcaseProvider`;
  a block on top of the Pinned section (5 slots, drag to reorder, × to remove, "+" opens
  `ShowcasePickerModal` with the year's unlocks from every platform); `ShowcaseToggleButton` in
  the RA and Steam/PSN/Xbox detail modals, only on earned achievements and only on your pages.
  The public profile, Following cards and the home's friend cards show it.
- **Achievements to get**: the old pinned achievements, renamed in all 9 languages
  ("Logros por conseguir"; the 📌 is now "pin as a goal"). Now private: `/api/favorites` GET
  ignores `?user=`; the public profile no longer shows them, so `MainPageFavorites` and its
  four per-platform rows were deleted (the unpin button stays, the Pinned tiles use it).
- Following card: the latest unlocks are now the large row ("Latest unlocks", or "nothing
  earned lately"), the showcase small at the foot.
- `RecentAchievement.Key` (Steam apiname, PSN trophy id, Xbox id) on the mapped unlocks.
- `/privacy`: the public profile shows the showcase, never the goals (9 languages, dated 20 Oct).
**Why** — The user wanted the "pins" on Following to be a showcase of earned achievements,
apart from the goals, and the recent unlocks to lead the card.
**Decisions** (the user's) — the showcase is managed in the Pinned section (they may move it
to Preferences later); added from a button on each earned achievement *and* a picker; the
public profile shows the showcase, not the goals; the goals are "Logros por conseguir".
Mine: a new table with one shape rather than a flag on `pinned_achievements` (different
meaning, no per-platform snapshot to decode); the button only in the detail modals (one place
per platform family) rather than on every row; the picker reads the year's unlocks already
loaded for the streak, so older achievements are added from their game page.
**Checked** — in the browser with the real account: added one from the picker, saw the tile
and the toast and the public profile section, then removed it (the showcase is empty again).
The Following card with mocked follows.
**Open** — "Earned" is trusted from the client (see `parseShowcaseEntry`). Steam/PSN/Xbox
unlocks added from the picker have no description (the feed does not carry it); from the
modal they do. A pinned goal that gets earned is not moved to the showcase automatically.

## 2026-10-20 — Presence everywhere another user shows (`improvements_11`)

**Did** — The green dot and "online / seen …" now follow every picture of another user, not
only the Following cards. Shared pieces: `presenceColumns()` (`src/lib/presence.ts`, the SQL
rule, now used by the follows overview, `/api/users/search` and `findPublicUser`),
`PresenceDot` and `PresenceLabel` (components). Placed in: Following hero faces, `UserSummary`
(search results, the home's friend cards), the public profile hero (dot + line under the name,
not on your own page), compare, someone's game page banner, the friends leaderboard and shared
games. `/privacy` and the switch now say *signed-in users* see it (9 languages).
**Why** — The user asked for the dot next to every online person's picture, and "last seen"
everywhere else.
**Decisions** — The dot speaks to screen readers (`announce`) only where no text beside it
says so. Your own picture never gets it. Recent users in the search (kept in the browser)
have no presence: they are not read from the server.
**Open** — Nothing refreshes it while a page stays open (only on load).

## 2026-10-19 — Online status and "last seen" (`improvements_11`)

**Did** — Presence on the Following cards. `migrations/038_user_presence.sql`
(`users.last_seen_at`, `users.show_presence` default true), **applied to the shared Neon
database 2026-10-19**. `usePresenceHeartbeat` (via `PresenceHeartbeat` in `MainProviders`)
posts `/api/presence` while the tab is visible; the route writes at most once a minute.
`/api/follows/overview` returns `online` (seen < 5 min) and `lastSeenAt` (rounded to 5 min),
both only for who shares it. The card shows a green dot and "Online", or "Seen 3 h ago" /
"over a month ago", in place of the bio (`presenceOf` in `src/utils/friends.ts`); the hero
says "n online now". A "Show when I am online" switch in Preferences → General
(`showPresence`, same path as `profilePublic`). `/privacy` explains it, in 9 languages,
dated 19 October 2026. Rules in CLAUDE.md → Presence.
**Why** — The user asked for it; analysis and proposal first, then their choices.
**Decisions** (the user's) — visible by default with an opt-out; not reciprocal; the status
replaces the bio. A heartbeat only while visible rather than writing from the session, so a
tab in the background does not count and no read path writes. Online is decided on the
server, so the client's clock does not matter.
**Checked** — in the browser: two beats on arrival (Strict Mode in dev), one row written;
the card states and the switch with mocked follows.
**Open** — what comes next is the user's call (CLAUDE.md roadmap): Steam "playing now" in
one call for everyone, an "online" filter, refreshing without reloading, the public profile.
**Watch out** — Any database without migration 038 breaks every signed-in request.

## 2026-10-19 — Following page restyled, room for rankings (`improvements_11`)

**Did** — `/following` was a plain list of names. Now (`FollowingPage`):
- `FollowingHero`: the title on a wash of the theme's accent, how many people you follow and
  a stack of their avatars (+N).
- `FollowingRankingsTeaser` beside it: "Rankings · Coming soon" with an empty podium. Not a
  link yet; when the rankings page exists, this card becomes its link.
- `FollowingToolbar`: search by name and a chip per platform (only those someone has, with
  counts; `aria-pressed` plus a check, not colour alone). Platforms are multi-select and add
  up: two chosen leave who has **both** (people link several accounts); "All" clears them.
  Filtering is `filterFollowing` in `src/utils/friends.ts`.
- Each person is a `FollowingCard` (design "A2", iterated with the user on a canvas of five
  variants): a banner with the **last game played** (`FollowingCardBanner`: blurred, a Steam
  header a little and an icon a lot; without one, the avatar colours via `UserProfileBanner`), who they are,
  a chip per linked account with the name it goes by (`FollowingCardPlatforms`; the overview
  now returns `accounts`, the names the public profile already shows, Xbox's only to an
  admin), and up to **5 pinned badges** whose tooltip says game, name and description
  (`FollowingCardBadges`, size `md`). At the foot, beside the groups, their last 5 unlocks in
  the same row at size `sm` (`recentAsBadge` puts an unlock in a pin's shape). Favourite games
  were dropped from the card on the user's choice.
- The page now reads `useFriendsData(true)` (the home Friends section's hook): the overview
  for everyone, and the platforms' games for the newest `DETAIL_LIMIT` (10) follows, from which
  `lastPlayedGame` (`src/utils/friends.ts`) picks the newest; RA has no play date, so its latest
  unlock stands in. `useFollowing` is gone. The overview now returns 5 pins with a
  `description` (a secret Xbox one not yet earned keeps it hidden); the home card shows 3.
- Fixed in `useFriendsData`: a page that wants it from its first render never loaded in dev
  (Strict Mode ran the effect twice; the guard skipped the second run). Tested under StrictMode.
New `T.following` keys in all 9 languages.
**Why** — The user found the page boring and wants it ready for a rankings system that will
have its own page.
**Decisions** — Last played costs platform calls (cached, the same as the home section), so
only the newest 10 follows get it and their latest unlocks; the rest show their avatar colours
and no unlocks. Storing it in the DB
when each user loads their own library was proposed, not done. The rankings themselves were
not started: only the place they open from.
**Open** — Online status / "last seen" (the line where the bio is now) is in the CLAUDE.md
roadmap: ask the user first. "1 grupos públicos" (no singular form). `GET /api/follows` has no
client left (POST/DELETE still used by `useFollow`); kept with its tests, can go.

## 2026-10-20 — Following, presence and showcase moved out (`improvements_11`)

**Did** — The Following restyle, presence ("online" / "last seen") and the achievement
showcase now live in `feat/social-rankings`, with their own PR, where the rankings will be
built. This branch keeps the progress chart periods, the 404/error screens, the lazy modal
suspense fix and the PSN-only header. One commit takes the social work back out, so the branch
did not need a force-push; its tree is the same as these four commits cherry-picked on
`develop` (tested: jest, lint, build).
**Watch out** — `migrations/038` and `039` are already applied to the shared database; this
branch no longer uses them, which is harmless. Their notes in CLAUDE.md are in the other branch.

## 2026-10-20 — Header for PSN-only accounts (`improvements_11`)

**Did** — `MainHeader` decided "has a platform" from RA or Steam only, so an account with only
PSN (or only Xbox, for an admin) got a bar with no search, no Library, Groups or Following.
It now counts PSN, and Xbox when `canUseXbox`. Tests for both.
**Watch out** — A new platform must be added to that check, or its users lose the bar.

## 2026-10-18 — New 404 and error screens (`improvements_11`)

**Did** — Three screens, sharing `StatusBadge` (an achievement tile with a corner badge and a
slow glow), `STATUS_BUTTON` and `useRise` (the landing hero's entrance) / `useGoBack` (back,
or home in a tab with no history):
- **404** (`NotFoundScreen`): a hidden achievement nobody has unlocked — "?" with a lock,
  "Hidden achievement · 404", "Explorer of the unknown", a card at 0 / 1 with 0.00 %
  rarity (`NotFoundProgress`), home and back. The root `not-found.tsx` shows it full screen.
- **404 inside the app** (`src/app/(main)/not-found.tsx`, new): a `notFound()` under `(main)`
  now keeps the header. On `/psnGame|steamGame|xboxGame/…` (`gameSourceFromPath`) it shows
  `NotFoundGame` (empty cover with the platform logo, "We could not find this game", library
  and back); elsewhere (e.g. `/foo`, caught by `[category]/layout`) the hidden achievement.
- **Errors** (`RouteError`, now also rendered by `global-error`): the 404's twin in red, an
  unlock cut short — alert tile with a retry badge, a card with the bar stopped at 62 % in the
  theme's colour and the `error.digest` with a copy button (`RouteErrorCard`), retry and home.
`T.errorBoundary` and `T.notFound` gained their keys in all 9 languages.
**Why** — The user wanted better 404 and error screens. Five variants were mocked up as an
artifact, then three error variants; they picked "hidden achievement" (404), "unlock
interrupted" (errors) and the in-app 404 with context.
**Decisions** — The game 404 says "could not find" rather than "not in your library": Steam
404s only on a malformed id (a game not owned still opens). An Xbox game URL gives a
non-admin the plain 404, with no word of Xbox. The second action is back, not search: the
search modal is local state of the header. Only the digest is shown, never the error message.
**Checked in the browser** (dev server, signed in and in a fresh signed-out context, desktop
and 390 px; temporary throwing pages, since deleted) and fixed what it showed:
- Retry used `reset()`, which never re-asks the server: a server error could not recover.
  Now `retry()` (Next 16.3, `error.tsx` props `{ error, retry }`); clicking it fetches anew.
- The screens sat at the top: the layout's `<main>` is a block, so `flex-1` did nothing.
  They now take `min-h-[calc(100dvh-7rem)]` (`STATUS_SCREEN`), measured header + footer.
- Two `<main>` landmarks (the layout's and the screen's): inside the app they are a `<div>`.
  `role="alert"` moved from the root to the message block (on a `<main>` it hid the landmark).
- Signed out, Next renders `(main)/not-found` too, with no layout: the screen was short and
  `<html>`'s darker background showed below. `(main)/not-found` is now a server component
  that reads the session (signed out → full screen); the client part is `NotFoundInApp`.
  The root layout's `<body>` got `min-h-screen`, so no short page shows that band.
- `/a/b/c` got the root 404, without header: `[category]/[consoleId]/[...missing]/page.tsx`
  now calls `notFound()`, so every unknown URL lands in `(main)/not-found` (checked: /a/b/c,
  /playing/3/x, /groups/x/y with header; /playing/3 still works).
- `global-error` (seen by making the root providers throw, since reverted) used the system
  font: it replaces the root layout and lost Inter's class. The font is now `src/lib/fonts.ts`,
  set by both.
**Decisions** — Not fixed, on purpose: game 404s (and /playing/3/x) answer HTTP 200 because
those routes stream (`loading.tsx`) and call `notFound()` on the client after the library
loads; a real 404 would need the library on the server before rendering (PSN/Xbox calls per
visit) or dropping the skeletons, for private pages no crawler sees. React's dev-only warning
"Encountered a script tag" on 404 pages comes from the theme script in the root layout (a 404
document is rendered on the client in dev); moving it to `next/script` risks a theme flash on
every page, for a warning production never shows.
**Watch out** — `global-error` is always dark (violet): it has no theme provider.

## 2026-10-18 — Clicking the "Achievements unlocked" chart lists that period (`improvements_11`)

**Did** — Clicking a point of a game's weekly/monthly chart (`GameAchievementsProgressChart`,
in every opened Recently played card and the library's opened cards) opens
`GameAchievementsProgressChartModal`: what was unlocked that week or month, newest first,
each a link to the achievement (rows from `LibraryDetailList`). The chart now takes
`InsightAchievement[]` (`fromRa`/`fromSteam`/`fromPsn`/`fromXbox`) instead of bare dates, and
`groupGameAchievementsByPeriod` returns each bucket's items and start.
**Why** — The user asked for it (the branch is for more improvements to come).
**Decisions** — The modal is lazy (`next/dynamic` + `LazyWhenOpened`) and portalled to
`<body>`, since the opened card animates. A point with no unlocks opens nothing.
**Watch out** — The buckets were labelled with `toISOString()` of a local midnight: east of
UTC the monthly view's last bucket was the previous month, and this month's unlocks fell in
no bucket. They are now local (`localDay`). Collection trophies are keyed `gameId:trophyId`
in the chart, since ids repeat across its games. The `fromX` links do not carry the profile
being viewed (`useSubject`), as in the library; on someone else's page they open the game
for the viewer.
**Fixed after** — The first click flashed the whole screen: a `next/dynamic` with no
`loading` has no Suspense boundary of its own, so downloading the modal suspended the home
page up to its `loading.tsx`. Every lazy modal (header, groups, pins, account page, login)
now passes `{ loading: () => null }`; the rule is in CLAUDE.md, "Performance rules".

---

## 2026-10-17 — Recently played skeleton fills its card (`fix/recent-skeleton`)

**Did** — The loading rows of "Recently played" (`RARecentlyPlayed`) sit in a
`home-fit-scroll` list and grow (`flex-1`) like the loaded rows, which share the card's
height (`ROW_STYLE` and the `.home-fit-scroll > *` rule in `globals.css`).
**Why** — The skeleton rows kept their natural height: an empty band under them, and
the list jumped when it loaded (seen by the user).
**Watch out** — The list waits for every linked platform. On 2026-10-17 `api.xbl.io`
did not answer from the dev machine (connection timeout after ~11 s, while the rest of
Cloudflare answered), so for an admin with Xbox linked the skeleton stayed ~12 s.
`xboxCall` has no timeout of its own and a failure is not cached, so every visit waits again.

---

## 2026-10-17 — Public comparison/how-to pages and a landing FAQ (`feat/seo-public-pages`)

**Did** — Four public pages: `/compare/exophase`, `/compare/psnprofiles`,
`/track/retroachievements-steam-playstation`, `/track/achievements-with-friends`
(`SEO_PAGES` in `src/translations/seoPages.ts`, `SeoPage`, `SeoPageRoute`), each
with a FAQ shown and sent as `FAQPage` JSON-LD. A five-question FAQ on the landing
(`T.landing.faq`, 9 languages) with its JSON-LD on the home page. The landing's
closing card and footer became `LandingClosing` and `PublicFooter`, shared with the
new pages; the footer links every public page (`PublicPageLinks`). Sitemap lists them
with their `updated` date; the proxy lets `/compare/` and `/track/` through.
**Why** — The user saw a post about a SaaS getting half its sign-ups from ChatGPT
recommending it off comparison posts. Before this, only 4 pages were public, so
neither Google nor an AI had anything to read about what the app does.
**Decisions** — Page prose in en/es only and outside `T`, since `T` is in every
page's bundle (CLAUDE.md, "Public pages"). Sitemap's `priority`/`changeFrequency`
left as they were: Google ignores them; what helps is more public pages.
Comparisons are honest about where the other site wins. The FAQ is an accordion
(`FaqListItem`, framer-motion height + fade, numbered, accent bar and a + that turns
into ×); the answer stays mounted while closed (height 0, `inert`) instead of using
`ExpandPanel`, which unmounts it, so every answer is in the HTML crawlers read.
**Open** — Claims about Exophase (platform list, leaderboards) and PSNProfiles
(guides, leaderboards) are from memory; their sites refuse automated reads, so the
user should confirm them. Google Search Console / Bing Webmaster Tools not set up
from here (dashboard work). Sign-ups are not tagged with their origin
(`utm_source=chatgpt.com`), so whether this works cannot be measured yet.
**Watch out** — Google shows FAQ rich results only for a few authority sites since
2023; the JSON-LD is still read (Bing, AIs), but do not expect FAQ snippets.

---

## 2026-10-17 — Checked in a real browser at 375 / 768 / 1440 px (`improvements_10`)

**Did** — Walked the main page (Ezio collection card, Activity, Pinned, Collection,
Following) in Playwright, signed in by the user, at phone, tablet and desktop widths;
no horizontal scroll at any. Fixed what showed: the month labels broke mid-word on a
phone (now hyphenated), the total play time split from its "h", best performance ran
the whole width between 1280 and 1535px (now beside play habits from `xl`), and the
weekday labels of the habits chart were cut at half width.
**Watch out** — Cards fade in on scroll (`ChartCard`'s `whileInView`): an element
screenshot of a section not scrolled through shows them blank. Reordering was not
tried in the browser, since it would save to the shared (production) database.

---

## 2026-10-17 — Collection made shorter; Following without an empty column (`improvements_10`)

**Did** — Collection: "Your numbers" (`CollectionNumbers`) is a strip across the page
under the last five completed — total play time beside its heading, then one tile
per platform side by side (4 columns from `2xl`, 2 below) — instead of a column ~700px
tall beside a collection grid of ~250px. The bars keep their counts; only the
repeated "completion distribution" heading is dropped (`CompletionDistribution`
`showTitle`). "Closest to perfect" moved to its own `CollectionClosest`, beside the
collection grid (same height); with nothing near 100% it renders nothing and the grid
takes the row (`xl:last:col-span-3`). Following: with nothing unlocked lately (and
done loading), the feed card stretches to the height of the column beside it
(`xl:self-stretch`, not sticky) with its "Nothing unlocked these days" centred,
instead of a short card over an empty column. (Hiding it was tried first; the user
wanted it shown.)

---

## 2026-10-17 — Pinned achievements and games can be reordered (`improvements_10`)

**Did** — In the Pinned section each tile has a grip (`MainPagePinnedSectionSortable`
+ `MainPagePinnedSectionSortableItem`, dnd-kit, pointer and keyboard). Achievements:
`migrations/037_pinned_achievements_position.sql` adds a nullable `position`;
`GET /api/favorites?source=all` returns the row `id` and orders by
`position NULLS FIRST, created_at DESC`; `PUT /api/favorites { order: [ids] }` saves
it (only the user's own rows); `usePinnedAchievements().reorder` is optimistic and
rolls back with a toast. Games reuse `PUT /api/pinnedGames`; the context's `reorder`
now also puts the old order back when the save fails.
**Decisions** — NULL position = never placed, shown first, newest first: a list nobody
reordered reads as before, and a pin made after a reorder appears on top.
**Watch out** — **Run migration 037 before this code runs against a database**: the
pins query orders by `position`, so without the column every pinned-achievements read
(main page, Pinned section, public profile) answers 500. Additive, safe to run first.
Applied to the shared database (production, which develop and local use) on
2026-10-17, with the user's go-ahead: 9 existing pins, all with no position yet.

---

## 2026-10-17 — Pinning no longer scrolls the page up (`improvements_10`)

**Did** — The four game tables (RA, Steam, PSN, Xbox) put pinned achievements first.
Pinning one moved its row to the top with the focused star in it; React then gave
the star its focus back, and `focus()` scrolled the page up to it. Each favourites
hook now also returns the pins as they loaded (`leading` / `leadingIds`), and the
tables order by that: a row pinned now stays where it is (still highlighted), and
leads the list the next time the page opens.

---

## 2026-10-17 — Pinning a PSN trophy answered 500 (`improvements_10`)

**Did** — `POST /api/favorites` for PSN listed `xbox_achievement_id` among its insert's
columns (8 columns, 7 values), so Postgres refused every PSN pin. Removed; a test now
checks, for each of the four sources, that the insert names as many columns as it
gives values (it fails on the old line).
**Why** — Slipped in with the Xbox data layer (`06be25b`); the route tests mock the
pool and only compared parameters. Never reached `develop` or `main`.

---

## 2026-10-17 — Stats & Activity: the Activity tab reworked (`improvements_10`)

**Did** — Three new cards, all read from the year of unlocks the streak already loads
(`useStreakData`: every platform, hidden consoles left out, no new call):
"This month vs last" (`MainPageMonthCompare`: achievements, games played, active
days, month-to-date against the same days of last month), "Play habits"
(`MainPageHabits`: bars by weekday and by hour of the day, the busiest day and three
hours in full accent and written out; a weekday × hour heatmap was tried first and
the user did not like it) and "Activity diary" (`MainPageJournal` +
`MainPageJournalDay`: the last 4 days with unlocks and their games). Logic in
`src/utils/activityInsights.ts`. Existing cards polished: "Most active" rows carry a
bar against the busiest game, "Abandoned" rows a progress bar (`GameListRow` got
`share` and `progress`). Order (2026-10-17, after seeing it): the month across the
top; habits (3/4) beside best performance (1/4), two cards of the same height; then
the four lists in one row (most active, diary, abandoned, rare) — 4 columns from
`2xl`, 2 by 2 below. The diary shows 3 days of at most 2 games, as tall as the
lists beside it. The pinned achievements left Activity (goals, not activity) for a
section of their own in the rail, "Pinned" (own page only; on a public profile they
stay in the showcase) — under Collection's numbers they went unseen. Best month opens
its days in `PeriodAchievementsModal` like the day and week do, instead of unfolding
and stretching the row. `GameListRow`'s icon is decorative (`alt=""`, grey behind it):
with the title as alt, a broken icon printed the name inside its 28px box.
The Pinned section was then redesigned (`MainPagePinnedSection`): the pinned
achievements are its lead — a heading with "n of total earned" and its bar, then
each as a tile (badge large with the platform in its corner, name, description, game,
earned/locked with an icon, points/grade/gamerscore, rarity); `pinnedView`
(`src/utils/pinnedView.ts`) puts the four platforms in one shape. Under them, the
pinned games as compact tiles (icon, platform, progress), resolved through
`useProfileLibrary`; the full cards with drag-to-reorder stay in Recently played's
pinned view. `MainPageFavorites` (the list) is still what the public profile's
showcase uses.
**Why** — The user asked to polish the section and add something; they picked these
three from four ideas (a per-platform split of unlocks was left out).
**Decisions** — Unlock dates are UTC on every platform; the habits, month and diary
count them in the browser's local time (`unlockTime`), or an evening in Madrid would
show two hours early. The month compares the 1st–17th with the 1st–17th, not half a
month against a whole one. Today/yesterday come from `Intl.RelativeTimeFormat`, weekday
and month names from `Intl.DateTimeFormat`, so only 9 strings were added per language.
**Open** — Not checked in a browser (every route needs a session).

---

## 2026-10-16 — RA missables marked in the badge grid; library backdrop band (`improvements_10`)

**Did** — `AchievementGrid` (the main page's opened RA card, the library's detail
panel, group cards) rings an unearned missable in red with a small warning triangle
in its corner, says "Missable" in its accessible name, and heads the grid with
"⚠ Missable left: N". `LibraryDetailBackdrop` is now `overflow-hidden`.
**Why** — The user wanted missables visible at a glance outside the game page.
The library panel showed a hard horizontal band across "Activity in this game": the
backdrop's art is `scale-110 blur-lg`, and what spilled past the bottom of its 30rem
box was outside the fade to `bg-card`, so the art's (dark) bottom edge showed cut off.
**Decisions** — Earned missables are left alone (nothing left to lose). The triangle
is there so the mark does not rely on colour alone.
**Open** — Not checked in a browser. The PSN work below was carried onto this branch
uncommitted from `feat/xbox-integration`; the branch name was chosen by the user.

---

## 2026-10-16 — PSN collections: one card in the recent feed (`feat/xbox-integration`)

**Did** — `withPlayData` gives a collection's last session only to the trophy set with
the newest trophy; the others keep their trophy date. Each game now carries its
`collection` (`PsnCollection` in `types/psn.ts`), and "Recently played" folds a
collection's games into one card (`psnFeed` in `utils/steamFeed.ts`,
`PsnCollectionItem`): its name, store icon, session, hours and summed trophies.
Opened, it looks like an opened game (`PsnCollectionExpanded`, trophies of every game
loaded at once by `usePsnCollectionTrophies`): ring, chart and rarest across the
collection, each game a fold of its trophies like BO2's DLC; the rarest link to
their own game (`PsnRarestTrophies` takes a `gameId` per trophy). Cache
`psn:titles:v10` → `v12`.
**Why** — Only Brotherhood was played, yet AC II showed in "Recently played" on
16 Oct with 76 h. Measured 2026-10-16: the played list has one entry, *The Ezio
Collection* (`CUSA04893_00`, 75 h 43 min, last session 16 Oct), and it maps to both
sets (`NPWR11436_00` Brotherhood, last trophy 6 Oct; `NPWR11435_00` AC II, last trophy
2 Apr 2025). The session was stamped on both.
**Decisions** — The user chose to fold only in the feed, with stats counting per
trophy set as before (each game keeps its platinum); a collection page with its games
as DLC-like sections was weighed and left out, since pins, groups, favorites and URLs
are all per set. The per-set session rule alone was not enough: opening AC II without
earning a trophy would still credit Brotherhood, and Sony gives nothing to tell them
apart. The hours stay on every game's own page (the total counts them once through
`playedAs`).
**Open** — The library lists (categories, explorer) still show each game apart, on
purpose: each completes on its own. Revelations is missing from the Ezio card: never
started, so Sony has no trophy list for it (the set lookup for `CUSA04893_00` returns
only AC II and Brotherhood). Not checked in a browser.
**Watch out** — Sony's `lastUpdatedDateTime` for AC II is 2026-09-20 though its last
trophy is from 2025: it moves without a trophy, so AC II still sorts at that date.

---

## 2026-10-16 — PSN icons: Sony's square store icon, not the PS4 trophy banner (`feat/xbox-integration`)

**Did** — PSN games now take their icon from the played-games list (`imageUrl`, else
`MASTER`) instead of the trophy set's (`withPlayData`, `psnClient.ts`); the cover is
only `PORTRAIT_BANNER`, and `GAMEHUB_COVER_ART` moved to the backdrop list. `GameIcon`
shows PSN icons with `object-contain`. A blurred copy filling the bands was tried and
dropped: the user preferred the plain bands. Cache key `psn:titles:v9` → `v10`.
**Why** — PS4 icons looked bad: measured 2026-10-16 on a real account, a PS4 trophy
set's `trophyTitleIconUrl` is a 320×176 banner (PS5's are 512×512), cropped to a
square ("SSASSIN CREED"). The played-games `imageUrl` is square (512/1024) on PS4 too.
On the game page the "cover" of a PS4 game was its 16:9 hub art cropped to 2:3.
**Decisions** — A collection (Ezio Collection → AC II, Brotherhood…) keeps each
game's trophy icon, letterboxed, rather than the same collection icon on every game.
PS3/Vita and games with a hidden played list also keep the (letterboxed) trophy icon.
**Watch out** — Pins and group items store `image_icon` at pin time; they show the
live library's icon when it is loaded, the stored one otherwise.

---

## 2026-10-16 — The "13 optimizations" (`feat/xbox-integration`)

**Did** — The roadmap's "13 optimization fixes" were never itemised, only named
(stampede, Cache-Control, duplicate fetches, TTLs, error boundaries, lazy images),
so each area was audited and what was real got fixed. Server stampede,
indexes and TTLs were already fine. Fixed: (1) `fetchWithRetry` shares one request
per URL in flight (the awards were asked for by 6 components); (2) `fetchShared`
does the same for the 12 PSN/Steam/Xbox hooks that use `fetch`; (3, 4) recharts
(~390 KB, in every page that had a chart) loads lazily behind the two plots;
(5) the account page's 9 modals and the admin panel load when first opened;
(6) the header's search and mobile menu, the group, pin and password-reset modals
too (`LazyWhenOpened`); (7) PSN and Xbox reads (6 routes) now send `Cache-Control`
like RA's and Steam's; (8) 7 context values are memoized; (9) hero images decode
async at low priority, admin avatars lazy; (10) `(auth)` got an error boundary
(`RouteError`, shared with `(main)`). Rules in `CLAUDE.md` ("Performance rules").
**Decisions** — Notifications stay a to-do the user wants to expand before it is
built (written in the roadmap). No change to the database.
**Open** — Not measured in a browser (no Lighthouse run): the evidence is that the
recharts chunk is now only in the `react-loadable-manifest`s, not eagerly loaded.
A first opening of a lazy modal costs one small download; if that is felt, preload
it on hover of its button.
**Watch out** — Tests of anything that opens a lazy modal wait for it (`findBy…`).

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
**Open** — `migrations/036` was run on the shared database on 2026-10-16, with the
user's OK (`develop` shares the production database). Without the column
`/api/preferences` answers 500 and every preference change toasts an error.
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
