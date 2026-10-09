-- A short text the user writes about themselves, and an optional gender for the
-- preferences. NULL means "not set". 'neutral' is a choice of its own, not the
-- absence of one. The 280 limit matches the API's.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS description TEXT CHECK (char_length(description) <= 280),
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'neutral'));
