-- Steam is linked by name now, like PSN (no Steam sign-in): nothing proves an
-- account is the user's, so it must not be unique either — a squatter would
-- lock the owner out, and one person may keep several CheevoVault accounts
-- with the same Steam account. Nothing looks users up by steamid, so no index
-- takes its place.
DROP INDEX IF EXISTS idx_users_steamid;
