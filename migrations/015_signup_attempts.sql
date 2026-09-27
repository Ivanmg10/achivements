-- Account creation is open, so the endpoint writes a row for anyone who asks.
-- Counting attempts in the database (rather than in each server instance's
-- memory) makes the limit hold across a serverless deployment.
CREATE TABLE IF NOT EXISTS signup_attempts (
  id SERIAL PRIMARY KEY,
  address TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS signup_attempts_address_time
  ON signup_attempts (address, created_at DESC);
