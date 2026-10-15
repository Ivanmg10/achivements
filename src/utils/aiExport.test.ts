import { aiExportFileName, aiExportText, buildAiExport, languageName, psnAiSource, raAiSource, steamAiSource } from './aiExport'
import type { RetroAchievement, RetroAchievementsGameWithAchievements } from '@/types/types'
import type { SteamAchievementUnified } from '@/types/steam'
import type { PsnGameProgress, PsnTrophy } from '@/types/psn'

const NOW = new Date('2026-10-13T12:00:00Z')

function raAch(id: number, over: Partial<RetroAchievement> = {}): RetroAchievement {
  return {
    ID: id, NumAwarded: 50, NumAwardedHardcore: 20, Title: `A${id}`, Description: `Do ${id}`, Points: 5, TrueRatio: 7,
    Author: 'x', AuthorULID: 'x', DateModified: '', DateCreated: '', BadgeName: '1', DisplayOrder: id, MemAddr: '', ...over,
  }
}

const RA_GAME = {
  ID: 1, Title: 'Jak II', ConsoleName: 'PlayStation 2', Developer: 'Naughty Dog', Publisher: null, Genre: 'Platformer',
  Released: '2003-10-14', NumDistinctPlayers: 200, GuideURL: 'https://github.com/RetroAchievements/guides/jak2',
  Achievements: {
    '3': raAch(3, { Type: 'missable' }),
    '1': raAch(1, { DateEarned: '2026-01-02 10:00:00', DateEarnedHardcore: '2026-01-02 10:00:00', Type: 'progression' }),
    '2': raAch(2, { DateEarned: '2026-01-01 09:00:00', Points: 10 }),
  },
} as unknown as RetroAchievementsGameWithAchievements

test('RA: pending in game order with type and rarity, earned oldest first with the mode', () => {
  const file = buildAiExport(raAiSource(RA_GAME), { lang: 'es', now: NOW })

  expect(file.pending).toEqual([{ name: 'A3', description: 'Do 3', rarityPercent: 25, type: 'missable', points: 5 }])
  expect(file.earned).toEqual([
    { name: 'A2', description: 'Do 2', earnedAt: '2026-01-01 09:00:00' },
    { name: 'A1', description: 'Do 1', earnedAt: '2026-01-02 10:00:00', hardcore: true },
  ])
  expect(file.progress).toEqual({ earned: 2, total: 3, percent: 67, hardcoreEarned: 1, pointsEarned: 15, pointsTotal: 20 })
  expect(file.game).toEqual({
    platform: 'RetroAchievements', title: 'Jak II', console: 'PlayStation 2', developer: 'Naughty Dog', genre: 'Platformer',
    released: '2003-10-14', link: 'https://retroachievements.org/game/1', guide: 'https://github.com/RetroAchievements/guides/jak2',
  })
  expect(file.exportedAt).toBe('2026-10-13T12:00:00.000Z')
})

test('the instructions name the game, the reply language and the platform rules', () => {
  const text = buildAiExport(raAiSource(RA_GAME), { lang: 'es', now: NOW }).instructions.join('\n')
  expect(text).toContain('"Jak II" (PlayStation 2, RetroAchievements)')
  expect(text).toContain('Reply in Spanish.')
  expect(text).toContain('hardcore mode')
  expect(text).toContain('has not asked anything specific')
  expect(text).not.toContain('PlayStation trophies')
})

test("the player's question goes in, and is answered first", () => {
  const file = buildAiExport(raAiSource(RA_GAME), { lang: 'en', question: '  How do I get the story choices?  ', now: NOW })
  expect(file.playerQuestion).toBe('How do I get the story choices?')
  expect(file.instructions.join('\n')).toContain('The player asks: "How do I get the story choices?". Answer that first')
})

const steamAch = (over: Partial<SteamAchievementUnified>): SteamAchievementUnified => ({
  _source: 'steam', id: 'x', apiname: 'x', title: 'x', description: '', dateEarned: null, badgeUrl: '', displayOrder: 0,
  hidden: false, earned: false, globalPct: null, likelyOnline: false, ...over,
})

test('Steam: English names, hidden and online flags, playtime; no RA-only fields', () => {
  const file = buildAiExport(
    steamAiSource({
      appId: 202970,
      title: 'Call of Duty: Black Ops II',
      details: { appId: 202970, name: 'x', developers: ['Treyarch'], publishers: ['Activision'], genres: ['Action'], releaseDate: '12 Nov, 2012', description: null, screenshots: [] },
      playtimeMinutes: 754,
      achievements: [
        steamAch({ apiname: 'B', title: 'Secreto', titleEn: 'Secret', hidden: true, displayOrder: 1, globalPct: 3.14159 }),
        steamAch({ apiname: 'A', title: 'Partida', description: 'Gana una partida', likelyOnline: true, displayOrder: 0, earned: true, dateEarned: '2026-01-01T00:00:00Z' }),
      ],
    }),
    { lang: 'es', now: NOW },
  )
  expect(file.pending).toEqual([{ name: 'Secreto', nameEnglish: 'Secret', rarityPercent: 3.1, hidden: true }])
  expect(file.earned).toEqual([{ name: 'Partida', description: 'Gana una partida', earnedAt: '2026-01-01T00:00:00Z' }])
  expect(file.game).toMatchObject({ platform: 'Steam', developer: 'Treyarch', playtimeHours: 12.6, link: 'https://store.steampowered.com/app/202970' })
  expect(file.progress).toEqual({ earned: 1, total: 2, percent: 50 })
  expect(file.instructions.join('\n')).toContain('"mayNeedOnline": true is only a guess')
})

test('PSN: grades, DLC by name and the trophies by grade', () => {
  const trophy = (over: Partial<PsnTrophy>): PsnTrophy => ({
    id: 0, name: 'x', detail: 'd', iconUrl: null, type: 'bronze', groupId: 'default', hidden: false, earned: false, earnedAt: null, rarity: null, ...over,
  })
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 1 }
  const game = {
    title: 'Black Ops II', consoleName: 'PS3', conceptId: null, playtimeMinutes: null,
    earned: counts, defined: { platinum: 1, gold: 0, silver: 0, bronze: 2 },
  } as unknown as PsnGameProgress
  const file = buildAiExport(
    psnAiSource({
      game,
      details: null,
      groups: [
        { id: 'default', name: 'Base', iconUrl: null, defined: counts, earned: counts, progress: 0 },
        { id: '001', name: 'Revolution', iconUrl: null, defined: counts, earned: counts, progress: 0 },
      ],
      trophies: [
        trophy({ id: 2, name: 'Mutated', groupId: '001', rarity: 1.25 }),
        trophy({ id: 0, name: 'Platinum', type: 'platinum', hidden: true }),
        trophy({ id: 1, name: 'First', earned: true, earnedAt: '2026-01-01T00:00:00Z' }),
      ],
    }),
    { lang: 'en', now: NOW },
  )
  expect(file.pending).toEqual([
    { name: 'Platinum', description: 'd', grade: 'platinum', hidden: true },
    { name: 'Mutated', description: 'd', rarityPercent: 1.3, grade: 'bronze', dlc: 'Revolution' },
  ])
  expect(file.earned).toEqual([{ name: 'First', description: 'd', earnedAt: '2026-01-01T00:00:00Z', grade: 'bronze' }])
  expect(file.progress.byGrade?.platinum).toEqual({ earned: 0, total: 1 })
  expect(file.game).toEqual({ platform: 'PlayStation Network', title: 'Black Ops II', console: 'PS3' })
  expect(file.instructions.join('\n')).toContain('Reply in English.')
})

test('as text: the instructions as prose, then the data as JSON without them', () => {
  const file = buildAiExport(raAiSource(RA_GAME), { lang: 'es', now: NOW })
  const text = aiExportText(file)
  expect(text.startsWith(file.instructions[0])).toBe(true)
  const json = JSON.parse(text.slice(text.indexOf('DATA (JSON):\n') + 'DATA (JSON):\n'.length))
  expect(json.instructions).toBeUndefined()
  expect(json.pending).toHaveLength(1)
})

test('language names and file names', () => {
  expect(languageName('es')).toBe('Spanish')
  expect(languageName('ja')).toBe('Japanese')
  expect(aiExportFileName('Call of Duty®: Black Ops II', 'psn')).toBe('call-of-duty-black-ops-ii-psn-ai.json')
  expect(aiExportFileName('ポケモン', 'ra')).toBe('game-ra-ai.json')
})

describe('Xbox', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { xboxAiSource } = require('./aiExport') as typeof import('./aiExport')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fx = require('@/test-utils/xboxFixtures') as typeof import('@/test-utils/xboxFixtures')

  const game = fx.xboxGameFixture({ title: 'Halo Infinite', consoleName: 'Xbox Series · PC', earnedGamerscore: 25, totalGamerscore: 1750 })
  const achievements = [
    fx.xboxAchievementFixture({ id: '2', name: 'Locked one', unlocked: false, unlockedAt: null, gamerscore: 50, rarity: 1.25, secret: true }),
    fx.xboxAchievementFixture({ id: '1', name: 'First', gamerscore: 25, unlockedAt: '2026-01-01T00:00:00Z' }),
  ]

  test('pending with gamerscore and the secret flag, earned oldest first, and the gamerscore progress', () => {
    const file = buildAiExport(xboxAiSource({ game, achievements, details: null }), { lang: 'en', now: NOW })
    expect(file.pending).toEqual([{ name: 'Locked one', description: 'Complete the Prologue', rarityPercent: 1.3, gamerscore: 50, hidden: true }])
    expect(file.earned).toEqual([{ name: 'First', description: 'Complete the Prologue', earnedAt: '2026-01-01T00:00:00Z', gamerscore: 25 }])
    expect(file.progress.gamerscore).toEqual({ earned: 25, total: 1750 })
    expect(file.game).toEqual({ platform: 'Xbox', title: 'Halo Infinite', console: 'Xbox Series · PC' })
  })

  test('the instructions talk about Xbox achievements and gamerscore, and carry nothing of the account', () => {
    const file = buildAiExport(xboxAiSource({ game, achievements, details: null }), { lang: 'es', now: NOW })
    const text = file.instructions.join('\n')
    expect(text).toContain('Xbox achievements')
    expect(text).toContain('gamerscore')
    expect(text).toContain('Reply in Spanish.')
    expect(JSON.stringify(file)).not.toMatch(/2535400000000001|TestPlayer/)
  })

  test('the file is named after the game and the platform', () => {
    expect(aiExportFileName('Halo Infinite', 'xbox')).toBe('halo-infinite-xbox-ai.json')
  })
})
