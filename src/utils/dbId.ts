const INT_MAX = 2147483647

/** A value as a positive INTEGER column id, or null when it cannot be one. */
export function dbId(value: unknown): number | null {
  const n = typeof value === 'string' && /^\d{1,10}$/.test(value) ? Number(value) : value
  return typeof n === 'number' && Number.isInteger(n) && n > 0 && n <= INT_MAX ? n : null
}
