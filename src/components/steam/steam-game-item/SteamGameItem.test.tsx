import { render, screen, fireEvent } from '@testing-library/react'
import SteamGameItem from './SteamGameItem'
import { en } from '@/translations/en'
import { toSteamGameProgress } from '@/utils/steamMappers'
import type { SteamGameProgress } from '@/types/steam'

jest.mock('@/components/steam/steam-recently-played-expanded/SteamRecentlyPlayedExpanded', () => ({
  __esModule: true,
  default: ({ game }: { game: { id: number; maxPossible: number } }) => (
    <div data-testid="achievements">achievements for {game.id} ({game.maxPossible})</div>
  ),
}))

function game(overrides: Partial<SteamGameProgress> = {}): SteamGameProgress {
  return {
    ...toSteamGameProgress({
      appid: 620,
      name: 'Portal 2',
      playtime_forever: 90,
      has_community_visible_stats: true,
      img_icon_url: 'hash',
      rtime_last_played: 1705320000,
    }),
    ...overrides,
  }
}

const loaded = { achievementsLoaded: true, maxPossible: 50, numAwarded: 20, pctWon: 40 }

test('shows title, platform, playtime and last played', () => {
  render(<SteamGameItem game={game()} />)

  expect(screen.getByText('Portal 2')).toBeInTheDocument()
  expect(screen.getByText('Steam')).toBeInTheDocument()
  expect(screen.getByText('1.5 h', { exact: false })).toBeInTheDocument()
  expect(screen.getByText('15 Jan 2024')).toBeInTheDocument()
})

test('labels playtime for screen readers', () => {
  render(<SteamGameItem game={game()} />)
  expect(screen.getByText(`${en.steam.playtime}:`, { exact: false })).toBeInTheDocument()
})

test('shows counts and a progress bar once counts are loaded', () => {
  render(<SteamGameItem game={game(loaded)} />)

  expect(screen.getByText(`20/50 ${en.steam.achievements}`)).toBeInTheDocument()
  const bar = screen.getByRole('progressbar', { name: 'Portal 2' })
  expect(bar.getAttribute('aria-valuenow')).toBe('40')
})

test('says progress is unknown, with no bar, when counts are not loaded', () => {
  render(<SteamGameItem game={game()} />)
  expect(screen.getByText(en.steam.progressUnknown)).toBeInTheDocument()
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
})

test('says the game has no achievements when it has no stats', () => {
  render(<SteamGameItem game={game({ hasStats: false })} />)
  expect(screen.getByText(en.steam.noAchievements)).toBeInTheDocument()
})

test('shows no bar for a loaded game with zero achievements', () => {
  render(<SteamGameItem game={game({ achievementsLoaded: true, maxPossible: 0 })} />)
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
})

test('omits the date when the game was never played', () => {
  render(<SteamGameItem game={game({ lastPlayed: null })} />)
  expect(screen.queryByText('15 Jan 2024')).not.toBeInTheDocument()
})

test('shows the 600×900 cover rather than the 32×32 library icon', () => {
  const { container } = render(<SteamGameItem game={game()} />)
  expect(container.querySelector('img')?.getAttribute('src')).toBe(
    'https://cdn.akamai.steamstatic.com/steam/apps/620/library_600x900.jpg',
  )
})

describe('links to the game page', () => {
  test('the title links to the Steam game page', () => {
    render(<SteamGameItem game={game()} />)
    expect(screen.getByRole('link', { name: 'Portal 2' }).getAttribute('href')).toBe('/steamGame/620')
  })

  test('the cover links there too, without a second stop in the tab order', () => {
    const { container } = render(<SteamGameItem game={game()} />)
    const links = container.querySelectorAll('a[href="/steamGame/620"]')
    expect(links).toHaveLength(2)
    expect(links[0].getAttribute('tabindex')).toBe('-1')
    expect(links[0].getAttribute('aria-hidden')).toBe('true')
  })

  test('no link sits inside the expand button', () => {
    render(<SteamGameItem game={game()} />)
    expect(screen.getByRole('button', { name: /achievements: / }).querySelector('a')).toBeNull()
  })
})

describe('expansion', () => {
  test('is a real button that reports its state and names the game', () => {
    render(<SteamGameItem game={game()} />)
    const button = screen.getByRole('button', { name: `${en.steam.showAchievements}: Portal 2` })
    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByTestId('achievements')).not.toBeInTheDocument()
  })

  test('toggles locally and loads achievements only when opened', () => {
    render(<SteamGameItem game={game()} />)
    const button = screen.getByRole('button', { name: /achievements: / })

    fireEvent.click(button)
    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByTestId('achievements')).toHaveTextContent('achievements for 620')

    const panelId = button.getAttribute('aria-controls')
    expect(document.getElementById(panelId!)).not.toBeNull()

    fireEvent.click(button)
    expect(screen.queryByTestId('achievements')).not.toBeInTheDocument()
  })

  test('does not fetch achievements for a game without stats', () => {
    render(<SteamGameItem game={game({ hasStats: false })} />)
    fireEvent.click(screen.getByRole('button', { name: /achievements: / }))

    expect(screen.queryByTestId('achievements')).not.toBeInTheDocument()
    expect(screen.getAllByText(en.steam.noAchievements)).toHaveLength(2)
  })

  test('defers to the parent when controlled', () => {
    const onToggle = jest.fn()
    const { rerender } = render(<SteamGameItem game={game()} expanded={false} onToggle={onToggle} />)

    fireEvent.click(screen.getByRole('button', { name: /achievements: / }))
    expect(onToggle).toHaveBeenCalledTimes(1)
    expect(screen.queryByTestId('achievements')).not.toBeInTheDocument()

    rerender(<SteamGameItem game={game()} expanded onToggle={onToggle} />)
    expect(screen.getByTestId('achievements')).toBeInTheDocument()
  })
})

test('accepts extra root classes so it can fill a layout slot', () => {
  const { container } = render(<SteamGameItem game={game()} className="h-full" />)
  expect((container.firstChild as HTMLElement).className).toContain('h-full')
})

test('the expand button names the action it will take', () => {
  render(<SteamGameItem game={game()} />)
  fireEvent.click(screen.getByRole('button', { name: /achievements: / }))
  expect(screen.getByRole('button', { name: `${en.steam.hideAchievements}: Portal 2` })).toBeInTheDocument()
})

test('opens the same dashboard RA games open into, for this game', () => {
  render(<SteamGameItem game={game(loaded)} />)
  fireEvent.click(screen.getByRole('button', { name: /achievements: / }))
  expect(screen.getByTestId('achievements')).toHaveTextContent('achievements for 620 (50)')
})

test('can be pinned as a Steam game, from outside the expand button', () => {
  render(<SteamGameItem game={game()} />)
  const pin = screen.getByRole('button', { name: en.pinnedGames.pinAria })
  expect(pin.closest('button[aria-expanded]')).toBeNull()
})
