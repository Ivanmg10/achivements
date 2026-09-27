import { render, screen } from '@testing-library/react'
import SteamExpandedStats from './SteamExpandedStats'
import { en } from '@/translations/en'

function value(label: string) {
  return screen.getByText(label).nextElementSibling?.textContent
}

test('lists playtime, the last two weeks, completion and what remains', () => {
  render(<SteamExpandedStats playtimeForever={29055} playtime2Weeks={90} completionPct={25} remaining={63} />)

  expect(value(en.steam.playtime)).toBe('484 h')
  expect(value(en.steam.last2Weeks)).toBe('1.5 h')
  expect(value(en.gameExpanded.completion)).toBe('25%')
  expect(value(en.gameExpanded.remaining)).toBe('63')
})

test('is a description list, shown on small screens only like RA\'s', () => {
  const { container } = render(<SteamExpandedStats playtimeForever={0} playtime2Weeks={0} completionPct={0} remaining={0} />)
  const dl = container.querySelector('dl')!
  expect(dl.className).toContain('lg:hidden')
  expect(dl.querySelectorAll('dt')).toHaveLength(4)
  expect(value(en.steam.last2Weeks)).toBe(`0 ${en.steam.minutesShort}`)
})
