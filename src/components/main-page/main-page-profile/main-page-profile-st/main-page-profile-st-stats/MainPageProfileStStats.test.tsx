import { render, screen } from '@testing-library/react'
import MainPageProfileStStats from './MainPageProfileStStats'
import { en } from '@/translations/en'
import { toSteamGameProgress } from '@/utils/steamMappers'
import type { SteamGameProgress } from '@/types/steam'

function game(minutes: number, overrides: Partial<SteamGameProgress> = {}): SteamGameProgress {
  return { ...toSteamGameProgress({ appid: minutes, name: 'G', playtime_forever: minutes }), ...overrides }
}

const LIBRARY = [
  game(600, { achievementsLoaded: true, maxPossible: 10, numAwarded: 10 }),
  game(120, { achievementsLoaded: true, maxPossible: 10, numAwarded: 4 }),
  game(0),
]

/** StatCard puts the value before its label. */
function value(label: string) {
  return screen.getByText(label).previousElementSibling?.textContent
}

test('shows games, playtime, perfect games and achievements unlocked', () => {
  render(<MainPageProfileStStats library={LIBRARY} isLoading={false} />)
  expect(value(en.steam.statGames)).toBe('3')
  expect(value(en.steam.totalPlaytime)).toBe('12 h')
  expect(value(en.steam.statPerfect)).toBe('1')
  expect(value(en.steam.statAchievements)).toBe('14')
})

test('marks counts as a lower bound while some are still missing', () => {
  const pending = { ...game(300), hasStats: true, achievementsLoaded: false }
  render(<MainPageProfileStStats library={[...LIBRARY, pending]} isLoading={false} />)
  expect(value(en.steam.statPerfect)).toBe('1+')
  expect(value(en.steam.statAchievements)).toBe('14+')
  // Games and playtime are exact regardless.
  expect(value(en.steam.statGames)).toBe('4')
})

test('shows placeholders while the library loads', () => {
  render(<MainPageProfileStStats library={[]} isLoading />)
  expect(screen.getAllByText('—')).toHaveLength(4)
})

test('is a 2×2 grid like the RA stats', () => {
  const { container } = render(<MainPageProfileStStats library={LIBRARY} isLoading={false} />)
  expect((container.firstChild as HTMLElement).className).toContain('grid-cols-2')
})
