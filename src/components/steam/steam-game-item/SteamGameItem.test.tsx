import { render, screen, fireEvent } from '@testing-library/react'
import SteamGameItem from './SteamGameItem'
import { en } from '@/translations/en'
import { toSteamGameProgress } from '@/utils/steamMappers'
import type { SteamGameProgress } from '@/types/steam'

jest.mock('./steam-game-item-achievements/SteamGameItemAchievements', () => ({
  __esModule: true,
  default: ({ appId }: { appId: number }) => <div data-testid="achievements">achievements for {appId}</div>,
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

test('falls back to a Steam placeholder when there is no icon', () => {
  const { container } = render(<SteamGameItem game={game({ imageIcon: '' })} />)
  expect(container.querySelector('img')).toBeNull()
  expect(screen.getAllByTestId('IconBrandSteam').length).toBeGreaterThan(1)
})

describe('expansion', () => {
  test('is a real button that reports its state', () => {
    render(<SteamGameItem game={game()} />)
    const button = screen.getByRole('button')
    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByTestId('achievements')).not.toBeInTheDocument()
  })

  test('toggles locally and loads achievements only when opened', () => {
    render(<SteamGameItem game={game()} />)
    const button = screen.getByRole('button')

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
    fireEvent.click(screen.getByRole('button'))

    expect(screen.queryByTestId('achievements')).not.toBeInTheDocument()
    expect(screen.getAllByText(en.steam.noAchievements)).toHaveLength(2)
  })

  test('defers to the parent when controlled', () => {
    const onToggle = jest.fn()
    const { rerender } = render(<SteamGameItem game={game()} expanded={false} onToggle={onToggle} />)

    fireEvent.click(screen.getByRole('button'))
    expect(onToggle).toHaveBeenCalledTimes(1)
    expect(screen.queryByTestId('achievements')).not.toBeInTheDocument()

    rerender(<SteamGameItem game={game()} expanded onToggle={onToggle} />)
    expect(screen.getByTestId('achievements')).toBeInTheDocument()
  })
})
