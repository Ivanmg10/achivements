jest.mock('@/lib/steamClient', () => ({ getPlayerSummaries: jest.fn(), resolveVanityUrl: jest.fn() }))

import { findSteamAccount, parseSteamQuery, readSteamId } from './steamAccount'
import { getPlayerSummaries, resolveVanityUrl } from '@/lib/steamClient'

const ID = '76561197960287930'

beforeEach(() => jest.clearAllMocks())

describe('parseSteamQuery', () => {
  test.each([
    [ID, { steamid: ID }],
    [` ${ID} `, { steamid: ID }],
    [`https://steamcommunity.com/profiles/${ID}/`, { steamid: ID }],
    [`steamcommunity.com/profiles/${ID}`, { steamid: ID }],
    ['https://steamcommunity.com/id/gabelogannewell/', { vanity: 'gabelogannewell' }],
    ['http://www.steamcommunity.com/id/Gabe_N?l=spanish', { vanity: 'Gabe_N' }],
    ['gabelogannewell', { vanity: 'gabelogannewell' }],
  ])('%s', (input, expected) => {
    expect(parseSteamQuery(input)).toEqual(expected)
  })

  test.each(['', 'a', 'has spaces', 'https://steamcommunity.com/profiles/123', 'https://example.com/id/gabe', 42])('rejects %p', (input) => {
    expect(parseSteamQuery(input)).toBeNull()
  })
})

test('readSteamId takes only an id or a /profiles/ link', () => {
  expect(readSteamId(`https://steamcommunity.com/profiles/${ID}`)).toBe(ID)
  expect(readSteamId('gabelogannewell')).toBeNull()
})

describe('findSteamAccount', () => {
  const player = (visibility: number) => ({ response: { players: [{ personaname: 'Gabe', communityvisibilitystate: visibility }] } })

  test('resolves a custom URL, then reads the profile', async () => {
    ;(resolveVanityUrl as jest.Mock).mockResolvedValue({ response: { success: 1, steamid: ID } })
    ;(getPlayerSummaries as jest.Mock).mockResolvedValue(player(3))
    expect(await findSteamAccount({ vanity: 'gabe' }, 'key')).toEqual({ steamid: ID, personaname: 'Gabe', isPublic: true })
    expect(resolveVanityUrl).toHaveBeenCalledWith('gabe', 'key')
    expect(getPlayerSummaries).toHaveBeenCalledWith(ID, 'key')
  })

  test('an id goes straight to the profile; a private one says so', async () => {
    ;(getPlayerSummaries as jest.Mock).mockResolvedValue(player(1))
    expect(await findSteamAccount({ steamid: ID }, 'key')).toMatchObject({ isPublic: false })
    expect(resolveVanityUrl).not.toHaveBeenCalled()
  })

  test('null when Steam knows no such name or id', async () => {
    ;(resolveVanityUrl as jest.Mock).mockResolvedValue({ response: { success: 42, message: 'No match' } })
    expect(await findSteamAccount({ vanity: 'nobody' }, 'key')).toBeNull()
    ;(getPlayerSummaries as jest.Mock).mockResolvedValue({ response: { players: [] } })
    expect(await findSteamAccount({ steamid: ID }, 'key')).toBeNull()
  })

  test('Steam being down is thrown, not taken for "no account"', async () => {
    ;(resolveVanityUrl as jest.Mock).mockRejectedValue(new Error('Steam 503'))
    await expect(findSteamAccount({ vanity: 'gabe' }, 'key')).rejects.toThrow('Steam 503')
  })
})
