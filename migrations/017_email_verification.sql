-- Soft email verification: an unverified address is flagged in the UI, never
-- blocked at sign-in. NULL means "not verified yet", which is what every
-- account created before this migration is.
--
-- No token table: a verification link is idempotent — following it twice is
-- the same as following it once — so there is nothing to spend, and the token
-- is signed rather than stored (src/lib/emailVerification.ts).
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
