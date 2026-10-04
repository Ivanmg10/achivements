-- Avatars uploaded from the user's device, stored here rather than on a third
-- party: one small image per user (cropped and resized to 256px in the
-- browser, capped at 512 KB by the API), served from /api/avatar. The mime
-- type is the one the API read from the file's own bytes, never the client's
-- word. Goes with the account: deleting the user deletes the image.
CREATE TABLE IF NOT EXISTS user_avatars (
  user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  image      BYTEA NOT NULL,
  mime       TEXT NOT NULL CHECK (mime IN ('image/png', 'image/jpeg', 'image/webp')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
