import { act, renderHook, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useVaultMe } from './useVaultMe'

const ME = { points: 1200, split: { ra: 1200 }, week: 0, month: 0, rank: 4, listed: true, showInRankings: true, provisional: 0, refreshedAt: null }

beforeEach(() => {
  global.fetch = jest.fn()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated', data: { user: { id: '1' } } })
})

test('reads your Vault Points once signed in', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, clone() { return this }, json: async () => ME })
  const { result } = renderHook(() => useVaultMe())
  await waitFor(() => expect(result.current.me).toEqual(ME))
  expect(global.fetch).toHaveBeenCalledWith('/api/rankings/me')
})

test('asks nothing signed out', () => {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'unauthenticated', data: null })
  const { result } = renderHook(() => useVaultMe())
  expect(global.fetch).not.toHaveBeenCalled()
  expect(result.current.isLoading).toBe(false)
})

test('a failure is an error; the switch shows at once and reads again', async () => {
  ;(global.fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: false, status: 500, clone() { return this } })
    .mockResolvedValue({ ok: true, clone() { return this }, json: async () => ({ ...ME, showInRankings: false }) })
  const { result } = renderHook(() => useVaultMe())
  await waitFor(() => expect(result.current.error).toBe(true))
  act(() => result.current.retry())
  await waitFor(() => expect(result.current.me?.points).toBe(1200))
  act(() => result.current.setShowInRankings(false))
  expect(result.current.me?.showInRankings).toBe(false)
})
