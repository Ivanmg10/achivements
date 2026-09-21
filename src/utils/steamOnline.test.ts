import { hasOnlineModes, isLikelyOnline, likelyOnlineNames } from './steamOnline'

function store(ids: number[]) {
  return { 620: { success: true, data: { name: 'x', categories: ids.map((id) => ({ id, description: String(id) })) } } }
}

describe('hasOnlineModes', () => {
  test('online PvP / co-op / MMO / cross-platform mean online', () => {
    for (const id of [20, 27, 36, 38]) expect(hasOnlineModes(620, store([2, id]))).toBe(true)
  })

  test('plain multi-player counts, unless it is split screen', () => {
    expect(hasOnlineModes(620, store([1]))).toBe(true)
    expect(hasOnlineModes(620, store([1, 24]))).toBe(false)
    expect(hasOnlineModes(620, store([1, 39]))).toBe(false)
  })

  test('a single-player game has none', () => {
    expect(hasOnlineModes(620, store([2, 22]))).toBe(false)
  })

  test('ids may come as strings', () => {
    expect(hasOnlineModes(620, { 620: { success: true, data: { name: 'x', categories: [{ id: '36', description: '' }] } } })).toBe(true)
  })

  test('unknown without a store entry', () => {
    expect(hasOnlineModes(620, { 620: { success: false } })).toBeNull()
    expect(hasOnlineModes(620, null)).toBeNull()
  })
})

describe('isLikelyOnline', () => {
  test.each(['Win a match online', 'Reach Gold rank in Ranked', 'Find a game through matchmaking', 'Host a lobby'])(
    '%p is online whatever the game',
    (text) => expect(isLikelyOnline(text, false)).toBe(true),
  )

  test('multiplayer wording is online unless the game has no online play', () => {
    expect(isLikelyOnline('Win a multiplayer game', null)).toBe(true)
    expect(isLikelyOnline('Top the leaderboard', true)).toBe(true)
    expect(isLikelyOnline('Win a multiplayer game', false)).toBe(false)
  })

  test('match-style wording only counts in games with online modes', () => {
    expect(isLikelyOnline('Win 10 matches', true)).toBe(true)
    expect(isLikelyOnline('Play with a friend', true)).toBe(true)
    expect(isLikelyOnline('Win 10 matches', false)).toBe(false)
    expect(isLikelyOnline('Win 10 matches', null)).toBe(false)
  })

  test('local play is never online', () => {
    expect(isLikelyOnline('Win a local multiplayer match', true)).toBe(false)
    expect(isLikelyOnline('Finish co-op in split-screen', true)).toBe(false)
  })

  test('whole words only, and empty text is not online', () => {
    expect(isLikelyOnline('Collect every matchstick', true)).toBe(false)
    expect(isLikelyOnline('', true)).toBe(false)
  })

  test('story achievements are not online', () => {
    expect(isLikelyOnline('Finish the story on hard', true)).toBe(false)
  })
})

test('likelyOnlineNames reads title and description', () => {
  const schema = [
    { name: 'A', defaultvalue: 0, displayName: 'Online Warrior', description: 'Beat the boss', hidden: 0 as const, icon: '', icongray: '' },
    { name: 'B', defaultvalue: 0, displayName: 'Boss', description: 'Beat the boss', hidden: 0 as const, icon: '', icongray: '' },
    { name: 'C', defaultvalue: 0, displayName: 'Secret', hidden: 1 as const, icon: '', icongray: '' },
  ]
  expect(likelyOnlineNames(schema, true)).toEqual(new Set(['A']))
})
