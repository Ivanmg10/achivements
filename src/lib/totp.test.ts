/** @jest-environment node */
import { matchingStep, newTotpSecret, totpCode, totpUri } from './totp'

// RFC 6238's test key, "12345678901234567890", in base32.
const SECRET = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'

test.each([
  [59, '287082'],
  [1111111109, '081804'],
  [1234567890, '005924'],
  [2000000000, '279037'],
])('at %d s the code is the RFC\'s, cut to six digits', (seconds, code) => {
  expect(totpCode(SECRET, Math.floor(seconds / 30))).toBe(code)
})

test('a code works in its step and the neighbouring ones, and not further', () => {
  const now = 1_790_000_000_000
  const step = Math.floor(now / 30_000)
  expect(matchingStep(SECRET, totpCode(SECRET, step), now)).toBe(step)
  expect(matchingStep(SECRET, totpCode(SECRET, step - 1), now)).toBe(step - 1)
  expect(matchingStep(SECRET, totpCode(SECRET, step + 1), now)).toBe(step + 1)
  expect(matchingStep(SECRET, totpCode(SECRET, step - 2), now)).toBeNull()
})

test('what is not six digits is no code', () => {
  expect(matchingStep(SECRET, '12345')).toBeNull()
  expect(matchingStep(SECRET, 'abcdef')).toBeNull()
})

test('a new secret is base32 and works', () => {
  const secret = newTotpSecret()
  expect(secret).toMatch(/^[A-Z2-7]{32}$/)
  expect(totpCode(secret, 1)).toMatch(/^\d{6}$/)
})

test('the setup link names the app and the account', () => {
  const uri = totpUri('ABC', 'boss')
  expect(uri).toContain('otpauth://totp/CheevoVault%3Aboss?')
  expect(uri).toContain('secret=ABC')
  expect(uri).toContain('issuer=CheevoVault')
})
