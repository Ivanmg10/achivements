# Component library and a record of every design — plan (designed and agreed; building)

Written 2026-10-23 at the user's request. **Its own development, on its own branch**, not part
of the welcome. Two things the user wants:

1. **An internal library of components** for the whole site, so it looks and behaves the same
   everywhere, in the welcome's style (they liked it).
2. **Every design that is made is recorded, so it can be found again**: each Figma file or
   design canvas, with its link, what it is for, its versions and which one was built.

**Design agreed 2026-10-24** on the canvas (`docs/designs.md`: the section "Todo lo acordado, página a
página" holds the version of every page to build). Building now, in the three PRs below; the
build plan is the section "Build plan" at the end of Part 1.

## Decided with the user (2026-10-23)

- **A full design, not a quick unification**: the whole component set is designed properly on a
  canvas (concepts, iterations), even if it takes longer. It is meant to apply to the whole site.
- **Components only, never page structure.** Page layouts are out of scope: more site-wide
  "designs" besides the colour themes are planned for the future, so a page's structure must not
  be tied to this one.
- **What a future "design" is (the user, 2026-10-23):** a whole different way of laying out the
  site, not a skin. The first one in mind is based on the Xbox 360's first dashboard (the blades),
  still only an idea. It reuses the typography but needs many components of its own for its
  proportions. So the library is the **shared core** (typography, buttons, inputs, selects,
  switches, modals, pills): small, layout-free, no outer margins or fixed widths, sized in rem.
  Layout pieces (cards, rails, blades, panels) belong to each design, not to `ui/`. Do not design
  for the Xbox 360 one now; just keep data in hooks and out of the components, so a second design
  can reuse the hooks and draw its own layout.
- **Hence the look lives in tokens, not in the components.** Radii, title face, surfaces,
  shadows, control heights and motion are CSS variables (`globals.css`, next to the themes'), and
  the components only read them. A future design is a new set of values, not new components.
- **A guard against regressions**: a test (or lint rule) fails when a hand-written primary button
  (`bg-accent text-bg-main…`), a `role="switch"` or a raw `<select>` appears outside
  `src/components/ui/`, so the library stays the only way to draw them.
- Measured the same day: 41 distinct primary-button class strings over 412 `<button>`s, 15 modals
  on `CommonModal`, 48 `<input>`s, 5 hand-made switches, 3 `<select>`s; radii in use: `xl` 431,
  `lg` 277, `2xl` 135, `md` 47, `3xl` 37.
- `StepsBar` and `Curtain` stay in the welcome until a second page needs them.
- No new class-merging dependency (`clsx`, `tailwind-merge`, `cva`): variants are a plain map;
  an extra `className` is for layout only (margin, width), never colours.
- **Concept A (Vitrina, the welcome's language) chosen** on the canvas (2026-10-23).
- **Barlow Condensed only on big titles** (a page's or a moment's), for now; modal and section
  titles stay in Inter.
- **The user wants the library to cover more than the first set**, every repeated piece that is
  not page structure. Measured 2026-10-23 (files that draw it by hand): section labels / kickers
  44 distinct class strings; inline notices (`role="alert"`) 34 distinct over 86 files; skeleton
  blocks (`animate-pulse`) 92 files; avatars 40; count badges 26; search fields 12; tabs 7; menus
  5; custom tooltips 5 (plus 130 native `title`s, left alone); spinners 4; two empty-state
  components (`empty-state`, `status-empty-state`).
- **Fields: "sunken"** (darker than the card, inner shadow, 52 px, radius 14; on focus it lights up
  to the card's colour with an accent ring and a soft halo; a counter or "Optional" beside the
  label) **with the hover of the "accent line" option** (the field gets a little lighter). The
  **tooltip is dark** (the header's colour, fine ring, shadow, small arrow), not inverted white.
  Both on the canvas's v2 (2026-10-23).
- **Shareable user card: concept A, "Ficha"** (1200×630). A future feature, not part of these PRs.
- **v3 agreed points (2026-10-23):** fields light up with the theme's accent on hover (an error
  field in the danger colour); an own `Select` (button + listbox with the menu's look, icons and a
  line of description), never the native one; tabs and the segmented control animate as part of
  the component (an indicator that slides the whole tab's width, content coming in from the side
  it was reached from); a small bounce on checks; the modal reviewed: icon tile, title and hint,
  a quiet ✕, a footer of its own, a dangerous-confirmation variant (`alertdialog`), an entrance,
  and what the code lacks today (`role="dialog"`, `aria-modal`, Escape, focus kept inside, no
  `min-h-100`), in three sizes.
- **`Surface` joins the library**: a card's shell (background, radius, ring, padding sizes, an
  optional platform gradient outline, an interactive variant that lights up like the fields). It
  is a component, not page structure: 191 files draw one by hand with five radii.
- **Hard-coded colours go too** (found in the section pass, 2026-10-23): 126 files use Tailwind's
  palette (`text-red-400` 78 times, `green-500`, `yellow-400`…) instead of the theme's `danger`,
  `success`, `warning`, so the red and green themes do not move them (errors to orange, done to
  teal). They are replaced as each piece is migrated, and the guard test refuses them outside the
  platform colours.
- **Patterns** checked on the canvas with real pieces: `UserPlatformCard` (connected and not),
  `GroupCard`, one user row for Following, search and rankings, and the delete confirmation
  (`DeleteConfirmDialog`, hide game, admin).
- **The whole site in own pieces (the user, 2026-10-23):** every visible component is drawn by
  the library, so components are homogeneous with each other and a new visual design stays
  close to the original. **Still components only, never page structure**: the user meant
  homogeneity between components; page headers, nav bar, toolbar layouts, status screens and a
  page order were proposed and **dropped** (their board was removed from the canvas). The full
  catalogue, from a pass over all 178 component folders, is the canvas's v4 row (six boards;
  number 2 below is dropped):
  1. **Foundations** (tokens): theme colours plus new `--hardcore` / `--softcore` (today fixed
     yellow-400 / blue-400 rings), platform colours only in marks; type scale (display, h1 32,
     h2 20, h3 16, body 15, small 13, kicker, label, numbers); spacing ×4; radii (8 chip, 12 small
     control, 14 field, 16 button, 24 card, pill); elevation (sunken, flat, floating, modal);
     motion (150 hover, 250 open, 450 spring indicators, 380 entrances, the 2.2 s curtain);
     Tabler icons 14–24; one focus ring.
  2. ~~Page structure~~: dropped, see above.
  3. **Forms**: `Field` anatomy (label, optional/counter, help, error), `Textarea`, `PasswordInput`
     (show/hide, requirements), `RadioGroup`, `ChoiceCards` (theme, gender, group visibility),
     `FileDrop` (avatar), `Combobox` with chips (game picker), read-only/disabled, `FormActions`.
  4. **Data**: `StatTile`, `StatPill`, `ProgressBar` (softcore under hardcore, finished glows)
     and `CircularProgress`, `LevelBadge` (tier hue and shape only on it), `PlatformBadge`,
     `GameThumb` (icon, 3:4 cover, PSN banner letterboxed, platform corner), `AchievementTile`
     (hardcore, softcore, earned, locked, missable, secret) and rarity, `ListRow` (game,
     achievement; lights up on hover), `Table`, relative `Timestamp`, `ChartCard` frame and the
     heatmap scale (charts stay recharts).
  5. **Feedback**: `Toaster` restyled (icon, action, timer line), `Banner` (email, cookies),
     `ProgressNotice` (`VaultFillLine`: reading, done, failed), `NavigationProgress`, `Spinner`,
     shaped `Skeleton`s with a shimmer, inline "saved".
  6. **Overlays**: any modal becomes a bottom `Sheet` under 640 px, `HoverCard` (a person),
     `Lightbox` (screenshots), `SearchModal` (opened by typing anywhere, as today; no shortcut), modal sizes
     440 / 540 / 760.
  7. **Disclosure and interaction**: `CollapsibleSection`, `Accordion` (FAQ), `FoldBar` (DLC),
     `ShowMore` (says how many), `SortableItem` (handle, lifted while dragged, drop slot, keyboard),
     `ToggleButton` (pin, favourite, showcase: filled, tinted, a bounce), `CopyButton`, `Shelf`
     (fading edges, arrows that hide at the ends).
- **"Less AI-made" (v5, 2026-10-23), agreed:** glow only on what is finished (the full bar), the
  hover marks the border without a halo; denser data with short radii (rows, tables, thumbs
  8–12 px; big radii only for cards and modals); kickers only in "moments" (welcome, rankings,
  profile head); **CheevoVault's slant** as a signature in a few fixed places: the primary
  button's chamfered corners, the tab line and segmented indicator cut on a diagonal, the
  progress bars' bevelled ends; bounce only on what moves (indicators), fades elsewhere. The
  tinted notices stay as they are (the user likes and uses them). **Open on the canvas:** icons
  bare or in a tile (proposed: bare everywhere except the empty state), and the UI font, Inter
  or Barlow (the display face's own family).
- **v6 (2026-10-23):** the whole template redrawn in the v5 style on four boards. The user liked
  the slanted segmented control and not the chamfered button; v6 proposes the primary button
  slanted like the selector (skewed background, upright text), with chamfered and plain as
  alternatives. Switches and filter chips go square-ish (radius 8) to match. **The user chose the
  slanted button** (2026-10-23).
- **Round 3 of the page designs (2026-10-23):**
  - **Top-bar search: option 1, "command"** (searches games, achievements and people; a central
    panel with recent searches; it opens, as today, when the person types anywhere outside a field, and has no Ctrl+K: the user dropped it, 2026-10-24).
  - **Home: the user picks its layout** (the first step of "styles to taste"): *Classic* (default,
    today's layout in the new style) or *Portada* (the top of concept A: the game you left half-way,
    big). A new synced preference (`isSyncedKey`) in Preferences → General. The statistics and
    activity section is **the same in both and keeps exactly its seven sections and content**
    (Overview, Activity, Collection, Pinned, Groups, Following, Browse): restyled, nothing added
    or removed.
  - **Both home layouts end their two columns on one line** (the user, 2026-10-24): the recently
    played card and the right column reach the same height, the right column's last card
    (recent achievements) growing to meet it, and the game rows sharing the height.
  - **Streaks take the theme's colour** (the user, 2026-10-24): amber (`--warning`) only in the
    streak page's hero; the header's day count, the overview figure, the rankings column, the
    home's strip, the day-by-day bars, the year and the best-streaks list use the accent.
  - **Opening a game on the home keeps today's behaviour** (the list fades, the card holds only that
    game) and today's panels: ring with points, the progress chart, the game's achievements to get,
    and every achievement below; only restyled.
  - **Group detail: covers keep today's size** (116 px; larger ones look blurry at their
    resolution).
  - Rankings: new filters (platform chips plus two selects) and a new leaderboard; streak: the hero
    kept, new best-streaks list, a day-by-day strip of the current streak, the year fixed; the
    switch to be chosen among four options.
- **Round 4 (2026-10-23):**
  - **Switch: the slanted one** (track skewed -14°, knob skewed too, accent when on), like the
    button and the segmented control.
  - **Recently played rows: a border and a flat tint of the game's colour, no blur** (the user did
    not like the blurred art behind the row). The tint comes from the game (its art's dominant
    colour, to be worked out in the build).
  - **Statistics and activity: today's layout, only the components restyled.** Every section keeps
    its order, its grid (measured on the live page) and its content; "Daily achievements" stays the
    line chart it is today. Do not reorganise these sections.
  - **Rankings: v2 agreed.**
  - **Streak v3:** "Your year" and "When you play" side by side, 50/50 as today. The day-by-day strip
    must survive outliers (a 30-achievement day): bar heights by square root, capped at the 90th
    percentile, and a day over the cap gets a cut mark and its number on top.
  - **`/diario`: the mini concept is liked**, kept as a future route.
- **Three PRs** (the user, 2026-10-23; first two, then three once v4 showed the size). Each one
  ships its components with tests, moves the site to them and adds its part of the guard:
  1. **Foundations and controls**: the tokens (with `--hardcore` / `--softcore` in every theme),
     button, icon button, field, select, search, textarea, password, checkbox, switch, radio,
     choice cards, file drop, combobox, tabs, segmented control, pills.
  2. **Overlays and feedback**: modal (and its sheet on phones), menu, popover / hover card,
     tooltip, lightbox, search modal; notices, banners, toasts, progress notice, spinner,
     skeletons, the one empty state.
  3. **Surfaces, data and disclosure**: `Surface`, stats, progress, level and platform badges,
     game thumbs, achievement tiles and rarity, list rows, table, chart frame; collapsible,
     accordion, fold, show more, sortable, toggle buttons, copy, shelf; and the sweep of the 126
     files with hard-coded palette colours.
- **22 themes, not 6** (found 2026-10-23: dark, light, dark/light red and green, red, purple,
  green, blue, ocean, oled, arctic, sakura, catppuccin, gruvbox, rose-pine, synthwave, terminal,
  san-andreas, snake-eater, bentley, clank, daxter). Every new token is defined for all of them,
  and the canvas's "Temas" board shows the library in dark-red, red, purple and green with their
  real values. `globals.css` darkens fixed palette text classes on light themes; that block goes
  once the sweep (PR 3) leaves no fixed palette classes. Inside
  each PR, one commit per kind of piece, so it can still be read (and reverted) a piece at a time.

---

# Part 1 — the component library

## Why

The same pieces are written again and again, each a little different (counted 2026-10-23):

- **Primary button**: at least five class strings for it (`bg-accent text-bg-main …` with
  `hover:opacity-90`, `hover:bg-accent/90`, `hover:bg-accent-hover`, rounded-xl or -2xl, with or
  without the focus ring offset), plus `PRIMARY_BUTTON` / `SECONDARY_BUTTON` / `QUIET_BUTTON` in
  `src/components/welcome-page/welcomeArt.ts`.
- **Switch** (`role="switch"`): drawn by hand in `UserProfileSwitch`, `PsnPreferenceSwitch`,
  `AdminCreateUserModal`, `AdminEditUserModal`.
- **Select**: `GroupToolbar`, `PublicUserGames`, the welcome's language select (the only one with
  its own arrow; the others keep the browser's, against the edge).
- **Pills / segmented controls**: `MainHeader`, `LibraryPlatformTabs`, `LibraryQuickFilters`,
  `MainViewToggle`, `StatusNavDropdown`, the welcome's step bar.
- **Inputs**: `bg-bg-main rounded-xl px-4 py-3` in the modals, `INPUT_CLASS` in the welcome.
- **Modals**: 15 components on `CommonModal`, each with its own header, close button (or none)
  and footer; `AvatarModal` is the newest shape (title + hint, ✕, content, actions).

What is already shared and stays the base: `src/components/ui/` (`ProgressBar`,
`CircularProgress`, `StatPill`, `ChartCard`, `GameListRow`, skeletons, `FadeImage`, `CountUp`),
`ProfileField`, `CommonModal`, `LazyWhenOpened`, `notify`/`Toaster`, the theme tokens in
`src/app/globals.css`.

## The visual language to start from (the welcome's)

- **Display titles**: Barlow Condensed, extra-bold italic (`font-display`, `display` in
  `src/lib/fonts.ts`), large, tight leading. Body in Inter.
- **Kicker** above a title: small, bold, uppercase, wide tracking, in the accent.
- **Floating bar** like the header: `rounded-2xl`, card background at 80 % with blur, 1 px ring.
- **Pills**: `rounded-full`, the current one ringed and in the accent, state also in words.
- **Cards** `rounded-2xl`/`rounded-3xl`, `bg-bg-card`, `ring-1 ring-ink/[0.06]`; panels inside
  them on `bg-bg-main`.
- **Buttons**: primary (accent, 48 px tall), secondary (ring), quiet (text only), icon (44 px).
- **Motion**: the chevron curtain for big changes of place; content coming in from the side it
  was reached from; Framer `layoutId` to grow a card into its detail; everything eased in and
  out, with a reduced-motion path.
- Sizes in rem, so a page can be scaled for big screens.

## A first shape (to design and agree, not to build as is)

`src/components/ui/` grows with: `Button` (primary / secondary / quiet / danger, sizes, loading),
`IconButton`, `Input`, `Select` (own chevron), `Switch` (label + state in words, as
`UserProfileSwitch`), `Card`, `Pill` and `SegmentedControl`, `Kicker`, `DisplayTitle`,
`SectionLabel`, a `Modal` with a standard head (title, hint, ✕) and footer over `CommonModal`,
`StepsBar` and `Curtain` lifted from the welcome. Each with tests and the rules already in
`CLAUDE.md` (accessible names, focus rings, `role="alert"` errors, theme colours only).

A place to see them all: an admin-only page or a design canvas artifact, so a change to one is
checked everywhere it shows.

## Build plan (agreed 2026-10-24)

Three PRs (see "Three PRs" above), each from `develop` on its own `feat/<issue>-…` branch, each
with its issue. Inside a PR, **one commit per kind of piece**: the component with its tests, then
the site moved to it, then its part of the guard. Nothing changes a page's layout; where the
canvas's final page differs from today, it is because a component changed, not the page.

### PR 1 · Foundations and controls — built 2026-10-24 (`feat/63-ui-library`)

1. **Tokens** in `src/app/globals.css`, defined for **every** theme (22 plus `black-ops-2`):
   `--hardcore` / `--softcore` (today fixed yellow-400 / blue-400 rings), the slant (`--slant-btn`
   -12°, `--slant-pill` -14°, `--slant-line` -30°), control heights (field 52 px, button 44,
   small 36), radii (8 chip, 12 control, 14 field, 20 card), the motion durations. Exposed to
   Tailwind through `@theme inline` like the colours. A test reads `globals.css` and fails when a
   theme lacks one.
2. **`Button`** (`primary` slanted, `secondary`, `quiet`, `danger`; sizes; `loading`; as a link
   too) and **`IconButton`** (required `aria-label`). Then every hand-written primary/secondary
   button moves to them (41 class strings today), the welcome's `PRIMARY_BUTTON` constants
   included.
3. **Fields**: `Field` (label, optional / counter, help, `role="alert"` error, ids wired),
   `Input` (sunken, accent on hover and focus, danger when invalid), `SearchInput`, `Textarea`,
   `PasswordInput` (show / hide). The 48 `<input>`s and the welcome's `INPUT_CLASS` move.
4. **`Select`**: own listbox with the menu's look (keyboard: arrows, Home/End, type-ahead,
   Escape), never the native one. The three raw `<select>`s move.
5. **`Checkbox`**, **`Switch`** (the slanted one: `role="switch"`, `aria-checked`, the state in
   words beside it), **`RadioGroup`**, **`ChoiceCards`**. The five hand-made switches move.
6. **`Tabs`** (sliding slanted line, content in from the side it was reached from, arrow keys) and
   **`SegmentedControl`** (sliding slanted pill), **`Pill`** / filter chip. `MainViewToggle`,
   `LibraryPlatformTabs`, `LibraryQuickFilters`, the header's pills and the account's tabs move.
7. **The guard** (`src/components/ui/uiGuard.test.ts`): fails on a hand-written primary button
   class, a `role="switch"`, a raw `<select>` or an `<input>` styled by hand outside
   `src/components/ui/`.
8. Search: no shortcut; it keeps opening on typing (`MainHeader`). Only its field is restyled here;
   the panel is PR 2.

### PR 2 · Overlays and feedback

`Modal` over `CommonModal` (head with icon, title and hint, quiet ✕, own footer, `alertdialog`
variant, three sizes, a bottom sheet under 640 px; `role="dialog"`, `aria-modal`, Escape, focus
kept inside), `Menu`, `Popover` / `HoverCard`, the dark `Tooltip`, `Lightbox`, the search panel
(option 1, games / achievements / people, recent searches); `Notice`, `Banner`, the toasts
restyled, `ProgressNotice` (`VaultFillLine`), `Spinner`, shaped `Skeleton`s, one `EmptyState`.

### PR 3 · Surfaces, data, disclosure and the colour sweep

`Surface`, `StatTile` / the overview's figures without boxes, `ProgressBar` / `CircularProgress`
(glow only when finished), `LevelBadge`, `PlatformBadge`, `GameThumb`, `AchievementTile` and
rarity as a tinted figure (no bar), `ListRow`, `Table` (headers aligned like their values),
chart frame; `CollapsibleSection`, `Accordion`, `FoldBar`, `ShowMore`, `SortableItem`,
`ToggleButton`, `CopyButton`, `Shelf`; and the sweep of the 126 files with palette colours. The
page changes agreed on the canvas land here: recently played rows (border and the game's tint),
the opened game, library detail panel, Following cards with the last game's art, rankings,
streak (amber only in its hero), group covers without a bar, and the home layout preference
(*Classic* / *Portada*, a synced key).

**Not in these PRs:** `/diario` and the shareable card (future, see the roadmap in `CLAUDE.md`).

## Answered (2026-10-23/24)

- The display face stays on big titles only; modal and section titles in the UI font.
- The gallery is the design canvas (no in-app page).

---

# Part 2 — a record of every design

## What the user wants

Any design made for CheevoVault (Figma, or a design canvas on claude.ai when Figma is not
connected) must stay reachable: today a design lives only as a link in a chat, and is lost with it.

## How

- **`docs/designs.md`** is the register, one entry per design: date, title, link, what it is for,
  the versions in it (and which one was built), the branch/PR that built it, its status
  (exploring / agreed / built / replaced). **Started 2026-10-23 with the welcome's canvas**, so the
  practice applies from now on (`CLAUDE.md` → How UI work is done).
- Designs are private to the user's account: the register holds the link, never a copy of them.
  Whoever opens it must be signed in as the user (or have it shared).
- When the library exists, the register also points at the canvas (or Figma page) that shows
  every component, so a change to one is checked against all the designs that use it.

## Open questions

- Figma as the home for designs from now on (needs its connector authorised), or the claude.ai
  canvas, or both?
- Export a picture of the agreed version next to each entry, so the register is readable without
  opening the link? (Images of a design are fine; images of real user data are not.)
