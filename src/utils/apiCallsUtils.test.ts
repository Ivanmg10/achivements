jest.mock('@/lib/fetchWithRetry', () => ({
  fetchWithRetry: jest.fn(),
}))

import { getGamesInfo, getGamesInfoList, unlinkRaUser, getWantGames } from './apiCallsUtils'
import { fetchWithRetry } from '@/lib/fetchWithRetry'

global.fetch = jest.fn()

const mockSession = { user: { rausername: 'ivan', raid: 'key' } } as any

beforeEach(() => {
  ;(fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({}),
  })
})

test('getGamesInfo calls setGameData with fetched data', async () => {
  const setGameData = jest.fn()
  ;(fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ ID: 1, Title: 'Game' }),
  })
  await getGamesInfo('123', mockSession, setGameData)
  expect(setGameData).toHaveBeenCalledWith({ ID: 1, Title: 'Game' })
})

test('getGamesInfo does not throw on error response', async () => {
  const setGameData = jest.fn()
  ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: false })
  await expect(getGamesInfo('123', mockSession, setGameData)).resolves.not.toThrow()
  expect(setGameData).not.toHaveBeenCalled()
})

test('getGamesInfoList appends to state', async () => {
  const setGames = jest.fn()
  ;(fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ ID: 2, Title: 'Game2' }),
  })
  await getGamesInfoList('456', mockSession, setGames)
  expect(setGames).toHaveBeenCalled()
  const updater = (setGames as jest.Mock).mock.calls[0][0]
  expect(updater([{ ID: 1 }])).toEqual([{ ID: 1 }, { ID: 2, Title: 'Game2' }])
})

test('getGamesInfoList does not throw on error response', async () => {
  const setGames = jest.fn()
  ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: false })
  await expect(getGamesInfoList('456', mockSession, setGames)).resolves.not.toThrow()
  expect(setGames).not.toHaveBeenCalled()
})

test('unlinkRaUser calls fetch and update', async () => {
  const update = jest.fn().mockResolvedValue(null)
  ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: true })
  await unlinkRaUser(update)
  expect(fetch).toHaveBeenCalledWith('/api/updateRaUser', expect.objectContaining({ method: 'POST' }))
  expect(update).toHaveBeenCalledWith({ raUser: {} })
})

test('unlinkRaUser does not throw on error', async () => {
  const update = jest.fn()
  ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: false })
  await expect(unlinkRaUser(update)).resolves.not.toThrow()
})

test('getWantGames calls setWantGames with shuffled results', async () => {
  const mockResults = Array.from({ length: 10 }, (_, i) => ({ ID: i + 1 }))
  ;(fetchWithRetry as jest.Mock).mockResolvedValueOnce({ Results: mockResults })
  const setWantGames = jest.fn()
  const setError = jest.fn()
  await getWantGames(mockSession, setWantGames, setError)
  expect(setWantGames).toHaveBeenCalledWith(expect.any(Array))
  const called = (setWantGames as jest.Mock).mock.calls[0][0]
  expect(called.length).toBeLessThanOrEqual(7)
})

test('getWantGames calls setError on failure', async () => {
  ;(fetchWithRetry as jest.Mock).mockRejectedValueOnce(new Error('Network error'))
  const setWantGames = jest.fn()
  const setError = jest.fn()
  await getWantGames(mockSession, setWantGames, setError)
  expect(setError).toHaveBeenCalledWith('Network error')
})
