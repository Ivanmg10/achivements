let pre = null;

/**
 * A second, small pool on pre's database, for production to read pre's PSN pool and alert on it
 * (psnPoolStatus.prePoolStatus, #178). Only ever used inside READ ONLY transactions. `pg` is loaded
 * on first use: every PSN call reaches this module (through the upkeep), and only production's
 * alerts need a second pool.
 *
 * @param {string} url
 */
export async function preDatabase(url) {
  if (!pre) {
    const { default: pkg } = await import("pg");
    pre = new pkg.Pool({ connectionString: url, max: 1, idleTimeoutMillis: 10000, connectionTimeoutMillis: 5000 });
  }
  return pre;
}
