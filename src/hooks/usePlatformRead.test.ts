import { renderHook, waitFor, act } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { usePlatformRead } from './usePlatformRead'
import { useXboxAchievements } from './useXboxAchievements'
import { useXboxSummary } from './useXboxSummary'
import { usePsnTrophies } from './usePsnTrophies'
import { usePsnSummary } from './usePsnSummary'
import { useSteamProfile } from './useSteamProfile'

const SPEC = { tag: 'test', errorFrom: async (res: Response) => `http ${res.status}` }
const answer = (body: unknown, ok = true, status = ok ? 200 : 500) => ({ ok, status, json: async () => body, clone() { return this } })

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn().mockResolvedValue(answer({ n: 1 }))
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => jest.restoreAllMocks())

describe('usePlatformRead', () => {
  test('asks once per url, however often the component renders, and is loading until the answer', async () => {
    const { result, rerender } = renderHook(() => usePlatformRead<{ n: number }, string>('/api/x?id=1', SPEC))
    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.data).toEqual({ n: 1 }))
    rerender()
    rerender()
    expect(result.current.isLoading).toBe(false)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  test('asks for nothing without a url, and forgets the answer when the url goes away', async () => {
    const { result, rerender } = renderHook(({ url }) => usePlatformRead<{ n: number }, string>(url, SPEC), { initialProps: { url: '/api/x' as string | null } })
    await waitFor(() => expect(result.current.data).not.toBeNull())
    rerender({ url: null })
    expect(result.current).toMatchObject({ data: null, error: null, isLoading: false })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  test('another url starts over, and an answer that arrives late for the old one is dropped', async () => {
    let first!: (v: unknown) => void
    ;(fetch as jest.Mock).mockImplementationOnce(() => new Promise((r) => (first = r))).mockResolvedValueOnce(answer({ n: 2 }))
    const { result, rerender } = renderHook(({ url }) => usePlatformRead<{ n: number }, string>(url, SPEC), { initialProps: { url: '/api/x?id=1' } })
    rerender({ url: '/api/x?id=2' })
    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.data).toEqual({ n: 2 }))
    await act(async () => first(answer({ n: 1 })))
    expect(result.current.data).toEqual({ n: 2 })
  })

  test('says why it failed: the platform\'s reading of a refusal, or "failed" for the network and a body it did not expect', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce(answer({}, false, 429))
    const refused = renderHook(() => usePlatformRead('/api/a', SPEC))
    await waitFor(() => expect(refused.result.current.error).toBe('http 429'))

    ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('offline'))
    const offline = renderHook(() => usePlatformRead<string, string>('/api/b', { ...SPEC, failure: () => 'failed' }))
    await waitFor(() => expect(offline.result.current.error).toBe('failed'))

    const odd = renderHook(() => usePlatformRead<string, string>('/api/c', { ...SPEC, parse: () => { throw new Error('shape') }, failure: () => 'failed' }))
    await waitFor(() => expect(odd.result.current.error).toBe('failed'))
    expect(odd.result.current.data).toBeNull()
  })

  test('retry asks again, once, and goes back to loading', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce(answer({}, false)).mockResolvedValueOnce(answer({ n: 3 }))
    const { result } = renderHook(() => usePlatformRead<{ n: number }, string>('/api/x', SPEC))
    await waitFor(() => expect(result.current.error).not.toBeNull())
    act(() => result.current.retry())
    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.data).toEqual({ n: 3 }))
    expect(result.current.error).toBeNull()
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  test('two readers of the same url share one request while it is in flight', async () => {
    const a = renderHook(() => usePlatformRead<{ n: number }, string>('/api/shared', SPEC))
    const b = renderHook(() => usePlatformRead<{ n: number }, string>('/api/shared', SPEC))
    await waitFor(() => expect(a.result.current.data).not.toBeNull())
    await waitFor(() => expect(b.result.current.data).not.toBeNull())
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})

/** The platforms' reads keep the number of calls they made before the shared hook (Xbox has 150 an hour for the app). */
describe('the platform reads ask once', () => {
  const signedIn = (user: Record<string, unknown>) => (useSession as jest.Mock).mockReturnValue({ data: { user }, status: 'authenticated', update: jest.fn() })

  test.each([
    ['Xbox achievements', () => useXboxAchievements('1738914043'), '/api/xbox/achievements?id=1738914043&lang=en', { achievements: [] }, {}],
    ['PSN trophies', () => usePsnTrophies('NPWR1_00'), '/api/psn/trophies?id=NPWR1_00&lang=en', { trophies: [] }, {}],
    ['Steam profile', () => useSteamProfile(), '/api/steam/profile', { steamid: '1' }, { steamid: '1' }],
    ['PSN summary', () => usePsnSummary(), '/api/psn/summary', { onlineId: 'x' }, { psnaccountid: '9' }],
  ])('%s', async (_, hook, url, body, user) => {
    signedIn({ id: '7', ...user })
    ;(fetch as jest.Mock).mockImplementation((u: string) => Promise.resolve(answer(u.includes('/titles') ? [] : body)))
    const { rerender } = renderHook(hook as () => unknown)
    await waitFor(() => expect((fetch as jest.Mock).mock.calls.some(([u]) => u === url)).toBe(true))
    rerender()
    rerender()
    expect((fetch as jest.Mock).mock.calls.filter(([u]) => u === url)).toHaveLength(1)
  })

  test('Xbox summary: one call, and none for someone who may not use Xbox', async () => {
    signedIn({ id: '7', admin: true, xboxxuid: '1' })
    ;(fetch as jest.Mock).mockImplementation((u: string) => Promise.resolve(answer(u.includes('/titles') ? [] : { gamertag: 'g' })))
    const { rerender } = renderHook(() => useXboxSummary())
    await waitFor(() => expect((fetch as jest.Mock).mock.calls.some(([u]) => u === '/api/xbox/summary')).toBe(true))
    rerender()
    expect((fetch as jest.Mock).mock.calls.filter(([u]) => u === '/api/xbox/summary')).toHaveLength(1)

    jest.clearAllMocks()
    signedIn({ id: '7', xboxxuid: '1' })
    renderHook(() => useXboxSummary())
    expect(fetch).not.toHaveBeenCalled()
  })
})
