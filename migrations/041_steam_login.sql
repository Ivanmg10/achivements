-- Sign in with Steam (OpenID). Unlike `steamid`, which users type and nothing
-- proves (migrations/028), this one is the account Steam itself vouched for at
-- sign-in, so it is unique: it is how that account finds its user again.
ALTER TABLE users ADD COLUMN IF NOT EXISTS steam_login_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS users_steam_login_id_key ON users (steam_login_id);
