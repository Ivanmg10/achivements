-- Password recovery. Only a hash of the token is stored, so a leak of this
-- table cannot be used to reset anyone's password; the token itself lives
-- only in the email that was sent.
CREATE TABLE IF NOT EXISTS password_resets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS password_resets_token ON password_resets (token_hash);
CREATE INDEX IF NOT EXISTS password_resets_user ON password_resets (user_id);

-- The attempt counter now guards signing up and asking for a reset alike.
ALTER TABLE signup_attempts ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'signup';
CREATE INDEX IF NOT EXISTS signup_attempts_scope_time
  ON signup_attempts (scope, address, created_at DESC);
