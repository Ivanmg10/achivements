-- PSN verification (#176): a user proves a PSN account is theirs by pasting a code in the account's
-- "About Me"; only a verified account counts in Vault Points, and only one user can have a given
-- PSN account verified. Linking stays non-unique (a squatter must not lock the owner out): the
-- unique index is partial, on verified rows only. The code and its expiry live here until it is
-- checked or the account is unlinked. Idempotent.
--
-- Apply to pre BEFORE the code ships: the session reads psn_verified_at on every request.
ALTER TABLE users ADD COLUMN IF NOT EXISTS psn_verified_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS psn_verification_code TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS psn_verification_expires_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS users_psn_verified_account
  ON users (psnaccountid)
  WHERE psn_verified_at IS NOT NULL;
