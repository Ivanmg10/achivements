-- A group item's release year, looked up once and kept: it never changes, and
-- asking RA for it on every visit (one request per game) ran into RA's rate
-- limit on big groups. NULL = not looked up yet; 0 = looked up, no year known.
ALTER TABLE game_group_items ADD COLUMN IF NOT EXISTS release_year SMALLINT;
