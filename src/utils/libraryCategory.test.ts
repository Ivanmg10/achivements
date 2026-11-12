import { detailCategory, inCategory } from './libraryCategory'

test('a status page takes its own status; "all" takes every known one', () => {
  expect(inCategory('playing', 'playing')).toBe(true)
  expect(inCategory('completed', 'playing')).toBe(false)
  expect(inCategory('wantToPlay', 'all')).toBe(true)
  expect(inCategory(null, 'all')).toBe(false)
})

test('on "all" a game opens as its own status', () => {
  expect(detailCategory('all', 'completed')).toBe('completed')
  expect(detailCategory('playing', 'completed')).toBe('playing')
})
