import type { RetroAchievement } from '@/types/types'
import { hiddenConsolesFrom, psnGradeShare, psnScoreInputs, raScoreInputs, steamScoreInputs, xboxScoreInputs } from './vaultScoreInputs'

const ra = (over: Partial<RetroAchievement>) => ({ ID: 1, NumAwarded: 50, NumAwardedHardcore: 40, Points: 10, ...over }) as RetroAchievement

describe('raScoreInputs', () => {
  it('reads points, rarity over players, and softcore', () => {
    const list = raScoreInputs(
      {
        1: ra({ DateEarnedHardcore: '2026-10-01 10:00:00', DateEarned: '2026-10-01 10:00:00' }),
        2: ra({ Points: 25, NumAwarded: 10, DateEarned: '2026-10-02 08:00:00' }),
        3: ra({ NumAwarded: 5 }),
      },
      100,
    )
    expect(list).toEqual([
      { native: 10, rarity: 50, earned: true, earnedAt: '2026-10-01T10:00:00Z', softcore: false },
      { native: 25, rarity: 10, earned: true, earnedAt: '2026-10-02T08:00:00Z', softcore: true },
      { native: 10, rarity: 5, earned: false, earnedAt: null, softcore: false },
    ])
  })
  it('has no rarity without players', () => {
    expect(raScoreInputs({ 1: ra({}) }, 0)[0].rarity).toBeNull()
  })
})

describe('steamScoreInputs', () => {
  it('counts each achievement as one, with its global share', () => {
    const pct = new Map([['WIN', 12.5]])
    expect(steamScoreInputs([{ apiname: 'WIN', achieved: 1, unlocktime: 1_760_000_000 }, { apiname: 'X', achieved: 0, unlocktime: 0 }], pct)).toEqual([
      { native: 1, rarity: 12.5, earned: true, earnedAt: new Date(1_760_000_000_000).toISOString() },
      { native: 1, rarity: null, earned: false, earnedAt: null },
    ])
  })
})

describe('psn and xbox', () => {
  it('weighs PSN grades, the platinum as a gold', () => {
    const t = (type: 'bronze' | 'platinum') => ({ id: 1, name: '', detail: '', iconUrl: null, type, groupId: 'default', hidden: false, earned: true, earnedAt: '2026-10-01T00:00:00Z', rarity: 3 })
    expect(psnScoreInputs([t('bronze'), t('platinum')]).map((a) => a.native)).toEqual([15, 90])
  })
  it('shares PSN progress by grade', () => {
    expect(psnGradeShare({ bronze: 2, silver: 0, gold: 1, platinum: 0 }, { bronze: 4, silver: 0, gold: 1, platinum: 1 })).toBeCloseTo(120 / 240)
  })
  it('reads gamerscore and Xbox rarity', () => {
    const a = { id: '1', name: '', description: '', iconUrl: null, gamerscore: 50, unlocked: false, unlockedAt: null, secret: false, rarity: 4.2, rarityCategory: 'Rare' }
    expect(xboxScoreInputs([a])).toEqual([{ native: 50, rarity: 4.2, earned: false, earnedAt: null }])
  })
})

describe('hiddenConsolesFrom', () => {
  it('reads the unticked consoles saved with the account', () => {
    expect([...hiddenConsolesFrom({ 'hidden-consoles:psn': '["PS3","PS Vita"]' }, 'psn')]).toEqual(['PS3', 'PS Vita'])
    expect(hiddenConsolesFrom({ 'hidden-consoles:psn': 'oops' }, 'psn').size).toBe(0)
    expect(hiddenConsolesFrom(null, 'ra').size).toBe(0)
  })
})
