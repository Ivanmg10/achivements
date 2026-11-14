import { parseRaGameId } from './raGameId'

test('reads a bare id of three digits or more', () => {
  expect(parseRaGameId('1234')).toBe(1234)
  expect(parseRaGameId('  620 ')).toBe(620)
})

test('reads a game link, with or without the scheme and www', () => {
  expect(parseRaGameId('https://retroachievements.org/game/1234')).toBe(1234)
  expect(parseRaGameId('retroachievements.org/game/77?x=1')).toBe(77)
  expect(parseRaGameId('https://www.retroachievements.org/game/9/hashes')).toBe(9)
})

test('a title, a short number or a link to something else is not an id', () => {
  expect(parseRaGameId('zelda')).toBeNull()
  expect(parseRaGameId('42')).toBeNull()
  expect(parseRaGameId('')).toBeNull()
  expect(parseRaGameId('https://retroachievements.org/user/ivan')).toBeNull()
  expect(parseRaGameId('0000')).toBeNull()
})
