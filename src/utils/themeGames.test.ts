import { THEMES } from '@/types/types'
import { optionsOf } from './themePicker'
import { themeCovers } from './themeGames'

const tributes = optionsOf('special').map((o) => o.theme)
const wall = themeCovers('dark')

test('each tribute shows its own games, none shared with another or with the art wall', () => {
  const covers = tributes.flatMap((id) => themeCovers(id))
  expect(covers).toHaveLength(tributes.length * 2)
  expect(new Set(covers).size).toBe(covers.length)
  for (const url of covers) {
    expect(wall).not.toContain(url)
    expect(url).toMatch(/^https:\/\/cdn\.akamai\.steamstatic\.com\/steam\/apps\/\d+\/library_600x900\.jpg$/)
  }
})

test('the palettes and the basic themes show the art wall\'s two games', () => {
  for (const id of THEMES.filter((t) => !tributes.includes(t))) expect(themeCovers(id)).toEqual(wall)
  expect(wall.every((url) => url.startsWith('https://retroachievements.org/Images/'))).toBe(true)
})

test('no Xbox picture anywhere', () => {
  for (const id of THEMES) for (const url of themeCovers(id)) expect(url).not.toMatch(/xbox|xboxlive/i)
})
