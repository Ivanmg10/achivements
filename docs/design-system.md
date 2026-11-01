# Design system

How the site's look is made, and how to add to it without drifting. Written for
the next agent (or person) who builds a page, a section or a piece. Start here,
then `CLAUDE.md` → "The component library" for the hard rules.

## The three layers

1. **Tokens** (`src/app/globals.css`): colours of a theme (`--accent`, `--bg-card`…),
   and the *design* — shapes, sizes, motion (`--slant-*`, `--clip-*`, `--bar-radius`,
   `--r-*`, `--h-*`, `--motion-*`). A theme changes the colours; a design changes
   the shapes. Today there are two designs: **slanted** (the default) and **round**, the site as it was before the slant
   (`[data-shape="round"]`, the person's choice, `useShapeStyle`; usable on any element). A third
   would be one more block of overrides, not an edit of any component. The **font** is a separate
   preference, not a third design: Barlow (the default), Sofia Sans or Fira Sans, each with its
   condensed italic display face, as `[data-font="sofia"|"fira"]` (`useFontStyle`; also usable on any
   element). `globals.css` swaps the font variables there; only Barlow preloads.
2. **The library** (`src/components/ui`, plus `VaultLevelBadge`, `GameCardBackdrop`…):
   every control, field, bar, ring, tag, dialog and surface. They read only tokens.
3. **Pages and sections** (`src/components/<area>`): built *from* the library; they
   add layout and copy, never a new control.

## The rules that keep it honest

- **Never draw a piece by hand.** `uiGuard.test.ts` fails on a hand-made button,
  text field, select, switch, checkbox, dialog, hard-coded palette colour, fixed
  `polygon(...)` or `skew-*-[..]`. If it fails, use the piece; if the piece is
  missing, add it (below).
- **Radii come from tokens too** (`rounded-card`, `-pane`, `-tile`, `-tag`, `-button`, `-chip`, `-field`): the round design softens or pills them. The guard refuses the fixed values (`rounded-[1.25rem]`…).
- **Shapes come from tokens.** A bar's cut ends are `slantStyle(px)`
  (`ui/shape.ts`); a mark's lean is `skew-y-(--slant-mark)`; a control's slant is
  `skew-x-(--slant-button)`. Never a literal. The welcome curtain's fixed `polygon(...)`
  values in `WelcomeCurtain.module.css` are the documented exception: the illustration is
  decorative and deliberately does not follow the shape choice.
- **Colour with a meaning comes from the theme** (danger, success, warning,
  `hardcore`, `softcore`). Hues of a *tier* (level badge, `streakTier`) are the
  exception and live in their own util, mixed with the text colour so they read on any theme.
- **Preferences about looks** (`home-layout`, `game-card-style`, `shape-style`, `font-style`) are
  synced keys in `src/utils/syncedPreferences.ts`; components read them through a
  hook (`useStoredChoice` underneath), and the *tokens* carry the result.
- **i18n:** every visible string is in `T` (all nine languages). The catalogue and
  the admin panel are the exception (English).

- **Loading is drawn from `Skeleton`.** One composed skeleton per screen or view, on the real page's boxes, gutters and classes (the home's uses the `home-fit` ones), so the content lands without a jump. Where a height comes from data, measure the real thing in the browser and write that number down. Pulse only; the guard refuses a hand-made `animate-pulse`.

## Entrances

One set of CSS classes in `globals.css` for the whole site (issue #61; families agreed 2026-10-25). A page asks for an entrance with a class; it never writes one.

| Family | Class | What it does |
|---|---|---|
| Heroes | `.enter-rows` on the column of text, `.enter-rise` on the rest with `[--i:n]` | Fade + 12 px rise; a child holding the `h1` goes first, whatever sits above it |
| Lists and tables | `.enter-rows` on the `ul` / `ol` / `tbody` | Rows 40 ms apart, only the first 12 |
| Cards and tiles | `.enter-card` on one, `.enter-cards` on a grid | Fade + scale 0.98 → 1 (a grid: first 12, 40 ms apart) |
| Charts and figures | `.enter-grow-x` / `-y`; `animateIn` on `CircularProgress`; `CountUp` | Bars grow, rings fill, numbers count. A `ProgressBar` inside any entering element grows by itself |
| Overlays, page transitions | none | As they were |

- **A page that waits for nothing may take longer:** `.enter-slow` on its root (800 ms, 70 ms apart; `/user`, the user's call, 2026-10-31). It has no skeleton to soften its arrival, so the general timing reads as abrupt. It only applies without reduced motion.
- **Retune in one place:** `--enter-duration`, `--enter-ease`, `--enter-stagger`, `--enter-rise`, `--enter-scale`, `--enter-grow`. Reduced motion only restates those tokens, so every entrance becomes a 200 ms fade with no movement and no delay; `CountUp` stays on its final number.
- **`backwards`, never `both`.** A fill that stays would keep a transform on the element: it traps `position: fixed` inside and fights a sortable row's own transform.
- **A list plays once.** `useEntrancesOnce` (mounted by `ShapeSync`) sets `data-entered` when its rows finish, because moving a node restarts its animation: measured 2026-10-31, 12 rows replayed on a reorder without the mark, 0 with it. It only ever switches an entrance off; nothing waits for it to show.
- **Only for what appears on its own.** A list that is mounted with its skeleton inside would play on the skeleton: keep the skeleton outside. What opens on a click may stay in Framer (dialogs, toasts, the library's swaps and opened rows); the guard in `uiGuard.test.ts` lists those. No `whileInView`: entrances are not scroll-triggered.
- **The library's shelves keep their own cascade** (`.enter-shelves` on their root, the user's call, 2026-10-31): each shelf 160 ms after the last, its title sliding in, its cards lifting and settling with a bounce 55 ms apart, "see all" closing it. The general `.enter-cards` was too plain there. It is built on the same tokens, so reduced motion needs nothing more, and its progress bars do not grow.
- The home's left card (`ViewEntrance`) and profile column (`MainPageProfile.module.css`) came first and keep their own keyframes (the user confirmed it on 2026-10-31). The welcome keeps its own too (`WelcomePage.module.css`): they are timed to its curtain.

## The catalogue (`/design`, admins only)

Every piece of `src/components/ui` (and the few that sit beside it) drawn live,
with its variants. Open it signed in as an admin; anyone else gets the 404 (the
flag is read from the database, never the session).

- **A menu on the left** lists every piece under its group (Foundations, Controls,
  Data, Feedback) and follows the reader (`useActiveSection`). On a phone it is a select.
- **Both designs, side by side.** A piece whose shape depends on the design is drawn
  twice, slanted and round, each inside its own scope (`data-shape` on a wrapper:
  the tokens answer to any element, not only `<html>`), whichever design the site is
  in. A piece that does not change is drawn once.
- **One list drives it** (`src/components/design-catalog/catalogue.ts`): the menu,
  each card's head (name, where it lives, summary), its props and its rules. A piece
  without an entry throws; a test checks that every entry has its card and menu link.
- The header flips the person's own shape and game-card style, to see the whole site follow.

## Adding or changing a piece — the flow

1. Is there one already? Look in the catalogue and in `src/components/ui`.
2. A new look for a whole area (a page, a section) → follow `design-process.md`
   (canvas first, one change at a time) and record it in `designs.md`.
3. Build the piece in `src/components/ui/<Piece>.tsx`: props for layout only
   (`className` never carries colour), accessible by default, reading tokens.
4. Test it next to it (`<Piece>.test.tsx`): render, interaction, the accessible name.
5. **Show it in the catalogue**: an entry in `catalogue.ts` (summary, source, props,
   rules) and its specimens in the group's file, inside `Compare` if its shape depends
   on the design, `Panel` if not.
6. If it must not be hand-made any more, add its rule to `uiGuard.test.ts`.
7. Use it in the page. A page that needs a one-off look asks for a prop or a
   variant on the piece, not a copy.
8. Worklog entry; `CLAUDE.md` if a rule changed.

## What is not here yet

- The V6 canvas boards are the *history* of the design (`docs/designs.md`); the
  catalogue is the *current* truth. If they disagree, the catalogue wins.
