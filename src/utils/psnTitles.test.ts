import {
  classifyPsnGame,
  countTrophies,
  dlcShortName,
  isPsnTitleId,
  psnBackdrop,
  psnNumericId,
  psnPlatformName,
  psnPlatformChip,
  psnTitleId,
  psnTrophyAnchor,
  totalPlaytime,
  trophiesByGroup,
} from './psnTitles'

test.each([
  ['NPWR20188_00', 2018800],
  ['NPWR00001_07', 107],
  ['NPWR99999_99', 9999999],
])('%s is the number %i, and back', (titleId, id) => {
  expect(psnNumericId(titleId)).toBe(id)
  expect(psnTitleId(id)).toBe(titleId)
})

test.each(['NPWR1_00', 'CUSA01433_00', 'npwr20188_00', 'NPWR20188_00x', ''])('%s is not a trophy-set id', (value) => {
  expect(psnNumericId(value)).toBeNull()
  expect(isPsnTitleId(value)).toBe(false)
})

test.each([
  [0, 'wantToPlay'],
  [1, 'playing'],
  [99, 'playing'],
  [100, 'completed'],
])('a game at %i%% goes to %s', (pctWon, category) => {
  expect(classifyPsnGame({ pctWon })).toBe(category)
})

test('counts every grade', () => {
  expect(countTrophies({ bronze: 30, silver: 10, gold: 4, platinum: 1 })).toBe(45)
})

test('a trophy anchor is stable', () => {
  expect(psnTrophyAnchor(12)).toBe('trophy-12')
})

test('the total play time counts a collection once', () => {
  expect(
    totalPlaytime([
      { playtimeMinutes: 100, playedAs: ['COLL'] },
      { playtimeMinutes: 100, playedAs: ['COLL'] },
      { playtimeMinutes: 30, playedAs: ['A'] },
      { playtimeMinutes: null, playedAs: [] },
    ]),
  ).toBe(130)
})

test('the backdrop is the widest art there is', () => {
  expect(psnBackdrop({ heroUrl: 'h', coverUrl: 'c', imageIcon: 'i' })).toBe('h')
  expect(psnBackdrop({ heroUrl: null, coverUrl: 'c', imageIcon: 'i' })).toBe('c')
  expect(psnBackdrop({ heroUrl: null, coverUrl: null, imageIcon: 'i' })).toBe('i')
})

test('trophiesByGroup: one section without DLC, else one per group that has trophies, in group order', () => {
  const t = [{ id: 0, groupId: 'default' }, { id: 1, groupId: '001' }, { id: 2, groupId: 'default' }]
  expect(trophiesByGroup(t, [{ id: 'default' }])).toEqual([{ groupId: 'default', trophies: t }])
  expect(trophiesByGroup(t, [{ id: 'default' }, { id: '002' }, { id: '001' }])).toEqual([
    { groupId: 'default', trophies: [t[0], t[2]] },
    { groupId: '001', trophies: [t[1]] },
  ])
})

test('psnPlatformName writes Sony codes as people do', () => {
  expect(psnPlatformName('PS5')).toBe('PS5')
  expect(psnPlatformName('PSVITA')).toBe('PS Vita')
  expect(psnPlatformName('PS3,PSVITA')).toBe('PS3 · PS Vita')
})

test('psnPlatformChip colours each console its own way; a cross-buy list by its first', () => {
  const chips = ['PS5', 'PS4', 'PS3', 'PS Vita'].map(psnPlatformChip)
  expect(new Set(chips).size).toBe(4)
  expect(psnPlatformChip('PS3 · PS Vita')).toBe(psnPlatformChip('PS3'))
  expect(psnPlatformChip('PS4')).toContain('#003791')
})

describe('classifyPsnGame with platinumCompletes', () => {
  test('a platinum counts as completed below 100% only when asked', () => {
    expect(classifyPsnGame({ pctWon: 85 })).toBe('playing')
    expect(classifyPsnGame({ pctWon: 85, platinumCompletes: true })).toBe('completed')
    expect(classifyPsnGame({ pctWon: 100 })).toBe('completed')
  })
})

describe('dlcShortName', () => {
  const BO2 = 'Call of Duty®: Black Ops II'
  test.each([
    ['Call of Duty: Black Ops II: Revolution', 'Revolution'],
    ['Call of Duty: Black Ops II Uprising', 'Uprising'],
    ['CALL OF DUTY®: BLACK OPS II - Apocalypse', 'Apocalypse'],
    ['Winter Wonder', 'Winter Wonder'],
  ])('%s → %s', (name, short) => {
    expect(dlcShortName(name, BO2)).toBe(short)
  })

  test('whole words only, and never an empty name', () => {
    expect(dlcShortName('Halogen Pack', 'Halo')).toBe('Halogen Pack')
    expect(dlcShortName('Astro Bot', 'Astro Bot')).toBe('Astro Bot')
    expect(dlcShortName('Astro Bot', '')).toBe('Astro Bot')
  })

  test('accented titles', () => {
    expect(dlcShortName('Pokémon Café: Remix', 'Pokémon Café')).toBe('Remix')
  })
})
