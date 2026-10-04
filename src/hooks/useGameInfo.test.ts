import { act, renderHook, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useGameInfo } from './useGameInfo'

const fetchMock = jest.fn()
const json = (body: unknown) => Promise.resolve({ ok: true, json: () => Promise.resolve(body) })
const fail = (status: number) => Promise.resolve({ ok: false, status, json: () => Promise.resolve({}) })

beforeEach(() => {
  fetchMock.mockReset()
  global.fetch = fetchMock as unknown as typeof fetch
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated' })
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

test('a main game: the game first, then its subsets, the game standing as its own main', async () => {
  fetchMock.mockImplementation((url: string) =>
    url.includes('getGameSubsets') ? json([{ ID: 9, Title: 'Zelda [Subset - Bonus]' }]) : json({ ID: 5, Title: 'Zelda', ConsoleID: 3, ImageIcon: '/i.png' }),
  )
  const { result } = renderHook(() => useGameInfo('5'))
  await waitFor(() => expect(result.current.game?.ID).toBe(5))
  await waitFor(() => expect(result.current.subsetsLoading).toBe(false))
  expect(result.current.parentId).toBe(5)
  expect(result.current.parentIcon).toBe('/i.png')
  expect(result.current.subsets).toHaveLength(1)
})

test('a subset: looks up its main game for the icon, and the subsets by the shared title', async () => {
  fetchMock.mockImplementation((url: string) => {
    if (url.includes('getGameSubsets')) return json([])
    if (url.includes('gameId=1')) return json({ ID: 1, Title: 'Zelda', ImageIcon: '/parent.png' })
    return json({ ID: 9, Title: 'Zelda [Subset - Bonus]', ParentGameID: 1, ConsoleID: 3 })
  })
  const { result } = renderHook(() => useGameInfo('9'))
  await waitFor(() => expect(result.current.game?.ID).toBe(9))
  await waitFor(() => expect(result.current.subsetsLoading).toBe(false))
  expect(result.current.parentId).toBe(1)
  expect(result.current.parentIcon).toBe('/parent.png')
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('baseTitle=Zelda'))
})

test('a failed game is an error; retry asks again', async () => {
  fetchMock.mockImplementationOnce(() => fail(503))
  const { result } = renderHook(() => useGameInfo('5'))
  await waitFor(() => expect(result.current.error).toBe('Error 503'))

  fetchMock.mockImplementation((url: string) => (url.includes('getGameSubsets') ? json([]) : json({ ID: 5, Title: 'Zelda' })))
  act(() => result.current.retry())
  await waitFor(() => expect(result.current.game?.ID).toBe(5))
  expect(result.current.error).toBeNull()
})

test('failed subsets only cost the tabs, never the page', async () => {
  fetchMock.mockImplementation((url: string) => (url.includes('getGameSubsets') ? fail(500) : json({ ID: 5, Title: 'Zelda' })))
  const { result } = renderHook(() => useGameInfo('5'))
  await waitFor(() => expect(result.current.game?.ID).toBe(5))
  await waitFor(() => expect(result.current.subsetsLoading).toBe(false))
  expect(result.current.subsets).toEqual([])
  expect(result.current.error).toBeNull()
})

test('asks nothing before the session is in', () => {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'loading' })
  renderHook(() => useGameInfo('5'))
  expect(fetchMock).not.toHaveBeenCalled()
})
