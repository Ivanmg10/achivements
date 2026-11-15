/** @jest-environment node */
import { raKeyHash, readRaKey, sealRaKey } from './raKey'

beforeEach(() => {
  process.env.NEXTAUTH_SECRET = 'test-secret'
})

test('a key is stored sealed and reads back', () => {
  const { sealed } = sealRaKey('my-ra-key')
  expect(sealed).not.toContain('my-ra-key')
  expect(readRaKey(sealed)).toBe('my-ra-key')
})

test('the same key seals differently each time, but its hash can be compared', () => {
  const a = sealRaKey('my-ra-key')
  const b = sealRaKey('my-ra-key')
  expect(a.sealed).not.toBe(b.sealed)
  expect(a.hash).toBe(b.hash)
  expect(a.hash).toBe(raKeyHash('my-ra-key'))
  expect(a.hash).not.toContain('my-ra-key')
})

test('a key stored before sealing still reads, and nothing reads as nothing', () => {
  expect(readRaKey('PlainKey123')).toBe('PlainKey123')
  expect(readRaKey(null)).toBeNull()
  expect(readRaKey(undefined)).toBeNull()
})

test('a new secret leaves a sealed key unreadable, not wrong', () => {
  const { sealed } = sealRaKey('my-ra-key')
  process.env.NEXTAUTH_SECRET = 'another-secret'
  expect(readRaKey(sealed)).toBeNull()
})
