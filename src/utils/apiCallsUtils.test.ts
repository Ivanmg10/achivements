import { addGamesToGroup, fetchRaCandidateById, unlinkRaUser } from './apiCallsUtils'

global.fetch = jest.fn()

beforeEach(() => {
  ;(fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({}),
  })
})

test('unlinkRaUser calls fetch and update', async () => {
  const update = jest.fn().mockResolvedValue(null)
  ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: true })
  await expect(unlinkRaUser(update)).resolves.toBe(true)
  expect(fetch).toHaveBeenCalledWith('/api/unlinkRaUser', expect.objectContaining({ method: 'POST' }))
  expect(update).toHaveBeenCalledWith()
})

test('unlinkRaUser does not throw on error, and says it failed', async () => {
  const update = jest.fn()
  ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: false })
  await expect(unlinkRaUser(update)).resolves.toBe(false)
  expect(update).not.toHaveBeenCalled()
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
