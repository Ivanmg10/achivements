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
| Streaks in the top bar | Shown (board 2: three tag variants, three progress variants); **no pick yet** | 2 |

## Order

1. Tint without border (tiny, ship first).
2. Fonts: `latin-ext` fix now; the font choice waits for the user.
3. Login / register details.
4. Landing v2 with entrance animations.
5. Layout chooser: **design round first**, then build (it also carries the font choice).
6. Streak tag / top bar progress: ask the user which variant of board 2, then a one-file change.

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

## 6. Streaks and progress in the top bar (board 2)

Ask the user: tag **Hoy** (glow) / **A** (no glow) / **B** (only the flame coloured); Vault Points
progress **ring in the accent** (today) / **ring in the level's colour** / **a line under the
bar**. Files: `ui/StreakTag.tsx` (+ every place listed in CLAUDE.md's streak line),
`main-header/main-header-level/MainHeaderLevel.tsx`. Tier thresholds and colours
(`src/utils/streakTier.ts`) still need the user's approval (roadmap §1).
