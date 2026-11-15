-- The second factor of the admin panel (src/lib/adminTotp.ts). `secret` is sealed with
-- secretBox; `confirmed_at` stays empty until the first good code; `last_step` stops a
-- code being used twice; `recovery` holds SHA-256 hashes of the one-time recovery codes.
-- A lost phone and lost codes: DELETE FROM admin_totp WHERE user_id = <id>, and enrol again.
CREATE TABLE IF NOT EXISTS admin_totp (
  user_id      INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  secret       TEXT NOT NULL,
  confirmed_at TIMESTAMPTZ,
  last_step    BIGINT,
  recovery     TEXT[] NOT NULL DEFAULT '{}'
);
