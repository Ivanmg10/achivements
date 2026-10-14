-- Whether the gender chosen in the preferences shows on the public profile.
-- Off by default: it is personal, and it was set before anyone could see it,
-- so nobody's is shown until they choose to.
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender_public BOOLEAN NOT NULL DEFAULT FALSE;
