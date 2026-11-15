# Steam

Moved out of `CLAUDE.md` on 2026-11-07 (#124). Sign-up, sign-in and linking through Steam's OpenID:
`../accounts.md`. How Steam fails: `README.md` here. The key is the app's (`STEAM_API_KEY`).

## Reading Steam (from the performance rules)

- **Steam's owned list is read through `loadOwnedGames`** (`src/lib/steamProgress.ts`, 5 min,
  shared): never call `getOwnedGames` from a route. A home page used to download it five times
  (2026-10-22). `scoreRefresh` keeps its own cache on purpose. "Recently played" is built from
  its last-played dates (`lastPlayedOf`, below), not from `GetRecentlyPlayedGames` alone (two weeks only).
- **Steam library counts come in batches** (`fetchBatchCounts`, `GetTopAchievementsForGames`, 100
  games a call; 192 in 0.6 s measured 2026-10-22): only finished games are read one by one, for
  the date they were finished. The batch also answers for achievements Steam keeps private, so it
  is trusted only after one per-game read agrees they are public (`batchCountsFor`). Keep that probe.
- **Every Steam unlock read is kept** in `steam_unlocks` (`migrations/042_steam_unlocks.sql`,
  applied to pre and production 2026-10-22; any other database needs it, though without it they
  only log and nothing fails): `fetchPlayerAchievements` records them, so the score refresh (every played game)
  fills it. The streak and activity read the `maxGames` played last live and the rest of the
  window from the table, only for games the owned list still shows (a private profile shows none).
  Unlinking Steam (user or admin) deletes the rows, and the kept hours (`steam_playtime`) with them;
  `/privacy` says both are kept until then.
- **"Now playing"** for the people you follow: `../social.md` → Presence.
- **Steam sends `rtime_last_played` only for the API key's owner** (#113): data read with the app's own
  credential hides per-account differences, so check a second, ordinary account before trusting it.

## Last played — our own date (#113, 2026-11-07)

Valve stopped sending a game's last-played date to anyone but the key's owner (late 2023, undocumented);
`playtime_forever` and `playtime_2weeks` still come for everyone. So every reader of a Steam date goes through
**`lastPlayedOf(game, now)`** (`src/utils/steamMappers.ts`), never `rtime_last_played` directly:

1. **Steam's `rtime_last_played`** when it is there (the key's owner): exact, and used as it is.
2. Otherwise the newest of **`last_played_at`**, set by `withLastPlayed` (`src/lib/steamProgress.ts`) inside
   `loadOwnedGames` and the score refresh's owned read, from:
   - **the newest kept unlock** of the game (`steam_unlocks`, `latestUnlocks`): exact;
   - **the last rise in its hours** seen (`steam_playtime`, `migrations/045`, `observePlaytime`): a game first
     seen is kept undated; more minutes than last time date it at that read when Steam counts minutes in the
     last two weeks, else two weeks before it (it cannot have been later). Reads happen every five minutes
     while someone looks at the profile and daily from the score cron, so the date is that close.
3. **Minutes in the last two weeks** (`playtime_2weeks > 0`, or the game in `GetRecentlyPlayedGames`, which
   `/api/steam/recentlyPlayed` folds into the owned list): no time, so the **start of the window**, now − 14
   days. Never later than the truth; sorts after anything dated inside the two weeks, before anything older.

None of these invents a day for the streak, the heatmap or the counters: those count unlocks (with their own
dates), and a date only chooses which games' unlocks are read. A game with no achievements played before
`steam_playtime` started stays undated and sorts last. Without migration 045 the hours are not kept (each read
logs it) and steps 1, 2 (unlocks) and 3 still work.

What changed with it: the counts cache is keyed by `playtime_forever` (`steamProgress3:`), not the date, and a
game with minutes in the last two weeks gets the one-hour TTL; the score refresh's `changeKey` is
`playtime_forever:rtime_last_played` (it was the date alone, `''` for everyone but the owner, so their games
were never read again). The derived date is left out of the key on purpose: its two-week part moves every read,
its unlock part is written by the refresh's own read (one useless re-read each), and a rise in hours already
moves the minutes.
