jest.mock('@/utils/adminFetch', () => ({ adminFetch: jest.fn() }))

import { renderHook, act } from '@testing-library/react'
import { useAdminXbox } from './useAdminXbox'
import { adminFetch } from '@/utils/adminFetch'
import { xboxGameFixture, xboxProfileFixture } from '@/test-utils/xboxFixtures'

const BODY = { profile: xboxProfileFixture(), games: [xboxGameFixture()], rateLimit: { remaining: 140, limit: 150 } }

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('nothing is asked until a lookup', () => {
  const { result } = renderHook(() => useAdminXbox())
  expect(adminFetch).not.toHaveBeenCalled()
  expect(result.current).toMatchObject({ result: null, error: null, loading: false })
})

test('a lookup sends the gamertag, encoded, and keeps the answer', async () => {
  ;(adminFetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => BODY })
  const { result } = renderHook(() => useAdminXbox())
  await act(async () => result.current.lookup('Name#1234'))
  expect(adminFetch).toHaveBeenCalledWith('/api/admin/xbox?gamertag=Name%231234')
  expect(result.current.result).toEqual(BODY)
  expect(result.current.error).toBeNull()
  expect(result.current.loading).toBe(false)
})

test.each(['not-found', 'private', 'not-configured', 'unauthorized', 'rate-limited', 'invalid-gamertag'])('keeps the reason: %s', async (reason) => {
  ;(adminFetch as jest.Mock).mockResolvedValue({ ok: false, status: 400, json: async () => ({ error: reason }) })
  const { result } = renderHook(() => useAdminXbox())
  await act(async () => result.current.lookup('x'))
  expect(result.current.error).toBe(reason)
  expect(result.current.result).toBeNull()
})

test('an error nobody knows, or no JSON at all, is a plain failure', async () => {
  ;(adminFetch as jest.Mock).mockResolvedValue({ ok: false, status: 502, json: async () => ({ error: 'weird' }) })
  const { result } = renderHook(() => useAdminXbox())
  await act(async () => result.current.lookup('x'))
  expect(result.current.error).toBe('failed')
  ;(adminFetch as jest.Mock).mockResolvedValue({ ok: false, status: 502, json: async () => { throw new Error('html') } })
  await act(async () => result.current.lookup('x'))
  expect(result.current.error).toBe('failed')
})

test('a network failure is a failure, and a failed lookup clears the old result', async () => {
  ;(adminFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => BODY })
  const { result } = renderHook(() => useAdminXbox())
  await act(async () => result.current.lookup('a'))
  expect(result.current.result).not.toBeNull()
  ;(adminFetch as jest.Mock).mockRejectedValueOnce(new Error('offline'))
  await act(async () => result.current.lookup('b'))
  expect(result.current.error).toBe('failed')
  expect(result.current.result).toBeNull()
})

test('a new lookup clears the previous error', async () => {
  ;(adminFetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({ error: 'not-found' }) })
  const { result } = renderHook(() => useAdminXbox())
  await act(async () => result.current.lookup('a'))
  expect(result.current.error).toBe('not-found')
  ;(adminFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => BODY })
  await act(async () => result.current.lookup('b'))
  expect(result.current.error).toBeNull()
})
