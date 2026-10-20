import pkg from "pg";
const { Pool } = pkg;

/**
 * The database to use. The Neon integration owns DATABASE_URL for every
 * environment, and Vercel refuses a second variable of that name for a branch;
 * so a database of its own for Preview (develop) or local work goes in
 * PREVIEW_DATABASE_URL, which wins when set. Never in production, whatever is
 * set there: production always runs on DATABASE_URL.
 */
export function databaseUrl(env = process.env) {
  if (env.VERCEL_ENV !== "production" && env.PREVIEW_DATABASE_URL) return env.PREVIEW_DATABASE_URL;
  return env.DATABASE_URL;
}

const pool = new Pool({
  connectionString: databaseUrl(),
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});

export default pool;
