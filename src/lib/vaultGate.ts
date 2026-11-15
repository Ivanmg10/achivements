/**
 * Only a verified PSN account counts in Vault Points (#176). Nothing is deleted or skipped when scores are made:
 * `score_games` and `score_periods` keep what was read for an unverified account, and every read that adds points
 * up carries one of these two clauses, so verifying shows the points at once with no new read of Sony, and
 * unlinking or clearing a verification takes them out at once. SQL written in code, never a value from a request.
 */

/** For a query that joins `score_games g` to `users u`. */
export const PSN_VERIFIED_JOINED = `(g.source <> 'psn' OR u.psn_verified_at IS NOT NULL)`

/** For a query with no `users` join: the stored row's own source and user columns. */
export function psnVerifiedFor(source: string, userId: string): string {
  return `(${source} <> 'psn' OR EXISTS (SELECT 1 FROM users pv WHERE pv.id = ${userId} AND pv.psn_verified_at IS NOT NULL))`
}
