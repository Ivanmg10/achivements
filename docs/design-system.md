# Design system

How the site's look is made, and how to add to it without drifting. Written for
the next agent (or person) who builds a page, a section or a piece. Start here,
then `CLAUDE.md` → "The design system and the library" for the hard rules (one line each; in full below).

## The three layers

1. **Tokens** (`src/app/globals.css`): colours of a theme (`--accent`, `--bg-card`…),
   and the *design* — shapes, sizes, motion (`--slant`, `--mark`, `--bar-radius`,
   `--r-*`, `--h-*`, `--motion-*`). A theme changes the colours; a design changes
   the shapes. Today there are two designs: **slanted** (the default) and **round**, softer surfaces with every one-line control a pill or a circle
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
- **One date format** (#129, #130; the owner on the canvas, 2026-11-07): day and short month in the reader's
  language, **the year only when it is not the current one** ("23 oct", "Oct 23", "3 oct 2025"; `dateFormat`
  in `utils/dates.ts`). On screen it is `ui/DateText` (a `<time>`); where JSX cannot go, `formatDate(s, lang)`
  or `formatDay(day, lang)` with no options. The guard refuses a numeric date (`formatDate(…, lang, {})`), the
  format written by hand (`{ day: 'numeric', month: 'short' }`, with or without a year), any
  `toLocaleDateString` outside `utils/dates.ts`, and a `toLocaleString` or `Intl.DateTimeFormat` given a day,
  month or year anywhere else (the admin panel is exempt). A date with its time (the unlock tooltip, RA's
  achievement modal) is `formatDateTime`: the one format, then hh:mm. What keeps its own options, through
  `formatDate` / `formatDay`, is not "the date of something": a chart's axis, a month ("January 2024", the best
  month), a range of days (`MainPageMonthCompare`, its own formatter), a day with its weekday (the journal, the
  streak page's rows, a day modal's title, the heatmap tooltip). A test that pins a formatted date fixes the clock
  (`jest.useFakeTimers({ now })`) or uses a past year, so it says the same next year.
- **A rule that starts with offenders lists them** (#120, 2026-11-08): `NEW_RULES` in the guard, each with its
  list of files still drawing the piece by hand in `ui/uiGuard.pending.json`. A file not on its list fails; a
  file on it that no longer offends fails too, so the list only shrinks. Migrate a file, then take it off.
  Never add one. The worklog's #120 entry says, rule by rule, what replaces what.
- **Radii come from tokens too**, chosen by what the thing is. Round must stay rounder than slanted (`designTokens.test.ts`). The guard refuses fixed values on anything painted (`rounded-lg`, `rounded-[1.25rem]`…), with a short list of documented exceptions.

  | Token | For | Slanted | Round |
  |---|---|---|---|
  | `rounded-card` | Cards | 20 px | 24 px |
  | `rounded-sheet` | The search panel, the rankings podium | 18 px | 24 px |
  | `rounded-pane` | Panes | 14 px | 20 px |
  | `rounded-tile` | Tiles inside a card | 10 px | 16 px |
  | `rounded-control` | Soft surfaces: notices, menus, tooltips, toasts. Not controls, despite the name | 12 px | 16 px |
  | `rounded-area` | A field of several lines | 14 px | 20 px |
  | `rounded-box`, `-box-md`, `-box-sm` | Thumbnails, rows, small boxes | 8, 6, 4 px | 12, 10, 8 px |
  | `rounded-cell` | Heatmap cells, chart bars | 3 px | 5 px |
  | `rounded-button` | Buttons, control groups | 12 px | pill |
  | `rounded-field` | A field of one line | 14 px | pill |
  | `rounded-icon`, `rounded-chip`, `rounded-nav` | Icon buttons, chips, the header's account link | 9, 8, 10 px | circle or pill |
  | `rounded-tag`, `-tag-sm`, `-badge` | Tags and small badges | 6, 4, 5 px | pill |

  `rounded-(--bar-radius)` rounds an accent mark's ends in the round design, and `--button-inset` is the room the slant adds on each side of a button, 0 in round.
- **The tokens that are not colours of a theme** (`globals.css`, `@theme inline`, #120):

  | Utility | What | Instead of |
  |---|---|---|
  | `focus-ring` | the focus ring of anything that takes the keyboard | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70` |
  | `shadow-hairline-t`, `-b`, `-b-soft` | a line between parts (ink 10 %; a table row's 5 %) | `shadow-[inset_0_±1px_0_rgb(var(--ink)/0.05–0.1)]` |
  | `shadow-sunken` | what you type into, below the card | `shadow-[inset_0_2px_4px_rgb(0_0_0/0.22)]` |
  | `drop-shadow-done` | the one glow: a finished bar or ring | `filter: drop-shadow(0 0 6px …)` |
  | `text-/bg-/ring-` `ra`, `ra-gold`, `steam`, `steam-dark`, `steam-perfect`, `psn`, `psn-dark`, `xbox`, `platinum` | a platform's own colour, the same in every theme (`/10` and the rest work) | `#66c0f4`, `#0070d1`, `#107c10`… and `sky-300` for a platinum |
  | `silver`, `silver-light`, `silver-ink`, `gold-ink`, `bronze-ink`, `hardcore-deep`, `offline`, `status-playing`, `status-want` (and `-bg`), `status-done-bg`, `redump`, `tosec` (and `-ink`), `best-period` (and `-soft`), `console-<name>` (and `-ink`), `award-*`, `steam-button`, `steam-slate`, `steam-night`, `steam-sky`, `psn-night`, `psn-light`, `xbox-dark`, `art-pink`, `art-cyan` | the hues that are not a theme's, in the exact values the palette classes gave them (2026-11-08) | `zinc-400`, `blue-900/50`, `violet-300`, `#171a21`… |

  In an inline style (an SVG stroke, a ring colour passed as a value) use `var(--color-steam)`. What stays a literal hex, on the guard's `OWN_COLOURS` list with its reason in the test: the logo and the server-drawn pictures, the RA guide's drawing of RetroAchievements' own page, the welcome curtain's ink, and the browser bar's `THEME_COLOR`.
- **Shapes come from tokens.** A lean is `skew-x-(--slant)` on a library piece or `SLANT_PLATE`
  (`ui/shape.ts`), the signature glyph is `MARK`. Never a literal (see The slant grammar below). The welcome curtain's fixed `polygon(...)`
  values in `WelcomeCurtain.module.css` are the documented exception: the illustration is
  decorative and deliberately does not follow the shape choice.
- **Colour with a meaning comes from the theme** (danger, success, warning,
  `hardcore`, `softcore`); a platform's is its token; the guard refuses a palette class of any hue and a hex
  literal outside the logo and the server-drawn pictures. Hues of a *tier* (level badge, `streakTier`) live in
  their own util, mixed with the text colour so they read on any theme.
- **Preferences about looks** (`home-layout`, `game-card-style`, `shape-style`, `font-style`) are
  synced keys in `src/utils/syncedPreferences.ts`; components read them through a
  hook (`useStoredChoice` underneath), and the *tokens* carry the result.
- **i18n:** every visible string is in `T` (all nine languages). The catalogue and
  the admin panel are the exception (English).

- **Loading is drawn from `Skeleton`.** One composed skeleton per screen or view, on the real page's boxes, gutters and classes (the home's uses the `home-fit` ones), so the content lands without a jump. Where a height comes from data, measure the real thing in the browser and write that number down. Pulse only; the guard refuses a hand-made `animate-pulse`.
- **Cards that share a row are one height, and full** (the owner, 2026-11-12). Two or three cards side by side (2-2,
  3-3-3…) stretch to the row's height (a grid row does it by itself) and **what each shows is sized to fill it**: more rows
  in the shorter one, a cap and a "See more" in the longer one; never a card stretched around blank space. It goes with
  "a page does not shrink when data is missing": with no data the room is kept, with data it is filled. Example, `/racha`:
  the calendar card is a fixed height (the weeks' arrows, the months, seven rows, the legend) and the day beside it shows
  at most five achievements, "See more" in its head; the best streaks next to it show as many rows as the card holds
  (`useFitCount` measures it), more where the calendar card stacks its panel under the grid and grows.

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

## The slant grammar (identity B v2, #127, 2026-11-09)

The owner chose it on the design canvas (`docs/designs.md`, row 2026-11-07: boards "SheetB2" and "Piezas"), as drawn.
The complaint was "it looks generic, nothing makes it recognisable", not the slant itself: the slant was everywhere at
four angles (12°, 14°, 20°, 30°) and fixed-pixel cuts, so it read as noise. B keeps it as the site's mark by putting it
where it means something.

- **One angle.** `--slant` is 12° (0 in round). Every lean is `skew-x-(--slant)` on a library piece, or `SLANT_PLATE`
  (a plate behind the content) for a big piece; a plate's cut follows the angle at any height, so the three podium steps
  lean alike. The guard refuses the old `--slant-*` / `--clip-*` and a lean outside the library but two drawings it names.
- **What leans:** the big gestures and the player's own marks: the primary `Button`, the chosen option of a
  `SegmentedControl`, the level (`VaultLevelBadge`, `Tag slant`) and the streak (`StreakTag`) wherever they are (the top
  bar shows them at one height, one family), the podium's steps.
- **What stands upright:** small controls, fields, search, filters, `Select`, `Switch`, secondary, quiet and danger
  buttons, every other tag (the game page's chips too), the header's account link, a row's accent mark.
- **Data never leans:** `ProgressBar`, `DataBar`, the streak page's bars and every chart bar are upright, square in
  slanted and rounded in round (`--bar-radius`).
- **The mark is the signature:** `--mark` ("/" slanted, "•" round; `MARK` on an `aria-hidden` span). In front of the
  tab you are on (`Tabs`, the one drawing of every tab bar: the profile tabs, the home's view switch, the stats rail,
  the account and public profile; `TabMark` in the top bar's links and the filter rows), in the search bar, between
  bare figures (`Figure`) and between facts on one line (`Facts`: "15/49 achievements / 102/485 pts / 2 Nov 2026").
- **No label in capitals:** `Kicker` (13 px), figure labels, card titles and table heads are in sentence case. The guard
  refuses the `uppercase` class (the hash modal's dump-group names are the one exception).
- **Round keeps its rule:** everything rounder than slanted, every one-line control a pill (`designTokens.test.ts`); it
  takes the dot where slanted has the slash, and nothing leans.

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

## The rules in full (moved from `CLAUDE.md`, 2026-11-07, #124)

`CLAUDE.md` keeps one line per rule; here is each with its reason and history.

### Designs, shapes and radii

- **Two designs, two look preferences:** `shape-style` = `slanted` (default) or `round`, and
  `font-style` = `barlow` (default), `sofia` or `fira` (Preferences → Layout), as
  `data-shape` and `data-font` on `<html>`; any element can carry either one to show a look inside
  another (the catalogue, the choice cards and the Layout chooser's sample do; `data-font` swaps `--font-face` and `--font-face-display`, and such an element takes the family itself) (`ShapeSync`; a
  script in the root layout paints the last choices before the first frame). A component never
  reads the choice: it reads tokens. A lean is `skew-x-(--slant)` or `SLANT_PLATE`, the mark `MARK`
  (`ui/shape.ts`; The slant grammar).
  **Never a literal `polygon(...)` or `skew-*-[..]`** (`uiGuard.test.ts` fails on it). The round
  design may override the shape tokens; no theme may (`designTokens.test.ts`). The base shape tokens sit on
  `:root` only, never on `[data-theme]`, so an element that carries a theme (the theme chooser's preview)
  inherits the page's design instead of restating the slanted one (AP-06, 2026-11-08). The welcome curtain's
  fixed clip paths are the documented decorative exception and do not follow the shape choice.
- **The round design must always be rounder than the slanted one (2026-11-01, #78):** every surface a step
  softer (`--r-card`, `-sheet`, `-pane`, `-tile`, `-control`, `-area`, `-box*`; `designTokens.test.ts` fails if one
  is not), and every one-line control a pill or a circle (`--r-button`, `-field`, `-icon`, `-tag`, `-tag-sm`, `-badge`,
  `-chip`). It started as a copy of the site before the slant, and the slanted design then grew past it, so it looked
  square with nothing failing. **Choose by what the thing is:** a card `rounded-card`, a floating panel `rounded-sheet`,
  an inner tile `rounded-tile`, a thumbnail, row or small box `rounded-box` (`-md`, `-sm`), a heatmap cell `rounded-cell`, a
  button `rounded-button`, an icon button `rounded-icon` or `rounded-chip`, one line of input `rounded-field`, several lines
  `rounded-area` (`multiline: true` on `fieldClass`, which the guard requires on a raw `<textarea>`; a round corner cuts its grip,
  so `[resize:var(--area-resize)]`). A `Modal` draws the frame: never a card inside it. **`rounded-control` is a soft surface, despite its name** (notices, menus,
  tooltips): it must never be a pill, and a real control does not use it. A value new to the slanted block restates what
  that design drew, so it does not move. Outside `ui/`, `uiGuard.test.ts` refuses `rounded-lg`, `-md`, `-sm`, `-xl`, `-2xl`,
  `-3xl` and arbitrary values, on any side, but for its short list of exceptions; a bare `rounded` is only a focus ring's corner.
  A `rounded-full` chip is a pill in both designs: left so on purpose, since moving it would change the slanted design.
- **Disclosure:** `Accordion` (`AccordionItem`), `ShowMore`, `Shelf`, `DropSlot` and `ToggleButton`
  are in `ui/`; a `DropSlot` is a dashed border and nothing else (no stripes, #130); the big faint icon behind a hero card's title is
  `GhostIcon` (one size and opacity, whole inside its card at the title's line; never an oversized icon cut by the edge); a pin star or any on/off icon is a `ToggleButton` (`aria-pressed`), never a hand-made `role="switch"`.
- **Game cards:** `game-card-style` = `tinted` (default, the colour of the game's art) or `flat`;
  `GameCardBackdrop` is the one place that draws it, so every game card follows it.
- **Streaks are coloured by tier** (`streakTier`: 0, 5, 10, 20, 30, 40, 50+ days; `StreakTag`, the picked best streak, the
  streak hero and its live bar, the cover's streak card, the home's stats tile, the rankings' streak column). Every streak
  colour comes from it; there is no "streaks in the accent" rule (gone since #124: the hero uses `streakTier` too). **The best
  streaks on `/racha` are grey but the one being shown day by day** (the `none` tier's grey), which is in its tier's colour:
  the live or best one at first, then the one picked (the owner's call, #131). The days of a streak (its calendar, the year) are shaded in the accent by how much was unlocked: that is
  activity, not a streak's colour. A tier's ink keeps `--streak-hue` of its hue (72 %, less on light themes and Steam Retro), so it reads in every theme.

### The Layout modal and look transitions

- **The Layout modal moves on every change (2026-11-01, #78):** all its options in view, no tabs. The theme stays in its own dialog (`ThemeModal`, which stays open on a pick and says what is on and saved), by the user's choice after trying it inside. The first game's card grows into
  the cover (Framer `layoutId`), the flat style wipes across the cards, and the rest goes through `lookTransition`
  (`src/utils/lookTransition.ts`, the browser's view transition): a font fades (in the sample: the page takes it when the modal closes, so it never changes behind; the user's call), a theme spreads from its tile, and a shape sweeps
  across the window behind a band of the accent shaped like it (`sweepEdge`). Do not ease a shape with CSS: the bars' `clip-path` cannot, so half the
  page jumped (the user turned that down). A browser without view transitions, or reduced motion, just changes. **Over a blurred backdrop a transition must be kept to the dialog** (`lookTransition(…, within)`): Firefox leaves `backdrop-filter` out of its capture of the page, so a whole-page transition shows the page sharp behind the dialog until it ends; a dialog whose page must take part (the theme's) has `backdrop="dim"`, with no blur to lose. **`::view-transition` takes every click, and that stays so:** with `pointer-events: none` Firefox cannot hit the captured element, so a click lands behind it and closes the dialog. `lookTransition` ends the transition and hands the click to the button under the pointer, only inside the dialog. A dialog's ring and shadow are outside its box, so a fade draws them twice and a sweep's `clip-path` cuts them: the `look-panel` pair clips the looks and draws them itself. **The change goes in after `ready`, two frames in, never in the transition's callback:** Firefox shows the element itself on a transition's first frame, a flash of the new look; the new look is live, so it takes the change behind the animation. Test motion in Firefox too, on the real screen.

### Entrances: what the table above does not say

- **CSS keyframes, never Framer's `x`/`y`/`initial` on what appears on a load** (`uiGuard.test.ts` fails on it;
  what opens on a click may stay in Framer), and never hide an element until a frame, idle callback or observer.
- A block that waits for a fetch holds its exact room, measured, or the same element unseen: the account page's level
  and rankings switch did not, and the page jumped 118 px when they landed. `useVaultMe`'s `isLoading` covers the session read.
- Entrance-only: no scroll triggers, no loops. The library's shelves and the home keep their own keyframes: do not fold
  them into the general families.

### The library's pieces (`src/components/ui`, 2026-10-24)

The site's controls come from the library, in the design agreed on the canvas
(`docs/ui-library-and-designs-plan.md` → Build plan). **Never draw one by hand**; a
guard test (`src/components/ui/uiGuard.test.ts`) fails when one appears outside `ui/`:

- **Buttons**: `Button` (`primary`, the only one that leans, `secondary`, `quiet`, `danger` (tinted, not solid); `size`; `loading`;
  `href` for a link) and `IconButton` (needs `aria-label`). Where an element cannot be one,
  `buttonClass(variant, size, layout)`.
- **Fields**: `Input`, `Textarea`, `SearchInput`, `PasswordInput`, wrapped in `Field` (label,
  aside, hint or error wired by id); or `fieldClass({ invalid, icon, size })` on a native input.
- **`Select`** (own listbox, never a native `<select>`), **`Switch`** (upright; say the state in
  words beside it), **`Checkbox`**, **`ChoiceCards`** / `choiceClass`.
- **`Tabs`** (the mark in front of the tab you are on, no underline; `lg` a card's title, `orientation="rail"` a column of sections; roving tabindex; the panel is the caller's, `tabIds`; `tabClass` + `TabMark` for pressed buttons),
  **`SegmentedControl`** (a sliding pill leaning on the one angle), **`Pill`** / `pillClass` for filter chips.
- `className` on them is for layout only (margin, width, flex), never colours.
- **The look lives in tokens** in `globals.css` (`--slant`, `--mark`, `--r-*`, `--h-*`, `--motion-*`,
  `--hardcore`/`--softcore`), defined once for every theme (`designTokens.test.ts`): a future
  site-wide design changes them, not the components.
- **Loading**: `Skeleton` (`ui/Skeleton.tsx`: `radius` from the tokens, colour `bg-skeleton`, pulse, still under reduced motion, always hidden), `SkeletonRow` / `SkeletonGameList`, `GameRowSkeleton`, `GameCardSkeleton`; an image's own placeholder uses `SKELETON_PULSE`. **Each screen and view has its own composed skeleton, on the real boxes and gutters** (2026-10-31, #70): a new screen, section or fetch brings its own in the same change, and a figure on its way is `loading` on `Figure`, never a `—`. The guard refuses a hand-made `animate-pulse`; only `StatusBadge`'s glow is exempt. Spinners stay for actions (inside a button), not for content. **The home's profile skeleton takes the height the real one had last time** (`homeFit` keeps it, `HOME_PROFILE_KEY`): that height sets the top of the home, and a fixed guess made the skeleton taller than the page (2026-11-01). **With profile tabs the home's profile column keeps one height (`min-height`, globals.css, the tallest platform's):** that height sets `--home-fit-trim`, so a shorter profile resized the charts and the heatmap on every switch (2026-11-01). **A line of unlocks over time is `AchievementsLinePlot`** (the home's week, a game's weeks or months): the user's rule, 2026-11-01, one chart, never a second drawing of it. **What a row or a card may show must be in it from the first frame:** a pill whose data comes later is a `loading` pill, gone only if the read fails (`!summary && !error`), or it pushes the others aside when it lands; a large `StatPill` keeps the line under its figure. **A chart in a skeleton is the real chart with `isLoading`**, never a second drawing of it. **`(home)/loading.tsx` also renders signed out, without `MainProviders`**: a skeleton there reads `useOptionalMainView`, never a context that throws. **A section lands whole (the user's preference, 2026-10-31):** the home's Friends and both Following lists hold their skeleton until `detailsLoading` is false, even if that takes longer; no row pops in or re-sorts, and a failed read still ends the wait. Do not add a timeout or a progressive reveal without asking. **A skeleton draws every variant and `<html>` picks one**, so a full load paints the right one before React can read a preference: `data-home-layout`, `data-library-layout` and `data-session` (`in` or `tabs`, nothing signed out; `sessionLook`, no account data) are set by `LOOK_SCRIPT` before the first frame, then kept by `ShapeSync`, and read in `globals.css` (`.if-*`, `.home-if-*`). A block sized by the person's data is a `RememberedHeight` (`ui/`): it keeps in this browser how tall it ended up and holds that room while it loads; the first visit has nothing to go by.
- **Dialogs**: `Modal` (head with icon, title and hint; `footer`; `tone="danger"` is an
  `alertdialog`; sizes `sm`–`xl`; a sheet on phones, or `placement="top"`, a panel near the top on every screen
  for a command panel or a menu (the phone menu, the search panel; `flush` drops the body's padding for rows that reach the edges); Escape, outside click, focus kept inside and
  given back; only the top dialog answers Escape). `CommonModal` is gone (#121): a dialog is a `Modal` with its head,
  corner close and `footer`, with no `children` when it is only a confirmation. A modal names itself by its `title`, its first heading, or
  `aria-label` / `aria-labelledby`. A dialog whose content is its own hero (the achievement windows) keeps it as content and takes the corner close.
- **Feedback**: `Notice` (tinted inline notice, `role="alert"` for errors, or for a warning with `alert`; `size="sm"` for a line in a card), `ErrorRetry` (a failed read: a
  danger `Notice` with what failed, an optional hint and a quiet retry `Button`), `Spinner` (an action on its
  way, in the text's colour; `Button loading` draws it), `TOOLTIP_SURFACE` (`ui/tooltip.ts`), `MENU_SURFACE` /
  `menuItemClass` (`ui/menu.ts`); the toasts are the dark card.
- **Labels, people and rows** (#120): `Kicker` / `kickerClass(tone, size)` (the small label, in sentence case: `xs` the
  home's chart heads, `sm` a panel's, `md` the welcome's; muted, accent, danger, warning, inherit), `SectionHead` (title, hint, an
  aside at the end; `md` a shelf, `lg` a streak card; Shelf draws its head with it), `Tag` (tinted label; tones
  muted, neutral, accent, info, success, warning, danger, hardcore, gold, surface, overlay, the platforms' steam, psn, xbox and the consoles' white, black, sky, and custom for a tier's hue in `style`; sizes xs a row's console, sm 20 px, md 22 px, lg 24 px;
  `slant` leans it on `--slant`, only for a mark of the player's own: the level), `Avatar` (round picture, initial or icon fallback,
  `online` draws the presence dot, `sizeSm` the size from `sm`), `ListRow` / `LIST_ROW` (media, title, sub line, trailing; the search panel's
  row), `Facts` (facts on one line joined by the mark; a screen reader hears a comma).
- **Surfaces and data**: `SURFACE` (`ui/surface.ts`; cards use `rounded-card`), `Figure` (every labelled
  number: `bare` has no box and the mark between figures, `tile` a small box, `card` the label first
  and the figure big, `compact` the account page's platform cards; `tone` from the theme, `color` for a tier's
  hue, `term` inside a `<dl>`; `StatPill` / `StatCard` are gone and the guard refuses their names),
  `DataBar` (a chart bar as long or as tall as its share, upright, optional track), `RarityBadge` (a tinted figure, never a bar), `ProgressBar` upright and
  glowing only when finished, `GameCardBackdrop` = a flat tint of the game's colour behind the
  same neutral hairline as a flat card (`useImageTint`; never the blurred art again, the user's
  choice). The art is read through
  `/api/image-proxy` (only the platforms' image hosts, images only, 3 MB, a week's cache) so a canvas
  may read it; do not widen its host list to anything a user can type (it would be an open proxy).
- **Colours with a meaning come from the theme**: danger, success, warning, `hardcore`,
  `softcore`; the guard refuses red / green / yellow / amber / orange palette classes. Tier and
  platform hues are the exception.
- **Fonts:** Barlow + Barlow Condensed is the default pair; Sofia Sans and Fira Sans are optional
  preferences, each with its condensed italic display face. All six are loaded in the root layout
  (`src/lib/fonts.ts`); only Barlow preloads. A page title, a big figure or a rank is
  `font-display italic`.
- **Numbers a reader sees are in their language:** `toLocaleString(lang)`, `decimal(n, lang)` for a
  fixed count of decimals, `formatRarity(pct, lang)`; never `toFixed` on screen ("0,8", not "0.8").
- **A game page's top is `GameHero`** (chips, title, facts, actions, tiles, media) and its tables use
  `ui/dataTable.ts` and `AchievementTableToolbar`; the four platforms share them.
- **The home layout is the person's choice** (`useHomeLayout`, synced key `home-layout`):
  `classic` (default) or `cover` (`MainPagePortada`, the game played last in big on top). It is in
  Preferences → General and in the welcome's preferences step.
- **The cover's art** (source order in `HomeHero.art`, `src/utils/homeHero.ts`) shows only once it has loaded
  and been judged for its box (`artVerdict`: at most 2× stretch, aspect 8:7 to 4:1). Each source is tried once;
  if none fits, the first too small for the box is the background anyway. **The big cover is never just a box
  art while a wide picture exists (the user's call, 2026-10-31):** the poster is for a game with no wide picture
  at all, or only portrait ones, then the game's colour alone. Xbox and RA take IGDB's first (`heroUrl`, `coverUrl`
  in `/api/xbox/details` and `/api/getGameArt`); RA then its own screenshots and box art, Xbox its tile. Hacks and
  subsets never ask IGDB (`igdbRaArt`). **IGDB pictures go through `pictureUrl`**: `t_1080p` stretches a
  smaller original (measured 2026-10-31), which hides a blurred picture from that check.

### Favicon and the theme list (#84, 2026-11-01)

- **The logo was drawn by a friend of the user and keeps its shape** (the user's call): recolour it, never redraw it or swap it
  for a simpler mark, here or anywhere. Its paths are `LOGO` in `src/utils/themeIcon.ts`.
- **The favicon follows the theme, with nothing behind it:** the whole logo in the accent, toned for the browser through `prefers-color-scheme` inside the SVG
  (4:1 on `#35363a` or on white); white and black accents take the browser's ink. **Never a ground or a plate** (the user tried it, 2026-11-02): a page cannot read a
  tab's colour, so any ground clashes with some browser's theme. The same cost as any single logo: a browser whose scheme does not match its tab colour reads worse, and a mid grey tab is the weakest.
  Themes that share an accent share an icon (Midnight and Crimson): it goes with the theme, it does not name it. Venom is the one exception: bone white accent, purple logo (the user's call).
- **A new theme needs its row in `THEME_ACCENT`:** the types refuse a missing one, `src/app/themes.test.ts` refuses one that differs from `globals.css`
  and holds every theme to WCAG AA (#123, see Contrast below). A new light theme also joins the light selector lists in `globals.css`.
- **One `<link id="theme-icon">`, in the root layout, before the script.** Not `src/app/icon.svg`: Next's link can land after the script. Both the script
  and `ThemeContext` set its `href`; a data URL has nothing to cache. Measured 2026-11-02 on real tabs, Chromium and Firefox change with no reload and follow the
  scheme. Safari is not tested (no Windows build): if it refuses, it keeps `/icon.svg`, the default theme's logo. A browser with a custom theme is not measured either.
- **A theme that no longer exists lands on `dark`** in the head script, `ThemeContext` and the public profile (no row, never its raw id). `users.theme` keeps
  the old value until the person picks another: no migration, nothing else reads it.
- **`apple-icon.tsx` still says "CH"**: out of #84, left as it was.

### Contrast — every theme, every tint (#123, 2026-11-09)

`src/app/themes.test.ts` runs over **all** of `THEMES` (colour maths in `src/app/themeContrast.ts`, `color-mix` in oklab included)
and holds each one to WCAG AA (4.5:1): text and secondary text on `bg-main`, `bg-card` and `bg-tertiary`; the accent as text
and on its own 15 % tint (a chosen `Pill`, a pressed `IconButton`, a dialog's head icon); the primary button's label on the
accent and its hover; success, warning, info and danger on a card and on their own 10 % `Notice` tint; hardcore and softcore on a
card; every streak tier's ink on the page, a card and its own 16 % tag. Secondary text must also sit at least 1.3:1 from the body text.
**A new theme, or a changed token, that fails one of these does not merge.** When a colour fails, move its lightness (same hue)
in that theme's block, never the rule; the streak ink is lowered with `--streak-hue`, not by recolouring the tier. A new tint a component draws
(another `bg-x/NN`) joins the test with its alpha. Changing an accent also changes its `THEME_ACCENT` row (the favicon).

### Progress bars — in the theme's colours

Every progress bar is `ProgressBar` (`src/components/ui/ProgressBar.tsx`) or
`CircularProgress`: the theme's `--progress` (its accent), RA softcore a darker
step of it (`bg-progress-soft`) under hardcore. A finished bar stays in the
theme's colour and glows (only a finished bar glows; upright, square ends in slanted and round in round: data never leans);
**the green is only in the percentage beside it**
(`text-success` at 100%), never on the bar — the user tried a green ring and
did not like it. Do not paint a bar in a platform's colour; those stay only in
charts that compare platforms (CompletionDistribution, the line
chart).
