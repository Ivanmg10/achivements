-- Xbox Live link, through OpenXBL. The user types a gamertag and we store the
-- account it resolves to (its XUID, a long decimal number kept as TEXT). Like
-- PSN and Steam, nothing proves the account is theirs, so this is deliberately
-- NOT unique: a public gamertag can be shown by anyone, and someone claiming
-- one first must not lock its real owner out.
--
-- Additive only. Xbox is admin-only for now (src/utils/xboxAccess.ts), so only
-- admins ever write these.
ALTER TABLE users ADD COLUMN IF NOT EXISTS xboxxuid      TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS xboxgamertag  TEXT;

-- The favourite Xbox game, the same shape as the other three ({ id, title, imageIcon }).
ALTER TABLE users ADD COLUMN IF NOT EXISTS favorite_xbox_game JSONB;
