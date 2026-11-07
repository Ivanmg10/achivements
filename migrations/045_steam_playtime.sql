-- The hours each Steam game had when the owned list was last read (src/lib/steamUnlocks.ts,
-- observePlaytime). Steam sends a game's last-played date only to the owner of the API key
-- (#113); for everyone else, more minutes than last time mean the game was played since, which
-- dates games with no achievements too. played_at is NULL until a rise is seen. Per user (and
-- their Steam account), gone with the user or the link. The code works without this table: the
-- dates then come from kept unlocks and Steam's two-week minutes alone.
CREATE TABLE IF NOT EXISTS steam_playtime (
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  steamid   TEXT NOT NULL,
  appid     INTEGER NOT NULL,
  minutes   INTEGER NOT NULL,
  played_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, steamid, appid)
);
