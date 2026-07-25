-- Custom order for the "Mastered & Completed — 100%" widget
CREATE TABLE IF NOT EXISTS perfect_games_order (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id    INTEGER NOT NULL,
  position   INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

CREATE INDEX IF NOT EXISTS idx_perfect_games_order_user_id ON perfect_games_order(user_id);
