# Antislop audit v1.7: code, visuals, identity (#77)

Started 2026-11-02, branch `chore/77-antislop-pass`. **Analysis only: nothing in the app was changed.**
The owner reads this, decides, and only then do fix issues (per screen or per shared piece) or a design
canvas get made.

## Why this audit exists

The site was built largely with AI, over many sessions. The owner likes it and loves its structure, but
feels a loss of control, and wants three things from this pass:

1. **Code a human can maintain alone**: no 200-line component that could be 50, no comment bloat, no logic
   copied two or three times because nobody looked.
2. **A visual identity of its own**: find the traits that make it read as AI-made, keep what is ours, and
   prefer simplicity: polish, reduce, or cut what does not earn its place.
3. **A deeper component library**, so future pages are built from it rather than drawn again.

Structure and layout stay; the slanted design stays. Everything here is a **proposal**.

## How this report is organised

- **Part 1, code**: the patterns that repeat across the whole codebase (the highest-value fixes), the
  probable bugs found on the way, and the questions only the owner can answer.
- **Part 2, visuals**: screen by screen, the slanted/round question, themes and colour, identity.
- **Part 3, the plan**: what becomes one shared change and what becomes a per-screen issue.
- **Appendices**: every auditor's full report, with a per-file coverage table:
  `docs/audits/antislop-v17/code/*.md` and `docs/audits/antislop-v17/visual/*.md`. Finding ids
  (`A-03`, `HK-01`, `V2-05`…) point there.

| Report | Area | Files | Findings (HIGH / MED / LOW) |
|---|---|---|---|
| `A` | Home components (`main-page/`) | 110 | 8 / 13 / 4 |
| `B` | Groups, account, rankings, following, streak, public profile | 129 | 11 / 13 / 4 |
| `C` | Library `ui/`, `/design`, welcome, header, search, layout/theme modals | 97 | 6 / 11 / 14 |
| `D1` | Per-platform components (`psn/`, `steam/`, `xbox/`, `ra-*`) | 77 | 7 / 13 / 3 |
| `D2` | Shared game, library and status components | 85 | 6 / 8 / 8 |
| `E` | Everything else in `components/` (auth, admin, modals, legal, vault…) | 126 | 8 / 19 / 10 |
| `HK` | `hooks/`, `context/` | 139 | 6 / 10 / 7 |
| `LB` | `lib/`, `proxy.ts` | 75 | 3 / 13 / 10 |
| `UT` | `utils/`, `types/`, `constants/`, `test-utils/` | 63 | 10 / 6 / 3 |
| `AP` | `app/` (pages, API routes), `globals.css` | 156 | 6 / 13 / 9 |
| `CP` | Copy: translations, public pages' prose | 13 | 3 / 11 / 5 |
| `MS` | Outside `src/`: scripts, config, CI, `public/`, CLAUDE.md and `docs/` drift | all | 2 / 4 / 5 |
| `T` | Every test file in `src/` (853 files, ~57,000 lines) | 853 | 6 / 5 / 3 |

The first eleven ran on Opus; `MS` and `T` on Sonnet, at about half the cost, which is enough for reading code and
listing findings. Judgement work (the visual and identity reports, this synthesis) stayed on Opus.

---

# Part 1: code

## 1.1 The diagnosis in one paragraph

The codebase is not badly written line by line: names are fair, error handling is mostly there, and many
comments record measured facts that are worth keeping. What hurts is **growth by copy**. Each platform was
added by copying the previous one (RA → Steam → PSN → Xbox), each new page drew its controls before the
library existed or without looking for it, and nobody went back to fold the copies together. The copies then
drifted: a fix made in one did not reach the others. That is where the size, the inconsistency the owner
feels on screen, and several real bugs come from.

## 1.2 Cross-cutting patterns (ranked by value)

### X1. The same component written once per platform

The largest single source of code. Four platforms means four copies of every card, row, table, provider and
route, differing in a handful of field names.

| Family | Copies | Lines now → with one shell | Ids |
|---|---|---|---|
| Game page achievement table + row + phone card | 3 (+RA) | 1,554 → ~600 | D1-01 |
| Badge grids, feed rows, category cards, category sections, expanded-game layout | 3–5 each | ~2,000 → ~900 | D1-02…06 |
| Group game cards (`SortableItem` ×4) | 4 | 712 → ~250 | B-01 |
| Home stat-pill rows, pinned rows, nav cards, profile column pieces | 4 each | ~1,760 → ~870 | A-02, A-03, A-06, A-07 |
| Status cards (`StatusGameItem` ×4) | 4 | 616 → ~290 | D2-01 |
| "Achievements to get" toggle hooks | 4 | 395 → ~110 | HK-02 |
| PSN and Xbox data providers | 2 (line for line) | → one | HK-04 |
| PSN/Steam/Xbox game page routes (not linked, loading, error, empty) | 3 | 304 → ~170 | AP-03 |
| Platform link/unlink SQL, user route vs admin route | 2 per platform | → `lib/platformLinks.ts` | AP-02 |
| Account page platform cards and forms | 2–3 | | B-06 |
| Admin panel platform blocks | 4 | | E (admin) |

**What it costs besides size:** the copies have drifted. RA colours the streak by tier and the other three
use the accent (A-02); the RA pinned row is a `div role="button"` while the other three were fixed (A-03,
A-05); the four group cards have different focus rings and expand behaviours (B-01); the admin RA unlink
skips a cache clear the others do (AP-02); Steam's "rarest" links go to your own page on someone else's
profile while PSN and Xbox keep the profile (D1-10).

**Proposed fix, one pattern for all:** a shared *shell* component (layout, states, interactions) plus a small
per-platform *adapter* (which fields, which icon, which extra column). Two shared achievement shapes already
exist in `utils/` (`CompareAchievement`, `InsightAchievement`); the shells should reuse one rather than add a
third (D1-01, UT-09). Not a generic four-way factory where the platforms really differ: HK found RA's retry
loop and Steam's two-step load are better left as they are (HK, question 1).

Estimated net reduction of X1 alone: **about 4,500 lines** of components, plus the drift bugs above.

### X2. The library exists, and is walked around

The component library (`src/components/ui`) is good, and the guard test stops the obvious bypasses. The ones
it does not catch have spread:

| Hand-drawn instead of the library | Where | Ids |
|---|---|---|
| The uppercase "kicker" label over titles | 116 lines in 95 files, six spellings; `SECTION_LABEL` exists | C-04, B (43 copies) |
| The focus-ring class string | 220 times in 162 files | C (library gaps) |
| Platform colours as hex literals | 116 times in ~40 files; Xbox is `#107c10` in some places and `text-success` in others | B-07, E-05, A |
| Card surface (`SURFACE`) spelled out | 38 files, one inside `ui/` itself | C-05 |
| Icon buttons drawn by hand | 13+ files, including `Modal`'s own close and 4 copies in the header | C-06 |
| Progress bar + percentage turning green at 100 % | 22 times; `LibraryEntryProgress` has one user | D2-04 |
| Notice boxes | ~14, three drifted styles | E-03, D1-19 |
| The retry pill under an error | 15 times, no focus ring, ignores both designs | D1-07 |
| Another user's avatar (+ presence dot) | 18 files, three fallbacks | B-08, C |
| The small tag (Beta and others) | 13 copies | B-11 |
| Stat tiles | 6 ways while `StatCard` exists | B-09 |
| Modals redrawing head, close and footer | ~20 (see X3) | E-02, B-03, D2-02 |

**Why it matters for the visuals:** this is the mechanical cause of "the same thing looks slightly different
on every page". **Fix:** add the missing pieces (`Kicker`, `Avatar`, `Tag` with tones, `ListRow`,
`SectionHead`, one `Spinner`, a top-anchored `Modal`, `ErrorRetry` on `Notice` + `Button`, `PlatformLogo`
everywhere), add tokens (`--hairline`, a focus-ring utility, `--shadow-sunken`, `--glow-done`, platform
colours as tokens), then **teach `uiGuard.test.ts` each new rule** so it cannot regrow (C, library gaps; T2).

### X3. Dialogs

`Modal` portals, animates, traps focus, answers Escape (only the top one) and draws head, close and footer.
Most dialogs do not let it:

- Every modal in D2's area wraps `Modal` in a **second** `createPortal`, hides its head and draws its own;
  `AchievementModal`'s ✕ has no accessible name; one adds its own Escape listener, which breaks "only the top
  dialog answers Escape" (D2-02).
- `GroupModal` and `AddGameModal` rebuild the portal, AnimatePresence and an Escape listener that never fires
  (B-03); 7 modals redraw their head and ✕ (two with a hard-coded English "Close"), 4 redraw Cancel/Save; the
  delete confirmations are not `tone="danger"` (E-02, E-27, B-03).
- `SearchModal` and the phone menu are hand-made dialogs that do not keep or give back focus; the phone menu
  has no `role="dialog"` (C-01).
- Modals imported statically, against the lazy-modal rule: the day/period/week modals in 7 files,
  `AchievementModal` in 2, `DayAchievementsModal` lazy in 1 of its 8 importers (A-04, D2-02).

**Fix:** one pass that makes every dialog a plain `Modal` (title, `showClose`, `footer`, `tone`), adds a
top-anchored placement for search and the phone menu, removes `CommonModal`, and lazy-loads them all. Then a
guard rule against `createPortal` outside `ui/`.

### X4. Small helpers that do not exist, so everyone writes their own

| Missing helper | Hand-written | Risk | Ids |
|---|---|---|---|
| Dates (`src/utils/dates.ts`) | ~100 places, 5 RA date parsers | **Some read RA's UTC strings as local time**; `formatDate` hard-codes `en-GB`, so every reader gets English dates | UT-04 |
| RA image URLs (`raAssets.ts`, like `steamAssets`) | ~50 (up to 148 counting all forms) | | UT-01, D2-05 |
| Platform list and names | `GAME_SOURCES` used only by a test, 12 re-spellings, `PLATFORM_NAME` ×5 | | UT-02 |
| One type per concept | the status union ×8, `SavedGame` ×6, "an achievement of any platform" 6 shapes / ~20 mappers, "a game of any platform" 8 shapes | | UT-03, UT-09, UT-10 |
| Hidden-games SQL clause | 17 copies in 6 files | | LB-01 |
| Session check in routes | 39 hand-rolled checks in 22 files, 401 spelled five ways | | AP-01 |
| RA retry loader (`useRetryingRead`) | 9 copies, drifted; ~350 lines | | HK-01 |
| Read one game's achievements on any platform | 2 full copies; RA's `Achievements` map parsed in 5 places | | HK-05 |
| PSN grade labels, RA id read, play-time units | 8, 6, 27 copies | | UT-07, UT-08, D1-13 |
| Secrets: HMAC, constant-time compare, cookie parse, `NEXTAUTH_SECRET` check | 3, 3, 2, 5 copies | Each caller's key derivation must stay exactly as is | LB-05, LB-07 |

### X5. Dead code

| What | Size | Ids |
|---|---|---|
| `MainPageMastery`, `MainPagePerfectGames`, `MainPageGamesList` and what only they reach | ~600 lines + ~400 of tests | A-01 |
| `GamesPlayedPieChart`, `MainStart` (+ `groupByConsole`, `T.pieChart`, `T.mainStart`) | | E-01 |
| `ragamesidpool.ts`, `CATEGORIES`, `getGamesInfo`, `getWantGames`, `groupByDay`, `calcStreak`, `withAchievementCounts`, `showcaseFromUnlock` (only a test; CLAUDE.md still names it) | | UT-06 |
| Translation keys never read | 115 keys ≈ 1,035 strings over nine languages | CP-03 |
| `globals.css`: light-theme rules for classes nobody uses; restated base values | 38 of 49 rules; ~115 lines | AP-06, AP-07 |
| `GET /api/follows` (no caller), `modalOverlay`/`modalContent`, ~10 exports used only in their own file, `isLimited` | | AP-16, LB-10, LB-06 |
| Library props nobody passes (`rarityTone`, `placeholderClassName`, `Tabs.size`, `IconButton tone="accent"`) | | C-12 |
| The home's "not linked" branches for PSN/Xbox/Steam that cannot run | | A-07 |

### X6. Project rules broken quietly

The rules in `CLAUDE.md` are good; some are not held, mostly where lint cannot see:

- **State in effects:** in 10 hooks and contexts a `load()` called from an effect sets loading before its
  first await, inside a `useCallback`, where the lint rule does not look (HK-06).
- **Memoized context values:** the Steam, PSN and Xbox providers read the session and pass a new `value`
  every render, so every session update re-renders all their readers (HK-03).
- **Silent failures:** pins, perfect-games order and groups turn a failed read into an empty list;
  `saveOrder` never rolls back (HK-09); `getGameHashes`/`getGameSubsets` answer an empty 200 on error, and a
  failed achievement detail is cached 5 minutes (AP-10); a failed RA id lookup in `AddGameModal` says
  nothing (B-02).
- **i18n:** hard-coded text in `GameHashesModal` (all Spanish), `AchievementModal`, `AchievementGrid`, the
  header and search ("Menú", "Close menu", "Search games"), `PinGameModal`, `NoMainHeader`, `"pts"` in 6
  files; ~10 date calls ignore the reader's language; the sign-up route's Spanish error strings are shown in
  all nine languages (D2-03, C-08, E, AP-12, A).
- **A figure loading shows `—`** on the account's platform cards (B-05).
- **Nested `<main>`** in 5 pages (AP-13); client components import types from server route files (AP-15).

### X7. Comments

Mostly fine: many record a measurement or a trap and should stay. The problems are specific:

- **Comments that lie**: docblocks on the wrong function in `steamClient` and `rankings`, an orphan block in
  `igdbClient` (LB-03); "Steam is linked by typing a name" in `ConnectAccounts` and `RaLoginModal` (E, D1-17).
- **Changelog comments**: "(#101)" in 13 docblocks, "as before" lines (HK-16); many comments still say "RA and
  Steam" over code that covers four platforms (A).

### X8. Naming and placement

- Shared pieces named after one platform: `SteamPinAchievementButton` is used by PSN, Xbox and the detail
  modal; `RARecentlyPlayed` is the all-platform feed; Steam's `achievementAnchor` is exported from a component
  and imported by three utils (D1-08, UT-11).
- `steamCache`/`withSteamCache` is the shared DB cache of every platform (LB-04).
- `achivement` typos in folder names (`achivements-line-chart`, `game-info-achivement`).
- "Detail" names three different things in the library (D2-09); `src/graphify-out/` sits inside `src/`.
- `utils.tsx` (523 lines) is a grab-bag of seven topics with ~70 dead lines (UT-05). Splitting it means
  changing the CLAUDE.md line that names it the home of pure transforms: the owner's call.

### X9. The project's own rules and tooling (MS)

- **`CLAUDE.md` is 1,459 lines (111 KB, about 28,000 tokens read at the start of every session)**, mixing rules
  with history and measurements. MS proposes keeping about 370 lines of rules an agent must obey on every task and
  moving platform specifics, performance notes, the welcome, social, releases, the roadmap and migration notes to
  `docs/` (MS-01).
- **Twelve contradictions or stale spots** in it, each checked against the code with line numbers: the Xbox score
  pace, streak colour (accent vs tier), `showcaseFromUnlock`, "Spanish UI text intentional" vs nine languages,
  "add to en.ts and es.ts" vs nine languages, `utils.tsx`, the `hasFetched` pattern (11 of 232 hooks), `role="switch"`
  vs `Switch`/`ToggleButton`, stale 1.5/1.6 milestones, an unchecked roadmap item already built, the Next.js block
  duplicated from `AGENTS.md`, two Xbox call counts (MS-02).
- **CI runs no tests, lint or build**, though the rules say never to merge a PR with them failing. Only the PR
  description and the linked issue are checked.
- `docs/worklog.md` is 2,460 lines and 137 entries: archive what is older than v1.7.0, about 150 live lines left
  (MS-04). Dead tracked files: `commit_all.tmp.sh`, `tasks/plan.md`, `tasks/todo.md`, `tailwind.config.ts` (Tailwind
  v4 never loads it), `public/media/3DSa.png` (MS-05). `docs/README.md` misses several docs; finished plans sit
  outside `archive/` (MS-06). Every dependency is used.

### X10. Tests (T)

- **No CI runs `npm test`, lint or build**, so none of the guard tests is enforced on a PR (T-01, MS). A `ci.yml`
  of about 25 lines fixes it. This is the cheapest high-value change in the whole report.
- About **660 test lines cover dead code** (9 whole files) and ~200 more sit inside kept files (T-02).
- About **3,500 lines of per-platform test clones** could be ~1,300 with `describe.each` contract suites, once the code
  itself is merged (T-03).
- **`themes.test.ts` checks 9 of 22 themes and never a tint**; run over all 22, the danger tint fails in six themes,
  the accent tint in six, and steam-retro's softcore on a card, which the test passes today (T-04, V7-01).
- **Guard holes**, each with a ready regex in T-05/T-06: 54 palette uses outside the five refused hues (`sky-300`
  ×21), `rounded-t-2xl`, Framer `variants`, 15 hand-made pill buttons, 14 hand-made notices, `createPortal` in 12
  files outside `ui/`, 213 hex literals in 78 files.
- Shared mocks copied by hand (`@/lib/db` ×75, `authOptions` ×67, `notify` ×34) where `moduleNameMapper` already
  does it for others; many assertions on implementation details (416 `querySelector`, 166 `toHaveClass`); every route
  test mocks the database, so SQL is never run; 43 tests use the real clock with no `TZ` (T-07…T-11).

## 1.3 Probable bugs found on the way

None was fixed (report only). Each needs a quick check before its fix.

| # | What | Where | Id |
|---|---|---|---|
| 1 | `PlatformMark` shows the **PlayStation logo on Xbox games** (collection and perfect-game tiles) | `platform-mark/` | E-06 |
| 2 | Setting a new password fails → the message says **"Error creating account"** | `ResetPasswordForm.tsx:52,54` | CP-02 |
| 3 | `/track/achievements-with-friends` says profiles show pinned achievements (private), that nobody is told who follows them (there is a Followers tab), and that people outside cannot see a profile (the teaser and `/rankings` are public) | `seoPages.ts` | CP-01 |
| 4 | `scoreRefresh.totalPoints` does not leave out hidden games or unlinked accounts; it feeds the "points ready" toast's level, which can differ from the header's | `lib/scoreRefresh.ts`, `useVaultFill.ts:62` | LB-02 |
| 5 | RA dates read as local time in some places and UTC in others: off by a day near midnight | `utils.tsx` KPIs, `gameCompare`, `friends`, home charts | UT-04 |
| 6 | Steam's activity/year feeds may not filter hidden games (RA, PSN, Xbox do) | to verify | AP-17 |
| 7 | On someone else's profile, Steam's "rarest earned" links to **your** game page | | D1-10 |
| 8 | Admin RA unlink skips `clearUserCache`; only admin PSN/Xbox links clear it | admin routes | AP-02 |
| 9 | The welcome's phone steps bar is `grid-cols-8`: a ninth step (a new platform) wraps | welcome | C-13 |
| 10 | `AchievementGrid` labels RA's `win_condition` as "completed" (the four tag maps drifted) | | D2-06 |
| 11 | `perfectDates` takes a PSN date without checking the game is completed | `utils/perfectGames.ts` | UT-10 |
| 12 | `AuthPage` mounts the login or register form twice (phone and desktop trees) | | E |
| 13 | `ThemePreview` looks slanted inside the round design (shape tokens sit on `[data-theme]`) | `globals.css` | AP-06 |
| 14 | The status page skeleton's column breakpoints no longer match the real list | | D2-10 |

## 1.4 Questions only the owner can answer (code)

**Answered 2026-11-06:** (1) every text goes through `T` (CLAUDE.md, Style, updated); the home's rail keeps its
sections, at most Explorar goes; themes, cuts and the identity directions are decided on a design canvas; the plan's
issues are opened (see 3.6).

1. **"Spanish UI text is intentional"** (CLAUDE.md, Style) vs **"all user-facing strings via `T`"** (i18n):
   several components hold literal Spanish or English. Which rule wins? (D2-03) **Answer: `T`.**
2. **`utils.tsx`**: split it by topic (and update CLAUDE.md), or keep one file? (UT-05)
3. **Platform links**: which cache behaviour is right on unlink, the user route's or the admin's? (AP-02)
4. **`MainPageWithoutRa`** copies the home and has drifted (no cover layout, no pinned view): fold it into
   the home, or keep it as is? Visible change. (A)
5. **`GroupCard`** is now only on public profiles: switch them to `GroupAlbumCard` (−120 lines, visible
   change)? (B-24)
6. **`/rankings/how`** shows Xbox as a platform that counts while Xbox is admin-only. Keep or hide? (CP-10)
7. **Steam "rarest earned" on another profile** (bug 7): make it match PSN and Xbox? (D1-10)
8. **CLAUDE.md contradicts itself** on the Xbox score pace (Vault Points says 5 a pass; #87 and the code say
   2). Which is true? (LB)

## 1.5 Copy (summary of CP)

- **Naming the same thing several ways**: linking RA is labelled "Sign in" (CLAUDE.md says it is not one);
  connect/link/unlink are mixed ("Desvincular" next to "Desconectando…"); Spanish calls the library
  biblioteca, librería, colección and bóveda; "achievements to get" is also pin, goal, pinned and "pineados"
  (CP-05, CP-07, CP-11, CP-13).
- **Gender**: rank names (Novato, Cazador, Maestro…) and the "only admin" message read as masculine in seven
  languages; "eres el #n" / "você é o #n" (CP-06).
- **Em dashes** in live strings: en 20, es 13, de 13, fr 16, it 12, ja 7, pl 16, pt 13, ru 33; each English
  and Spanish one has a rewrite in CP-09.
- The landing still says "across both accounts" with three platforms, in all nine languages (CP-04).
- Three modals and the register form show the API's raw `data.error` to people (CP, cross-area).
- What holds up: the landing FAQ passes the antislop FAQ rule, and both comparison pages are honest.

---

# Part 2: visuals

Seven visual auditors read 361 screenshots (every screen, slanted and round, 390 px and 2560 px, signed in and
out) plus the code behind them. Full reports: `antislop-v17/visual/V1.md`…`V7.md`.

| Report | Area | Findings (HIGH / MED / LOW) |
|---|---|---|
| `V1` | Home, header, search | 6 / 11 / 9 |
| `V2` | Library lists, the four game pages, not-found | 8 / 8 / 4 |
| `V3` | Groups, Following, rankings, streak, public profiles | 6 / 17 / 8 |
| `V4` | Account page, every dialog, the welcome | 5 / 10 / 7 |
| `V5` | Landing, sign-in, legal, comparison pages, public profile card | 6 / 17 / 3 |
| `V6` | The two designs and the component library | 6 / 9 / 2 |
| `V7` | Colour and contrast (token level; the per-theme review was cut by the owner) | 3 findings + a contrast table |

**A capture lesson, kept for next time.** The first signed-in round shots were the slanted page in the account's
own theme: `shape-style`, `home-layout` and the theme follow the account (`usePreferencesSync`, `users.theme`) and
win over whatever a script puts in `localStorage`. The round pairs used here were re-taken with the account's
preferences answered differently *in the browser only* (Playwright intercepting `/api/preferences` and
`/api/me/bootstrap`, every write blocked): `.audit/shots/app2/`, 110 shots. The account was never changed. V6 and
this synthesis used them from the start; V1–V4 first judged round from the tokens and were then re-checked against
the real pairs (each has a section "Slanted vs round in this area (re-checked 2026-11-06 with real pairs)"). Any
future visual capture must do the same.

## 2.1 What reads as AI-made, in one list

These recur on almost every screen; each is a pattern from the antislop catalogue, and each has a cause in Part 1.

1. **The uppercase tracked label on every block** ("JUGANDO AHORA", "ESTA SEMANA", "ACTIVIDAD, ÚLTIMOS 310 DÍAS"),
   next to two other label styles. The welcome uses kickers *in moments*; the app uses them as wallpaper
   (V1-06, V3, V5; code C-04).
2. **Too many things competing.** The home's first screen holds about 10 blocks and 45 figures, the same fact
   several times ("this week" three ways, "now playing" both as a card and as the list's first row) (V1-03);
   Following stacks two hero cards (about 560 px on a phone) before the first person (V3-05); rankings has three
   focal points (V3-09); the public profile repeats its achievements in three blocks and its identity in two
   (V3-20, V3-21).
3. **Colour on data instead of on state.** "Finished" is green, amber or blue depending on the platform; blue also
   means "in progress"; every figure in a detail panel gets its own colour (V2-04). About 24 hues are active across
   the site (accent, 4 platforms, 8 level tiers, 7 streak tiers, 6 meaning colours); yellow alone means five things
   (V7-02). Red is the loudest thing on the account page: seven destructive elements (V4-04).
4. **Glow and wash.** A pointer-following accent glow (`.spotlight`) on 21 components; accent washes and orbs in six
   places on the public pages, each written differently (V7-02, V5).
5. **The landing template.** Hero with a picture on the right, a bento of icon tiles, numbered monospace FAQ cards,
   a closing CTA card; no logo anywhere (the friend-drawn logo is only the favicon) (V5-01…03).
6. **The same piece in two looks** on one screen: a library button next to a hand-drawn one (landing, login, teaser,
   rankings: V5-10), three hand-made tab bars of three shapes on the home (V1-05), ten dialogs whose head is drawn
   five ways (V4-11), a person drawn seven ways across the social pages (V3-30). This is X2 of Part 1, seen.

## 2.2 What is already ours (keep it)

The auditors agree on these; they are where the owner's liking comes from:

- **The display italic condensed face** (Barlow Condensed italic) on titles, ranks and big figures: the strongest
  voice the site has.
- **The game art itself**: the login's art wall (the one thing a visitor remembers), the tinted game cards, the
  detail panel tinted in the game's colour.
- **The shared game page top** (`GameHero`) and the status-list rows.
- **The welcome**: it slants once per screen, and uses its kickers and motion as moments.
- **Single slanted gestures used big**: the primary button, the search slash, the slash between figures, the
  podium, the best-streak race bars, the overflow cut on the streak strip.
- **The app's 404** ("Explorador de lo desconocido", a locked achievement card): the most CheevoVault-specific screen.
- **Honest copy** on the comparison pages and the landing FAQ.

## 2.3 Why slanted feels off (the owner's question)

The answer is consistent across the seven reports, and it is not "slanted is wrong". It is how it is applied.

1. **One idea, about fifteen visible angles.** The tokens hold four skews (12° buttons, 14° pills and switches, 20°
   marks, 30° underlines), and the cut ends of bars are fixed pixels, so their angle depends on each bar's height:
   2.5° to 63° on real screens; three different angles on one podium; a 4 px progress bar with a 3 px cut leans
   about 37° (V6-01, V3).
2. **The slant only reaches the smallest things.** Cards, rows, tiles, avatars and fields are soft rounded
   rectangles (20 px cards). The slant lands on 22 px tags, 1 px hairlines, 4 px underlines and 6 px bar ends, where
   it reads as jitter, not as a voice. Two of the angle tokens produce 2 px or less and are invisible (V6-03, V6-05).
   The re-taken home pair shows it: round and slanted differ only in the search slash, the dividers between figures
   and the header pills.
3. **Two slant languages that do not rhyme.** Skewed controls keep their round corners (a 12 px radius on a 12°
   skew: a "rounded parallelogram" that belongs to neither design), next to crisp clipped bars with sharp corners
   (V6-02, V4, V2).
4. **No grammar.** The same kind of element is slanted in one place and straight in the next: in one toolbar the
   search field and filter pills are straight while the sort and the view switcher lean; the slanted level tag sits
   next to straight "TÚ", "Beta" and "Privado" tags; the segmented control's thumb leans inside a straight track
   (V6-04, V2, V3).
5. **Slant on data.** Vertical bars whose length *is* the information lean like dominoes (weekday streak bars, weeks
   chart), which blurs the comparison they exist for (V6-07, V3).
6. **Full-width slanted slabs**: the account's unlink buttons and dialog footers turn an accent into a band (V4).

**The welcome already shows the fix**: it slants **one** thing per screen (the primary button); its step pills are
round in both designs and its cards are upright. That rarity is why it reads as intentional (V4-21).

## 2.4 Round today

**Round is mostly "slanted with the cuts removed"**: every slanted device has a round fallback (lean to 0, cut to
capsule, plate to pill). The real pairs (re-checked 2026-11-06) show cards, rows, tables, heatmaps, tiles, dialog
frames and most dialogs identical in both designs; only controls, tags and bar ends change. The podium shows it best:
slanted steps are an image of a podium, round steps are three grey boxes. **One exception, worth building on:** on
bars round does have a small idea of its own. The rankings' weekly bars, the best-streak bars and the platform split
become capsules, the current week a dot, and the home's streak day strip is a better drawing in round than in slanted
(at 390 the slanted strip reads as hatching). But round applies it to only about half its bar charts (V3-32), and its
segmented track keeps 12 px corners next to capsule thumbs (V2-21). The italic display type keeps leaning in round with nothing answering it (V6, "Round's
own character"). What round does have: pills and circles for every one-line control (consistent since #78), round
platform dots, softer cards. Honestly kept, it is the calmer, friendlier design.

## 2.5 Identity: three focused directions

None changes page structure; all keep slanted as the default; they combine. From V6 ("Identity options"), with the
other reports' evidence behind them.

**A. One angle, used big** (the minimum; most of the "off" feeling goes by deletion). One `--slant` token replaces
the four angles; cuts follow it at any height (a `DataBar` piece); nothing under about 28 px slants; vertical data
bars never lean. Slanted things per screen drop to one to four, all the same angle, all large: the primary button,
the segmented choice, the podium, the race bars. That becomes the recognisable "CheevoVault lean".

**B. The slash as signature.** The search "/" and the slash between figures are already the most "ours" slants.
Make the slash the brand device: the current tab marked by a short slash, "/" as the separator in meta lines
("PS4 / 76 de 102 / 82 h"), with the logo (recoloured, never redrawn) finally on screen. Round draws a dot in its
place.

**C. Crisp slanted, soft round.** Small radii on slanted controls and tags (2 to 4 px) and tighter surfaces
(`--r-card` 20 to 14 px), so slanted is angular and confident; round keeps pills and soft cards and takes
**upright** display type (a `--display-style` token). Each design gets a character of its own, and the feeling that
slanted damaged round goes away because they stop sharing the same soft middle. Tokens only.

**Recommended order:** A, then C (token-only, can be tried live on `/design` with the shape switch), then B if a mark
beyond the logo is wanted. They go to the design canvas for the owner to choose, as `docs/design-process.md` says.

## 2.6 Simplify: cut and merge proposals

All are proposals; each needs the owner's yes.

| Proposal | Why | Id |
|---|---|---|
| ~~Home's side rail from 7 sections to 4~~ **Declined by the owner (2026-11-06): the sections stay; at most Explorar goes** | duplicates | V1-04 |
| Home overview: drop the 7-day chart from Resumen, KPI row to 4 figures, fold "Jugando ahora" into the list's first row | about 10 blocks and 45 figures on the first screen | V1-03 |
| One scope for the whole overview (the KPI row follows the profile tab while the charts count every platform) | "This week 1" next to "55 achievements in 7 days" | V1-02 |
| Following: two hero cards become one line of heading | 560 px before the first person on a phone | V3-05 |
| Public profile: one achievements block, one identity card | repeated three and two times | V3-20, V3-21 |
| Status pages "Completados" and "Ningún logro": drop the progress bar, lead with the finished date or the total | every bar full, or every bar empty | V2-13 |
| `/allGames` goes to the library's list view | the oldest-looking page, 11,000 px tall, emoji icons | V2-18 |
| Account page: quiet unlink buttons in each card's head, "Cerrar sesión" secondary, "Eliminar cuenta" one quiet line at the foot | red is the loudest thing on the page | V4-04 |
| Streaks in the accent only; the glow only on a finished progress bar | 24 hues, glow on 21 components | V7-02 |
| Themes: 22 to about 13, mapping each removed theme to its successor (count who uses which first) | a grid of 2 grounds times 5 accents, near-duplicates | V7-03 |
| Landing: the title-screen idea (2.8) replaces the template | the first impression is the most AI-looking screen | V5 |

## 2.7 Accessibility and visible bugs

| What | Id |
|---|---|
| Error notice text fails AA in the default dark theme (4.29:1) and five others; accent text on its own tint (selected pills, pressed icon buttons, dialog head icon) fails in six themes; `themes.test.ts` checks only 9 themes and never a tint | V7-01 |
| Streak colours on light themes read at 2.5 to 3.9:1 | V7-01 |
| On Venom, an "on" switch is a white knob on a white track (about 1.1:1): `Switch` paints the knob `bg-white` on the accent | V4-02 |
| "Tema: —" and "Idioma: —" are what a screen reader hears on the account page (the value goes in `children`, the label is built from `value`) | V4-01 |
| "Ratio hardcore 285 %" is RA's RetroRatio, not a hardcore share; the avatar ring's colour reads the same number, so it is gold for nearly everyone | V1-01 |
| Any printable key opens search with that key typed in; "/" opens it on "0 results" | V4-15, V1-12 |
| At 390, podium places 2 and 3 show the level badge twice (`hidden sm:inline-flex` loses to the badge's own `inline-flex`); the same cause elsewhere | V3-08, V5-18 |
| At 390 the level badge runs under the points on the account page | V4-03 |
| A game page that does not exist shows a bare "Error 503", not the not-found screen | V2-09 |
| "Crear una cuenta" does not always register | V5-16 |
| The cookie sheet covers the first screen on phones | V5-09 |
| Signed out, the app overwrites the stored theme with dark (public pages always dark, a fresh sign-in flashes dark) | V7 side note |
| At 2560 the game table runs the full width (about 1,800 px between a name and its numbers); public pages are 416 to 980 px columns in an empty screen | V2-03, V5-19 |
| `/rankings/how` names Xbox to signed-out visitors | V3-15 |
| On phones the platform tag "RetroAchievements" cuts the game title short; tab rows wrap; sideways strips show no sign of more | V2-14, V1-14, V1-15 |
| Two Xbox game pages opened from links in the owner's own library (`/xboxGame/1480659447`, `/xboxGame/1096157159`) show "game not found" to an admin, in both designs. Could be a dead id, the Xbox quota or a real bug: verify first | V2, app2 |
| A figure on its way shows "—" ("Tiempo total —" on the home's Xbox profile, the account's platform cards) | B-05, seen in `app2/home-classic__round__venom__2560.jpg` |

## 2.8 The new landing (inputs for the MGS2 idea)

The owner wants a title screen in the spirit of Metal Gear Solid 2's start screen, with the login's game carousel
where the eyes are. From V5 ("Direction notes"):

- **Keep**: the art wall (it is the "eyes"), the logo (unused today: the lockup is logo plus display italic
  wordmark), the display italic face as one huge line, the intro's voice ("lo que te queda por cazar"), the slide
  between login and register, the welcome's curtain and "cards grow into their detail" for going from a menu entry
  into its content, and the FAQ's content (it must stay server-rendered HTML for search engines and its JSON-LD).
- **Drop**: the bento and icon tiles, the cursor spotlight and orbs, the closing CTA card, underlined form headings,
  the frosted card with `shadow-2xl`, the monospace numbered FAQ, the marquee that never pauses, the two mounted forms.
- **Needs from the library** (none exists yet): `TitleMenu` (vertical text entries, one selected, arrow keys, the
  slant as the cursor, real links and buttons), `ArtReel` (the collage as a piece with a pause control and a still
  frame for reduced motion; the lockup text as the LCP element, not a cover), `BrandMark` (the logo paths,
  recoloured from tokens), a full-bleed `TitleScreen` shell that also hosts login, register, Steam sign-up and reset,
  a display scale in rem, and a decision on whether signed-out visitors see slanted or follow the default.

---

# Part 3: the plan

Nothing here is started. The owner decides; then each line becomes an issue (Feature or Bug form) and a PR into
`develop`, one concern each. The order matters: deleting first shrinks what the later steps touch, and the shared
pieces must exist before the per-platform shells and the screens can use them.

## 3.1 First, the owner's decisions

1. The eight code questions (1.4).
2. Which cut and merge proposals go ahead (2.6).
3. The identity direction: A, C, B or a mix (2.5), chosen on a **design canvas** with today's real screens beside
   each option (the owner's standing preference: grounded, never generic).
4. The landing: the title-screen idea, on the same canvas, once the direction is set.

## 3.2 Shared changes (one issue each, highest value first)

| # | Change | Removes or fixes | From |
|---|---|---|---|
| S0 | **CI that runs `npm test`, lint and build** on every PR, so the guards hold | the rules are only enforced by hand today | X10, T-01 |
| S1 | **Delete dead code**: dead components and their tests, dead utils, 115 translation keys, dead CSS rules, dead route, dead props | ~1,000+ lines of code, ~1,000 strings | X5 |
| S2 | **Fix the probable bugs** (1.3 and 2.7), each verified first; small ones grouped | 14 code bugs, ~15 visible ones | 1.3, 2.7 |
| S3 | **Data helpers**: `utils/dates.ts` (UTC rule, the reader's language), `raAssets.ts`, one platform list and names, one type per concept, the hidden-games SQL helper, `requireSession` returning the user, `useRetryingRead` | ~100 date sites, ~50 URL sites, 39 session checks, 9 loaders | X4 |
| S4 | **Library gaps**: `Kicker`, `SectionHead`, `Tag` (tones), `Avatar`, `ListRow`, `Figure`, `DataBar`, `ErrorRetry`, one `Spinner`, a top-anchored `Modal`; tokens for the focus ring, hairline, platform colours; each with its specimen and **a guard rule** so it cannot regrow | kickers in 95 files, focus ring ×220, hex ×116, surfaces ×38, notices ×14… | X2, V6 |
| S5 | **Dialog pass**: every dialog a plain `Modal`, lazy-loaded; `CommonModal` removed; guard against `createPortal` outside `ui/` | ~20 dialogs | X3 |
| S6 | **Slant grammar and the two designs** (after the canvas): one `--slant`, `DataBar` cuts, nothing small slants, `--display-style`, crisper slanted radii | the "off" feeling | 2.3–2.5 |
| S7 | **Colour**: contrast fixes in the tokens (tested values in V7), contrast tests for every theme and on tints, the switch's knob ink, one completion colour across platforms, streak colour decision, the glow budget, the theme list | AA failures, 24 hues | 2.7, V7 |
| S8 | **Copy**: one name per thing (link/unlink, library, achievements to get), gender-neutral ranks, em dashes, the landing's "both accounts", raw API errors shown to people, the public page that says what is no longer true | | 1.5 |
| S9 | **CLAUDE.md and docs**: contradictions removed, a shorter rules file, history moved to `docs/` | see MS | MS |

## 3.3 Per-platform shells (one issue per family)

After S3 and S4. Each: one shell plus a small adapter per platform, with tests moved to the shell. Highest line
count first: the game page achievement table (D1-01), the group game cards (B-01), the home rows and profile pieces
(A-02, A-03, A-06, A-07), the status cards (D2-01), badge grids, feed rows and category cards (D1-02…06), the
favourite hooks (HK-02), the PSN/Xbox providers (HK-04), the game page routes (AP-03), the link/unlink SQL
(AP-02), the account cards (B-06), the admin blocks (E). About 4,500 lines in all.

## 3.4 Per-screen issues (after S4 and S6)

Each uses the shared pieces and the chosen direction; each is checked on the owner's 2560 px screen and on a phone.

| Screen | What | Ids |
|---|---|---|
| Home | the rail, the overview's scope and density, one tab bar, phone wraps | V1 |
| Library and game pages | max width at 2560, the achievement row, completion colour, status pages without useless bars, `/allGames` | V2 |
| Following, rankings, profiles, groups | one person row, one heading, rankings' focal point, the profile's repeats | V3 |
| Account and dialogs | quiet destructive actions, the welcome's language on the account page, the preferences card | V4 |
| Landing and auth | the title screen (canvas first) | V5, 2.8 |

## 3.6 Issues opened (2026-11-06)

What can start now has its issue; what waits on the design canvas is gathered in one (#126). The per-screen issues
(3.4) are opened after the canvas, from what is agreed there.

| Plan | Issue | Depends on |
|---|---|---|
| S0 CI | #116 | — (do first) |
| S1 dead code | #117 | #116 |
| S2 probable bugs | #118 | #116 |
| S3 shared helpers | #119 | #116 |
| S4 library gaps and guard rules | #120 | #116; the slant inside `Tag`/`DataBar` follows #126 |
| S5 dialogs | #121 | #120 |
| S8 copy and i18n | #122 | — |
| S7 contrast (the theme list and colour budget go to #126) | #123 | #116 |
| S9 CLAUDE.md and docs | #124 | — |
| 3.3 per-platform shells | #125 | #116, #119 |
| S6 identity, cuts, themes, then the landing (design canvas) | #126 | — |

Three issues opened before the audit join the plan (2026-11-06):

| Issue | Where it goes | Why there |
|---|---|---|
| #113 Steam last-played only for the key owner | with #118, right after #117 | a data bug every Steam user but one sees (recently played, activity, streak, score refresh); no design needed |
| #114 recently-played rows misaligned | inside #115's viewport sweep | same sweep, same rows; the cause may be a width band |
| #115 profile on Steam Deck and AYN Thor | after #125 and the per-screen issues | fixing rows before they become one shell and take direction B would be done twice |

## 3.7 The owner's answers on the canvas (2026-11-06)

- **Identity: B.** Plus: slant the player's own marks (level and streak in the header, the rank's level) at the
  one angle. In round, the tabs take the mark in front like slanted, not the short underline. Drawn as B v2.
- **Cuts (2.6): rejected as drawn.** The owner felt they took the site's personality away (the proposals were
  redrawn flat instead of on the real components). Only repeats and real bugs may come back, one by one, with
  the owner's yes; the current look stays.
- **Themes:** purple stays. Open: dark and light take white and black as accent (absorbing `dark-white` and
  `light-black`), leaving violet to purple; drawn as Temas v2. **Chosen 2026-11-06**: dark white, light black, 22 → 14; Venom stays though close to dark.
- **Landing:** concept 2 (the moving band of covers under the title), but a working landing that explains the
  site below, with no "press start". Drawn as Landing v2, desktop and phone. v2's first screen read flat and its italic menu off-style; landing v3 has three first screens and the sections below with real crops and the real FAQ.
- **Cuts:** instead of page reworks, a review of what can be improved inside each screen as it is (see the reply of 2026-11-06 in #126).

## 3.5 Coverage

- **Code**: every non-test file in `src/` read in full by one of eleven auditors, each with a per-file table
  (`antislop-v17/code/*.md`): 1,000+ files, about 94,000 lines. Tests (853 files, guard tests read in full, the rest
  by heads, titles, diffs and counts) and everything outside `src/` in a second pass (`T.md`, `MS.md`).
- **Visuals**: 361 screenshots in the first capture (`.audit/shots/`, git-ignored) and 110 re-taken signed-in
  shots with real slanted/round pairs, eight dialogs included (`app2/`): every route, each home section and profile tab, each preferences tab, ten dialogs, both designs, 390 px and
  2560 px, signed in and out. The manifest is on issue #77.
- **Left out, on purpose**:
  - **Per-theme visual review**: cut by the owner (2026-11-06) as not worth its cost. Themes are judged from their
    tokens (the contrast table in V7) and from the owner's own theme, Venom, which is what the signed-in shots show.
  - The welcome beyond its first screen and the admin panel beyond its unlock: judged from code.
  - **No Xbox game page was seen**: both Xbox ids tried show "game not found" (listed in 2.7). Its page is judged
    from code (it shares `GameHero` and the table with PSN).
  - Not read line by line: the smaller test files (heads, titles, diffs and counts), the migrations (names and
    sizes) and `scripts/demo-rankings.mjs`.
  - `allGames` and `playing` at 390 are cut at 10,000 px (Chromium's limit).
  - Tools that measure duplication and dead exports (`jscpd`, `knip`) were not run: downloading them needs the
    owner's permission. The auditors found duplication and dead code by reading and grep instead.
