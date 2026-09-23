-- The "Mastered & Completed — 100%" widget now lists Steam's perfect games
-- beside RA's, so its custom order has to name the platform too: an RA game id
-- and a Steam appid share a number space.
--
-- Additive, and safe while code that predates it is live: existing rows become
-- 'ra' through the default, and the old UNIQUE(user_id, game_id) stays so older
-- code's ON CONFLICT (user_id, game_id) still finds its arbiter.
ALTER TABLE perfect_games_order ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'ra';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'perfect_games_order_source_check') THEN
    ALTER TABLE perfect_games_order ADD CONSTRAINT perfect_games_order_source_check CHECK (source IN ('ra', 'steam'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'perfect_games_order_user_source_game_key') THEN
    ALTER TABLE perfect_games_order ADD CONSTRAINT perfect_games_order_user_source_game_key UNIQUE (user_id, source, game_id);
  END IF;
END $$;
