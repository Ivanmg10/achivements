import { renderHook, waitFor, act } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useSteamRecentAchievements } from './useSteamRecentAchievements'
import { useLanguage } from '@/context/LanguageContext'
import { en } from '@/translations/en'

const LIST = [{ appId: 1, apiname: 'A', title: 'A', gameTitle: 'G', badgeUrl: '', unlockedAt: '2024-01-01T00:00:00.000Z' }]

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

afterEach(() => {
  ;(console.error as jest.Mock).mockRestore()
  ;(useLanguage as jest.Mock).mockReturnValue({ lang: 'en', setLang: jest.fn(), T: en })
})

test('does nothing without Steam linked', () => {
  setSteamId(null)
  const { result } = renderHook(() => useSteamRecentAchievements())
  expect(fetch).not.toHaveBeenCalled()
  expect(result.current).toMatchObject({ achievements: [], isLoading: false, error: null })
  expect(() => result.current.retry()).not.toThrow()
})

test('loads the recent unlocks in the app language, straight from the server', async () => {
  setSteamId('765')
  ;(useLanguage as jest.Mock).mockReturnValue({ lang: 'es', setLang: jest.fn(), T: en })
  ;(fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => LIST })
  const { result } = renderHook(() => useSteamRecentAchievements())

  await waitFor(() => expect(result.current.achievements).toEqual(LIST))
  expect(fetch).toHaveBeenCalledWith('/api/steam/recentAchievements?lang=spanish', { cache: 'no-store' })
  expect(result.current.isLoading).toBe(false)
})

test('surfaces an HTTP error', async () => {
  setSteamId('765')
  ;(fetch as jest.Mock).mockResolvedValue({ ok: false, status: 503 })
  const { result } = renderHook(() => useSteamRecentAchievements())
  await waitFor(() => expect(result.current.error).toMatch('503'))
})

test('rejects a non-array payload', async () => {
  setSteamId('765')
  ;(fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) })
  const { result } = renderHook(() => useSteamRecentAchievements())
  await waitFor(() => expect(result.current.error).toBe('Unexpected recent achievements response'))
})

test('reports a non-Error rejection generically', async () => {
  setSteamId('765')
  ;(fetch as jest.Mock).mockRejectedValue('weird')
  const { result } = renderHook(() => useSteamRecentAchievements())
  await waitFor(() => expect(result.current.error).toBe('Unknown error'))
})

test('retry loads again', async () => {
  setSteamId('765')
  ;(fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: false, status: 503 })
    .mockResolvedValueOnce({ ok: true, json: async () => LIST })
  const { result } = renderHook(() => useSteamRecentAchievements())
  await waitFor(() => expect(result.current.error).not.toBeNull())

  await act(async () => { await result.current.retry() })
  expect(result.current.achievements).toEqual(LIST)
  expect(result.current.error).toBeNull()
})

test('clears the list on unlink', async () => {
  setSteamId('765')
  ;(fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => LIST })
  const { result, rerender } = renderHook(() => useSteamRecentAchievements())
  await waitFor(() => expect(result.current.achievements).toEqual(LIST))

  setSteamId(null)
  rerender()
  expect(result.current.achievements).toEqual([])
})

test('a slow answer for the previous language does not land on top', async () => {
  setSteamId('765')
  const releases: Record<string, (v: unknown) => void> = {}
  ;(fetch as jest.Mock).mockImplementation((url: string) =>
    new Promise((r) => { releases[new URL(url, 'http://x').searchParams.get('lang')!] = r }),
  )
  const { result, rerender } = renderHook(() => useSteamRecentAchievements())

  ;(useLanguage as jest.Mock).mockReturnValue({ lang: 'es', setLang: jest.fn(), T: en })
  rerender()

  await act(async () => { releases.spanish({ ok: true, json: async () => [{ ...LIST[0], title: 'ES' }] }) })
  await act(async () => { releases.english({ ok: true, json: async () => [{ ...LIST[0], title: 'EN' }] }) })
  expect(result.current.achievements[0].title).toBe('ES')
})

describe('scope', () => {
  test('activity loads the 60-day window', async () => {
    setSteamId('765')
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => LIST })
    const { result } = renderHook(() => useSteamRecentAchievements('activity'))
    await waitFor(() => expect(result.current.achievements).toEqual(LIST))
    expect(fetch).toHaveBeenCalledWith('/api/steam/activity?lang=english', { cache: 'no-store' })
  })

  test('null loads nothing, even with Steam linked', () => {
    setSteamId('765')
    const { result } = renderHook(() => useSteamRecentAchievements(null))
    expect(fetch).not.toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
    act(() => result.current.retry())
    expect(fetch).not.toHaveBeenCalled()
  })
})
