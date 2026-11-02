-- RA keys are sealed with secretBox from now on (src/lib/raKey.ts), so a copy of the
-- database does not give them away. A sealed value is different every time, so the
-- UNIQUE on raid no longer stops one key linking two accounts: a keyed hash does.
-- Keys stored before this stay readable, in the clear, until they are linked again.
ALTER TABLE users ADD COLUMN IF NOT EXISTS raid_hash TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS users_raid_hash_key ON users (raid_hash) WHERE raid_hash IS NOT NULL;
