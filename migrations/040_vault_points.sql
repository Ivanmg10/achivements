-- Vault Points and the rankings (docs/rankings-plan.md). Additive: new tables
-- and two user columns with defaults; code that does not know them ignores them.

-- One row per game a user has scored, per platform account. `points` is the
-- game's score before the stack factor (the same title listed again on one
-- platform); the rankings multiply them. `unlocks` holds [unix day, points]
-- pairs for weeks and months. `change_key` is what the platform's library says
-- about the game's last unlock, so a refresh only re-reads games that moved.
-- `flag` = 'suspect' (Steam unlock tool) keeps a game out of the rankings until
-- an admin clears it ('cleared').
CREATE TABLE IF NOT EXISTS score_games (
  user_id       INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source        TEXT        NOT NULL CHECK (source IN ('ra', 'steam', 'psn', 'xbox')),
  game_id       BIGINT      NOT NULL,
  account       TEXT        NOT NULL,
  title         TEXT        NOT NULL,
  points        INTEGER     NOT NULL DEFAULT 0,
  stack_factor  REAL        NOT NULL DEFAULT 1,
  earned        INTEGER     NOT NULL DEFAULT 0,
  total         INTEGER     NOT NULL DEFAULT 0,
  completed     BOOLEAN     NOT NULL DEFAULT FALSE,
  provisional   BOOLEAN     NOT NULL DEFAULT FALSE,
  flag          TEXT        CHECK (flag IN ('suspect', 'cleared')),
  change_key    TEXT,
  unlocks       JSONB       NOT NULL DEFAULT '[]'::jsonb,
  rules_version SMALLINT    NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, source, game_id)
);

CREATE INDEX IF NOT EXISTS score_games_flag ON score_games (flag) WHERE flag IS NOT NULL;

-- Points earned per week ('w', starting Monday UTC) and month ('m'), per
-- platform, rebuilt from score_games on every refresh of the user.
CREATE TABLE IF NOT EXISTS score_periods (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source  TEXT    NOT NULL,
  kind    CHAR(1) NOT NULL CHECK (kind IN ('w', 'm')),
  start   DATE    NOT NULL,
  points  INTEGER NOT NULL,
  PRIMARY KEY (user_id, source, kind, start)
);

CREATE INDEX IF NOT EXISTS score_periods_kind_start ON score_periods (kind, start);

-- Where each user stood in the global all-time ranking at the start of a week,
-- for the arrows that say who moved. Kept twelve weeks.
CREATE TABLE IF NOT EXISTS score_snapshots (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week    DATE    NOT NULL,
  rank    INTEGER NOT NULL,
  points  INTEGER NOT NULL,
  PRIMARY KEY (week, user_id)
);

-- Whether the user appears in the rankings (a switch in Preferences → General),
-- and when their score was last refreshed.
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_in_rankings BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS score_refreshed_at TIMESTAMPTZ;
