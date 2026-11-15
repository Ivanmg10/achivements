-- The PSN service-account pool (#178, epic #174): several PlayStation accounts read Sony instead of one.
-- Any account can read any public profile, so a call goes to whichever is free (src/lib/psnPool.ts).
--
-- psn_service_accounts   one row per account: its sealed NPSSO and tokens (src/lib/psnAccounts.ts seals
--                         them; never returned, logged or sent), its state and its health.
-- psn_account_leases     the account's concurrency slots; a lease expires by itself if an instance dies.
-- psn_account_stats      calls per account and minute (ok, 429, auth, server errors). No ids, no tokens.
-- psn_alert_state        when each Telegram alert was last sent, so it is not repeated (psnAlerts.ts).
-- psn_sync_jobs          the sync queue, shared with phase 4 (#179); empty until then.
--
-- The per-account call budget is not a table: it is psnBudget's 'psn-upstream' count per account in
-- signup_attempts, as in phase 2.
--
-- Today's account: the row of psn_credentials (migration 026) is copied into PSN-1, its sealed values
-- as they are (the same key opens them), only when the pool is empty. psn_credentials is left in
-- place, unread, as the fallback for one release. The app runs the same copy on first use when the
-- pool is empty (psnAccounts.seedPsnPool), so a row saved after this ran is not lost either.
-- Idempotent.
--
-- Apply to pre BEFORE the code ships: every PSN call reads psn_service_accounts.
CREATE TABLE IF NOT EXISTS psn_service_accounts (
  id                  SERIAL PRIMARY KEY,
  label               TEXT NOT NULL UNIQUE,
  hint                TEXT,
  online_id           TEXT,
  avatar_url          TEXT,
  npsso               TEXT,
  npsso_expires_at    TIMESTAMPTZ,
  refresh_token       TEXT,
  refresh_expires_at  TIMESTAMPTZ,
  access_token        TEXT,
  access_expires_at   TIMESTAMPTZ,
  status              TEXT NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'paused', 'draining', 'quarantined')),
  weight              SMALLINT NOT NULL DEFAULT 1 CHECK (weight BETWEEN 1 AND 10),
  concurrency         SMALLINT NOT NULL DEFAULT 4 CHECK (concurrency BETWEEN 1 AND 16),
  rate_per_min        SMALLINT NOT NULL DEFAULT 40 CHECK (rate_per_min BETWEEN 1 AND 200),
  last_used_at        TIMESTAMPTZ,
  last_ok_at          TIMESTAMPTZ,
  last_error          TEXT,
  cooldown_until      TIMESTAMPTZ,
  failure_count       SMALLINT NOT NULL DEFAULT 0,
  canary_at           TIMESTAMPTZ,
  canary_ok           BOOLEAN,
  warned_at           TIMESTAMPTZ,
  renewed_at          TIMESTAMPTZ,
  renewed_by          TEXT,
  created_by          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS psn_account_leases (
  account_id    INTEGER NOT NULL REFERENCES psn_service_accounts(id) ON DELETE CASCADE,
  slot          SMALLINT NOT NULL,
  leased_until  TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (account_id, slot)
);

CREATE TABLE IF NOT EXISTS psn_account_stats (
  account_id     INTEGER NOT NULL REFERENCES psn_service_accounts(id) ON DELETE CASCADE,
  minute         TIMESTAMPTZ NOT NULL,
  calls          INTEGER NOT NULL DEFAULT 0,
  ok             INTEGER NOT NULL DEFAULT 0,
  rate_limited   INTEGER NOT NULL DEFAULT 0,
  auth_errors    INTEGER NOT NULL DEFAULT 0,
  server_errors  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (account_id, minute)
);

-- account_id 0 is an alert about the whole pool.
CREATE TABLE IF NOT EXISTS psn_alert_state (
  kind          TEXT NOT NULL,
  account_id    INTEGER NOT NULL DEFAULT 0,
  last_sent_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (kind, account_id)
);

CREATE TABLE IF NOT EXISTS psn_sync_jobs (
  id            BIGSERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phase         TEXT NOT NULL,
  priority      SMALLINT NOT NULL DEFAULT 5,
  run_after     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status        TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'done', 'failed')),
  attempts      SMALLINT NOT NULL DEFAULT 0,
  locked_by     TEXT,
  locked_until  TIMESTAMPTZ,
  error         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS psn_sync_jobs_one_active
  ON psn_sync_jobs (user_id, phase)
  WHERE status IN ('queued', 'running');

-- Today's account becomes PSN-1 (the same statement as psnAccounts.SEED_FROM_LEGACY).
INSERT INTO psn_service_accounts
  (label, npsso, npsso_expires_at, refresh_token, refresh_expires_at, access_token, access_expires_at,
   renewed_at, renewed_by, warned_at, created_by)
SELECT 'PSN-1', npsso, npsso_expires_at, refresh_token, refresh_expires_at, access_token, access_expires_at,
       updated_at, updated_by, warned_at, 'migration 047'
  FROM psn_credentials
 WHERE id = 1 AND npsso IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM psn_service_accounts);
