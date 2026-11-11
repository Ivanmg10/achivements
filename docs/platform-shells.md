# Platform shells — one component per family, a small adapter per platform

Every platform (RetroAchievements, Steam, PlayStation, Xbox) was added by copying the previous one, and
the copies drifted: different focus rings, a sort that ran backwards on one, a cache cleared in one
copy only (antislop audit #77, X1 and §3.3; issue #125). A **family** is one of those sets of copies
(the game page table, the group cards, the status cards…). It becomes one **shell** plus one small
**adapter** per platform. The first family done is the game page achievement table (#125,
2026-11-10); it is the example below. The group game cards (`GroupGameCard`) and the status cards
(`StatusGameCard`) followed, the same way, with a view-model type (`types/gameCard.ts`) instead of a
hook: they hold no state beyond open/closed. The home's pieces (family 3) are the same: the stat pills
(`MainPagePeriodStats`), the nav cards (`MainPagePlatformNav`), the pinned rows (`PinnedGameCard`) and the profile
column's glue (`MainPageProfileLinked`, `MainPageProfileRecentList`). Family 5 has four shells, each with
its contract suite: the badge grid (`BadgeGrid`, generic over the platform's item like the table, with
slots for what a badge is called, where it goes, its ring and its tooltip, and `LazyBadgeGrid` for the
grid's loading / failure / empty states), the feed row (`FeedGameCard`, a view model), the category
section (`PlatformCategorySection`, the platform's hook result and its words) and the opened game
(`GameExpandedLayout`). The families still to do are listed in `docs/worklog.md` (entry of #125 → Open).

## Where things live

| Piece | Where | The table's |
|---|---|---|
| The shell: layout, states, interactions | `src/components/<family>/<Family>.tsx`, its parts in sub-folders | `achievement-table/AchievementTable.tsx`, `-row`, `-card`, `-desktop`, `-detail`, `sortable-header/` |
| The shell's state | `src/hooks/use<Family>.ts` | `useAchievementTable` (filter, group, search, order, fold, deep link) |
| Pure rules (order, rings, anchors) | `src/utils/<family>.ts` | `utils/achievementTable.ts` (`sortEntries`, `earnedRing`, `anchorOf`) |
| The adapter's contract | `src/types/<family>.ts` | `types/achievementTable.ts` (`TableTexts`, `AchievementColumn`, `PinControl`, `RevealControl`, `AchievementView`, `DetailOptions`) |
| Each adapter | where the platform's component was, **same path and default export**, so callers do not change | `game-info-table/GameInfoTable.tsx` (RA), `steam/steam-game-info-table/SteamGameInfoTable.tsx`, `psn/psn-game-info-table/PsnGameInfoTable.tsx`, `xbox/xbox-game-info-table/XboxGameInfoTable.tsx` |
| The contract suite | `src/components/<family>/<Family>.contract.test.tsx` | `achievement-table/AchievementTable.contract.test.tsx` |
| Each platform's own tests | next to its adapter | `PsnGameInfoTable.test.tsx`, … |

## The shared shape of an achievement

**Do not add a new one.** The shells read `CompareAchievement` (`src/utils/gameCompare.ts`, which
extends `GameAchievement` from `src/types/game.ts`): id, title, description, icon, rarity, earned,
earnedAt, and the optional platform facts `points` (RA), `grade` (PSN), `gamerscore` (Xbox), `anchor`
(deep links), `hardcore` (RA), `secret` (hidden until earned). Each platform has **one mapper per item**
there (`raCompareItem(players)`, `steamCompareItem`, `psnCompareItem`, `xboxCompareItem`), and the
`*CompareList` functions are those mappers over a list. A family that needs one more fact of the
achievement adds an optional field there; one that needs a fact only the platform has reads it from
the platform's own item (below).

`InsightAchievement` (`utils/gameInsights.ts`) is the library cards' shape: a `CompareAchievement` plus
points, kind and link. Its `fromRa…fromXbox` are the per-item mappers above plus those three.

The viewer's pins and the secrets they reveal are one hook each for the four platforms
(`useAchievementPins(PSN_PINS, …)` → `pins`, `useRevealed(byDefault, idOf)` → `reveal`: the table's
`PinControl` and `RevealControl`, so an adapter passes them as they are). A new platform adds a
`PinSpec` there. The PSN and Xbox libraries are `createConsoleLibrary` (`context/consoleLibrary.tsx`);
a game page's states (not linked, library error, loading / error / empty table) are
`components/game-page-states/`, and the width under a game header is `GAME_SECTION_WIDTH`.

## How a shell takes its platform

The shell is generic over the platform's own item `T` (`RetroAchievement`, `SteamAchievementUnified`,
`PsnTrophy`, `XboxAchievement`) and keeps it beside its row: `TableEntry<T> = { item, row, order }`.
The shell's logic reads only `row`; the adapter's slots get the entry, so they read the platform's
fields with their real types. No `any`, no switch on `source` inside the shell for something an
adapter could say.

```tsx
<AchievementTable
  source="xbox" gameId={gameId} gameTitle={gameTitle}
  items={achievements}            // in the game's order (sort it in a useMemo if the platform does not)
  toRow={xboxCompareItem}         // stable: module level, or useMemo (RA's needs the player count)
  texts={{ label, name, none, earned, locked, secret, secretText, reveal, conceal, revealAll, concealAll }}
  pins={{ canPin, isPinned: (a) => pinned.has(a.id), leads: (a) => leading.has(a.id), toggle }}
  reveal={{ isRevealed: (a) => isRevealed(a.id), toggle: (a) => toggleOne(a.id), setAll: (as, on) => setAll(as.map((a) => a.id), on) }}
  columns={[gamerscore]}          // its own columns; rarity and earned are the shell's
  detail={{ tags: score }}
/>
```

What an adapter may pass, and nothing else:
- **Data**: `items`, `toRow`, `source`, `gameId`, `gameTitle`.
- **Words**: `texts`, every one from `T`, the platform's own keys (a trophy is not an achievement).
- **The viewer's state from the platform's hooks**: `pins` (the favourites hook), `reveal` (the reveal hook).
  The adapter calls the hooks; the shell never imports a platform hook.
- **What differs**: `columns` (a column is its head, its cell, its sort and its chip on the phone card),
  `tags` (beside the name), `notice` (the line that keeps only some), `scopes` (tabs over the table),
  `detail` (tags and guide name, or `render` for a window of the platform's own), `sortMenu`,
  `keepSecretIcon`, `pinInTitle`.

A slot is a function of the entry that returns a node. A flag is only for a real, named difference
(`keepSecretIcon`: Steam shows a secret one's picture). If a second platform would need a new flag,
look for the data that already says it first (the ring colour comes from `grade` / `hardcore`, not
from a flag).

## What stays different on purpose

The shell must keep these; an adapter carries each one. From the audit (HK, LB) and `docs/platforms/`:

- **RA:** hardcore and softcore (ring, date line "Hardcore · date"), points, players and hardcore
  players as columns, the type tags (missable in red, `win_condition` reads "Win"), missables named in a
  line above, its own detail window (`AchievementModal`, with comments and unlocks), its star beside the
  name. Its data hooks keep their retry loop (`useRetryingRead`). RA's pictures go through Next's image
  optimizer; the other hosts are `unoptimized`.
- **Steam:** the library loads in two steps (the recent games first, then the whole library: `SteamGamesDataContext`), secret ones
  keep their picture and cannot be revealed (Steam gives no text), "Online?" and the online notice,
  guides searched by the English name (`titleEn`), links `#ach-<apiname>` (any character: decode the
  fragment).
- **PSN:** trophy grades (column, ring, chip), DLC groups as tabs (`PsnTrophyGroupTabs`, the guard's one
  tablist exception), hidden trophies revealed by the viewer, the game order is the trophy id, one app
  account for every call (pace).
- **Xbox:** gamerscore (column, chip, "N G"), secret achievements hidden until revealed, the order Xbox
  sends (ids are not always numbers), admin only (`useXboxEnabled`, `sourceAllowed`), 150 calls an hour
  for the app (never add a read to a shell that runs on every card).

## Tests: one contract suite, then each platform's own

- **The contract** (`<Family>.contract.test.tsx`): `describe.each(PLATFORMS)` over the four adapters,
  each built from the same platform-neutral specs (`{ title, earned, at, rarity, secret, … }`) by a small
  builder per platform. It tests what a person sees and does: names in order, filters and counts, the
  order a column gives, the fold, a search, pins (the button's name and `aria-pressed`, the order),
  the detail window by its name. Capabilities that only some platforms have are their own
  `describe.each(PLATFORMS.filter(p => p.secret))`, never a skipped test.
- **Each adapter's own test** covers only what it adds (PSN's DLC tabs and grade, Xbox's gamerscore,
  Steam's English guide name, RA's columns and modes). Delete the copies' tests when you delete the copies.
- **Behaviour, not implementation** (audit T-09): query by role, name and text; assert `aria-*` and what
  is on screen; no class names, no `querySelector` on a class, no call counts. A hook's mock may be
  checked for what it was called with (it is the boundary). Mock only the platform hooks that fetch.
- Run a mutation by hand once (break a rule in the shell, see the suite fail) before trusting it.

## Doing a family, step by step

1. Read the family's audit finding(s) and the copies side by side (`diff` them). List what is the same
   (the shell) and what differs (the adapter); check each difference against the list above and
   `docs/platforms/` before calling it drift.
2. Write the shell, its hook and its pure rules with their tests. Look in `ui/` first: a piece the
   copies draw by hand is a library piece.
3. Turn each platform's component into its adapter, at the same path. Delete the copies and their tests.
4. Write the contract suite; rewrite the adapters' tests to what is theirs only.
5. Note every visible change (a drift fixed, a copy that looked different) in the commit and the worklog.
   Anything else must look and behave as before.
6. `npx tsc --noEmit`, `npm run lint`, `npx jest --ci`, `npm run build`. One commit per step.
7. Tick the family in the worklog entry of #125; the next family starts from there.
