/**
 * The columns that tell others whether a user is online and when they were last
 * seen, for a `users` row (under `alias`, if the query gives it one). Only for
 * who shares it (`show_presence`); online is seen in the last 5 minutes; the
 * time is rounded down to 5 minutes, never sent exact. Every query that shows
 * presence selects these, so the rule lives in one place.
 */
export function presenceColumns(alias?: string): string {
  const c = (column: string) => (alias ? `${alias}.${column}` : column)
  return `COALESCE(${c('show_presence')} AND ${c('last_seen_at')} > now() - interval '5 minutes', false) AS online,
              CASE WHEN ${c('show_presence')} THEN to_timestamp(floor(extract(epoch FROM ${c('last_seen_at')}) / 300) * 300) END AS "lastSeenAt"`
}
