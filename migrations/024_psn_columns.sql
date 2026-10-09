-- PlayStation Network link. The user types a PSN username and we store the
-- account it resolves to. Sony has no public sign-in to prove ownership, so
-- this is deliberately NOT unique: a public trophy list can be shown by anyone,
-- and someone claiming a name first must not lock its real owner out.
ALTER TABLE users ADD COLUMN IF NOT EXISTS psnaccountid TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS psnusername  TEXT;
