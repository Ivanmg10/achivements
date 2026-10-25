# UI polish — roadmap to 100 %

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

## 4. Layout modal: friendlier and bigger, with fonts  **Q**

- [ ] **Decide the fonts** (how many, which; today Barlow for the UI and Barlow Condensed italic for
      display, in both designs). YOUR NOTES:
- [ ] A font choice as a preference (synced: add its key in `src/utils/syncedPreferences.ts`), loaded
      lazily so the choice costs nothing to those who keep the default (`src/lib/fonts.ts`).
- [ ] Rework `LayoutModal`: larger previews that look like the page they change, a live preview of the
      whole choice, shorter wording, reset to defaults. Keep the welcome's inline version in step
      (CLAUDE.md → the welcome follows the app).
- [ ] Texts in all nine languages, gender-neutral; update the `/design` specimens.

## 5. The tinted (colourful) game-card style  **D** **Q**

It does not fully convince yet (`game-card-style` = `tinted` default or `flat`;
`GameCardBackdrop` is the one place that draws it).

- [ ] Say what is wrong with it. YOUR NOTES (too strong / muddy on some art / hard to read / not
      consistent between list, grid and shelf…):
- [ ] Design round: 2–3 concepts on the canvas, same game art in each (light, dark, very bright, very dark).
- [ ] Contrast check on text over the tint (WCAG 2.1) for every theme.
- [ ] Build in `GameCardBackdrop` only; the pages must not change.

## 6. Library and page leftovers

- [ ] `Shelf` (`LibraryShelf`) and the striped drag slot (groups' sortable rows) as library pieces.
- [ ] The welcome curtain (`WelcomeCurtain.module.css`) still has fixed clip-paths: move them to the
      slant tokens or leave a documented exception.
- [ ] Check *round* on the pages not yet opened in it: Library, Groups, Following, Account.
- [ ] Portada's kicker does not show total hours.
- [ ] The canvas boards V6 were only spot-checked: compare them with the built pages.
- [ ] Older components that still use `rounded-xl` / `rounded-2xl` (the classic look anyway): decide
      whether to move them to `rounded-card` / `-pane` so one token rules them all.

YOUR NOTES:

## 7. Shipping

- [ ] PR `feat/65-ui-surfaces` → `develop` (squash; closes #63, #64, #65); check on the preview
      (admin `/design`, both designs, the three synced preferences across two browsers).
- [ ] One branch per block above, from `develop`; one issue each (the PR check needs it); entry in the worklog.
- [ ] Before the release: merge `main` back into `develop` (it is one commit behind: PR #37).
- [ ] Release PR `develop` → `main` titled `chore(release): v1.7.0` (minor bump by hand in
      `src/lib/version.ts`): list the merged PRs, no migration or env var is needed for the library;
      check the release gates in CLAUDE.md.
- [ ] After the release: update `CLAUDE.md` milestones (`1.7.0`), `README.md` (screenshots/features) and archive this file.

## 8. Not in this stretch (future wishes, for reference)

- A shareable user card (CLAUDE.md → Roadmap). Public data only; changing `/privacy` if more.
- `/diario`, a day-by-day journal of play.
- More languages.
- Notifications (do not start without the user's idea).

## Suggested order

1. Your review (§1) → fill the notes.
2. PR and preview of the current branch (§7, first lines).
3. Skeletons (§2): cheap, visible, no design round.
4. Entrance animations (§3): design round first, then build.
5. Layout modal + fonts (§4) once the fonts are chosen.
6. Tinted style (§5): design round, last because it is the least certain.
7. Leftovers (§6) in between, whatever your review says is worst.
8. Release (§7).
