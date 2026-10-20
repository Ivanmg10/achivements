-- The achievement showcase: up to five achievements a user has earned and
-- chooses to show off, in their own order. What other users see of them (the
-- public profile, the Following cards); the pinned achievements are their own
-- goals and stay theirs.
--
-- Unlike pinned_achievements, one shape for every platform: `achievement_key`
-- is RA's achievement id, Steam's apiname, PSN's trophy id or Xbox's
-- achievement id, as text; the text and badge are copied in when it is added.
-- The limit of five is the API's (POST /api/showcase).
--
-- Additive: a new table nothing older reads.
CREATE TABLE IF NOT EXISTS showcase_achievements (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source          TEXT NOT NULL CHECK (source IN ('ra', 'steam', 'psn', 'xbox')),
  game_id         INTEGER NOT NULL,
  achievement_key TEXT NOT NULL,
  game_title      TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  badge           TEXT,
  earned_at       TIMESTAMPTZ NOT NULL,
  position        INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, source, game_id, achievement_key)
);
