-- Xbox games join RA, Steam and PSN wherever a game is kept as (source,
-- game_id): pinned games, group items, the perfect-games order and hidden
-- games. An Xbox game_id is its title id, a decimal number that fits the
-- existing INTEGER column (see xboxNumericId).
--
-- Additive: each CHECK only widens, so code that predates it keeps working.
ALTER TABLE pinned_games DROP CONSTRAINT IF EXISTS pinned_games_source_check;
ALTER TABLE pinned_games ADD CONSTRAINT pinned_games_source_check CHECK (source IN ('ra', 'steam', 'psn', 'xbox'));

ALTER TABLE game_group_items DROP CONSTRAINT IF EXISTS game_group_items_source_check;
ALTER TABLE game_group_items ADD CONSTRAINT game_group_items_source_check CHECK (source IN ('ra', 'steam', 'psn', 'xbox'));

ALTER TABLE perfect_games_order DROP CONSTRAINT IF EXISTS perfect_games_order_source_check;
ALTER TABLE perfect_games_order ADD CONSTRAINT perfect_games_order_source_check CHECK (source IN ('ra', 'steam', 'psn', 'xbox'));

ALTER TABLE hidden_games DROP CONSTRAINT IF EXISTS hidden_games_source_check;
ALTER TABLE hidden_games ADD CONSTRAINT hidden_games_source_check CHECK (source IN ('ra', 'steam', 'psn', 'xbox'));
