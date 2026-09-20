-- Persistent cache for Steam Web API responses. Steam rate-limits far harder
-- than RA (~100-200 calls / 5 min), so unlike raCache this survives restarts
-- and is shared across server instances.
--
-- The key carries its own namespace (e.g. 'owned:7', 'schema:730') instead of
-- the table being keyed on user_id: game schemas are identical for every user,
-- so they cache once globally rather than once per user. user_id stays as a
-- nullable back-reference purely so a user's rows are cleaned up with them --
-- global entries leave it NULL.
CREATE TABLE IF NOT EXISTS steam_cache (
  cache_key  TEXT PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  cache_data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sweeping expired rows.
CREATE INDEX IF NOT EXISTS idx_steam_cache_expires_at ON steam_cache(expires_at);
-- Dropping everything for one user on unlink.
CREATE INDEX IF NOT EXISTS idx_steam_cache_user_id ON steam_cache(user_id) WHERE user_id IS NOT NULL;
