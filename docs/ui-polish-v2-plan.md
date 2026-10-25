# UI polish v2 — integration plan

Written 2026-10-25, at the end of a design round the user ran out of usage to build. **Pick this up
from here.** Design canvas: [UI polish v2](https://claude.ai/artifact/9PhwWGMvcFzsygiGpDcY2F)
(private to the user's account; boards are named below by their number). Its history and the
rejected canvas before it are in `docs/designs.md`. This plan replaces §4–§7 of
`docs/ui-polish-roadmap.md` for the blocks it covers; the rest of that roadmap (skeletons,
leftovers, release) still stands.

How to work: `docs/design-process.md` (one version at a time, change only what the user asked,
build in short rounds, check it yourself in the browser — the user does not want to be asked for
screenshots). Library rules: `docs/design-system.md`. Every block below is one work branch from
`develop` with its own issue (`<type>/<issue>-<slug>`), its tests, a `docs/worklog.md` entry and,
if a design changes, its row in `docs/designs.md`. The user commits nothing to `main` until the
v1.7.0 release (roadmap §9).

## What the user decided on 2026-10-25

| Block | Decision | Board |
|---|---|---|
| Tinted game cards | **No border** (variant A). Gradient unchanged. | 1 |
| Landing | **Landing v2** ("me gusta bastante"), plus entrance animations on components only | 5b |
| Login / register | **"Con los detalles"** (small details, not a redesign) | 6 |
| Fonts | Liked Barlow / Sofia Sans / Fira Sans as options; **which ones ship is not decided** | 4, 3b |
| Layout chooser | Not the centred modal (3), not the plain panels (3b). **New concept**: background blurred, a floating full preview of the main page showing the changes, options in a side panel | — (to design) |
| Streaks in the top bar | **Tag without glow** (variant A) ; Vault Points progress **stays as today** (ring in the accent) | 2 |
| Default design | **Slanted** stays the default | — |
| Streak tiers | **Approved** as they are (0, 5, 10, 20, 30, 40, 50+; `streakTier.ts`) | 2 |
| Skeletons | **One per screen**, shaped like what it replaces; **pulse**, not shimmer; **no canvas round** | — |
| Entrance animations | The family table in §8 approved; **every page and component, nothing left unanimated** | — |
| Leftovers | §9: all yes, except no total hours in Portada's kicker | — |
| Release | **Option A** (all the polish in v1.7.0), and **not to `main` yet**: the user wants more style work first | — |

## Order

1. Quick wins: tint without border (§1), streak tag without glow (§6), `latin-ext` (§2).
2. The user's review bugs (§10): f (broken modal) first, then a, b, d, e, i, j.
3. Skeletons for every screen (§7), including review c and g.
4. The animation mechanism + landing v2 (§4), then animations everywhere (§8).
5. Login / register details (§3).
6. Leftovers (§9).
7. Layout chooser: **design round first**, then build, with the font choice (§2, §5).
8. Release when the user says (§11).

---

## 1. Tint without border

- `src/components/game-card-backdrop/GameCardBackdrop.tsx`: the tinted style's
  `boxShadow: inset 0 0 0 1px rgb(${tint} / 0.45)` becomes the flat style's hairline
  (`inset 0 0 0 1px rgb(var(--ink) / 0.08)`). Background gradient stays `0.24 → 0.07 → transparent`.
- Update its comment ("and a border in it") and its test, the `/design` specimen text if it
  mentions the border, `docs/design-system.md` and CLAUDE.md's line "`GameCardBackdrop` = a flat
  tint and border of the game's colour".
- Not decided, leave alone: average vs vivid colour. Board 1 shows the average going grey on
  Mario Sunshine, Hollow Knight and Celeste; raise it with the user once they see the borderless
  version live.

## 2. Fonts

- **Now, whatever is chosen:** `src/lib/fonts.ts` loads only `subsets: ['latin']`, so Polish
  (ą ę ł…) falls back to a system font. Add `'latin-ext'` to both faces. Barlow has **no Cyrillic**
  at all, so Russian always falls back with Barlow; Japanese falls back with any of the three.
- **Later (with block 5):** the font becomes a preference like `shape-style`: a synced key
  (`src/utils/syncedPreferences.ts`), `data-font` on `<html>` painted before the first frame by
  the same script as `data-shape` (`ShapeSync`), and the two CSS variables (`--font-ui`,
  `--font-barlow`) switched per `data-font` in `globals.css`. Candidates, each a family plus its
  condensed italic 700/800 for display: Barlow + Barlow Condensed (default), Sofia Sans + Sofia
  Sans Extra Condensed, Fira Sans + Fira Sans Extra Condensed (both with `cyrillic`).
  Load the non-default ones with `preload: false` so only the default costs the first paint.
  **Ask the user which of the two (or both) ship before building.** Add the choice to the
  welcome's preferences step (CLAUDE.md: the welcome follows the app).

## 3. Login / register details (board 6, "Con los detalles")

Files: `login-user-form/LoginUserForm.tsx`, `register-user-form/RegisterUserForm.tsx`,
`auth-form-field/AuthFormField.tsx`, `src/app/(auth)/authPage/page.tsx`, `SteamSignInDivider`.

- Title: `font-display italic` (≈40 px) left-aligned with a short kicker above it in the accent
  (new strings, e.g. "Tu bóveda te espera" / "Gratis, en un minuto"; gender-neutral, 9 languages).
  Drops the centred title and its rounded accent bar.
- Password fields get show/hide: `AuthFormField` renders the library's `PasswordInput` for
  `type="password"` (it has no toggle today).
- "¿Olvidaste tu contraseña?" moves from under the form to the password label's aside (`Field`'s
  `aside`), on the login form only.
- "Cuenta creada correctamente" becomes a `Notice` (success tone, icon, a title and a line:
  "Entra con tu usuario y tu contraseña"); the hand-made green box goes.
- Register: Steam and RetroAchievements side by side under the "o" divider, both secondary
  `Button`s with the design's shape (RA's hand-made `rounded-xl` button goes; label shortens to
  "Con RetroAchievements"). Login keeps Steam alone.
- Register: the password rule ("Al menos 8 caracteres", `PASSWORD_MIN`) turns into a live check
  (○ → ✓ in `text-success` once met), not colour alone.
- The legal links pill follows the shape token (`rounded-tag`) instead of `rounded-full`.
- Tests: each form's existing tests plus the toggle (aria-label changes, type switches) and the
  live rule.

## 4. Landing v2 (board 5b) + entrance animations

Today: `landing-page/LandingPage.tsx` with `LandingNav`, `LandingHero` (title, intro, CTA and the
`AuthCollagePanel` wall), `LandingBento` (+ `LandingFeature`), `FaqList`, `LandingClosing`,
`PublicFooter`. Target, top to bottom:

1. **Nav**: wordmark, links "Rankings" (`#rankings`) and "Preguntas" (`#faq`) hidden on phones,
   "Entrar" as a secondary `Button` (not the hand-made `rounded-full` pill).
2. **Hero** (`LandingHero`): title in `font-display italic` (~84 px desktop), the intro, "Crear
   cuenta" primary + "Gratis. Sin versión de pago." beside it. Right side: **a piece of the app,
   not the collage**: a "Jugado recientemente" panel (top strip with a `StreakTag` and a level
   badge, four game rows with `GameCardBackdrop` forced to `tinted` and `ProgressBar`). Static
   sample data (the art the bento already uses: RA images and `steamAssetUrl` covers); it is an
   illustration, `aria-hidden`.
3. **Platforms strip** (new `LandingPlatforms`): three columns between hairlines, each the
   platform's name and how it links (RA: username + Web API key, or sign up with it; Steam: sign
   in with Steam, profile must be public to read games; PlayStation: online ID, trophies public).
   Must stay true to CLAUDE.md's platform sections. **No Xbox** (public pages rule).
4. **Library** (`LandingLibrary`, replaces the bento's big tile): text left, a shelf of eight
   covers with a thin progress bar each.
5. **Rankings** (new `LandingRankings`, `id="rankings"`, a slightly darker band): title "Puntos
   Vault y rankings" + `Beta` tag; text built on the app's own sentence (`T.rankings.intro`: all
   platforms worth the same, rarer achievements worth more); link "Cómo se calculan" →
   `/rankings/how` (public). An **example** table (labelled "Ejemplo", made-up usernames, never
   real users) using `VaultLevelBadge`, `StreakTag` and `ui/dataTable.ts`. Three points below:
   level from Novato to Leyenda (the tier marks), compare with everyone or who you follow by
   week / month / all time (also by streak), you appear only with a public profile and can opt
   out in Preferences. Nothing about the formula beyond what `/rankings/how` says.
6. **Streaks** (`LandingStreaks`): one sentence and the seven tier tags (0, 5, 10, 20, 30, 40, 50+).
7. **FAQ**: two columns (title + lead left, an `Accordion` right, first item open). Add
   "¿Qué son los Puntos Vault?" to `T.landing.faq` in all 9 languages; the `FAQPage` JSON-LD is
   built from the same list, so it follows (CLAUDE.md → Public pages). Drop the blurred accent blob.
8. **Closing**: a hairline, "Trae tus juegos" in display italic, the line and the CTA, no card.
9. Text fix: `progressText` says "en las dos cuentas"; there are three platforms.

All new text in `T.landing` (9 languages, gender-neutral). Remove `LandingBento` / `LandingFeature`
if nothing else uses them, with their tests. Check at 390 px and 2560 px.

**Entrance animations, components only** (the user's words: "unas buenas animaciones de entrada de
componentes únicamente"): the pieces animate (rows, covers, table rows, tags, points), never a
whole section sliding in. Rules from CLAUDE.md → Roadmap (#61):

- CSS keyframes, not Framer's `x`/`y` (the hero uses Framer `motion` today: replace it).
- Never hide an element until a frame, idle callback or observer fires. Below the fold use
  scroll-driven CSS (`animation-timeline: view()` inside `@supports`), so a browser without it
  simply shows everything.
- A stagger through a `--i` index on each item; durations and easing as tokens (`--enter-*` next
  to `--motion-*` in `globals.css`), one place to retune.
- Reduced motion: a fade at most.
- Suggested motions: hero rows rise 8 px and fade in a 60 ms stagger; covers lift in a stagger;
  ranking rows fade in order; tier tags pop (scale 0.92 → 1); FAQ needs none.
- This is the first use of the shared mechanism #61 asks for: build it as a small reusable class
  set, not landing-only CSS, and add its specimen to `/design`.

## 5. Layout chooser — design first

Where it lives today: the Layout modal (`layout-modal/LayoutModal.tsx`, tabs Page / Home) opened
from Preferences (`UserPreferencesCard`). The user liked the side panel but not on its own,
because the settings live in Preferences and the page behind is not the home. **Their concept:**
opening "Diseño" blurs the page behind, shows a **floating, scaled-down full main page** that
reflects every choice live, and the options in a side panel.

Design round on the canvas before code (new boards on the same canvas):

- The preview is a sample home built from the real library pieces inside a container that
  carries its own `data-shape` (and later `data-font`), which the token system already supports
  (any element can carry `data-shape`). Not an iframe, not a screenshot.
- Decide with the user: apply each choice at once (today) or on "Guardar" with "Cancelar"
  (more natural with a preview); phone layout (preview on top, options as a sheet?).
- Options: shape, font (block 2), home layout, game card style; leave room for future
  "styles to the user's taste" (CLAUDE.md roadmap).
- Then build it as a library-backed piece (`Modal` size `xl` or a new overlay variant in `ui/`
  with its specimen), keep `LayoutModal`'s preferences components, and update the welcome's
  preferences step if it shows these choices.

## 6. Streak tag without glow (board 2, variant A)

`ui/StreakTag.tsx`: drop the outer glow (`0 0 14px …`) and the flame's `drop-shadow`; keep the
tinted fill and the 1 px inset ring. It is the one piece, so every place that shows a tag follows.
The streak page's hero is not a tag: leave it unless the user says otherwise. `MainHeaderLevel`
(the Vault Points ring) stays as it is. Tiers approved: no change to `streakTier.ts`.

## 7. Skeletons, one per screen (roadmap §2)

Decided 2026-10-25: a `Skeleton` piece in `ui/` (radius and surface from the tokens, so *round* and
*slanted* follow; a **pulse**, off with reduced motion), then **every** `loading.tsx` and component
skeleton redrawn in the shape of what it replaces, same gutters, no jump when the content arrives.
No canvas round. Also the places that load **without** a skeleton today (user review c, g below).
Guard in `uiGuard.test.ts` against a hand-made `animate-pulse` block; specimen in `/design`.

## 8. Entrance animations everywhere (roadmap §3, issue #61)

Approved 2026-10-25, to apply to **every page and component, leaving nothing unanimated** (make an
inventory of pages and families first and tick it off), the welcome included:

| Family | Motion |
|---|---|
| Heroes (game page, group, streak, profile, following) | Fade + rise 12 px; the title first, the facts after |
| Lists and tables | Rows staggered 40 ms, only the first 12 |
| Cards and tiles | Fade + scale 0.98 → 1 |
| Charts and figures | Bars grow, rings fill, big numbers count up |
| Overlays (modals, menus, search, toasts) | As today |
| Page transitions | Nothing beyond the thin top line that exists |

Same rules and mechanism as §4 (CSS keyframes, `--i` stagger, `--enter-*` tokens, never hidden until
a frame or observer, reduced motion a fade at most); build the mechanism once (§4 is its first use).

## 9. Leftovers (roadmap §8), decided 2026-10-25

- `Shelf` and the groups' drag slot become library pieces: **yes**.
- The welcome curtain's fixed clip-paths: **a documented exception** (decorative, must not follow
  the shape choice); note it in `uiGuard.test.ts` / `docs/design-system.md`.
- Round mode on Library, Groups, Following, Account: check it in the browser (see review a).
- Total hours in Portada's kicker: **no**.
- Compare the canvas's V6 boards with the built pages and bring the user only the differences.
- Old `rounded-xl` / `rounded-2xl`: **move them to the tokens** (`rounded-card` / `-pane` / `-tile`).

## 10. The user's review of the site (2026-10-25)

Screenshots were of `localhost:3000` at 2560 px, dark theme, slanted unless said.

- a. **Stats & Activity → Overview, round design:** the stat pills do not fit, and their hover is a
  circle. Fix the pill and its hover in round.
- b. **Pinned → "Achievements to get"** (and the showcase): every card the same size, no jumps
  (a two-line title or description makes one taller today; showcase cards differ too).
- c. **Home → Following / leaderboard:** no skeleton; users appear one by one as they load.
- d. **Search:** some games' icons do not load (seen: Assassin's Creed Liberation, Steam, empty tile).
  Find which source/URL fails and fall back to a placeholder like the rest.
- e. **Library:** the left list gets a fade at its bottom so it reads as scrollable.
- f. **The "New group" modal is broken.** Reproduce and fix.
- g. **Following page:** do not show the Following / Followers lists until everything is loaded
  (a skeleton until then); today they pop in with jumps.
- h. Rankings: fine.
- i. **`/racha` → "Your year":** the framed current streak is cut off at the right edge. Also check
  that the year really includes **old Steam and PSN history**: the user feels it misses it. Start
  from CLAUDE.md → Performance rules (`steam_unlocks`: only what the score refresh has read; the
  live part covers the `maxGames` played last) and how PSN's year feed is built; measure on the
  user's account before changing anything, and tell the user what is and is not counted.
- j. **`/user`, preferences tabs:** going from a platform tab (RA) to General, one preference
  arrives late and jumps. Keep the tab's height or render it with the rest.
- k. **`/welcome`** follows every one of these style and layout changes (skeletons, animations,
  fonts, Layout chooser, tint, shapes): check it in each block.

Also seen in the screenshots, not raised by the user: the library shows "Could not load your Xbox
games" in red (admin account; the open `xboxCall` timeout problem, `docs/xbox-integration-plan.md` §7).

## 12. Answers of 2026-10-25, last round

- **Streak glow:** remove it **only in the top bar** (`MainHeader`'s `StreakTag`): give `StreakTag`
  a prop (e.g. `glow={false}`) rather than changing the piece for everyone. Supersedes §6.
- **Fonts:** the user leaves the choice to us. Offer **both** Sofia Sans ("Amable") and Fira Sans
  ("Legible") beside Barlow (default), as §2 describes; the extra two with `preload: false`.
- **Tint colour: try a more vivid one**, with the fear that it over-saturates. From the user's home
  screenshot: Monument Valley (green) and Marvel's Spider-Man (red) look great today; Assassin's
  Creed Liberation, Call of Duty: Black Ops II, The Impossible Game and Pokémon Colosseum look bad
  (muddy grey/brown or a hue that is not the game's). Proposal to test: take the most colourful
  cluster instead of the average, then **cap it in OKLCH** (chroma and lightness in a band, so no
  neon and no near-black), and when the art has no real colour (low chroma) fall back to the
  neutral tint instead of a muddy one. Show it first on a canvas board with **exactly those six
  games** (today / vivid capped / vivid uncapped), dark and light, then change only
  `useImageTint`'s `averageTint` (+ its tests).
- **Layout chooser:** choices apply **at once** (as today). The floating page is a **dummy example of
  the main page** (sample data, not the person's own), shown over the blurred page, with the
  options in the side panel. This is the concept to draw in §5.

## 13. Portada (the home's cover layout), the user's style points

- The level card needs the **ring** (`CircularProgress` around the level, progress to the next
  level), as the classic view's level shows; today it is a plain number and looks bland.
- That card area looks **empty**: add something to it (draw options in the design round; ideas:
  the week's points and rank change, the next tier, the rarest recent unlock).
- **Remove the last-played game from "Recently played"** in Portada: it is already the hero.
- **Stats & Activity's data source:** in Classic it follows the platform chosen in the right
  column's tabs (RA / Steam / PlayStation / Xbox); Portada has no such tabs, so it is unclear what
  the section shows. To decide with the user on the canvas; recommended: put the platform tabs in the
  Stats & Activity head itself (the same state Classic uses), so both layouts work the same way.

### Portada, decided on the canvas (board 7, 2026-10-25)

- Level card: the ring + **option A "Tu semana"** (the week's points, places gained, a 7-day mini bar
  chart). B and C were not chosen.
- The Stats & Activity platform switch: **not** the pill tabs drawn on board 7; use the same
  selector as the account preferences (`ui/Tabs`, the slanted line tabs of `UserPreferencesCard`),
  sharing its state with Classic's platform tabs.
- **"Recently played / Pinned games" must end at the same height as the right column.** If
  something has to give, it is the right column's "Recent achievements" (show fewer).
- **Slanted tags everywhere:** the level and streak tags drawn skewed in the top bar (boards 2 and
  7) are liked; in the slanted design, the top bar's level and streak tags and the page's tags
  (level badge, streak tag, platform chips) lean with `skew-x-(--slant-pill)` (text counter-skewed).
  Round design unchanged. Do it in the pieces (`VaultLevelBadge`, `StreakTag`, the chip), not per page.

## 11. Release

Option A: everything above ships together as v1.7.0, but **not yet**: the user wants to work on
more style points first. When it is time: merge `main` into `develop` (PR #37 is missing there),
then `chore(release): v1.7.0` with the release gates of CLAUDE.md.
