# Libraries: synced preferences, consoles, hidden games, completion dates

Moved out of `CLAUDE.md` on 2026-11-07 (#124). `CLAUDE.md` → Libraries keeps the rules that bite on any
task that lists games.

## The library's pages — one page, four statuses (#129, 2026-11-11)

"Not started", "In progress", "Completed" and "All games" (`/allGames`) are one component,
`LibraryPage`, with the status as its `category` (`all` is every status). A new library page is a new
status there, not a page of its own. What each status takes is `inCategory` (`utils/libraryCategory.ts`),
used by the four `use*GamesByCategory` hooks; on "all" each game keeps its own status (`LibraryEntry.status`),
its quick filters are the statuses (`quickFiltersFor`), its shelves are "continue" and one per status, its
cards are always together (no "by platform" switch), and an opened game shows the detail of its own status
(`detailCategory`). Every view has the same row of controls (`LibraryToolbar`: search, filters, then the
order, size and views); the game count under the title only shows when neither the platform tabs nor the
"all" quick filter say it.

## Preferences that follow the account

The display preferences (which consoles show, library layout/view/columns/sort,
and the PSN/Xbox switches) are kept in the browser (`useStorageValue`) **and**
mirrored in `users.preferences` (`migrations/036_user_preferences.sql`, a jsonb of
short strings), so they follow the person between devices.

- **The list of keys is fixed in code** (`src/utils/syncedPreferences.ts`,
  `isSyncedKey`); `/api/preferences` refuses anything else whole. A device-bound
  value (language, cookie choice, the last tab, folded sections) stays in the
  browser. **To sync a new preference, add its key there**; nothing else.
- `usePreferencesSync` (mounted by `MainProviders`): on sign-in the account's values
  are applied to the browser (the account wins) and what only the browser has goes up
  once; then each change is sent after 800 ms. Changes made by the sync itself are not
  sent back (`applyStoredValue`). A failed save toasts; a failed read only logs.
- Not mounted on someone else's page, and never exposed on public profiles
  (`publicUser` selects explicit columns: keep it that way).

## Consoles to show — a preference per platform

The account page's preferences are in tabs (`UserPreferencesCard`): General, then
one per platform with its favourite game and its own choices; the tab last open
is remembered (`account-preferences-tab`). A new platform preference goes in its
platform's tab, not in a new card. RA, PSN and Xbox each have, in their tab, the list of
the consoles in the user's library with a tick each (`UserConsolesPreference`;
Steam has none). Unticked consoles leave the lists, collection and stats, and
nothing is deleted.

- Stored under `hidden-consoles:<source>` (`useHiddenConsoles`; in the browser and,
  see "Preferences that follow the account", on the account), as the *unticked* names, so a console that appears later starts shown.
- Applied **in the data contexts** (`GamesDataContext`, `PsnGamesDataContext`,
  `XboxGamesDataContext`): `library`/`all` is filtered, `fullLibrary` (PSN, Xbox)
  and `consoles` (the options) are not. **Anything that looks a game up by id**
  (its page, a pin, a group item) must use `fullLibrary`, or a game on an
  unticked console 404s.
- Only the viewer's **own** library: on someone else's page (`useSubject()`)
  nothing is filtered. A game is hidden only when **all** its consoles are
  unticked (`isConsoleShown`: "Xbox 360 · Xbox Series" stays with either ticked).
- **Feeds follow it too** (`useConsoleVisibility`: `isShown(unlock)` /
  `isGameShown(source, id)`): the year feed behind the streak, the heatmap and the
  charts, RA's recent unlocks, and the PSN/Xbox "latest" columns. So a day spent only
  on a hidden console is not a day in the streak. A **new feed of unlocks must
  filter through that hook**, or a hidden game comes back through it.

## Hidden games — a listing preference, never authorization (2026-10-31, #88)

- A hidden game is excluded from every listing and listing-derived aggregate, for its
  owner and on public/other-user views, keyed by `source:id` (`src/utils/gameVisibility.ts`).
  The hidden-games modal is the only intentional exception, so showing the game again stays possible.
- **Two boundaries, one rule.** Listing BFF routes filter after their canonical upstream/cache read
  (`src/lib/gameVisibility.ts`) and answer with `max-age=0`; shared client providers/selectors filter
  again so optimistic hide/show is immediate and a warm response cannot leak. Raw upstream caches need
  no purge. Public subjects mount `HiddenGamesProvider` with the profile owner's keys, never the viewer's.
- Library `fullLibrary` stays raw for direct game URLs and id lookups. A direct game URL keeps its
  existing authorization behavior: hidden is not a new privacy or access-control model. Do not filter
  the canonical detail loaders to “fix” a listing.
- Stored pins, groups, favorites and showcases stay stored and are excluded at read time, so unhide
  restores them. Groups filter with the group owner's id. Friends' libraries use the friend's keys.
- `score_games` also keeps hidden rows as raw data, but every ranking/streak/total read excludes them.
  Hide/show rebuilds `score_periods` and bumps the shared ranking-cache revision in Postgres; stack
  factors and periods count only visible games. Historical `score_snapshots` stay point-in-time records. Never delete a hidden row just
  to make a listing correct.

## Completion dates are not latest activity (2026-10-31, #88)

Completion status still uses each platform's whole set, but its date is a separate nullable value in
`src/utils/completionDates.ts`. Activity fields remain cache and sync fingerprints; PSN/RA use base
completion, while Steam/Xbox deliberately use full-current-set completion (user decision, 2026-10-31).

| Platform | Completion-date rule | Conservative fallback |
|---|---|---|
| **PSN** | Earned platinum in `default`, else the latest dated trophy only when the whole `default` group is earned. `/api/psn/titles` adds `completedAt`; no-DLC completed games may use `lastTrophyAt`, DLC games read the existing per-game trophy cache. | `null` when base data/date is incomplete or enrichment fails. A failed date lookup does not fail the library and is not cached as a complete enrichment. |
| **RetroAchievements** | `Mastery/Completion` award date, or `HighestAwardDate` when `HighestAwardKind` is `mastered`/`completed`. | `null`; never the latest achievement or a title-based subset guess. |
| **Steam** | When the current set is 100%, use `lastUnlock` (the latest earned achievement). Do not attempt base/DLC separation. | `null` without a valid unlock date; never `lastPlayed`. |
| **Xbox** | When the current set is 100%, `/api/xbox/titles` reads achievements and uses the latest `unlockedAt`. Do not attempt base/DLC separation. | `null` when the read or date is unavailable; never `lastPlayed`. Partial enrichment is not cached as complete. |

**The Completed lists go by this date, not by activity (#99):** on `/completed` the mixed list orders by it by default (`completed` sort key, `mixedSortKeys`), the platforms' own lists too (`byCompletedDesc`), and rows, cards and shelf cards say "Finished" with it, falling back to the last session only when it is unknown. Playing a DLC later must not move a completed game. RA's own list keeps its orders: it has no such key.

Collection grids keep undated games in their existing **Undated** group and library details omit
**Finished** when the date is unknown. Activity feeds, `/racha` and charts still show DLC on its real
unlock day. Vault's completion bonus uses the same date (timestamp 0 when unknown), with
`RULES_VERSION = 3` so normal score refreshes rebuild stored games and periods; display data needs no
migration and historical score snapshots are left untouched.
