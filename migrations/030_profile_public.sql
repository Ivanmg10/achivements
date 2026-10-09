-- Whether other users may find and open this account's profile page. On by
-- default: the page is what the app is for. Off, the account is left out of
-- user search, its page answers "not found" to everyone else, and none of its
-- data can be read by name (see dataOwner). The owner always sees their own.
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_public BOOLEAN NOT NULL DEFAULT TRUE;
