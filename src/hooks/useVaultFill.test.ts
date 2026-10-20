import { renderHook, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { notify } from '@/lib/notify'
import { useVaultFill } from './useVaultFill'

jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))

const answer = (over: Record<string, unknown>) => ({
  complete: false, running: false, points: 0, updatedAt: '2026-10-20T10:00:00Z', ran: true, finished: false,
  platforms: { steam: { read: 10, total: 190, state: 'reading' } }, ...over,
})
const ok = (data: unknown) => ({ ok: true, json: async () => data })

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated', data: { user: { id: '1', steamid: 's' } } })
  global.fetch = jest.fn()
})

test('asks for pass after pass until complete, then says the points are ready', async () => {
  ;(global.fetch as jest.Mock)
    .mockResolvedValueOnce(ok(answer({})))
    .mockResolvedValueOnce(ok(answer({ complete: true, finished: true, points: 126_000, platforms: { steam: { read: 190, total: 190, state: 'done' } } })))
  const { result } = renderHook(() => useVaultFill())
  await waitFor(() => expect(result.current.status?.complete).toBe(true), { timeout: 4000 })
  expect((global.fetch as jest.Mock).mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(2)
  expect(result.current.version).toBe(2)
  expect(notify.success).toHaveBeenCalledWith('Your Vault Points are ready: Level 32 · Veteran')
})

test('a returning user with a fresh score: one quiet answer, no toast, nothing to reload', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue(ok(answer({ complete: true, ran: false, platforms: {} })))
  const { result } = renderHook(() => useVaultFill())
  await waitFor(() => expect(result.current.status?.complete).toBe(true))
  expect(global.fetch).toHaveBeenCalledTimes(1)
  expect(result.current.version).toBe(0)
  expect(notify.success).not.toHaveBeenCalled()
})

test('says when a platform could not be read', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue(ok(answer({ complete: true, platforms: { steam: { read: 0, total: 0, state: 'error', error: 'private' } } })))
  renderHook(() => useVaultFill())
  await waitFor(() => expect(notify.error).toHaveBeenCalledWith('Steam could not be read. The rest already counts.'))
})

test('signed out, nothing is asked; a failed request ends the loop', async () => {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'unauthenticated', data: null })
  renderHook(() => useVaultFill())
  expect(global.fetch).not.toHaveBeenCalled()

  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated', data: { user: { id: '1' } } })
  ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500 })
  renderHook(() => useVaultFill())
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1))
})
