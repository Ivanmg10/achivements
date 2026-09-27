-- Steam account linking. These columns were previously added by hand to the
-- live DB (authOptions + types already read them), so this migration exists to
-- make the schema reproducible from scratch. Idempotent on purpose.
ALTER TABLE users ADD COLUMN IF NOT EXISTS steamid       TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS steamusername TEXT;

-- A Steam account may only be linked to one app account.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_steamid ON users(steamid) WHERE steamid IS NOT NULL;
