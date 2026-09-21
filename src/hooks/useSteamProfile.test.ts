import { renderHook, waitFor, act } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useSteamProfile } from './useSteamProfile'

const PROFILE = { steamid: '765', personaname: 'Ivan', avatarfull: 'a.jpg' }

function setSteamId(steamid: string | null) {
  ;(useSession as jest.Mock).mockReturnValue({
    data: { user: { id: '7', ...(steamid ? { steamid } : {}) } },
    status: 'authenticated',
    update: jest.fn(),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => { (console.error as jest.Mock).mockRestore() })

test('does not fetch without a linked account', () => {
  setSteamId(null)
  const { result } = renderHook(() => useSteamProfile())
  expect(fetch).not.toHaveBeenCalled()
  expect(result.current.profile).toBeNull()
})

test('loads the profile once for a linked account', async () => {
  setSteamId('765')
  ;(fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => PROFILE })
  const { result, rerender } = renderHook(() => useSteamProfile())

  await waitFor(() => expect(result.current.profile).toEqual(PROFILE))
  rerender()
  expect(fetch).toHaveBeenCalledTimes(1)
  expect(fetch).toHaveBeenCalledWith('/api/steam/profile')
})

test('surfaces an HTTP error', async () => {
  setSteamId('765')
  ;(fetch as jest.Mock).mockResolvedValue({ ok: false, status: 404 })
  const { result } = renderHook(() => useSteamProfile())

  await waitFor(() => expect(result.current.error).toMatch('404'))
  expect(result.current.isLoading).toBe(false)
})

test('surfaces a non-Error rejection generically', async () => {
  setSteamId('765')
  ;(fetch as jest.Mock).mockRejectedValue('weird')
  const { result } = renderHook(() => useSteamProfile())
  await waitFor(() => expect(result.current.error).toBe('Unknown error'))
})

test('retry loads again after a failure', async () => {
  setSteamId('765')
  ;(fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: false, status: 503 })
    .mockResolvedValueOnce({ ok: true, json: async () => PROFILE })
  const { result } = renderHook(() => useSteamProfile())
  await waitFor(() => expect(result.current.error).not.toBeNull())

  await act(async () => { await result.current.retry() })
  expect(result.current.profile).toEqual(PROFILE)
  expect(result.current.error).toBeNull()
})

test('clears the profile on unlink', async () => {
  setSteamId('765')
  ;(fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => PROFILE })
  const { result, rerender } = renderHook(() => useSteamProfile())
  await waitFor(() => expect(result.current.profile).toEqual(PROFILE))

  setSteamId(null)
  rerender()
  expect(result.current.profile).toBeNull()
})
