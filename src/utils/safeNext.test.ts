import { safeNext } from './safeNext'

// Built from char codes so no editor or shell can swallow the backslash or the control characters.
const BS = String.fromCharCode(92)
const TAB = String.fromCharCode(9)
const LF = String.fromCharCode(10)
const NUL = String.fromCharCode(0)

test.each([
  ['/groups', '/groups'],
  ['/user/ana?tab=games', '/user/ana?tab=games'],
  ['/rankings#me', '/rankings#me'],
  ['/gameInfo/123', '/gameInfo/123'],
])('a path of this site is kept: %s', (raw, expected) => {
  expect(safeNext(raw)).toBe(expected)
})

test.each([
  ['a protocol-relative URL', '//evil.com'],
  ['a protocol-relative URL with a path', '//evil.com/groups'],
  ['an https URL', 'https://evil.com'],
  ['an http URL', 'http://evil.com/groups'],
  ['a slash and a backslash', `/${BS}evil.com`],
  ['a slash, a backslash and a slash', `/${BS}/evil.com`],
  ['two backslashes', `${BS}${BS}evil.com`],
  ['a javascript: URL', 'javascript:alert(1)'],
  ['a tab that the URL parser drops', `/${TAB}/evil.com`],
  ['a newline that the URL parser drops', `/${LF}/evil.com`],
  ['a NUL', `/${NUL}/evil.com`],
  ['a bare host', 'evil.com'],
  ['a relative path', 'groups'],
  ['nothing', ''],
  ['a very long path', `/${'a'.repeat(600)}`],
])('%s goes home', (_what, raw) => {
  expect(safeNext(raw)).toBe('/')
})

test('not a string, or the screens that would bounce straight back, go home', () => {
  for (const raw of [undefined, null, 5, ['/groups'], { a: 1 }]) expect(safeNext(raw)).toBe('/')
  for (const raw of ['/authPage', '/authPage?mode=register', '/resetPassword?token=x', '/api/auth/signout']) expect(safeNext(raw)).toBe('/')
})

test('a path that resolves to another host once the URL is parsed does not pass', () => {
  expect(safeNext('/..//evil.com')).toBe('/')
})
