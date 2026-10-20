import { presenceColumns } from './presence'

test('online within 5 minutes and the time rounded to 5, both only for who shares it', () => {
  const sql = presenceColumns('u')
  expect(sql).toContain("COALESCE(u.show_presence AND u.last_seen_at > now() - interval '5 minutes', false) AS online")
  expect(sql).toContain('CASE WHEN u.show_presence THEN to_timestamp(floor(extract(epoch FROM u.last_seen_at) / 300) * 300) END AS "lastSeenAt"')
})

test('without an alias, the bare columns', () => {
  const sql = presenceColumns()
  expect(sql).toContain('COALESCE(show_presence AND last_seen_at >')
  expect(sql).not.toContain('.show_presence')
})
