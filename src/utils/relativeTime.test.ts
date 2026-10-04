import { relativeTime } from './utils'

const ago = (ms: number) => new Date(Date.now() - ms).toISOString()

test('in the largest unit that fits, in the language asked for', () => {
  expect(relativeTime(ago(2 * 3600_000), 'en')).toMatch(/2 hr\.? ago/)
  expect(relativeTime(ago(3 * 86400_000), 'es')).toMatch(/hace 3 d/)
})

test('a dash when there is no date to tell', () => {
  expect(relativeTime(null)).toBe('—')
  expect(relativeTime('nonsense')).toBe('—')
})
