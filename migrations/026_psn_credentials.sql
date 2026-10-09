-- The app's one set of PSN credentials, kept in the database rather than in a
-- Vercel variable, so the NPSSO can be renewed from the admin panel without a
-- redeploy, and the tokens survive cold starts.
--
-- Sony fixes the NPSSO's life at 60 days from sign-in and offers no way to
-- extend it (refreshing returns the same refresh token, good for 10 days), so
-- a person has to paste a new one every ~2 months. npsso_expires_at drives
-- the daily reminder (/api/cron/psnToken); warned_at stops it repeating daily.
--
-- The secrets are stored encrypted (AES-256-GCM, key derived from
-- NEXTAUTH_SECRET, see src/lib/secretBox.ts): an NPSSO is a live session on
-- the Sony account.
CREATE TABLE IF NOT EXISTS psn_credentials (
  id                  SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  npsso               TEXT,
  npsso_expires_at    TIMESTAMPTZ,
  refresh_token       TEXT,
  refresh_expires_at  TIMESTAMPTZ,
  access_token        TEXT,
  access_expires_at   TIMESTAMPTZ,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by          TEXT,
  warned_at           TIMESTAMPTZ
);
