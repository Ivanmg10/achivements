import { renderHook, act } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { usePsnLink } from './usePsnLink'

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
  setSession({ id: '7', psnaccountid: '42', psnusername: 'Hakoom' })
  const { result } = renderHook(() => usePsnLink())
  expect(result.current).toMatchObject({ accountId: '42', username: 'Hakoom', isLinked: true })
})

test('links, then refreshes the session from the DB', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue(json(200, { psnaccountid: '42', psnusername: 'Hakoom' }))
  mockUpdate.mockResolvedValue({ user: { psnaccountid: '42' } })
  const { result } = renderHook(() => usePsnLink())

  let ok = false
  await act(async () => {
    ok = await result.current.link('Hakoom')
  })

  expect(ok).toBe(true)
  expect(global.fetch).toHaveBeenCalledWith('/api/psn/link', expect.objectContaining({ method: 'POST', body: '{"username":"Hakoom"}' }))
  expect(mockUpdate).toHaveBeenCalledWith()
  expect(result.current.error).toBeNull()
})

test('keeps the reason the server gave', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue(json(403, { error: 'private' }))
  const { result } = renderHook(() => usePsnLink())
  await act(async () => {
    expect(await result.current.link('Hakoom')).toBe(false)
  })
  expect(result.current.error).toBe('private')
  expect(mockUpdate).not.toHaveBeenCalled()
})

test('an unknown reason or a network error is "failed"', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValueOnce(json(500, { error: 'weird' }))
  const { result } = renderHook(() => usePsnLink())
  await act(async () => {
    await result.current.link('Hakoom')
  })
  expect(result.current.error).toBe('failed')

  ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('offline'))
  await act(async () => {
    await result.current.link('Hakoom')
  })
  expect(result.current.error).toBe('failed')
})

test('fails when the session did not take the link', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue(json(200, { psnaccountid: '42' }))
  mockUpdate.mockResolvedValue(undefined)
  const { result } = renderHook(() => usePsnLink())
  await act(async () => {
    expect(await result.current.link('Hakoom')).toBe(false)
  })
  expect(result.current.error).toBe('failed')
})

test('unlinks and reports whether it worked', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue(json(200, { ok: true }))
  mockUpdate.mockResolvedValue({ user: {} })
  const { result } = renderHook(() => usePsnLink())
  await act(async () => {
    expect(await result.current.unlink()).toBe(true)
  })
  expect(global.fetch).toHaveBeenCalledWith('/api/psn/unlink', { method: 'POST' })

  ;(global.fetch as jest.Mock).mockResolvedValue(json(500, {}))
  await act(async () => {
    expect(await result.current.unlink()).toBe(false)
  })
})
