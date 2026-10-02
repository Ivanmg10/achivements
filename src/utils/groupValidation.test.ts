import { GROUP_DESCRIPTION_MAX, GROUP_TITLE_MAX, readGroupFields, readItemCounts, readItemFields } from './groupValidation'

describe('readGroupFields', () => {
  test('cleans a valid group and fills the defaults', () => {
    expect(readGroupFields({ title: '  RPGs  ' })).toEqual({
      ok: true,
      value: { title: 'RPGs', description: null, icon: null, is_public: false },
    })
  })

  test('accepts an emoji or a link as the icon', () => {
    expect(readGroupFields({ title: 'x', icon: '🎮' }).ok).toBe(true)
    expect(readGroupFields({ title: 'x', icon: '👨‍👩‍👧‍👦' }).ok).toBe(true)
    expect(readGroupFields({ title: 'x', icon: `https://img.test/${'a'.repeat(300)}.png` }).ok).toBe(true)
  })

  test.each([
    ['no title', {}],
    ['a blank title', { title: '   ' }],
    ['a title that is not text', { title: 42 }],
    ['a title over the limit', { title: 'a'.repeat(GROUP_TITLE_MAX + 1) }],
    ['a description over the limit', { title: 'x', description: 'a'.repeat(GROUP_DESCRIPTION_MAX + 1) }],
    ['a description that is not text', { title: 'x', description: { a: 1 } }],
    ['a long text icon', { title: 'x', icon: 'not an emoji at all' }],
    ['a huge link icon', { title: 'x', icon: `https://img.test/${'a'.repeat(600)}` }],
    ['is_public that is not a boolean', { title: 'x', is_public: 'yes' }],
    ['no body at all', null],
  ])('refuses %s', (_, body) => {
    expect(readGroupFields(body).ok).toBe(false)
  })
})

describe('readItemCounts', () => {
  test('missing counts are zero', () => {
    expect(readItemCounts({})).toEqual({ ok: true, value: { num_awarded: 0, max_possible: 0, points_won: 0, max_points: 0 } })
  })

  test.each([
    ['negative', { num_awarded: -1 }],
    ['fractional', { max_possible: 1.5 }],
    ['text', { points_won: '5' }],
    ['more earned than there is', { num_awarded: 5, max_possible: 4 }],
    ['more points than there are', { points_won: 10, max_points: 5 }],
    ['absurdly large', { max_points: 1e12, points_won: 0 }],
  ])('refuses counts that are %s', (_, body) => {
    expect(readItemCounts(body).ok).toBe(false)
  })
})

describe('readItemFields', () => {
  const game = { game_id: 1, title: 'Zelda', image_icon: '/Images/1.png', console_name: 'NES', pct_won: 0.5, num_awarded: 1, max_possible: 2 }

  test('keeps a valid game', () => {
    expect(readItemFields(game)).toEqual({
      ok: true,
      value: { ...game, points_won: 0, max_points: 0 },
    })
  })

  test.each([
    ['no game id', { ...game, game_id: undefined }],
    ['a game id that is not a positive integer', { ...game, game_id: '1' }],
    ['no title', { ...game, title: '' }],
    ['a title over the limit', { ...game, title: 'a'.repeat(201) }],
    ['a huge image', { ...game, image_icon: 'a'.repeat(501) }],
    ['a progress over 100%', { ...game, pct_won: 1.5 }],
    ['bad counts', { ...game, num_awarded: 3 }],
  ])('refuses %s', (_, body) => {
    expect(readItemFields(body).ok).toBe(false)
  })
})
