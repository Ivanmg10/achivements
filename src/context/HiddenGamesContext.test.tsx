import { act, renderHook, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { HiddenGamesProvider, useHiddenGames } from './HiddenGamesContext'
import { notify } from '@/lib/notify'
import { en } from '@/translations/en'

jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))

const fetchMock = jest.fn()
const wrapper = ({ children }: { children: React.ReactNode }) => <HiddenGamesProvider>{children}</HiddenGamesProvider>
const ok = (body: unknown = { ok: true }) => Promise.resolve({ ok: true, json: () => Promise.resolve(body) })

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = fetchMock as unknown as typeof fetch
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated' })
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

test('loads the hidden games and answers isHidden per platform', async () => {
  fetchMock.mockReturnValueOnce(ok([{ source: 'ra', game_id: 5, title: 'Zelda', image: null }]))
  const { result } = renderHook(() => useHiddenGames(), { wrapper })
  await waitFor(() => expect(result.current.hidden).toHaveLength(1))
  expect(result.current.isHidden(5, 'ra')).toBe(true)
  expect(result.current.isHidden(5, 'steam')).toBe(false)
})

test('hiding shows at once, saves, and says so', async () => {
  fetchMock.mockReturnValueOnce(ok([])).mockReturnValueOnce(ok())
  const { result } = renderHook(() => useHiddenGames(), { wrapper })
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  await act(() => result.current.hideGame({ source: 'steam', id: 620, title: 'Portal 2', image: null }))
  expect(result.current.isHidden(620, 'steam')).toBe(true)
  expect(fetchMock).toHaveBeenLastCalledWith('/api/hiddenGames', expect.objectContaining({ method: 'POST' }))
  expect(notify.success).toHaveBeenCalledWith(en.toast.gameHidden)
})

test('a refused hide rolls back and says so', async () => {
  fetchMock.mockReturnValueOnce(ok([])).mockReturnValueOnce(Promise.resolve({ ok: false, status: 500 }))
  const { result } = renderHook(() => useHiddenGames(), { wrapper })
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  await act(() => result.current.hideGame({ source: 'ra', id: 5, title: 'Zelda', image: null }))
  expect(result.current.isHidden(5, 'ra')).toBe(false)
  expect(notify.error).toHaveBeenCalledWith(en.toast.gameHideFailed)
})

test('showing again removes it; a refusal puts it back and says so', async () => {
  fetchMock.mockReturnValueOnce(ok([{ source: 'ra', game_id: 5, title: 'Zelda', image: null }]))
  const { result } = renderHook(() => useHiddenGames(), { wrapper })
  await waitFor(() => expect(result.current.hidden).toHaveLength(1))

  fetchMock.mockReturnValueOnce(Promise.resolve({ ok: false, status: 500 }))
  await act(() => result.current.showGame(5, 'ra'))
  expect(result.current.isHidden(5, 'ra')).toBe(true)
  expect(notify.error).toHaveBeenCalledWith(en.toast.gameShowFailed)

  fetchMock.mockReturnValueOnce(ok())
  await act(() => result.current.showGame(5, 'ra'))
  expect(result.current.isHidden(5, 'ra')).toBe(false)
  expect(fetchMock).toHaveBeenLastCalledWith('/api/hiddenGames?source=ra&gameId=5', { method: 'DELETE' })
  expect(notify.success).toHaveBeenCalledWith(en.toast.gameShown)
})

test('if the list cannot be read, every game stays visible', async () => {
  fetchMock.mockReturnValueOnce(Promise.resolve({ ok: false, status: 500 }))
  const { result } = renderHook(() => useHiddenGames(), { wrapper })
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(result.current.hidden).toEqual([])
  expect(console.error).toHaveBeenCalled()
})
