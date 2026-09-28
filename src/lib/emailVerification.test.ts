import { signVerification, readVerification, verificationUrl } from './emailVerification'

const NOW = 1_759_000_000_000
const WEEK = 7 * 24 * 60 * 60 * 1000

beforeEach(() => {
  process.env.NEXTAUTH_SECRET = 'test-secret'
  process.env.NEXTAUTH_URL = 'https://www.cheevovault.com'
})

test('a token says who it is for and which address it proves', () => {
  const token = signVerification(7, 'ivan@test.com', NOW)
  expect(readVerification(token, NOW)).toEqual({ userId: '7', email: 'ivan@test.com' })
})

test('the address is compared in lower case, however it was typed', () => {
  const token = signVerification(7, 'Ivan@Test.com', NOW)
  expect(readVerification(token, NOW)?.email).toBe('ivan@test.com')
})

test('a forged signature is refused', () => {
  const token = signVerification(7, 'ivan@test.com', NOW)
  const [payload] = token.split('.')
  expect(readVerification(`${payload}.${'0'.repeat(64)}`, NOW)).toBeNull()
})

test('a token signed with another secret is refused', () => {
  const token = signVerification(7, 'ivan@test.com', NOW)
  process.env.NEXTAUTH_SECRET = 'a-different-secret'
  expect(readVerification(token, NOW)).toBeNull()
})

test('rubbish is refused rather than throwing', () => {
  expect(readVerification(null, NOW)).toBeNull()
  expect(readVerification('', NOW)).toBeNull()
  expect(readVerification('nodot', NOW)).toBeNull()
  expect(readVerification('not.base64url', NOW)).toBeNull()
})

test('a link lasts a week, and is dead after it', () => {
  const token = signVerification(7, 'ivan@test.com', NOW)
  expect(readVerification(token, NOW + WEEK - 1000)).not.toBeNull()
  expect(readVerification(token, NOW + WEEK + 1000)).toBeNull()
})

test('a token from the future is refused — a clock cannot be argued with', () => {
  const token = signVerification(7, 'ivan@test.com', NOW + 60_000)
  expect(readVerification(token, NOW)).toBeNull()
})

test('the link is built from the public URL', () => {
  const token = signVerification(7, 'ivan@test.com', NOW)
  expect(verificationUrl(token)).toBe(
    `https://www.cheevovault.com/api/auth/verifyEmail?token=${encodeURIComponent(token)}`,
  )
})
