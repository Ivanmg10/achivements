import { consoleOptions, consolesOf, filterByConsole, isConsoleShown } from './consoleFilter'

test('splits a joined label into its consoles', () => {
  expect(consolesOf('PS4 · PS5')).toEqual(['PS4', 'PS5'])
  expect(consolesOf('GameCube')).toEqual(['GameCube'])
  expect(consolesOf('')).toEqual([])
  expect(consolesOf(undefined)).toEqual([])
})

test('counts each console once per game, biggest first, ties by name', () => {
  expect(consoleOptions(['PS4 · PS5', 'PS4', 'PS5', 'PS Vita', 'PS3'])).toEqual([
    { name: 'PS4', count: 2 },
    { name: 'PS5', count: 2 },
    { name: 'PS Vita', count: 1 },
    { name: 'PS3', count: 1 },
  ])
  expect(consoleOptions([])).toEqual([])
})

test('lists the consoles asked for even with no games, after the rest', () => {
  expect(consoleOptions(['PS5', 'PS4 · PS5'], ['PS3', 'PS Vita', 'PS4', 'PS5'])).toEqual([
    { name: 'PS5', count: 2 },
    { name: 'PS4', count: 1 },
    { name: 'PS Vita', count: 0 },
    { name: 'PS3', count: 0 },
  ])
})

test('a game stays while one of its consoles is ticked', () => {
  const hidden = new Set(['Xbox 360'])
  expect(isConsoleShown('Xbox 360', hidden)).toBe(false)
  expect(isConsoleShown('Xbox 360 · Xbox Series', hidden)).toBe(true)
  expect(isConsoleShown('Xbox 360 · Xbox One', new Set(['Xbox 360', 'Xbox One']))).toBe(false)
  expect(isConsoleShown('Xbox One', hidden)).toBe(true)
  expect(isConsoleShown('', hidden)).toBe(true)
})

test('filters games, and returns the same list when nothing is hidden', () => {
  const games = [{ c: 'PS3' }, { c: 'PS5' }]
  expect(filterByConsole(games, (g) => g.c, new Set(['PS3']))).toEqual([{ c: 'PS5' }])
  expect(filterByConsole(games, (g) => g.c, new Set())).toBe(games)
})
