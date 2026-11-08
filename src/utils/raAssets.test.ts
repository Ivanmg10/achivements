import { raAvatarUrl, raBadgeUrl, raImageUrl } from './raAssets'

test('an RA path is a picture on RA’s site; none is none', () => {
  expect(raImageUrl('/Images/012345.png')).toBe('https://retroachievements.org/Images/012345.png')
  expect(raImageUrl('')).toBeUndefined()
  expect(raImageUrl(null)).toBeUndefined()
})

test('a badge, locked or not; none is none', () => {
  expect(raBadgeUrl('123456')).toBe('https://media.retroachievements.org/Badge/123456.png')
  expect(raBadgeUrl('123456_lock')).toBe('https://media.retroachievements.org/Badge/123456_lock.png')
  expect(raBadgeUrl(undefined)).toBeUndefined()
})

test('a user picture, with the name encoded', () => {
  expect(raAvatarUrl('Scott')).toBe('https://media.retroachievements.org/UserPic/Scott.png')
  expect(raAvatarUrl('a b')).toBe('https://media.retroachievements.org/UserPic/a%20b.png')
})
