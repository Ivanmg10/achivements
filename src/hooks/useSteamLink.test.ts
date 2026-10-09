import { renderHook, act } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useSteamLink } from './useSteamLink'

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

test('links by what was typed, then refreshes the session from the DB', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue(json(200, { steamid: STEAM_ID, steamusername: 'Gabe' }))
  mockUpdate.mockResolvedValue({ user: { steamid: STEAM_ID } })
  const { result } = renderHook(() => useSteamLink())

  let ok = false
  await act(async () => {
    ok = await result.current.link('gabelogannewell')
  })

  expect(ok).toBe(true)
  expect(global.fetch).toHaveBeenCalledWith('/api/steam/link', expect.objectContaining({ method: 'POST', body: '{"query":"gabelogannewell"}' }))
  expect(mockUpdate).toHaveBeenCalledWith()
  expect(result.current.error).toBeNull()
})

test.each(['invalid-query', 'not-found', 'private', 'not-configured'] as const)('keeps the reason the server gave: %s', async (code) => {
  ;(global.fetch as jest.Mock).mockResolvedValue(json(400, { error: code }))
  const { result } = renderHook(() => useSteamLink())
  await act(async () => {
    expect(await result.current.link('x')).toBe(false)
  })
  expect(result.current.error).toBe(code)
  expect(mockUpdate).not.toHaveBeenCalled()
})

test('an unknown reason, a network error, or a session that did not take it is "failed"', async () => {
  const { result } = renderHook(() => useSteamLink())
  ;(global.fetch as jest.Mock).mockResolvedValueOnce(json(500, { error: 'weird' }))
  await act(async () => {
    await result.current.link('gabe')
  })
  expect(result.current.error).toBe('failed')

  ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('offline'))
  await act(async () => {
    await result.current.link('gabe')
  })
  expect(result.current.error).toBe('failed')

  ;(global.fetch as jest.Mock).mockResolvedValueOnce(json(200, { steamid: STEAM_ID }))
  mockUpdate.mockResolvedValueOnce(undefined)
  await act(async () => {
    expect(await result.current.link('gabe')).toBe(false)
  })
  expect(result.current.error).toBe('failed')
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
