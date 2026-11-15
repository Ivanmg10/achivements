import pkg from "pg";
const { Pool } = pkg;

let pre = null;

/**
 * A second, small pool on pre's database, for production to read pre's PSN pool and alert on it
 * (psnPoolStatus.prePoolStatus, #178). Only ever used inside READ ONLY transactions.
 *
 * @param {string} url
 */
export function preDatabase(url) {
  pre ??= new Pool({ connectionString: url, max: 1, idleTimeoutMillis: 10000, connectionTimeoutMillis: 5000 });
  return pre;
}
