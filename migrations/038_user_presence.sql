-- When a user was last seen with CheevoVault open in front of them, for the
-- "online" / "seen 3 h ago" line on the Following cards. Written by
-- POST /api/presence (a heartbeat while the tab is visible), at most once a
-- minute. NULL is "never seen since this shipped".
--
-- show_presence is the user's choice to share it (on by default, a switch in
-- Preferences → General). Off, nobody is told when they were last seen.
--
-- Additive: code that does not know these columns ignores them. Code that
-- reads them (userRecord, the follows overview) needs this applied first.
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_presence BOOLEAN NOT NULL DEFAULT TRUE;
