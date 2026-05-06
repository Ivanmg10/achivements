CREATE TABLE IF NOT EXISTS favorite_achievements (
  id                   SERIAL PRIMARY KEY,
  user_id              INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id       INTEGER NOT NULL,
  game_id              INTEGER NOT NULL,
  game_title           TEXT    NOT NULL,
  snapshot             JSONB   NOT NULL,
  num_distinct_players INTEGER NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_fav_ach_user_id ON favorite_achievements(user_id);
