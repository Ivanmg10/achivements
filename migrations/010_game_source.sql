-- Pinned games and group items can now be Steam games as well as RA games.
-- A game is identified by (source, game_id): RA game ids and Steam appids
-- share a number space, so RA game 730 and Steam app 730 are different games.
--
-- Additive only, and safe to run while code that predates it is live:
-- existing rows become 'ra' through the default, and the old
-- (…, game_id) unique constraints are kept so older code's
-- ON CONFLICT (…, game_id) clauses still find their arbiter. They are dropped
-- in 011, once code using the new constraints is deployed.

ALTER TABLE pinned_games ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'ra';
ALTER TABLE game_group_items ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'ra';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pinned_games_source_check') THEN
    ALTER TABLE pinned_games ADD CONSTRAINT pinned_games_source_check CHECK (source IN ('ra', 'steam'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'game_group_items_source_check') THEN
    ALTER TABLE game_group_items ADD CONSTRAINT game_group_items_source_check CHECK (source IN ('ra', 'steam'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pinned_games_user_source_game_key') THEN
    ALTER TABLE pinned_games ADD CONSTRAINT pinned_games_user_source_game_key UNIQUE (user_id, source, game_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'game_group_items_group_source_game_key') THEN
    ALTER TABLE game_group_items ADD CONSTRAINT game_group_items_group_source_game_key UNIQUE (group_id, source, game_id);
  END IF;
END $$;
