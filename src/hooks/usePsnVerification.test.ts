import { renderHook, act, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { usePsnVerification } from './usePsnVerification'

const mockUpdate = jest.fn()

function setSession(user: Record<string, unknown> | null) {
  ;(useSession as jest.Mock).mockReturnValue({ data: user ? { user } : null, status: user ? 'authenticated' : 'unauthenticated', update: mockUpdate })
}

const json = (status: number, body: unknown) => ({ ok: status < 400, status, json: async () => body, clone() { return this } })
const issued = { verified: false, code: 'CV-ABCD2345', expiresAt: '2030-01-01T00:00:00Z' }

beforeEach(() => {
  jest.clearAllMocks()
  setSession({ id: '7', psnaccountid: '42' })
  global.fetch = jest.fn().mockResolvedValue(json(200, issued))
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('without a PSN account it asks for nothing', () => {
  setSession({ id: '7' })
  const { result } = renderHook(() => usePsnVerification())
  expect(result.current).toMatchObject({ linked: false, verified: false, code: null, isLoading: false })
  expect(global.fetch).not.toHaveBeenCalled()
})

test('linked and not verified: asks for the code', async () => {
  const { result } = renderHook(() => usePsnVerification())
  expect(result.current.isLoading).toBe(true)
  await waitFor(() => expect(result.current.code).toBe('CV-ABCD2345'))
  expect(global.fetch).toHaveBeenCalledWith('/api/psn/verify')
  expect(result.current.verified).toBe(false)
})

test('a verified session never asks for a code (asking would make one)', () => {
  setSession({ id: '7', psnaccountid: '42', psnVerified: true })
  const { result } = renderHook(() => usePsnVerification())
  expect(result.current).toMatchObject({ linked: true, verified: true })
  expect(global.fetch).not.toHaveBeenCalled()
})

test('a failed read keeps the code the route sent', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue(json(500, { error: 'failed' }))
  const { result } = renderHook(() => usePsnVerification())
  await waitFor(() => expect(result.current.loadError).toBe('failed'))
})

test('check: verified, the session is refreshed from the database', async () => {
  const { result } = renderHook(() => usePsnVerification())
  await waitFor(() => expect(result.current.code).not.toBeNull())
  ;(global.fetch as jest.Mock).mockResolvedValueOnce(json(200, { verified: true }))
  mockUpdate.mockResolvedValue({})

  let ok = false
  await act(async () => {
    ok = await result.current.check()
  })

  expect(ok).toBe(true)
  expect(global.fetch).toHaveBeenLastCalledWith('/api/psn/verify', { method: 'POST' })
  expect(mockUpdate).toHaveBeenCalledWith()
  expect(result.current).toMatchObject({ verified: true, error: null, checking: false })
})

test.each(['not-found', 'taken', 'private', 'rate-limited'])('check: %s is kept for the screen to say', async (code) => {
  const { result } = renderHook(() => usePsnVerification())
  await waitFor(() => expect(result.current.code).not.toBeNull())
  ;(global.fetch as jest.Mock).mockResolvedValueOnce(json(code === 'rate-limited' ? 429 : 409, { error: code }))
  await act(async () => {
    expect(await result.current.check()).toBe(false)
  })
  expect(result.current).toMatchObject({ error: code, verified: false })
  expect(mockUpdate).not.toHaveBeenCalled()
})

test('check: an expired code asks for a new one', async () => {
  const { result } = renderHook(() => usePsnVerification())
  await waitFor(() => expect(result.current.code).toBe('CV-ABCD2345'))
  ;(global.fetch as jest.Mock)
    .mockResolvedValueOnce(json(409, { error: 'no-code' }))
    .mockResolvedValueOnce(json(200, { ...issued, code: 'CV-NEWNEW22' }))
  await act(async () => {
    await result.current.check()
  })
  await waitFor(() => expect(result.current.code).toBe('CV-NEWNEW22'))
  expect(result.current.error).toBe('no-code')
})

test('check: a network failure is "failed", and an unknown answer too', async () => {
  const { result } = renderHook(() => usePsnVerification())
  await waitFor(() => expect(result.current.code).not.toBeNull())
  ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('offline'))
  await act(async () => {
    expect(await result.current.check()).toBe(false)
  })
  expect(result.current.error).toBe('failed')
  ;(global.fetch as jest.Mock).mockResolvedValueOnce(json(500, 'nope'))
  await act(async () => {
    await result.current.check()
  })
  expect(result.current.error).toBe('failed')
})
