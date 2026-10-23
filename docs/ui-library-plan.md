# An internal component library — plan (idea, not started)

Written 2026-10-23 at the user's request: they liked the welcome's visual style and want, in
time, **one set of components for the whole site so it looks and behaves the same everywhere**.
Not started; to be designed the usual way first (`docs/design-process.md`). Nothing here is
decided beyond the wish.

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

## How it would be done

1. Design the set on a canvas (as the welcome was), from the inventory above, and agree it.
2. Build the components, with tests.
3. Move the site over **one component type at a time** (all buttons, then all switches…), each
   its own PR, so nothing changes look by accident. The welcome goes first (it already has most
   pieces as constants).

## Open questions for the user

- Should the display face (Barlow italic) reach the whole site's titles, or stay for "moments"
  (welcome, rankings, empty states)?
- Which pieces first? (Proposed: buttons, inputs/selects, switches, modals.)
- A gallery page in the app (admin-only) or only the design canvas?
