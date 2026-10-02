-- A UNIQUE constraint on the password column, from before these migrations.
-- It never did anything: every bcrypt hash carries its own random salt, so two
-- hashes never match even for the same password. It only cost an index write
-- on every sign-up and password change. The UNIQUE on raid stays: that one
-- stops one RA key being linked to two accounts (see api/updateRaUser).
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_password_key;
