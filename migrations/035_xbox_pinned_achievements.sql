-- Xbox achievements can be pinned too, like RA, Steam and PSN ones. An
-- achievement has no id of its own across games — it is (game, achievement
-- id) — so it gets its own column and its own identity index, as Steam's
-- apiname (012) and PSN's trophy number (027) did. The id is TEXT: modern
-- games number theirs "1", "2"…, Xbox 360 ones are plain integers.
-- game_id is the title id (see xboxNumericId).
--
-- Additive: the CHECK only widens, and the other sources' rows are untouched.
ALTER TABLE pinned_achievements ADD COLUMN IF NOT EXISTS xbox_achievement_id TEXT;

ALTER TABLE pinned_achievements DROP CONSTRAINT IF EXISTS pinned_achievements_source_check;
ALTER TABLE pinned_achievements ADD CONSTRAINT pinned_achievements_source_check CHECK (source IN ('ra', 'steam', 'psn', 'xbox'));

CREATE UNIQUE INDEX IF NOT EXISTS pinned_achievements_xbox_key
  ON pinned_achievements (user_id, game_id, xbox_achievement_id) WHERE source = 'xbox';
