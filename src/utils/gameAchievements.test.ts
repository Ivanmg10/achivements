import { fetchGameAchievements, raAchievementList, readJson } from './gameAchievements'

const answer = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body, clone() { return this } })

beforeEach(() => {
  global.fetch = jest.fn()
})

test('raAchievementList: the achievements of an RA answer, none without one', () => {
  const a = { ID: 1, Title: 'A' }
  expect(raAchievementList({ Achievements: { 1: a as never, 2: undefined } })).toEqual([a])
  expect(raAchievementList({ Achievements: null })).toEqual([])
  expect(raAchievementList(undefined)).toEqual([])
})

test('readJson throws on anything but a 2xx', async () => {
  ;(fetch as jest.Mock).mockResolvedValue(answer({}, 404))
  await expect(readJson('/api/x?y=1')).rejects.toThrow('/api/x 404')
})

test('each platform through the route its page uses', async () => {
  const fetchMock = fetch as jest.Mock
  fetchMock.mockResolvedValueOnce(answer({ ID: 3, NumDistinctPlayers: 9, Achievements: { 1: { ID: 1 } } }))
  expect(await fetchGameAchievements('ra', 3, 'es')).toMatchObject({ source: 'ra', list: [{ ID: 1 }], game: { NumDistinctPlayers: 9 } })
  expect(fetchMock.mock.calls[0][0]).toBe('/api/getGameProgression?gameId=3')

  fetchMock.mockResolvedValueOnce(answer([{ apiname: 'WIN' }]))
  expect(await fetchGameAchievements('steam', 620, 'es')).toEqual({ source: 'steam', list: [{ apiname: 'WIN' }] })
  expect(fetchMock.mock.calls[1][0]).toBe('/api/steam/achievements?appid=620&lang=spanish')

  fetchMock.mockResolvedValueOnce(answer({ trophies: [{ id: 0 }] }))
  expect(await fetchGameAchievements('psn', 2018800, 'es')).toEqual({ source: 'psn', list: [{ id: 0 }] })
  expect(fetchMock.mock.calls[2][0]).toBe('/api/psn/trophies?id=NPWR20188_00&lang=es')

  fetchMock.mockResolvedValueOnce(answer({ achievements: [{ id: '1' }] }))
  expect(await fetchGameAchievements('xbox', 7, 'es')).toEqual({ source: 'xbox', list: [{ id: '1' }] })
  expect(fetchMock.mock.calls[3][0]).toBe('/api/xbox/achievements?id=7&lang=es')
})

test('an answer of the wrong shape is an error', async () => {
  ;(fetch as jest.Mock).mockResolvedValue(answer({ nope: true }))
  await expect(fetchGameAchievements('steam', 1, 'en')).rejects.toThrow('Unexpected Steam answer')
  await expect(fetchGameAchievements('psn', 2018800, 'en')).rejects.toThrow('Unexpected PSN answer')
  await expect(fetchGameAchievements('xbox', 1, 'en')).rejects.toThrow('Unexpected Xbox answer')
})
