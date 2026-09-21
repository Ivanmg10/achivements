import { renderHook, waitFor, act } from '@testing-library/react'
import { useSteamGameDetails } from './useSteamGameDetails'
import { useLanguage } from '@/context/LanguageContext'
import { en } from '@/translations/en'

const DETAILS = { appId: 620, name: 'Portal 2', developers: ['Valve'], publishers: [], genres: [], releaseDate: null, description: null, screenshots: [] }

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  ;(console.error as jest.Mock).mockRestore()
  ;(useLanguage as jest.Mock).mockReturnValue({ lang: 'en', setLang: jest.fn(), T: en })
})

test('does nothing without a game', () => {
  const { result } = renderHook(() => useSteamGameDetails(null))
  expect(fetch).not.toHaveBeenCalled()
  expect(result.current).toMatchObject({ details: null, isLoading: false, error: null })
  expect(() => result.current.retry()).not.toThrow()
})

test('loads the details in the app language', async () => {
  ;(useLanguage as jest.Mock).mockReturnValue({ lang: 'es', setLang: jest.fn(), T: en })
  ;(fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200, json: async () => DETAILS })
  const { result } = renderHook(() => useSteamGameDetails(620))

  await waitFor(() => expect(result.current.details).toEqual(DETAILS))
  expect(fetch).toHaveBeenCalledWith('/api/steam/gameDetails?appid=620&lang=spanish')
  expect(result.current.isLoading).toBe(false)
})

test('treats 404 (no store entry) as no details, not an error', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: false, status: 404 })
  const { result } = renderHook(() => useSteamGameDetails(620))

  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(result.current.details).toBeNull()
  expect(result.current.error).toBeNull()
})

test('surfaces other failures', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: false, status: 503 })
  const { result } = renderHook(() => useSteamGameDetails(620))
  await waitFor(() => expect(result.current.error).toMatch('503'))
})

test('surfaces a non-Error rejection generically', async () => {
  ;(fetch as jest.Mock).mockRejectedValue('weird')
  const { result } = renderHook(() => useSteamGameDetails(620))
  await waitFor(() => expect(result.current.error).toBe('Unknown error'))
})

test('retry loads again', async () => {
  ;(fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: false, status: 503 })
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => DETAILS })
  const { result } = renderHook(() => useSteamGameDetails(620))
  await waitFor(() => expect(result.current.error).not.toBeNull())

  await act(async () => { await result.current.retry() })
  expect(result.current.details).toEqual(DETAILS)
  expect(result.current.error).toBeNull()
})

test('a slow answer for the previous game does not overwrite the current one', async () => {
  const releases: Record<string, (v: unknown) => void> = {}
  ;(fetch as jest.Mock).mockImplementation((url: string) =>
    new Promise((r) => { releases[new URL(url, 'http://x').searchParams.get('appid')!] = r }),
  )
  const { result, rerender } = renderHook(({ id }) => useSteamGameDetails(id), { initialProps: { id: 1 } })
  rerender({ id: 2 })

  await act(async () => { releases['2']({ ok: true, status: 200, json: async () => ({ ...DETAILS, appId: 2 }) }) })
  await act(async () => { releases['1']({ ok: true, status: 200, json: async () => ({ ...DETAILS, appId: 1 }) }) })

  expect(result.current.details?.appId).toBe(2)
})
