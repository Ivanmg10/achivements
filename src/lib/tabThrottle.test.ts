import { dueInThisTab } from './tabThrottle'

beforeEach(() => window.sessionStorage.clear())

test('runs once per window in a tab, then again once it has passed', () => {
  expect(dueInThisTab('k', 60_000, 1_000)).toBe(true)
  expect(dueInThisTab('k', 60_000, 30_000)).toBe(false)
  expect(dueInThisTab('k', 60_000, 61_001)).toBe(true)
})

test('each key counts on its own', () => {
  expect(dueInThisTab('a', 60_000, 1_000)).toBe(true)
  expect(dueInThisTab('b', 60_000, 1_000)).toBe(true)
})

test('blocked storage runs it every time, as before', () => {
  const spy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  expect(dueInThisTab('k', 60_000, 1_000)).toBe(true)
  expect(dueInThisTab('k', 60_000, 2_000)).toBe(true)
  spy.mockRestore()
})
