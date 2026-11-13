import { SAMPLE_STEAM_ACHIEVEMENTS } from './sampleSteamAchievements'
import { SAMPLE_NAMES as ES } from './names/es'
import { SAMPLE_PSN_ICONS, SAMPLE_PSN_TROPHIES } from './samplePsnTrophies'
import { loadSampleAchievements, loadSampleTrophies, toPsnTrophies, toSteamAchievements } from './landingLibrary'
import { SAMPLE_ACHIEVEMENTS, SAMPLE_GAMES } from '@/components/landing-page/landingSamples'
import { addDays } from '@/utils/dates'

const TODAY = '2026-11-13'

test('each Steam example earns the owner\'s count, with every achievement named and dated from today', () => {
  for (const game of SAMPLE_GAMES.filter((g) => g.appId)) {
    const list = toSteamAchievements(game.appId!, SAMPLE_STEAM_ACHIEVEMENTS[game.appId!], ES[game.appId!], TODAY)
    expect(list).toHaveLength(game.total)
    expect(list.filter((a) => a.earned)).toHaveLength(game.earned)
    for (const a of list) {
      expect(a.title).not.toBe(a.apiname)
      expect(a.earned).toBe(a.dateEarned !== null)
      expect(a.badgeUrl).toMatch(new RegExp(`^https://steamcdn-a\\.akamaihd\\.net/.+/${game.appId}/[0-9a-f]+\\.jpg$`))
    }
  }
})

test('Black Ops II agrees with the "Achievement by achievement" example: the same days', () => {
  const list = toSteamAchievements(202970, SAMPLE_STEAM_ACHIEVEMENTS[202970], ES[202970], TODAY)
  const byIcon = Object.fromEntries(list.map((a) => [a.badgeUrl, a]))
  for (const a of SAMPLE_ACHIEVEMENTS) {
    const same = byIcon[a.icon]
    expect(same).toBeDefined()
    expect(same.dateEarned?.slice(0, 10) ?? null).toBe(a.daysAgo === null ? null : addDays(TODAY, -a.daysAgo))
  }
})

test('loads one game in the reader\'s language', async () => {
  const list = await loadSampleAchievements(202970, 'es', TODAY)
  expect(list).toHaveLength(35)
  expect(list.map((a) => a.title)).toContain('Futurista')
})

test('the PSN example earns every trophy, named, with its icon on the PSN host and the platinum last', () => {
  const game = SAMPLE_GAMES.find((g) => g.trophySet)!
  const list = toPsnTrophies(SAMPLE_PSN_TROPHIES, SAMPLE_PSN_ICONS, ES[game.trophySet!], TODAY)
  expect(list).toHaveLength(game.total)
  expect(list.filter((t) => t.earned)).toHaveLength(game.earned)
  for (const t of list) {
    expect(t.name).not.toBe('')
    expect(t.iconUrl).toMatch(/^https:\/\/image\.api\.playstation\.com\/trophy\/np\//)
  }
  const last = [...list].sort((a, b) => b.earnedAt!.localeCompare(a.earnedAt!))[0]
  expect(last.type).toBe('platinum')
})

test('loads the PSN example in the reader language', async () => {
  const list = await loadSampleTrophies('NPWR11436_00', 'es', TODAY)
  expect(list[0].name).toBe('El César')
})
