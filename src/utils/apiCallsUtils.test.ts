jest.mock('@/lib/fetchWithRetry', () => ({
  fetchWithRetry: jest.fn(),
}))

import { addGamesToGroup, fetchRaCandidateById, getGamesInfo, getGamesInfoList, unlinkRaUser, getWantGames } from './apiCallsUtils'
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
  expect(fetch).toHaveBeenCalledWith('/api/unlinkRaUser', expect.objectContaining({ method: 'POST' }))
  expect(update).toHaveBeenCalledWith({ raUser: null })
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

describe('fetchRaCandidateById', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    ;(console.error as jest.Mock).mockRestore()
  })

  test('returns the game as an RA picker candidate', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ Title: 'Metroid', ConsoleName: 'NES', ImageIcon: '/m.png', NumAchievements: 30 }),
    }) as unknown as typeof fetch
    await expect(fetchRaCandidateById(123)).resolves.toEqual({
      key: 'ra:123', source: 'ra', id: 123, title: 'Metroid', subtitle: 'NES', imageRef: '/m.png',
      pctWon: 0, numAwarded: 0, maxPossible: 30, status: null,
    })
    expect(global.fetch).toHaveBeenCalledWith('/api/getGameData?gameId=123')
  })

  test('fills blanks when RA leaves fields out', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ Title: 'Bare' }) }) as unknown as typeof fetch
    await expect(fetchRaCandidateById(1)).resolves.toMatchObject({ subtitle: '', imageRef: '', maxPossible: 0 })
  })

  test('returns null when RA has no such game', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) }) as unknown as typeof fetch
    await expect(fetchRaCandidateById(1)).resolves.toBeNull()
  })

  test('returns null on a failed lookup', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch
    await expect(fetchRaCandidateById(1)).resolves.toBeNull()
    global.fetch = jest.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch
    await expect(fetchRaCandidateById(1)).resolves.toBeNull()
  })
})

describe('addGamesToGroup', () => {
  const steam = {
    key: 'steam:620', source: 'steam' as const, id: 620, title: 'Portal 2', subtitle: 'Steam', imageRef: '',
    pctWon: 0.5, numAwarded: 1, maxPossible: 2, status: null,
  }
  const ra = { ...steam, key: 'ra:620', source: 'ra' as const, title: 'Zelda', subtitle: 'SNES' }

  test('posts each game with its platform and reports the ones that failed', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    global.fetch = jest.fn((_url: string, init: { body: string }) =>
      Promise.resolve({ ok: JSON.parse(init.body).source === 'ra', status: 500 }),
    ) as unknown as typeof fetch

    const failed = await addGamesToGroup(7, [ra, steam])

    expect(failed).toEqual([steam])
    const bodies = (global.fetch as jest.Mock).mock.calls.map(([url, init]) => [url, JSON.parse(init.body).source])
    expect(bodies).toEqual([['/api/groups/7/games', 'ra'], ['/api/groups/7/games', 'steam']])
  })

  test('a network error counts as a failure', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    global.fetch = jest.fn().mockRejectedValue(new Error('offline'))
    await expect(addGamesToGroup(7, [ra])).resolves.toEqual([ra])
  })
})
