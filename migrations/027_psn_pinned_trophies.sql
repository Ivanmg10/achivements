-- PSN trophies can be pinned too, like RA and Steam achievements. A trophy has
-- no id of its own across games — it is (game, trophy number) — so it gets
-- its own column, as Steam's apiname did (012), and its own identity index.
-- game_id is the trophy set's number (see psnNumericId).
--
-- Additive: the CHECK only widens, and RA/Steam rows are untouched.
ALTER TABLE pinned_achievements ADD COLUMN IF NOT EXISTS psn_trophy_id INTEGER;

ALTER TABLE pinned_achievements DROP CONSTRAINT IF EXISTS pinned_achievements_source_check;
ALTER TABLE pinned_achievements ADD CONSTRAINT pinned_achievements_source_check CHECK (source IN ('ra', 'steam', 'psn'));

CREATE UNIQUE INDEX IF NOT EXISTS pinned_achievements_psn_key
  ON pinned_achievements (user_id, game_id, psn_trophy_id) WHERE source = 'psn';
