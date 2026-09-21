import { renderHook, act, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useSteamLink, STEAM_LINK_URL } from './useSteamLink'

const STEAM_ID = '76561198000000000'

const mockUpdate = jest.fn()
const mockReplace = jest.fn()

function setSession(user: Record<string, unknown> | null) {
  ;(useSession as jest.Mock).mockReturnValue({
    data: user ? { user } : null,
    status: user ? 'authenticated' : 'unauthenticated',
    update: mockUpdate,
  })
}

function setParams(params: Record<string, string> = {}) {
  ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(params))
}

beforeEach(() => {
  jest.clearAllMocks()
  // Like next-auth: resolves to the session after the jwt callback merged the data.
  mockUpdate.mockImplementation(async (data: Record<string, unknown>) => ({ user: { id: '7', ...data } }))
  ;(useRouter as jest.Mock).mockReturnValue({ replace: mockReplace, push: jest.fn(), prefetch: jest.fn() })
  ;(usePathname as jest.Mock).mockReturnValue('/user')
  setSession({ id: '7' })
  setParams()
  global.fetch = jest.fn()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  ;(console.error as jest.Mock).mockRestore()
})

describe('reading the link from the session', () => {
  test('reports an unlinked account', () => {
    const { result } = renderHook(() => useSteamLink())
    expect(result.current.isLinked).toBe(false)
    expect(result.current.steamId).toBeNull()
    expect(result.current.steamUsername).toBeNull()
    expect(result.current.status).toBeNull()
  })

  test('reports a linked account', () => {
    setSession({ id: '7', steamid: STEAM_ID, steamusername: 'Ivan' })
    const { result } = renderHook(() => useSteamLink())
    expect(result.current.isLinked).toBe(true)
    expect(result.current.steamId).toBe(STEAM_ID)
    expect(result.current.steamUsername).toBe('Ivan')
  })
})

describe('handling the callback redirect', () => {
  test('on success, pulls the stored link into the session and clears the param', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ steamid: STEAM_ID, steamusername: 'Ivan' }),
    })
    setParams({ steam: 'linked' })

    const { result } = renderHook(() => useSteamLink())

    await waitFor(() => expect(mockUpdate).toHaveBeenCalled())
    expect(fetch).toHaveBeenCalledWith('/api/steam/account')
    expect(mockUpdate).toHaveBeenCalledWith({ steamid: STEAM_ID, steamusername: 'Ivan' })
    expect(mockReplace).toHaveBeenCalledWith('/user')
    expect(result.current.status).toBe('linked')
  })

  test('falls back to failed when reading the account back errors', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500 })
    setParams({ steam: 'linked' })

    const { result } = renderHook(() => useSteamLink())

    await waitFor(() => expect(result.current.status).toBe('failed'))
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  test('falls back to failed when the account fetch rejects', async () => {
    ;(fetch as jest.Mock).mockRejectedValue(new Error('offline'))
    setParams({ steam: 'linked' })

    const { result } = renderHook(() => useSteamLink())
    await waitFor(() => expect(result.current.status).toBe('failed'))
  })

  test.each([
    ['already_linked', 'alreadyLinked'],
    ['cancelled', 'cancelled'],
    ['invalid_state', 'failed'],
    ['invalid_assertion', 'failed'],
    ['invalid_identity', 'failed'],
    ['unauthorized', 'failed'],
    ['error', 'failed'],
    ['something_new', 'failed'],
  ])('maps ?steam=%s to %s without touching the session', async (param, expected) => {
    setParams({ steam: param })
    const { result } = renderHook(() => useSteamLink())

    expect(result.current.status).toBe(expected)
    expect(fetch).not.toHaveBeenCalled()
    expect(mockUpdate).not.toHaveBeenCalled()
    expect(mockReplace).toHaveBeenCalledWith('/user')
  })

  test('does nothing when there is no steam param', () => {
    const { result } = renderHook(() => useSteamLink())
    expect(result.current.status).toBeNull()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  test('handles the param once, not again on re-render', async () => {
    setParams({ steam: 'cancelled' })
    const { rerender } = renderHook(() => useSteamLink())
    rerender()
    rerender()
    expect(mockReplace).toHaveBeenCalledTimes(1)
  })
})

describe('disconnect', () => {
  test('unlinks and clears the session fields', async () => {
    setSession({ id: '7', steamid: STEAM_ID, steamusername: 'Ivan' })
    ;(fetch as jest.Mock).mockResolvedValue({ ok: true })

    const { result } = renderHook(() => useSteamLink())
    await act(async () => { await result.current.disconnect() })

    expect(fetch).toHaveBeenCalledWith('/api/steam/unlink', { method: 'POST' })
    expect(mockUpdate).toHaveBeenCalledWith({ steamid: null, steamusername: null })
    expect(result.current.isUnlinking).toBe(false)
  })

  test('surfaces a failure and stops unlinking', async () => {
    setSession({ id: '7', steamid: STEAM_ID })
    ;(fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500 })

    const { result } = renderHook(() => useSteamLink())
    await act(async () => { await result.current.disconnect() })

    expect(result.current.status).toBe('failed')
    expect(mockUpdate).not.toHaveBeenCalled()
    expect(result.current.isUnlinking).toBe(false)
  })

  test('surfaces a network failure', async () => {
    setSession({ id: '7', steamid: STEAM_ID })
    ;(fetch as jest.Mock).mockRejectedValue(new Error('offline'))

    const { result } = renderHook(() => useSteamLink())
    await act(async () => { await result.current.disconnect() })

    expect(result.current.status).toBe('failed')
  })
})

test('dismiss clears the status message', async () => {
  setParams({ steam: 'cancelled' })
  const { result } = renderHook(() => useSteamLink())
  expect(result.current.status).toBe('cancelled')

  act(() => result.current.dismiss())
  expect(result.current.status).toBeNull()
})

test('exposes the link route for the Connect control to point at', () => {
  expect(STEAM_LINK_URL).toBe('/api/steam/link')
})

describe('regression: link saved in the DB but never reaching the session', () => {
  function linkedAccount() {
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ steamid: STEAM_ID, steamusername: 'Ivan' }),
    })
  }

  test('waits for the session to finish loading before updating it', async () => {
    // Right after the redirect back from Steam the session is still loading,
    // and next-auth's update() silently does nothing in that state.
    linkedAccount()
    setParams({ steam: 'linked' })
    ;(useSession as jest.Mock).mockReturnValue({ data: null, status: 'loading', update: mockUpdate })

    const { result, rerender } = renderHook(() => useSteamLink())
    expect(fetch).not.toHaveBeenCalled()
    expect(mockUpdate).not.toHaveBeenCalled()
    // Not claimed as linked yet, and the param is kept until it is processed.
    expect(result.current.status).toBeNull()
    expect(mockReplace).not.toHaveBeenCalled()

    setSession({ id: '7' })
    rerender()

    await waitFor(() => expect(result.current.status).toBe('linked'))
    expect(mockUpdate).toHaveBeenCalledWith({ steamid: STEAM_ID, steamusername: 'Ivan' })
    expect(mockReplace).toHaveBeenCalledWith('/user')
  })

  test('does not claim success when update() skipped without throwing', async () => {
    linkedAccount()
    setParams({ steam: 'linked' })
    mockUpdate.mockResolvedValue(undefined)

    const { result } = renderHook(() => useSteamLink())
    await waitFor(() => expect(result.current.status).toBe('failed'))
  })

  test('does not claim success when the session came back without the link', async () => {
    linkedAccount()
    setParams({ steam: 'linked' })
    mockUpdate.mockResolvedValue({ user: { id: '7' } })

    const { result } = renderHook(() => useSteamLink())
    await waitFor(() => expect(result.current.status).toBe('failed'))
  })

  test('fails when the account read back has no Steam link stored', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ steamid: null, steamusername: null }) })
    setParams({ steam: 'linked' })

    const { result } = renderHook(() => useSteamLink())
    await waitFor(() => expect(result.current.status).toBe('failed'))
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  test('shows non-success outcomes without waiting for the session', () => {
    setParams({ steam: 'cancelled' })
    ;(useSession as jest.Mock).mockReturnValue({ data: null, status: 'loading', update: mockUpdate })

    const { result } = renderHook(() => useSteamLink())
    expect(result.current.status).toBe('cancelled')
  })

  test('disconnect fails loudly if the session still holds the link', async () => {
    setSession({ id: '7', steamid: STEAM_ID })
    ;(fetch as jest.Mock).mockResolvedValue({ ok: true })
    mockUpdate.mockResolvedValue({ user: { id: '7', steamid: STEAM_ID } })

    const { result } = renderHook(() => useSteamLink())
    await act(async () => { await result.current.disconnect() })
    expect(result.current.status).toBe('failed')
  })

  test('disconnect fails loudly if update() skipped', async () => {
    setSession({ id: '7', steamid: STEAM_ID })
    ;(fetch as jest.Mock).mockResolvedValue({ ok: true })
    mockUpdate.mockResolvedValue(undefined)

    const { result } = renderHook(() => useSteamLink())
    await act(async () => { await result.current.disconnect() })
    expect(result.current.status).toBe('failed')
  })
})
