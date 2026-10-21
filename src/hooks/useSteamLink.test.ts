import { renderHook, act, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useSteamLink } from './useSteamLink'
import { notify } from '@/lib/notify'
import { en } from '@/translations/en'

jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))

const STEAM_ID = '76561198000000000'
const mockUpdate = jest.fn()

function setSession(user: Record<string, unknown>) {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user }, status: 'authenticated', update: mockUpdate })
}

const json = (status: number, body: unknown) => ({ ok: status < 400, status, json: async () => body })

beforeEach(() => {
  jest.clearAllMocks()
  setSession({ id: '7' })
  global.fetch = jest.fn()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('reads the link from the session', () => {
  setSession({ id: '7', steamid: STEAM_ID, steamusername: 'Gabe' })
  const { result } = renderHook(() => useSteamLink())
  expect(result.current).toMatchObject({ steamId: STEAM_ID, steamUsername: 'Gabe', isLinked: true })
})

test('links through Steam, coming back to this page', () => {
  ;(usePathname as jest.Mock).mockReturnValue('/user')
  const { result } = renderHook(() => useSteamLink())
  expect(result.current.linkHref).toBe('/api/auth/steam?intent=link&next=%2Fuser')
})

describe('back from Steam', () => {
  afterEach(() => window.history.replaceState(null, '', '/'))

  test('linked: the session is refreshed, it says so once, and the fragment goes', async () => {
    window.history.replaceState(null, '', '/user#steam-linked')
    mockUpdate.mockResolvedValue({ user: { steamid: STEAM_ID } })
    const { rerender } = renderHook(() => useSteamLink())
    rerender()

    await waitFor(() => expect(notify.success).toHaveBeenCalledWith(en.toast.steamLinked))
    expect(notify.success).toHaveBeenCalledTimes(1)
    expect(mockUpdate).toHaveBeenCalledWith()
    expect(window.location.hash).toBe('')
  })

  test.each([
    ['#steam-taken', en.toast.steamLinkTaken],
    ['#steam-failed', en.toast.steamLinkFailed],
  ])('%s says why', (hash, message) => {
    window.history.replaceState(null, '', '/user' + hash)
    renderHook(() => useSteamLink())
    expect(notify.error).toHaveBeenCalledWith(message)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  test('any other fragment is left alone', () => {
    window.history.replaceState(null, '', '/user#followers')
    renderHook(() => useSteamLink())
    expect(notify.error).not.toHaveBeenCalled()
    expect(window.location.hash).toBe('#followers')
  })
})

test('unlinks, and fails loudly when the server or the session does not follow', async () => {
  const { result } = renderHook(() => useSteamLink())
  ;(global.fetch as jest.Mock).mockResolvedValueOnce(json(200, {}))
  mockUpdate.mockResolvedValueOnce({ user: {} })
  await act(async () => {
    expect(await result.current.unlink()).toBe(true)
  })
  expect(global.fetch).toHaveBeenLastCalledWith('/api/steam/unlink', { method: 'POST' })

  ;(global.fetch as jest.Mock).mockResolvedValueOnce(json(500, {}))
  await act(async () => {
    expect(await result.current.unlink()).toBe(false)
  })

  ;(global.fetch as jest.Mock).mockResolvedValueOnce(json(200, {}))
  mockUpdate.mockResolvedValueOnce({ user: { steamid: STEAM_ID } })
  await act(async () => {
    expect(await result.current.unlink()).toBe(false)
  })
  expect(result.current.isUnlinking).toBe(false)
})
