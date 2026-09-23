-- Achievements can now be pinned from Steam as well as RA. RA identifies an
-- achievement by its global achievement_id; Steam has no such id, only an
-- apiname scoped to its game — so achievement_id becomes optional and a new
-- steam_apiname column carries the Steam identity instead.
--
-- The old UNIQUE(user_id, achievement_id) constraint from 002 still gives RA
-- rows their identity guarantee unchanged: NULLs never collide in a unique
-- constraint, so Steam rows (which leave achievement_id NULL) never trip it.
-- Steam rows get their own identity guarantee from a partial unique index.
ALTER TABLE pinned_achievements ALTER COLUMN achievement_id DROP NOT NULL;
ALTER TABLE pinned_achievements ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'ra';
ALTER TABLE pinned_achievements ADD COLUMN IF NOT EXISTS steam_apiname TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pinned_achievements_source_check') THEN
    ALTER TABLE pinned_achievements ADD CONSTRAINT pinned_achievements_source_check CHECK (source IN ('ra', 'steam'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS pinned_achievements_steam_key
  ON pinned_achievements (user_id, game_id, steam_apiname) WHERE source = 'steam';
