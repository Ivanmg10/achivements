import { withSubject } from './withSubject'

test('leaves the URL alone for the signed-in user\'s own data', () => {
  expect(withSubject('/api/getUserAwards', null)).toBe('/api/getUserAwards')
})

test('names the user on a plain URL', () => {
  expect(withSubject('/api/getUserAwards', 'bob')).toBe('/api/getUserAwards?user=bob')
})

test('appends to a URL that already has a query, and encodes the name', () => {
  expect(withSubject('/api/steam/activity?lang=english', 'a b&c')).toBe('/api/steam/activity?lang=english&user=a%20b%26c')
})
