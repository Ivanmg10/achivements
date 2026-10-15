jest.mock('@/lib/steamCache', () => ({
  withSteamCache: jest.fn((_key: string, _ttl: number, fetcher: () => Promise<unknown>) => fetcher()),
}))

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body })
const GAME = {
  name: 'Jak II',
  first_release_date: 1066003200, // 2003-10-13
  cover: { image_id: 'co1' },
  artworks: [{ image_id: 'ar1' }],
}

// The app token lives in the module: a fresh module per test.
let igdb: typeof import('./igdbClient')
let withSteamCache: jest.Mock

beforeEach(async () => {
  jest.clearAllMocks()
  jest.resetModules()
  process.env.TWITCH_CLIENT_ID = 'client'
  process.env.TWITCH_CLIENT_SECRET = 'secret'
  global.fetch = jest.fn() as unknown as typeof fetch
  igdb = await import('./igdbClient')
  withSteamCache = (await import('@/lib/steamCache')).withSteamCache as jest.Mock
})

afterAll(() => {
  delete process.env.TWITCH_CLIENT_ID
  delete process.env.TWITCH_CLIENT_SECRET
})

test('titleKey ignores ®/™, case, accents and punctuation', () => {
  expect(igdb.titleKey('Assassin’s Creed® Brotherhood')).toBe(igdb.titleKey("assassin's creed brotherhood"))
  expect(igdb.titleKey('Pokémon')).toBe('pokemon')
})

test("Sony's platform names map to IGDB's ids; PS4/PS5 to none", () => {
  expect(igdb.igdbPlatforms('PS3')).toEqual([9])
  expect(igdb.igdbPlatforms('PS3,PSVITA')).toEqual([9, 46])
  expect(igdb.igdbPlatforms('PS3 · PS Vita')).toEqual([9, 46])
  expect(igdb.igdbPlatforms('PS Vita')).toEqual([46])
  expect(igdb.igdbPlatforms('PS4')).toEqual([])
})

test('toIgdbArt prefers the exact title, falls back to the first hit, and builds the image URLs', () => {
  const other = { name: 'Jak II: Renegade Collection' }
  expect(igdb.toIgdbArt('Jak II', [other, GAME])).toEqual({
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big_2x/co1.jpg',
    heroUrl: 'https://images.igdb.com/igdb/image/upload/t_1080p/ar1.jpg',
    releaseYear: 2003,
  })
  expect(igdb.toIgdbArt('Nothing alike', [other])).toEqual({ coverUrl: null, heroUrl: null, releaseYear: null })
  expect(igdb.toIgdbArt('Jak II', [])).toBeNull()
})

test('without a Twitch app, or for a PS4/PS5 game, nothing is asked', async () => {
  delete process.env.TWITCH_CLIENT_SECRET
  expect(await igdb.igdbArt('Jak II', 'PS3')).toBeNull()
  process.env.TWITCH_CLIENT_SECRET = 'secret'
  expect(await igdb.igdbArt('Astro Bot', 'PS5')).toBeNull()
  expect(global.fetch).not.toHaveBeenCalled()
})

test('gets an app token once, searches on the platform, and caches the art', async () => {
  ;(global.fetch as jest.Mock)
    .mockResolvedValueOnce(ok({ access_token: 'tok', expires_in: 5_000_000 }))
    .mockResolvedValue(ok([GAME]))
  expect(await igdb.igdbArt('Jak II™', 'PS3')).toMatchObject({ releaseYear: 2003 })
  await igdb.igdbArt('Jak II', 'PS3')

  const calls = (global.fetch as jest.Mock).mock.calls
  expect(calls.filter(([url]) => String(url).startsWith('https://id.twitch.tv'))).toHaveLength(1)
  const [url, init] = calls[1]
  expect(url).toBe('https://api.igdb.com/v4/games')
  expect(init.headers).toEqual({ 'Client-ID': 'client', Authorization: 'Bearer tok' })
  expect(init.body).toContain('search "Jak II"')
  expect(init.body).toContain('where platforms = (9)')
  expect(withSteamCache).toHaveBeenCalledWith('igdb:art:v2:9:jak ii', expect.any(Number), expect.any(Function))
})

test('a miss is cached as such, not as a bare null the cache would read as "not cached"', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValueOnce(ok({ access_token: 'tok', expires_in: 5_000_000 })).mockResolvedValue(ok([]))
  expect(await igdb.igdbArt('Unknown', 'PSVITA')).toBeNull()
  await expect(withSteamCache.mock.results[0].value).resolves.toEqual({ art: null })
})

test('a revoked token is renewed once; IGDB down throws, so nothing is cached', async () => {
  ;(global.fetch as jest.Mock)
    .mockResolvedValueOnce(ok({ access_token: 'old', expires_in: 5_000_000 }))
    .mockResolvedValueOnce({ ok: false, status: 401 })
    .mockResolvedValueOnce(ok({ access_token: 'new', expires_in: 5_000_000 }))
    .mockResolvedValueOnce(ok([GAME]))
  expect(await igdb.igdbArt('Jak II', 'PS3')).toMatchObject({ releaseYear: 2003 })
  expect((global.fetch as jest.Mock).mock.calls[3][1].headers.Authorization).toBe('Bearer new')

  ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 })
  await expect(igdb.igdbArt('Jak 3', 'PS3')).rejects.toThrow('IGDB answered 500')
})

test('every PlayStation maps to its IGDB id for the details lookup', () => {
  expect(igdb.igdbPsnPlatforms('PS5')).toEqual([167])
  expect(igdb.igdbPsnPlatforms('PS4')).toEqual([48])
  expect(igdb.igdbPsnPlatforms('PS3 · PS Vita')).toEqual([9, 46])
  expect(igdb.igdbPsnPlatforms('PC')).toEqual([])
})

const DETAILED = {
  name: 'Call of Duty: Black Ops II',
  summary: '  Set in 2025…  ',
  first_release_date: 1352764800, // 2012-11-13
  genres: [{ name: 'Shooter' }],
  involved_companies: [
    { developer: true, publisher: false, company: { name: 'Treyarch' } },
    { developer: false, publisher: true, company: { name: 'Activision' } },
    { developer: false, publisher: false },
  ],
  screenshots: [{ image_id: 'sc1' }],
}

test('toIgdbDetails reads studios by role, genres, the date and the screenshots', () => {
  expect(igdb.toIgdbDetails('Call of Duty: Black Ops II', [{ name: 'Other' }, DETAILED])).toEqual({
    summary: 'Set in 2025…',
    developers: ['Treyarch'],
    publishers: ['Activision'],
    genres: ['Shooter'],
    releaseDate: '2012-11-13',
    screenshots: [
      {
        thumb: 'https://images.igdb.com/igdb/image/upload/t_screenshot_med/sc1.jpg',
        full: 'https://images.igdb.com/igdb/image/upload/t_1080p/sc1.jpg',
      },
    ],
  })
  expect(igdb.toIgdbDetails('x', [{ name: 'x' }])).toEqual({
    summary: null, developers: [], publishers: [], genres: [], releaseDate: null, screenshots: [],
  })
  expect(igdb.toIgdbDetails('x', [])).toBeNull()
})

test('igdbDetails searches every platform of the game and caches under its own key', async () => {
  ;(global.fetch as jest.Mock)
    .mockResolvedValueOnce(ok({ access_token: 'tok', expires_in: 5_000_000 }))
    .mockResolvedValue(ok([DETAILED]))
  expect(await igdb.igdbDetails('Call of Duty®: Black Ops II', 'PS3')).toMatchObject({ developers: ['Treyarch'] })
  const [, init] = (global.fetch as jest.Mock).mock.calls[1]
  expect(init.body).toContain('search "Call of Duty: Black Ops II"')
  expect(init.body).toContain('involved_companies.company.name')
  expect(init.body).toContain('where platforms = (9)')
  expect(withSteamCache).toHaveBeenCalledWith('igdb:details:v1:9:call of duty black ops ii', expect.any(Number), expect.any(Function))
})

test('igdbDetails asks nothing without a Twitch app', async () => {
  delete process.env.TWITCH_CLIENT_ID
  expect(await igdb.igdbDetails('Astro Bot', 'PS5')).toBeNull()
  expect(global.fetch).not.toHaveBeenCalled()
  process.env.TWITCH_CLIENT_ID = 'client'
})

test("an Xbox library's platform names map to IGDB's ids", () => {
  expect(igdb.igdbXboxPlatforms('Xbox 360')).toEqual([12])
  expect(igdb.igdbXboxPlatforms('Xbox One')).toEqual([49])
  expect(igdb.igdbXboxPlatforms('Xbox Series · PC')).toEqual([169, 6])
  expect(igdb.igdbXboxPlatforms('Xbox One · Xbox Series')).toEqual([49, 169])
  expect(igdb.igdbXboxPlatforms('PS5')).toEqual([])
  expect(igdb.igdbXboxPlatforms('PCSX')).toEqual([])
})

test("an Xbox game's art is looked up on its own platforms, apart from a PlayStation game's", async () => {
  ;(global.fetch as jest.Mock)
    .mockResolvedValueOnce(ok({ access_token: 'tok', expires_in: 5_000_000 }))
    .mockResolvedValue(ok([GAME]))
  expect(await igdb.igdbXboxArt('Jak II™', 'Xbox One · Xbox Series')).toMatchObject({ releaseYear: 2003 })
  const [, init] = (global.fetch as jest.Mock).mock.calls[1]
  expect(init.body).toContain('where platforms = (49,169)')
  expect(withSteamCache).toHaveBeenCalledWith('igdb:art:v2:49,169:jak ii', expect.any(Number), expect.any(Function))
})

test('with no Xbox platform, or without a Twitch app, an Xbox game asks nothing', async () => {
  expect(await igdb.igdbXboxArt('Astro Bot', 'PS5')).toBeNull()
  expect(await igdb.igdbXboxDetails('Astro Bot', 'PS5')).toBeNull()
  delete process.env.TWITCH_CLIENT_SECRET
  expect(await igdb.igdbXboxArt('Halo', 'Xbox 360')).toBeNull()
  expect(global.fetch).not.toHaveBeenCalled()
})

test("an Xbox game's details come from its own platforms too", async () => {
  ;(global.fetch as jest.Mock)
    .mockResolvedValueOnce(ok({ access_token: 'tok', expires_in: 5_000_000 }))
    .mockResolvedValue(ok([{ name: 'Halo 3', summary: 'Finish the fight', first_release_date: 1190678400 }]))
  expect(await igdb.igdbXboxDetails('Halo 3', 'Xbox 360')).toMatchObject({ summary: 'Finish the fight', releaseDate: '2007-09-25' })
  expect((global.fetch as jest.Mock).mock.calls[1][1].body).toContain('where platforms = (12)')
  expect(withSteamCache).toHaveBeenCalledWith('igdb:details:v1:12:halo 3', expect.any(Number), expect.any(Function))
})
