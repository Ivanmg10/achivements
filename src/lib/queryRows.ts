import pool from '@/lib/db'

/** `pool` comes untyped from db.js: the rows, typed as the query selects them. */
export async function queryRows<T>(text: string, params: unknown[] = []): Promise<T[]> {
  return (await pool.query(text, params)).rows as T[]
}
