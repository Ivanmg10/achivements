-- Add achievement count columns to group items for aggregate stats on group cards
ALTER TABLE game_group_items
  ADD COLUMN IF NOT EXISTS num_awarded  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_possible INTEGER NOT NULL DEFAULT 0;
