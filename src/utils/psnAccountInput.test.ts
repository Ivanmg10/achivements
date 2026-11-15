import { readAccountPatch, readNewAccount, readNpsso } from './psnAccountInput'

const NPSSO = 'a'.repeat(64)

test('an NPSSO is 64 letters and digits, trimmed', () => {
  expect(readNpsso({ npsso: ` ${NPSSO} ` })).toBe(NPSSO)
  expect(readNpsso({ npsso: 'short' })).toBeNull()
  expect(readNpsso({ npsso: `${'a'.repeat(63)}!` })).toBeNull()
  expect(readNpsso(null)).toBeNull()
})

test('a new account: a plain label, an optional hint, a weight from 1 to 10 (1 by default)', () => {
  expect(readNewAccount({ label: ' PSN-2 ', npsso: NPSSO })).toEqual({ label: 'PSN-2', hint: null, weight: 1, npsso: NPSSO })
  expect(readNewAccount({ label: 'PSN-3', hint: ' the old one ', weight: 2, npsso: NPSSO })).toEqual({ label: 'PSN-3', hint: 'the old one', weight: 2, npsso: NPSSO })
  expect(readNewAccount({ label: 'PSN-3', hint: '  ', npsso: NPSSO })).toMatchObject({ hint: null })
})

test('a new account refuses a bad label, hint or weight, and says when only the NPSSO is wrong', () => {
  expect(readNewAccount({ label: '', npsso: NPSSO })).toBe('invalid')
  expect(readNewAccount({ label: '<b>', npsso: NPSSO })).toBe('invalid')
  expect(readNewAccount({ label: 'PSN-2', hint: 'x'.repeat(81), npsso: NPSSO })).toBe('invalid')
  expect(readNewAccount({ label: 'PSN-2', hint: 5, npsso: NPSSO })).toBe('invalid')
  expect(readNewAccount({ label: 'PSN-2', weight: 11, npsso: NPSSO })).toBe('invalid')
  expect(readNewAccount({ label: 'PSN-2', npsso: 'nope' })).toBe('invalid-npsso')
})

test('a change: an admin may pause, drain or resume, and tune within range', () => {
  expect(readAccountPatch({ status: 'draining' })).toEqual({ status: 'draining' })
  expect(readAccountPatch({ weight: 2, concurrency: 3, ratePerMin: 30, hint: null })).toEqual({ weight: 2, concurrency: 3, ratePerMin: 30, hint: null })
  expect(readAccountPatch({ hint: ' blue ' })).toEqual({ hint: 'blue' })
})

test('a change refuses quarantine by hand, out-of-range numbers, a bad hint and nothing at all', () => {
  expect(readAccountPatch({ status: 'quarantined' })).toBe('invalid')
  expect(readAccountPatch({ concurrency: 0 })).toBe('invalid')
  expect(readAccountPatch({ ratePerMin: 1.5 })).toBe('invalid')
  expect(readAccountPatch({ hint: 'x'.repeat(81) })).toBe('invalid')
  expect(readAccountPatch({})).toBe('invalid')
  expect(readAccountPatch('x')).toBe('invalid')
})
