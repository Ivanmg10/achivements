import { render, screen, fireEvent } from '@testing-library/react'
import SteamStatusGameItem from './SteamStatusGameItem'
import { en } from '@/translations/en'
import { toSteamGameProgress } from '@/utils/steamMappers'
import type { SteamGameProgress } from '@/types/steam'

jest.mock('@/components/steam/steam-library-detail/SteamLibraryDetail', () => ({
  __esModule: true,
  default: ({ game, category }: { game: { id: number }; category?: string }) => (
    <div data-testid="achievements">{game.id}:{category}</div>
  ),
}))

function game(overrides: Partial<SteamGameProgress> = {}): SteamGameProgress {
  return {
    ...toSteamGameProgress({
      appid: 377160,
      name: 'Fallout 4',
      playtime_forever: 29055,
      has_community_visible_stats: true,
      rtime_last_played: 1788802145,
    }),
    ...overrides,
  }
}

const partial = { achievementsLoaded: true, maxPossible: 84, numAwarded: 42, pctWon: 50 }

test("the cover is Steam's icon and the chip says Steam", () => {
  const { container } = render(<SteamStatusGameItem game={game(partial)} />)
  // The first image is the blurred backdrop; the cover is the one inside the link.
  expect(container.querySelector('a img')?.getAttribute('src')).toBe('/api/steam/icon?appid=377160')
  expect(screen.getByText('Steam')).toBeInTheDocument()
})

test('shows the play time and the last played date', () => {
  render(<SteamStatusGameItem game={game()} />)
  expect(screen.getByText(`${en.steam.playtime} · 484 h`)).toBeInTheDocument()
  expect(screen.getByText(`${en.steam.lastPlayed} ·`, { exact: false })).toBeInTheDocument()
  expect(screen.queryByText(en.steam.neverPlayed, { exact: false })).not.toBeInTheDocument()
})

test('says never played for an untouched game', () => {
  render(<SteamStatusGameItem game={game({ lastPlayed: null, playtimeForever: 0 })} />)
  expect(screen.getByText(`${en.steam.lastPlayed} · ${en.steam.neverPlayed}`)).toBeInTheDocument()
})

test('a perfect game is green in its counts as well as marked', () => {
  render(<SteamStatusGameItem game={game({ achievementsLoaded: true, maxPossible: 84, numAwarded: 84, pctWon: 100 })} />)
  expect(screen.getByText(`84 / 84 ${en.steam.achievements}`).className).toContain('text-success')
})

test('says progress is unknown, without a bar, when counts are not loaded', () => {
  render(<SteamStatusGameItem game={game()} />)
  expect(screen.getByText(en.steam.progressUnknown)).toBeInTheDocument()
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
})

test('a game without stats says so, and opens to that instead of a detail', () => {
  render(<SteamStatusGameItem game={game({ hasStats: false })} />)
  expect(screen.getByText(en.steam.noAchievements)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /achievements: / }))
  expect(screen.queryByTestId('achievements')).not.toBeInTheDocument()
  expect(screen.getAllByText(en.steam.noAchievements)).toHaveLength(2)
})

test('opens the detail with the game and its list', () => {
  render(<SteamStatusGameItem game={game(partial)} category="playing" />)
  fireEvent.click(screen.getByRole('button', { name: `${en.steam.showAchievements}: Fallout 4` }))
  expect(screen.getByTestId('achievements')).toHaveTextContent('377160:playing')
})
