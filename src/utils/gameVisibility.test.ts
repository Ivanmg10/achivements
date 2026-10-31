import { filterHiddenAwards, filterHiddenGames } from './gameVisibility'
import type { UserAwards } from '@/types/types'

test('filters by source and id without hiding the same numeric id on another platform', () => {
  const games = [{ id: 730 }, { id: 731 }]
  expect(filterHiddenGames(games, 'steam', new Set(['steam:730', 'ra:731']))).toEqual([{ id: 731 }])
  expect(filterHiddenGames(games, 'ra', new Set(['steam:730', 'ra:731']))).toEqual([{ id: 730 }])
})

test('accepts an id selector for activity DTOs', () => {
  const unlocks = [{ appId: 10 }, { appId: 20 }]
  expect(filterHiddenGames(unlocks, 'steam', new Set(['steam:10']), (unlock) => unlock.appId)).toEqual([{ appId: 20 }])
})

test('removes hidden awards and recomputes their aggregate counts', () => {
  const awards: UserAwards = {
    TotalAwardsCount: 3,
    MasteryAwardsCount: 2,
    CompletionAwardsCount: 1,
    BeatenHardcoreAwardsCount: 1,
    BeatenSoftcoreAwardsCount: 0,
    EventAwardsCount: 0,
    VisibleUserAwards: [
      { AwardedAt: '2026-01-01', AwardType: 'Mastery/Completion', AwardData: 1, AwardDataExtra: 1, Title: 'Hidden', ConsoleName: 'SNES', ImageIcon: '' },
      { AwardedAt: '2026-01-02', AwardType: 'Mastery/Completion', AwardData: 2, AwardDataExtra: 0, Title: 'Visible', ConsoleName: 'SNES', ImageIcon: '' },
      { AwardedAt: '2026-01-03', AwardType: 'Game Beaten', AwardData: 1, AwardDataExtra: 1, Title: 'Hidden beaten', ConsoleName: 'SNES', ImageIcon: '' },
    ],
  }

  const visible = filterHiddenAwards(awards, new Set(['ra:1']))
  expect(visible.VisibleUserAwards.map((award) => award.AwardData)).toEqual([2])
  expect(visible).toMatchObject({ TotalAwardsCount: 1, MasteryAwardsCount: 0, CompletionAwardsCount: 1, BeatenHardcoreAwardsCount: 0 })
})
