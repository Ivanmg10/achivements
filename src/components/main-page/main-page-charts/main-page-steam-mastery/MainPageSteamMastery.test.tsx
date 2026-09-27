import { render, screen } from '@testing-library/react'
import MainPageSteamMastery from './MainPageSteamMastery'
import { en } from '@/translations/en'
import type { SteamGameProgress } from '@/types/steam'

function game(id: number, over: Partial<SteamGameProgress> = {}): SteamGameProgress {
  return {
    _source: 'steam', id, title: `Game ${id}`, imageIcon: '', consoleName: 'Steam',
    maxPossible: 10, numAwarded: 5, pctWon: 50, lastPlayed: '2024-01-01T00:00:00.000Z',
    playtimeForever: 120, playtime2Weeks: 0, imgLogoUrl: '', hasStats: true, achievementsLoaded: true,
    ...over,
  } as SteamGameProgress
}

function stat(label: string) {
  return screen.getByText(label).previousElementSibling?.textContent
}

const LIBRARY = [
  game(1, { numAwarded: 10, pctWon: 100 }),
  game(2, { numAwarded: 8, pctWon: 80 }),
  game(3, { numAwarded: 3, pctWon: 30 }),
  game(4, { playtimeForever: 0, numAwarded: 0, pctWon: 0 }),
]

test('leads with perfect games, counted against the library whose progress is loaded', () => {
  render(<MainPageSteamMastery games={LIBRARY} />)
  const headline = screen.getByText(new RegExp(en.steam.statPerfect)).parentElement!
  expect(headline).toHaveTextContent('1')
  expect(headline).toHaveTextContent(`4 ${en.steam.statGames.toLowerCase()}`)
})

test('supports it with the rest of the totals', () => {
  render(<MainPageSteamMastery games={LIBRARY} />)
  expect(stat(en.categories.playing)).toBe('2')
  expect(stat(en.steam.statAchievements)).toBe('21')
  expect(stat(en.cards.steamAvgCompletion)).toBe('70%')
  expect(stat(en.steam.statGames)).toBe('4')
  expect(stat(en.steam.totalPlaytime)).toBe(`6${en.steam.hoursShort}`)
})

test('breaks the library down by completion band', () => {
  render(<MainPageSteamMastery games={LIBRARY} />)
  const bands = screen.getByText(en.charts.completionDistTitle).parentElement!
  // 0% and 30% below half, 80% in the 75–99 band, 100% perfect.
  expect(bands).toHaveTextContent('<25%1')
  expect(bands).toHaveTextContent('75–99%1')
  expect(bands).toHaveTextContent('100%1')
})

test('warns when some games’ progress has not loaded, since they are left out', () => {
  const { rerender } = render(<MainPageSteamMastery games={LIBRARY} />)
  expect(screen.queryByText(en.steam.partialProgressNote)).not.toBeInTheDocument()
  rerender(<MainPageSteamMastery games={[...LIBRARY, game(5, { achievementsLoaded: false, playtimeForever: 60 })]} />)
  expect(screen.getByText(en.steam.partialProgressNote)).toBeInTheDocument()
})

test('lists the started games closest to perfect', () => {
  render(<MainPageSteamMastery games={[game(1, { pctWon: 30 }), game(2, { pctWon: 90, numAwarded: 9 }), game(3, { numAwarded: 10, pctWon: 100 })]} />)
  expect(screen.getByText(en.cards.closestToPerfect)).toBeInTheDocument()
  const rows = screen.getAllByRole('link')
  expect(rows.map((r) => r.getAttribute('href'))).toEqual(['/steamGame/2', '/steamGame/1'])
  expect(screen.getByText('90%')).toBeInTheDocument()
})

test('shows a skeleton while the library loads, and no closest list for an empty library', () => {
  const { container, rerender } = render(<MainPageSteamMastery games={[]} isLoading />)
  expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
  rerender(<MainPageSteamMastery games={[]} />)
  expect(screen.queryByText(en.cards.closestToPerfect)).not.toBeInTheDocument()
  expect(stat(en.cards.steamAvgCompletion)).toBe('0%')
})

test('drops the side column when no game is close to perfect', () => {
  const { container, rerender } = render(<MainPageSteamMastery games={[game(1, { numAwarded: 10, pctWon: 100 })]} />)
  expect(container.querySelector('[class*="grid-cols-[3fr_2fr]"]')).toBeNull()
  rerender(<MainPageSteamMastery games={[game(1, { numAwarded: 5, pctWon: 50 })]} />)
  expect(container.querySelector('[class*="grid-cols-[3fr_2fr]"]')).not.toBeNull()
})
