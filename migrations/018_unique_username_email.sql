-- One account per username and per address, in any case. The endpoints check
-- this before writing, but two sign-ups racing each other can both pass the
-- check; the index is what makes the second one fail. Recovery mails the
-- address on the account, so two accounts sharing one would leave a reset
-- link going to whichever the query happened to find first.
--
-- Creating the index fails if duplicates already exist. Find them first:
--   SELECT LOWER(username), COUNT(*) FROM users GROUP BY 1 HAVING COUNT(*) > 1;
--   SELECT LOWER(email), COUNT(*) FROM users WHERE email IS NOT NULL GROUP BY 1 HAVING COUNT(*) > 1;
CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_key ON users (LOWER(username));
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_key ON users (LOWER(email)) WHERE email IS NOT NULL;
