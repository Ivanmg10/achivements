-- PSN games join RA and Steam wherever a game is kept as (source, game_id):
-- pinned games, group items, the perfect-games order and hidden games. A PSN
-- game_id is its trophy set's number: "NPWR20188_00" is 2018800 (see
-- psnNumericId), so it fits the existing INTEGER column.
--
-- Additive: each CHECK only widens, so code that predates it keeps working.
-- Pinned achievements stay RA/Steam — a trophy is identified differently and
-- would need columns of its own.

ALTER TABLE pinned_games DROP CONSTRAINT IF EXISTS pinned_games_source_check;
ALTER TABLE pinned_games ADD CONSTRAINT pinned_games_source_check CHECK (source IN ('ra', 'steam', 'psn'));

ALTER TABLE game_group_items DROP CONSTRAINT IF EXISTS game_group_items_source_check;
ALTER TABLE game_group_items ADD CONSTRAINT game_group_items_source_check CHECK (source IN ('ra', 'steam', 'psn'));

ALTER TABLE perfect_games_order DROP CONSTRAINT IF EXISTS perfect_games_order_source_check;
ALTER TABLE perfect_games_order ADD CONSTRAINT perfect_games_order_source_check CHECK (source IN ('ra', 'steam', 'psn'));

ALTER TABLE hidden_games DROP CONSTRAINT IF EXISTS hidden_games_source_check;
ALTER TABLE hidden_games ADD CONSTRAINT hidden_games_source_check CHECK (source IN ('ra', 'steam', 'psn'));

-- The favourite PSN game, the same shape as the other two ({ id, title, imageIcon }).
ALTER TABLE users ADD COLUMN IF NOT EXISTS favorite_psn_game JSONB;
