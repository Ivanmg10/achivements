-- Games the user has hidden from their status lists (want to play, playing,
-- completed), RA or Steam: RA game ids and Steam appids overlap, so a game is
-- (source, game_id). Title and image are copied in so the "hidden games" list
-- in preferences can show them without asking RA or Steam again. Goes with
-- the account: deleting the user deletes these.
CREATE TABLE IF NOT EXISTS hidden_games (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source     TEXT NOT NULL CHECK (source IN ('ra', 'steam')),
  game_id    INTEGER NOT NULL,
  title      TEXT NOT NULL,
  image      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, source, game_id)
);
