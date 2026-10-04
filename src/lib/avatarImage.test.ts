import { avatarUrl, isUploadedAvatar, parseAvatarSegment, sniffImageType } from './avatarImage'

const bytes = (...b: number[]) => new Uint8Array([...b, ...new Array(16).fill(0)])

describe('sniffImageType', () => {
  test('recognises PNG, JPEG and WebP by their first bytes', () => {
    expect(sniffImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe('image/png')
    expect(sniffImageType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('image/jpeg')
    expect(sniffImageType(bytes(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50))).toBe('image/webp')
  })

  test('refuses anything else, SVG and HTML included', () => {
    const text = (s: string) => Uint8Array.from(s, (c) => c.charCodeAt(0))
    expect(sniffImageType(text('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'))).toBeNull()
    expect(sniffImageType(text('<!doctype html><html>'))).toBeNull()
    expect(sniffImageType(bytes(0x47, 0x49, 0x46, 0x38))).toBeNull() // GIF
    expect(sniffImageType(new Uint8Array())).toBeNull()
  })

  test('a RIFF file that is not WebP is refused', () => {
    expect(sniffImageType(bytes(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x41, 0x56, 0x45))).toBeNull() // WAVE
  })
})

test('avatar URLs carry the version in the path and parse back to the user', () => {
  const url = avatarUrl(12, 1700000000)
  expect(url).toBe('/api/avatar/12-1700000000')
  expect(parseAvatarSegment(url.split('/').pop()!)).toBe(12)
})

test('parseAvatarSegment rejects anything that is not id-version', () => {
  for (const s of ['12', 'abc-1', '12-', '../12-1', '12-1.png', '-1']) expect(parseAvatarSegment(s)).toBeNull()
})

test('tells an uploaded avatar from a pasted link', () => {
  expect(isUploadedAvatar('/api/avatar/3-1')).toBe(true)
  expect(isUploadedAvatar('https://i.pinimg.com/a.jpg')).toBe(false)
  expect(isUploadedAvatar(null)).toBe(false)
})
