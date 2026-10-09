/** @jest-environment node */
import { open, seal } from './secretBox'

beforeEach(() => {
  process.env.NEXTAUTH_SECRET = 'test-secret'
})

test('round-trips a secret, and never stores it in the clear', () => {
  const sealed = seal('npsso-value', 'purpose')
  expect(sealed).not.toContain('npsso-value')
  expect(open(sealed, 'purpose')).toBe('npsso-value')
})

test('a different purpose, secret or a tampered value reads as nothing', () => {
  const sealed = seal('npsso-value', 'purpose')
  expect(open(sealed, 'other')).toBeNull()
  const [iv, tag, data] = sealed.split('.')
  expect(open(`${iv}.${tag}.${data.slice(0, -2)}AA`, 'purpose')).toBeNull()
  process.env.NEXTAUTH_SECRET = 'rotated'
  expect(open(sealed, 'purpose')).toBeNull()
})

test('nothing stored is nothing', () => {
  expect(open(null, 'purpose')).toBeNull()
  expect(open('', 'purpose')).toBeNull()
})
