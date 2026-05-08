-- Rename favorite_achievements to pinned_achievements
ALTER TABLE IF EXISTS favorite_achievements RENAME TO pinned_achievements;
ALTER INDEX IF EXISTS idx_fav_ach_user_id RENAME TO idx_pinned_ach_user_id;

-- Game groups
CREATE TABLE IF NOT EXISTS game_groups (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT    NOT NULL,
  description TEXT,
  icon        TEXT,
  is_public   BOOLEAN NOT NULL DEFAULT false,
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_groups_user_id ON game_groups(user_id);

-- Items inside a group
CREATE TABLE IF NOT EXISTS game_group_items (
  id           SERIAL PRIMARY KEY,
  group_id     INTEGER NOT NULL REFERENCES game_groups(id) ON DELETE CASCADE,
  game_id      INTEGER NOT NULL,
  title        TEXT    NOT NULL,
  image_icon   TEXT,
  console_name TEXT,
  pct_won      NUMERIC(5,4) DEFAULT 0,
  position     INTEGER NOT NULL DEFAULT 0,
  added_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, game_id)
);

CREATE INDEX IF NOT EXISTS idx_game_group_items_group_id ON game_group_items(group_id);
