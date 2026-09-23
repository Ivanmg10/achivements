import {
  buildRaCandidates,
  buildSteamCandidates,
  candidateIconUrl,
  candidateToGroupItemBody,
  normalizeTitle,
  searchCandidates,
  titleMatches,
  GameCandidate,
} from './gameCandidates'
import { toSteamGameProgress } from './steamMappers'
import type { RecentlyPlayedGame, RetroAchievementsGameCompleted, WantToPlayGame } from '@/types/types'

function completed(id: number, pct: string, hc = '0', title = `RA ${id}`): RetroAchievementsGameCompleted {
  return { GameID: id, Title: title, ImageIcon: `/Images/${id}.png`, ConsoleID: 1, ConsoleName: 'SNES', MaxPossible: 10, NumAwarded: Math.round(parseFloat(pct) * 10), PctWon: pct, HardcoreMode: hc }
}

function recent(id: number, achieved: number, total = 10): RecentlyPlayedGame {
  return { GameID: id, Title: `Recent ${id}`, ImageIcon: '/r.png', ConsoleName: 'GBA', LastPlayed: '', NumPossibleAchievements: total, PossibleScore: 0, NumAchieved: achieved, ScoreAchieved: 0, NumAchievedHardcore: 0, ScoreAchievedHardcore: 0 }
}

function want(id: number): WantToPlayGame {
  return { ID: id, Title: `Want ${id}`, GameTitle: `Want ${id}`, ImageIcon: '/w.png', ConsoleID: 2, ConsoleName: 'N64', PointsTotal: 0, AchievementsPublished: 40 }
}

describe('buildRaCandidates', () => {
  test('maps completion rows with status and a 0–1 completion', () => {
    const [c] = buildRaCandidates([completed(1, '0.5')], [], [])
    expect(c).toEqual({
      key: 'ra:1', source: 'ra', id: 1, title: 'RA 1', subtitle: 'SNES', imageRef: '/Images/1.png',
      pctWon: 0.5, numAwarded: 5, maxPossible: 10, status: 'in-progress',
    })
  })

  test('tells hardcore and softcore completions apart', () => {
    const list = buildRaCandidates([completed(1, '1', '1'), completed(2, '1', '0')], [], [])
    expect(list.map((c) => c.status)).toEqual(['completed-hc', 'completed-sc'])
  })

  test('one entry per game, keeping the most advanced status', () => {
    const list = buildRaCandidates([completed(1, '1', '0'), completed(1, '1', '1')], [recent(1, 3)], [want(1)])
    expect(list).toHaveLength(1)
    expect(list[0].status).toBe('completed-hc')
  })

  test('adds recent games not in the completion list', () => {
    const list = buildRaCandidates([], [recent(7, 2), recent(8, 0)], [])
    expect(list.map((c) => [c.id, c.status, c.pctWon])).toEqual([[7, 'in-progress', 0.2], [8, null, 0]])
  })

  test('copes with a recent game that has no achievements', () => {
    expect(buildRaCandidates([], [recent(9, 0, 0)], [])[0].pctWon).toBe(0)
  })

  test('adds want-to-play games', () => {
    const [c] = buildRaCandidates([], [], [want(4)])
    expect(c).toMatchObject({ key: 'ra:4', status: 'want-to-play', maxPossible: 40, pctWon: 0 })
  })

  test('reads the legacy GameID on want-to-play rows', () => {
    const legacy = { ...want(0), ID: undefined as unknown as number, GameID: 55 }
    expect(buildRaCandidates([], [], [legacy])[0].id).toBe(55)
  })

  test('treats an unparseable completion as zero', () => {
    expect(buildRaCandidates([completed(1, 'x')], [], [])[0].pctWon).toBe(0)
  })
})

describe('buildSteamCandidates', () => {
  const base = toSteamGameProgress({ appid: 620, name: 'Portal 2', playtime_forever: 60, has_community_visible_stats: true, img_icon_url: 'hash' })

  test('maps library games, keyed apart from RA ids', () => {
    const [c] = buildSteamCandidates([{ ...base, achievementsLoaded: true, maxPossible: 50, numAwarded: 25, pctWon: 50 }])
    expect(c).toMatchObject({ key: 'steam:620', source: 'steam', subtitle: 'Steam', pctWon: 0.5, numAwarded: 25, maxPossible: 50, status: 'in-progress' })
    expect(c.imageRef).toContain('/620/hash.jpg')
  })

  test('uses the Steam categories for status', () => {
    const list = buildSteamCandidates([
      { ...base, id: 1, achievementsLoaded: true, maxPossible: 4, numAwarded: 4, pctWon: 100 },
      { ...base, id: 2, playtimeForever: 0 },
      { ...base, id: 3 },
    ])
    expect(list.map((c) => c.status)).toEqual(['perfect', 'want-to-play', null])
  })
})

test('candidateIconUrl resolves RA paths and passes Steam URLs through', () => {
  expect(candidateIconUrl({ source: 'ra', imageRef: '/Images/1.png' })).toBe('https://retroachievements.org/Images/1.png')
  expect(candidateIconUrl({ source: 'steam', imageRef: 'https://x/icon.jpg' })).toBe('https://x/icon.jpg')
  expect(candidateIconUrl({ source: 'steam', imageRef: '' })).toBe('')
})

test('normalizeTitle ignores accents and case', () => {
  expect(normalizeTitle('Pokémon ÉLITE')).toBe('pokemon elite')
})

describe('searchCandidates', () => {
  const list = [
    { key: 'ra:1', title: 'Super Mario 64' },
    { key: 'steam:2', title: 'Mario Kart' },
    { key: 'ra:3', title: 'Pokémon Mario Edition' },
    { key: 'ra:4', title: 'Mario' },
    { key: 'steam:5', title: 'Supermario' },
  ] as GameCandidate[]

  test('finds across platforms, best match first', () => {
    const titles = searchCandidates(list, 'mario').map((c) => c.title)
    expect(titles[0]).toBe('Mario')
    expect(titles[1]).toBe('Mario Kart')
    expect(titles).toContain('Supermario')
    expect(titles).toHaveLength(5)
  })

  test('is accent-insensitive', () => {
    expect(searchCandidates(list, 'pokemon').map((c) => c.key)).toEqual(['ra:3'])
  })

  test('leaves out excluded keys and caps the count', () => {
    expect(searchCandidates(list, 'mario', new Set(['ra:4'])).map((c) => c.key)).not.toContain('ra:4')
    expect(searchCandidates(list, 'mario', new Set(), 2)).toHaveLength(2)
  })

  test('returns nothing for a blank query', () => {
    expect(searchCandidates(list, '   ')).toEqual([])
  })
})

describe('candidateToGroupItemBody', () => {
  test('carries the platform, so a Steam appid is not stored as an RA game', () => {
    const [steam] = buildSteamCandidates([
      { ...toSteamGameProgress({ appid: 620, name: 'Portal 2', playtime_forever: 60, img_icon_url: 'abc' }), achievementsLoaded: true, maxPossible: 50, numAwarded: 25, pctWon: 50 },
    ])
    expect(candidateToGroupItemBody(steam)).toEqual({
      source: 'steam',
      game_id: 620,
      title: 'Portal 2',
      image_icon: steam.imageRef,
      console_name: 'Steam',
      pct_won: 0.5,
      num_awarded: 25,
      max_possible: 50,
    })
  })

  test('an RA game keeps its console and image path', () => {
    const [ra] = buildRaCandidates([completed(7, '1', '1', 'Zelda')], [], [])
    expect(candidateToGroupItemBody(ra)).toMatchObject({ source: 'ra', game_id: 7, title: 'Zelda', pct_won: 1 })
  })
})

describe('titleMatches', () => {
  test('matches ignoring case and accents, and anywhere in the title', () => {
    expect(titleMatches('Pokémon Colosseum', 'pokemon')).toBe(true)
    expect(titleMatches('Pokémon Colosseum', 'COLOS')).toBe(true)
    expect(titleMatches('Pokémon Colosseum', 'zelda')).toBe(false)
  })

  test('an empty or blank filter matches everything', () => {
    expect(titleMatches('Anything', '')).toBe(true)
    expect(titleMatches('Anything', '   ')).toBe(true)
  })
})
