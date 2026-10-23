-- Every Steam unlock read so far, with its date (src/lib/steamUnlocks.ts). Steam has no
-- "recent achievements" call: the streak and the activity charts were built by reading the
-- unlock list of each game played in the window, at most 80, so a year of more games lost
-- days. The score refresh already reads every played game's list; keeping what it reads lets
-- them use all of them. Per user (and their Steam account), gone with the user or the link.
CREATE TABLE IF NOT EXISTS steam_unlocks (
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  steamid     TEXT NOT NULL,
  appid       INTEGER NOT NULL,
  apiname     TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (user_id, steamid, appid, apiname)
);
CREATE INDEX IF NOT EXISTS steam_unlocks_by_date ON steam_unlocks (user_id, steamid, unlocked_at);
