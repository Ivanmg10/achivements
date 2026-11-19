-- PSN snapshots (#179, phase 4 of epic #174): what Sony said about each linked account, kept in Postgres, so a
-- page reads the database and never Sony. The sync queue (psn_sync_jobs, migration 047) fills it in the
-- background (src/lib/psnSync.ts, src/lib/psnQueue.ts); the readers are src/lib/psnSnapshot.ts.
--
-- psn_players          one row per PSN account (users.psnaccountid; several users may link the same one): the
--                      headline numbers, the enrichment (played list, trophy sets, IGDB art), when each was read,
--                      the language its trophy texts are read in, and whether its trophies are hidden.
-- psn_player_games     its trophy list, one row per trophy set: the game as the app shows it (JSON), the date of
--                      its last trophy, and the date the stored trophies belong to (trophies_at). A game whose two
--                      dates differ is the delta the next sync reads.
-- psn_player_trophies  the trophies it has earned (only those: a row is an earned trophy).
-- psn_games            a trophy set, the same for every player: name, icon, platform, counts, DLC groups.
-- psn_trophies         a trophy of a set, the same for every player: grade, group, icon, rarity, texts per language.
--
-- What is stored has an end: a player's games are capped at 5,000 (psnStore.MAX_GAMES), and trophies are bounded
-- by the games. An account no user has linked any more loses its rows in the daily sweep (psnSync.sweepPsnPlayers).
-- Idempotent. Apply to pre BEFORE the code ships: every PSN page reads these tables.
CREATE TABLE IF NOT EXISTS psn_players (
  account_id     TEXT PRIMARY KEY,
  summary        JSONB,
  summary_at     TIMESTAMPTZ,
  profile_at     TIMESTAMPTZ,
  titles_at      TIMESTAMPTZ,
  enrichment     JSONB,
  enriched_at    TIMESTAMPTZ,
  year_at        TIMESTAMPTZ,
  language       TEXT NOT NULL DEFAULT 'en-US',
  state          TEXT NOT NULL DEFAULT 'new' CHECK (state IN ('new', 'ok', 'private')),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS psn_games (
  title_id    TEXT PRIMARY KEY,
  service     TEXT NOT NULL,
  name        TEXT NOT NULL,
  icon_url    TEXT,
  platform    TEXT,
  defined     JSONB NOT NULL,
  has_dlc     BOOLEAN NOT NULL DEFAULT FALSE,
  -- {"es-ES": [{ id, name, iconUrl, defined }], ...}: the DLC groups' names come per language.
  groups      JSONB NOT NULL DEFAULT '{}',
  -- The languages whose trophy texts are in psn_trophies.texts.
  languages   TEXT[] NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS psn_trophies (
  title_id   TEXT NOT NULL REFERENCES psn_games(title_id) ON DELETE CASCADE,
  trophy_id  INTEGER NOT NULL,
  type       TEXT NOT NULL,
  group_id   TEXT NOT NULL DEFAULT 'default',
  hidden     BOOLEAN NOT NULL DEFAULT FALSE,
  icon_url   TEXT,
  rarity     REAL,
  -- {"es-ES": ["name", "detail"], ...}
  texts      JSONB NOT NULL DEFAULT '{}',
  PRIMARY KEY (title_id, trophy_id)
);

CREATE TABLE IF NOT EXISTS psn_player_games (
  account_id      TEXT NOT NULL REFERENCES psn_players(account_id) ON DELETE CASCADE,
  title_id        TEXT NOT NULL,
  game            JSONB NOT NULL,
  last_trophy_at  TEXT,
  trophies_at     TEXT,
  -- [{ id, earned, progress }]: what the account has of each DLC group (games with DLC only).
  groups          JSONB,
  completed_at    TEXT,
  -- A page asked for this game's trophies: the next sync reads it first.
  wanted_at       TIMESTAMPTZ,
  PRIMARY KEY (account_id, title_id)
);

CREATE INDEX IF NOT EXISTS psn_player_games_delta
  ON psn_player_games (account_id, last_trophy_at DESC)
  WHERE trophies_at IS DISTINCT FROM last_trophy_at OR wanted_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS psn_player_trophies (
  account_id  TEXT NOT NULL,
  title_id    TEXT NOT NULL,
  trophy_id   INTEGER NOT NULL,
  earned_at   TEXT,
  PRIMARY KEY (account_id, title_id, trophy_id),
  FOREIGN KEY (account_id, title_id) REFERENCES psn_player_games(account_id, title_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS psn_player_trophies_recent
  ON psn_player_trophies (account_id, earned_at DESC)
  WHERE earned_at IS NOT NULL;

-- The worker takes the most urgent job first, oldest first within a priority (psnQueue.claimPsnJobs).
CREATE INDEX IF NOT EXISTS psn_sync_jobs_next
  ON psn_sync_jobs (priority, run_after)
  WHERE status = 'queued';
