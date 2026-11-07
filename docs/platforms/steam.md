# Steam

Moved out of `CLAUDE.md` on 2026-11-07 (#124). Sign-up, sign-in and linking through Steam's OpenID:
`../accounts.md`. How Steam fails: `README.md` here. The key is the app's (`STEAM_API_KEY`).

## Reading Steam (from the performance rules)

- **Steam's owned list is read through `loadOwnedGames`** (`src/lib/steamProgress.ts`, 5 min,
  shared): never call `getOwnedGames` from a route. A home page used to download it five times
  (2026-10-22). `scoreRefresh` keeps its own cache on purpose. "Recently played" is built from
  its `rtime_last_played`, not from `GetRecentlyPlayedGames` (two weeks only).
- **Steam library counts come in batches** (`fetchBatchCounts`, `GetTopAchievementsForGames`, 100
  games a call; 192 in 0.6 s measured 2026-10-22): only finished games are read one by one, for
  the date they were finished. The batch also answers for achievements Steam keeps private, so it
  is trusted only after one per-game read agrees they are public (`batchCountsFor`). Keep that probe.
- **Every Steam unlock read is kept** in `steam_unlocks` (`migrations/042_steam_unlocks.sql`,
  applied to pre and production 2026-10-22; any other database needs it, though without it they
  only log and nothing fails): `fetchPlayerAchievements` records them, so the score refresh (every played game)
  fills it. The streak and activity read the `maxGames` played last live and the rest of the
  window from the table, only for games the owned list still shows (a private profile shows none).
  Unlinking Steam (user or admin) deletes the rows; `/privacy` says they are kept until then.
- **"Now playing"** for the people you follow: `../social.md` → Presence.
- **Steam sends `rtime_last_played` only for the API key's owner** (#113): data read with the app's own
  credential hides per-account differences, so check a second, ordinary account before trusting it.
