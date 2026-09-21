-- Run only once code from the Steam integration (which uses the
-- (…, source, game_id) constraints added in 010) is deployed everywhere.
--
-- Until then the old (…, game_id) constraints stay, so older code keeps
-- working — at the cost that an RA game and a Steam app with the same numeric
-- id cannot both be pinned, or both sit in one group.
ALTER TABLE pinned_games DROP CONSTRAINT IF EXISTS pinned_games_user_id_game_id_key;
ALTER TABLE game_group_items DROP CONSTRAINT IF EXISTS game_group_items_group_id_game_id_key;
