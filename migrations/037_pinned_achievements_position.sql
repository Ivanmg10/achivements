-- Pinned achievements can be put in the user's own order, as pinned games
-- already can (007). NULL is "never placed": those come first, newest first,
-- as every pin did until now, so a list nobody reordered reads the same and a
-- pin made after a reorder shows on top until it is placed.
--
-- Additive: one nullable column; code that does not know it ignores it.
ALTER TABLE pinned_achievements ADD COLUMN IF NOT EXISTS position INTEGER;
