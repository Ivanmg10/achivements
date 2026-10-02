-- What admins do to accounts: who, to whom, what and when. Read from the admin
-- panel. The names are copied in, so an entry still reads after either
-- account is deleted (the admin id then goes NULL; the target id is kept
-- as a plain number). Entries older than a year are dropped (adminAuth.ts).
CREATE TABLE IF NOT EXISTS admin_actions (
  id              SERIAL PRIMARY KEY,
  admin_id        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  admin_username  TEXT NOT NULL,
  target_user_id  INTEGER,
  target_username TEXT,
  action          TEXT NOT NULL,
  detail          JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_actions_created_at ON admin_actions (created_at DESC);
