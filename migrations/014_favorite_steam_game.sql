-- A favourite game per platform: favorite_game stays the RA one, this is the
-- Steam one. Same shape ({ id, title, imageIcon }), so one API and one picker
-- serve both.
ALTER TABLE users ADD COLUMN IF NOT EXISTS favorite_steam_game JSONB;
