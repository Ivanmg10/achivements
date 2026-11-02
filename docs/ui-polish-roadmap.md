# UI polish — roadmap to 100 %

> **Historical record, updated 2026-10-30.** This roadmap and `docs/ui-polish-v2-plan.md` preserve
> the design round and its decisions. They are no longer active execution plans. Use the open
> GitHub issues for current scope and order; #77 is the final audit of the current UI block.
>
> **2026-10-25:** the design round for §4–§7 (tint, Layout modal, fonts, landing, login/register,
> streaks) is done; what was decided and how to build it is in `docs/ui-polish-v2-plan.md`.

Written 2026-10-25, at the end of the component library's third part (`feat/65-ui-surfaces`,
issues #63–#65). It lists what is left before the new look can be called finished and can go to
`main`. **The user completes it**: every `YOUR NOTES` line is theirs to fill in; an agent picks
the items up in order, one work branch per block, from `develop`.

How each block is worked: `docs/design-process.md` (concepts on the canvas → one version at a time →
build → fix from screenshots). Rules for the pieces: `docs/design-system.md`. Every design made gets
its entry in `docs/designs.md`. Every task ends with a `docs/worklog.md` entry.

Legend: `[x]` done · `[ ]` pending · **D** needs a design round first · **Q** needs the user's answer first.

---

## 0. State on 2026-10-25

- [x] Tokens, the library (`src/components/ui`), two designs (*slanted* default, *round* = the site as it
      was before the slant), 29 pieces in the catalogue at `/design` (admins).
- [x] Every page matched to the boards: home (classic and cover), library, game pages (4 platforms),
      rankings, following, groups, streak, account, welcome, search, modals.
- [x] Streak tiers (0, 5, 10, 20, 30, 40, 50+ days) in the tag, hero, live bar, rankings and home tile.
- [x] Disclosure pieces (`Accordion`, `ShowMore`, `ToggleButton`).
- [x] Gates green at `17fffca2` (v1.6.150): 806 suites / 5012 tests, `tsc`, `eslint`, `npm run build`.
- [ ] The branch is merged into `develop` and checked on `dev.cheevovault.com`.

## 1. Your own review (you, no agent)

Nothing below can be closed until this is done, because it decides what the rest contains.

- [ ] Walk the whole site in both designs (Preferences → Layout → Page) at your screen's size and at
      phone width. Home (classic, cover), Library, a game of each platform, Rankings and
      `/rankings/how`, Following (both tabs), Groups and a group, `/racha`, Account (every tab),
      public profile, Welcome, Search, every modal.
- [ ] Compare *round* against *slanted* in `/design` (the Compare view) and decide which stays the default.
- [ ] Approve or change the streak tiers (colours and thresholds): `src/utils/streakTier.ts`.
- [ ] Note everything that looks wrong or unfinished below.

YOUR NOTES:

-
-
-

## 2. Skeletons in the new look  **(next, biggest visible gap)**

Every loading state still follows the old look: fixed radii, old surfaces.

- [ ] One `Skeleton` piece in `ui/` (shimmer off with reduced motion) that takes its radius and
      surface from the tokens, so *round* and *slanted* follow on their own.
- [ ] Sweep every `loading.tsx` (one per route) and the skeletons of components (`GameInfoSkeleton`,
      `SkeletonGameList`, `SkeletonStat`…) so each has the shape of what it replaces
      (hero, bars, tiles, rows), in the same gutters.
- [ ] Specimen in `/design`; a guard in `uiGuard.test.ts` against a hand-made `animate-pulse` block.
- [ ] No layout jump when the content arrives (compare heights).

YOUR NOTES:

## 3. Entrance animations on every page and component  **D** (issue #61)

**Done 2026-10-31 (`feat/61-entrance-rollout`), with the families agreed on 2026-10-25 and no design round:
see `docs/design-system.md` → Entrances.** What follows is the original plan, kept for the record.

The home has them (left card `ViewEntrance`, profile column `MainPageProfile.module.css`); the rest of
the site is static next to it. Rules already agreed (CLAUDE.md → Roadmap):

- **CSS keyframes, not Framer's `x`/`y`**, for anything that plays on a first load (Framer stutters while
  the page mounts).
- **Never hide an element until a frame or idle callback**: it would show empty while the main thread is busy.
- **Reduced motion: a fade at most.**
- A motion suited to what it shows, not one effect everywhere.

Plan:

- [ ] **Design round on the canvas** (`docs/design-process.md`): 2–3 concepts, one per family below, and
      a short list of motions (rise, fade, grow from the card, stagger, count-up). Entry in `docs/designs.md`.
- [ ] Tokens, like the rest: durations, easing and stagger step in `globals.css` (`--motion-*` exist;
      add `--enter-*`), one place to retune them.
- [ ] A small shared mechanism (a CSS class with a `--i` index for the stagger, and a keyframe set) so a
      page asks for an entrance instead of writing one. Test: reduced motion drops the movement.
- [ ] Apply by family (fill in the motion you want):

| Family | Pages / pieces | Motion |
|---|---|---|
| Heroes | game page hero, group hero, streak hero, public profile hero, following hero | YOUR NOTES |
| Lists and grids | library rows, game cards, achievement tables, rankings table | YOUR NOTES |
| Cards and tiles | stat tiles, account cards, group cards, side cards | YOUR NOTES |
| Charts and figures | rings, bars, heatmap, streak chart, big numbers | YOUR NOTES |
| Overlays | modals, search panel, menus, toasts (some exist) | YOUR NOTES |
| Page transitions | route to route (the thin top line exists) | YOUR NOTES |

- [ ] Check cost: no layout shift, no long task on the first load of the home and a game page.

## 4. The signed-out landing, login and register  **D**

The landing (`src/components/landing-page`, the signed-out home) is older than the welcome and the
library; it should look like them. Login and register (`auth-*`, `login-user-form`,
`register-user-form`) already please the user, so they only get a review.

- [ ] **Landing: design round on the canvas** (`docs/design-process.md`): 2–3 concepts in the welcome's
      language (display italic titles, kickers, floating pill bar, cards that grow into their detail)
      drawn with the library, in both designs. Show the real product (the cover home, a game page,
      rankings and levels, streak tiers, the showcase), not generic art. Entry in `docs/designs.md`.
- [ ] Keep what search engines and chat AIs read (CLAUDE.md → Public pages): the FAQ and its
      `FAQPage` JSON-LD from one list, honest wording, **no Xbox**, `T` in nine languages; the landing
      stays static-friendly (no `headers()`/`cookies()` in the root layout) and loads no `recharts`.
- [ ] `/compare/<slug>` and `/track/<slug>` share the new look (same header, cards and FAQ pieces).
- [ ] Entrance animations for the landing are part of §3 (it is the first page a visitor sees).
- [ ] **Login and register: review only** (no redesign): tokens and library pieces (no hand-made
      control), *round* and *slanted*, phone width, errors inline (`Notice`), the loading state
      (§2), `/resetPassword`, `/authPage`, and the curtain into `/welcome` after sign-up.

YOUR NOTES (what the landing must say first, who it is for, what you like in other sites):

## 5. Fonts: the proposal  **Q**

**What is true today.** `src/lib/fonts.ts` loads Barlow (UI) and Barlow Condensed italic 800 (display),
the same in both designs, with the **`latin` subset only**. So: Polish letters (ł, ą, ę, ś, ż…) and other
Latin-extended ones fall back to a system font mid-word; Russian (Cyrillic) and Japanese never use Barlow
(it has no Cyrillic nor kana). Two of the nine languages do not look like the design.

- [ ] **Do now, whatever the choice** (a one-line fix): add `latin-ext` to both Barlow subsets.
- [ ] Choose at most two more families. My proposal (subsets from memory: **check each family's
      subsets on Google Fonts before building**; Japanese stays on the system font in all of them):

| Set | UI / display | Feel | For | Against |
|---|---|---|---|---|
| **Arcade** (today) | Barlow / Barlow Condensed italic | Sporty, condensed italic titles: the welcome's identity | The look already agreed everywhere | No Cyrillic |
| **Tech** (proposed) | Exo 2 / Exo 2 italic 800 | Game-like, angular, true italics, so the slanted design fits; has Cyrillic and Latin-ext | Most "gaming vault"; keeps italic titles | Wide letters: tables and small text need a size check |
| **Calm** (proposed) | Manrope / Manrope 800 (upright) | Modern dashboard, very legible small, has Cyrillic and Latin-ext | Dense data (tables, rankings) read best; pairs with the round design | Loses the italic display; titles lose some of the welcome's energy |

- [ ] The font is **its own preference, independent of the shape** (`font-style`: `arcade` | `tech` |
      `calm`, synced: add the key to `src/utils/syncedPreferences.ts`), because the user does not want
      the font to change with the design. Done as tokens like the shapes: `[data-font="…"]` sets
      `--font-ui` and `--font-barlow` (the `font-display` utility), on `<html>` and on any element, so
      the Layout modal's preview can show each set inside the modal.
- [ ] Cost: a family's file is only downloaded when a rule uses it, so the unused sets should cost
      nothing; confirm in the network panel, and give the extra sets `preload: false`.
- [ ] Catalogue: a Fonts specimen in `/design` showing a title, a table and a figure in each set.

YOUR NOTES (which of the two extras, or neither):

## 6. Layout modal: the proposed design  **D**

Today `LayoutModal` has two tabs (Page, Home) and small previews. Proposal, to be drawn on the canvas
first (it needs the fonts of §5):

```
┌───────────────────────────────────────────────────────────────┐
│ ▣ Layout                                  Your page, your way │
│ ───────────────────────────────────────────────────────────── │
│  Shape      │  ┌───────────────────────────────────────────┐  │
│  Font       │  │  LIVE PREVIEW (a miniature of your home,  │  │
│  Home       │  │  header + hero + two game rows), drawn    │  │
│  Game cards │  │  with the choices as you make them        │  │
│             │  └───────────────────────────────────────────┘  │
│             │   Slanted ◉  Aa 1.234       Round ○  Aa 1.234   │
│             │   (two large cards, each in its own shape)      │
│ ───────────────────────────────────────────────────────────── │
│ ↺ Reset to defaults                                  [ Done ] │
└───────────────────────────────────────────────────────────────┘
```

- [ ] A wide modal (size `xl`); on the left the sections (Shape, Font, Home, Game cards) as vertical
      tabs, on phones a sheet with the tabs on top and the preview collapsed above the choices.
- [ ] **One live preview** that applies every choice at once (`data-shape`, `data-font` and the card
      style scoped to the preview, so the page behind does not flicker), instead of a drawing per option.
- [ ] Each choice is a large `ChoiceCards` card that shows itself: a shape card in its own shape, a font
      card with "Aa 1.234" and a title in that family, a home card with a mini home, a card-style card with
      two sample rows.
- [ ] Changes still save at once (synced preferences); no Cancel, but a **Reset to defaults** and a
      "Done". Short wording, nine languages, gender-neutral.
- [ ] The welcome's preferences step stays in step (CLAUDE.md → the welcome follows the app): same
      choices, inline.
- [ ] Specimen in `/design`; tests for the keyboard path (tabs, cards) and for reset.

YOUR NOTES:

## 7. The tinted game-card style: a future UI section  **D** **Q**

**What it is today** (`GameCardBackdrop`, the one place that draws it). Every game card (library rows,
the home's recents and pinned games, "now playing", groups, the PSN/Steam/Xbox lists) paints a layer
behind its content. With `game-card-style` = **`tinted`** (the default) the app takes the game's art,
shrinks it to 12×12 pixels in a canvas (`useImageTint`, through `/api/image-proxy` so any host can be
read), averages its colour (colourful pixels count more, near-black and near-white are skipped) and
paints: a left-to-right gradient of that colour from 24 % to 7 % opacity fading to nothing at 75 %, over
the card's surface, plus a 1 px border in the same colour at 45 %. A game with a red cover gets a red card.
With **`flat`** the card is its plain surface and a hairline, and the art is not even read. The user chose
it over a blurred copy of the art (2026-10-24) and can switch it in Preferences → Layout → Home.

**Why it may not convince** (hypotheses to confirm with the user): the tint comes from an average, so
many games average to the same muddy brown or grey; a long list of different colours looks busy next to
the calm sections; text sits on a coloured gradient whose contrast changes per game; the border at 45 %
can fight the theme's accent; list, grid and shelf each use it a little differently.

- [ ] Say what is wrong with it. YOUR NOTES (too strong / muddy / hard to read / busy / inconsistent):
- [ ] Concepts to draw on the canvas, with the same six games (light art, dark art, very bright, very
      dark, grey, multicolour): **(a) accent-only tint** (the border and a tiny corner glow, the body
      stays neutral); **(b) dominant colour, not average** (pick the most frequent hue, so muddy browns
      become the game's real colour) with a capped saturation; **(c) art strip** (a thin real-art band
      on the left edge, the rest neutral); **(d) theme-harmonised** (the game's hue blended toward the
      theme accent so a whole list feels like one family).
- [ ] Contrast check (WCAG 2.1) of the text over the tint, every theme, light and dark.
- [ ] Build it only in `GameCardBackdrop` (and `useImageTint` if the colour maths changes); the pages
      must not change. Keep `flat` as the choice for people who want calm.

## 8. Library and page leftovers

- [ ] `Shelf` (`LibraryShelf`) and the striped drag slot (groups' sortable rows) as library pieces.
- [ ] The welcome curtain (`WelcomeCurtain.module.css`) still has fixed clip-paths: move them to the
      slant tokens or leave a documented exception.
- [ ] Check *round* on the pages not yet opened in it: Library, Groups, Following, Account.
- [ ] Portada's kicker does not show total hours.
- [ ] The canvas boards V6 were only spot-checked: compare them with the built pages.
- [ ] Older components that still use `rounded-xl` / `rounded-2xl` (the classic look anyway): decide
      whether to move them to `rounded-card` / `-pane` so one token rules them all.

YOUR NOTES:

## 9. Shipping

- [ ] PR `feat/65-ui-surfaces` → `develop` (squash; closes #63, #64, #65); check on the preview
      (admin `/design`, both designs, the three synced preferences across two browsers).
- [ ] One branch per block above, from `develop`; one issue each (the PR check needs it); entry in the worklog.
- [ ] Before the release: merge `main` back into `develop` (it is one commit behind: PR #37).
- [ ] Release PR `develop` → `main` titled `chore(release): v1.7.0` (minor bump by hand in
      `src/lib/version.ts`): list the merged PRs, no migration or env var is needed for the library;
      check the release gates in CLAUDE.md.
- [ ] After the release: update `CLAUDE.md` milestones (`1.7.0`), `README.md` (screenshots/features) and archive this file.

## 10. Not in this stretch (future wishes, for reference)

- A shareable user card (CLAUDE.md → Roadmap). Public data only; changing `/privacy` if more.
- `/diario`, a day-by-day journal of play.
- More languages.
- Notifications (do not start without the user's idea).

## Current work

The former suggested order was removed on 2026-10-30. The open GitHub issues now define the work
and its dependencies; #77 is the final audit after the implementation block.
