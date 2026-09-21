import { gameKey, parseGameKey, gameHref, isGameSource, GAME_SOURCES } from './gameRef'

test('keys keep RA and Steam games with the same id apart', () => {
  expect(gameKey('ra', 730)).toBe('ra:730')
  expect(gameKey('steam', 730)).toBe('steam:730')
  expect(gameKey('ra', 730)).not.toBe(gameKey('steam', 730))
})

test('parses a key back', () => {
  expect(parseGameKey('steam:730')).toEqual({ source: 'steam', id: 730 })
  expect(parseGameKey(gameKey('ra', 1))).toEqual({ source: 'ra', id: 1 })
})

test.each(['730', 'epic:730', 'ra:', 'ra:abc', 'ra:-3', 'ra:1.5', ''])('rejects %p', (key) => {
  expect(parseGameKey(key)).toBeNull()
})

test('each platform has its own game page', () => {
  expect(gameHref('ra', 1)).toBe('/gameInfo/1')
  expect(gameHref('steam', 730)).toBe('/steamGame/730')
})

test('recognises only known sources', () => {
  expect(GAME_SOURCES).toEqual(['ra', 'steam'])
  expect(isGameSource('ra')).toBe(true)
  expect(isGameSource('steam')).toBe(true)
  expect(isGameSource('epic')).toBe(false)
  expect(isGameSource(undefined)).toBe(false)
})
