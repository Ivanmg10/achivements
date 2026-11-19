-- PSN metrics (#180, phase 5 of epic #174): what the admin pool dashboard and the alerts read.
--
-- psn_account_stats  + forbidden (Sony's "this profile is hidden", not the account's fault) and by_fn, the calls of
--                    the minute by function ({"titles": 3, "summary": 1}).
-- psn_timings        one row per Sony call (kind 'sony', its account) and per PSN page read (kind 'read', ok = the
--                    answer came from the store, false = 202 while the first sync runs): the p95s and the share of
--                    reads served at once. Swept after two days by the worker's cron (psnMetrics.sweepPsnTimings).
-- psn_sync_jobs      + started_at, when a job was first taken: the queue's lag is started_at - run_after.
--
-- Idempotent, and additive only: the code before #180 never reads the new columns or table.
ALTER TABLE psn_account_stats ADD COLUMN IF NOT EXISTS forbidden INTEGER NOT NULL DEFAULT 0;
ALTER TABLE psn_account_stats ADD COLUMN IF NOT EXISTS by_fn JSONB NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS psn_timings (
  at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  kind        TEXT NOT NULL CHECK (kind IN ('sony', 'read')),
  account_id  INTEGER,
  ms          INTEGER NOT NULL,
  ok          BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS psn_timings_kind_at ON psn_timings (kind, at DESC);

ALTER TABLE psn_sync_jobs ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
