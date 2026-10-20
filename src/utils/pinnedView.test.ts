import { pinnedView } from './pinnedView'
import { en } from '@/translations/en'
import type { PinnedAchievement } from '@/types/types'

const pin = (p: unknown) => p as PinnedAchievement

test('RA: points, its rarity among the game players, and no anchor (it opens its modal)', () => {
  const v = pinnedView(
    pin({
      source: 'ra', achievement_id: 5, game_id: 7423, game_title: 'Colosseum', num_distinct_players: 200,
      snapshot: { Title: 'Win', Description: 'Win it', BadgeName: '123', Points: 10, NumAwarded: 50, DateEarned: '2026-01-01' },
    }),
    en,
  )
  expect(v).toMatchObject({
    key: 'ra:5', source: 'ra', gameId: 7423, title: 'Win', description: 'Win it', earned: true, anchor: null,
    value: '10 pts', rarity: 25, iconUrl: 'https://media.retroachievements.org/Badge/123.png',
  })
})

test('Steam: no points, its global rarity, a link to it, and a hidden one stays hidden', () => {
  const v = pinnedView(
    pin({ source: 'steam', steam_apiname: 'WIN', game_id: 620, game_title: 'Portal 2', num_distinct_players: 0, snapshot: { title: 'Secret', description: 'Spoiler', badgeUrl: 'b', earned: false, hidden: true, globalPct: 3.2 } }),
    en,
  )
  expect(v).toMatchObject({ title: en.steam.hiddenAchievement, description: '', value: null, rarity: 3.2, earned: false })
  expect(v.anchor).toBeTruthy()
})

test('PSN: its grade in its colour, and a hidden trophy keeps its text', () => {
  const v = pinnedView(
    pin({ source: 'psn', psn_trophy_id: 3, game_id: 2018800, game_title: 'BO2', num_distinct_players: 0, snapshot: { name: 'X', detail: 'Y', iconUrl: 'i', type: 'gold', earned: false, hidden: true, rarity: 1.5 } }),
    en,
  )
  expect(v).toMatchObject({ title: en.psn.hiddenTrophy, description: en.psn.hiddenTrophyDesc, value: en.psn.gold, valueClass: 'text-yellow-400', rarity: 1.5 })
})

test('Xbox: gamerscore, and a secret one not unlocked is concealed', () => {
  const v = pinnedView(
    pin({ source: 'xbox', xbox_achievement_id: 'a1', game_id: 9, game_title: 'GH2', num_distinct_players: 0, snapshot: { name: 'N', description: 'D', iconUrl: null, gamerscore: 20, unlocked: false, secret: true, rarity: null } }),
    en,
  )
  expect(v).toMatchObject({ title: en.xbox.secretAchievement, description: '', value: '20 G', rarity: null, earned: false })
})
