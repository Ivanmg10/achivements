# Design system

How the site's look is made, and how to add to it without drifting. Written for
the next agent (or person) who builds a page, a section or a piece. Start here,
then `CLAUDE.md` → "The component library" for the hard rules.

## The three layers

1. **Tokens** (`src/app/globals.css`): colours of a theme (`--accent`, `--bg-card`…),
   and the *design* — shapes, sizes, motion (`--slant-*`, `--clip-*`, `--bar-radius`,
   `--r-*`, `--h-*`, `--motion-*`). A theme changes the colours; a design changes
   the shapes. Today there are two designs: **slanted** (the default) and **round**
   (`:root[data-shape="round"]`, the person's choice, `useShapeStyle`). A third
   would be one more block of overrides, not an edit of any component.
2. **The library** (`src/components/ui`, plus `VaultLevelBadge`, `GameCardBackdrop`…):
   every control, field, bar, ring, tag, dialog and surface. They read only tokens.
3. **Pages and sections** (`src/components/<area>`): built *from* the library; they
   add layout and copy, never a new control.

## The rules that keep it honest

- **Never draw a piece by hand.** `uiGuard.test.ts` fails on a hand-made button,
  text field, select, switch, checkbox, dialog, hard-coded palette colour, fixed
  `polygon(...)` or `skew-*-[..]`. If it fails, use the piece; if the piece is
  missing, add it (below).
- **Shapes come from tokens.** A bar's cut ends are `slantStyle(px)`
  (`ui/shape.ts`); a mark's lean is `skew-y-(--slant-mark)`; a control's slant is
  `skew-x-(--slant-button)`. Never a literal.
- **Colour with a meaning comes from the theme** (danger, success, warning,
  `hardcore`, `softcore`). Hues of a *tier* (level badge, `streakTier`) are the
  exception and live in their own util, mixed with the text colour so they read on any theme.
- **Preferences about looks** (`home-layout`, `game-card-style`, `shape-style`) are
  synced keys in `src/utils/syncedPreferences.ts`; components read them through a
  hook (`useStoredChoice` underneath), and the *tokens* carry the result.
- **i18n:** every visible string is in `T` (all nine languages). The catalogue and
  the admin panel are the exception (English).

## The catalogue (`/design`, admins only)

Every piece of `src/components/ui` drawn live with its variants, and the tokens.
Open it signed in as an admin; anyone else gets the 404. It uses the real
components, so it cannot drift. Flip the shape, the theme and the game-card style
in Preferences → General to see every piece follow.

## Adding or changing a piece — the flow

1. Is there one already? Look in the catalogue and in `src/components/ui`.
2. A new look for a whole area (a page, a section) → follow `design-process.md`
   (canvas first, one change at a time) and record it in `designs.md`.
3. Build the piece in `src/components/ui/<Piece>.tsx`: props for layout only
   (`className` never carries colour), accessible by default, reading tokens.
4. Test it next to it (`<Piece>.test.tsx`): render, interaction, the accessible name.
5. **Show it in the catalogue** (`src/components/design-catalog/`): one specimen
   per variant.
6. If it must not be hand-made any more, add its rule to `uiGuard.test.ts`.
7. Use it in the page. A page that needs a one-off look asks for a prop or a
   variant on the piece, not a copy.
8. Worklog entry; `CLAUDE.md` if a rule changed.

## What is not here yet

- The Disclosure pieces (`Accordion`, `ShowMore`, `ToggleButton`, `Shelf`) agreed on
  the canvas have no page that uses them.
- The V6 canvas boards are the *history* of the design (`docs/designs.md`); the
  catalogue is the *current* truth. If they disagree, the catalogue wins.
