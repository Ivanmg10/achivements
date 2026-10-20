import { renderHook, act } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useXboxLink, xboxErrorFrom } from './useXboxLink'

const mockUpdate = jest.fn()

function setSession(user: Record<string, unknown>) {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user }, status: 'authenticated', update: mockUpdate })
}

const json = (status: number, body: unknown) => ({ ok: status < 400, status, json: async () => body })

beforeEach(() => {
  jest.clearAllMocks()
  setSession({ id: '7', admin: true })
  global.fetch = jest.fn()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('reads the link from the session', () => {
  setSession({ id: '7', admin: true, xboxxuid: '25354', xboxgamertag: 'TestPlayer' })
  const { result } = renderHook(() => useXboxLink())
  expect(result.current).toMatchObject({ enabled: true, xuid: '25354', gamertag: 'TestPlayer', isLinked: true })
})

test('for a non-admin it is never linked, whatever the session holds', () => {
  setSession({ id: '7', xboxxuid: '25354', xboxgamertag: 'TestPlayer' })
  const { result } = renderHook(() => useXboxLink())
  expect(result.current).toMatchObject({ enabled: false, xuid: null, gamertag: null, isLinked: false })
})

test('links, then refreshes the session from the DB', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue(json(200, { xboxxuid: '25354', xboxgamertag: 'TestPlayer' }))
  mockUpdate.mockResolvedValue({ user: { xboxxuid: '25354' } })
  const { result } = renderHook(() => useXboxLink())

  let ok = false
  await act(async () => {
    ok = await result.current.link('TestPlayer')
  })

  expect(ok).toBe(true)
  expect(global.fetch).toHaveBeenCalledWith('/api/xbox/link', expect.objectContaining({ method: 'POST', body: '{"gamertag":"TestPlayer"}' }))
  expect(mockUpdate).toHaveBeenCalledWith()
  expect(result.current.error).toBeNull()
  expect(result.current.isLinking).toBe(false)
})

test('keeps the reason the server gave, and does not touch the session', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue(json(403, { error: 'private' }))
  const { result } = renderHook(() => useXboxLink())
  await act(async () => {
    expect(await result.current.link('TestPlayer')).toBe(false)
  })
  expect(result.current.error).toBe('private')
  expect(mockUpdate).not.toHaveBeenCalled()
})

test('an unknown reason, or a network error, is "failed"', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValueOnce(json(500, { error: 'weird' }))
  const { result } = renderHook(() => useXboxLink())
  await act(async () => {
    await result.current.link('TestPlayer')
  })
  expect(result.current.error).toBe('failed')

  ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('offline'))
  await act(async () => {
    await result.current.link('TestPlayer')
  })
  expect(result.current.error).toBe('failed')
})

test('fails when the session did not take the link', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue(json(200, { xboxxuid: '25354' }))
  mockUpdate.mockResolvedValue(undefined)
  const { result } = renderHook(() => useXboxLink())
  await act(async () => {
    expect(await result.current.link('TestPlayer')).toBe(false)
  })
  expect(result.current.error).toBe('failed')
})

test('unlinks and reports whether it worked', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue(json(200, { ok: true }))
  mockUpdate.mockResolvedValue({ user: {} })
  const { result } = renderHook(() => useXboxLink())
  await act(async () => {
    expect(await result.current.unlink()).toBe(true)
  })
  expect(global.fetch).toHaveBeenCalledWith('/api/xbox/unlink', { method: 'POST' })

  ;(global.fetch as jest.Mock).mockResolvedValue(json(500, {}))
  await act(async () => {
    expect(await result.current.unlink()).toBe(false)
  })
  expect(result.current.isUnlinking).toBe(false)
})

test('an unlink the session still shows linked is a failure', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue(json(200, { ok: true }))
  mockUpdate.mockResolvedValue({ user: { xboxxuid: '25354' } })
  const { result } = renderHook(() => useXboxLink())
  await act(async () => {
    expect(await result.current.unlink()).toBe(false)
  })
})

test('xboxErrorFrom reads the code, and anything else is "failed"', async () => {
  expect(await xboxErrorFrom(json(404, { error: 'not-found' }) as unknown as Response)).toBe('not-found')
  expect(await xboxErrorFrom(json(429, { error: 'rate-limited' }) as unknown as Response)).toBe('rate-limited')
  expect(await xboxErrorFrom(json(500, { error: 'nope' }) as unknown as Response)).toBe('failed')
  expect(await xboxErrorFrom({ json: async () => { throw new Error('html') } } as unknown as Response)).toBe('failed')
})
