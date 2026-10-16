-- Display preferences that follow the account between devices (which consoles
-- show, how the library is laid out, a few switches). Until now they lived only
-- in each browser. A flat JSON object of short strings; the keys that may be
-- stored are decided in code (src/utils/syncedPreferences.ts), never by the client.
-- Additive: existing rows get {} and code that does not know the column ignores it.

ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences jsonb NOT NULL DEFAULT '{}'::jsonb;
