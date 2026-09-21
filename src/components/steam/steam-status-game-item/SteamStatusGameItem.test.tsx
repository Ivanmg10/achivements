import { render, screen, fireEvent } from '@testing-library/react'
import SteamStatusGameItem from './SteamStatusGameItem'
import { en } from '@/translations/en'
import { toSteamGameProgress } from '@/utils/steamMappers'
import type { SteamGameProgress } from '@/types/steam'

jest.mock('@/components/steam/steam-game-item/steam-game-item-achievements/SteamGameItemAchievements', () => ({
  __esModule: true,
  default: ({ appId, expectedCount, badgeSize }: { appId: number; expectedCount?: number; badgeSize: number }) => (
    <div data-testid="achievements">{appId}:{String(expectedCount)}:{badgeSize}</div>
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
const perfect = { achievementsLoaded: true, maxPossible: 84, numAwarded: 84, pctWon: 100 }

test('lays out like an RA card: cover, title, Steam chip, counts, bar with %', () => {
  const { container } = render(<SteamStatusGameItem game={game(partial)} />)

  expect(container.querySelector('img')?.getAttribute('src')).toContain('/377160/library_600x900.jpg')
  expect(screen.getByText('Fallout 4')).toBeInTheDocument()
  expect(screen.getByText('Steam')).toBeInTheDocument()
  expect(screen.getByText(`42 / 84 ${en.steam.achievements}`)).toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: 'Fallout 4' }).getAttribute('aria-valuenow')).toBe('50')
  expect(screen.getByText('50%')).toBeInTheDocument()
})

test('shows playtime where RA shows points, and the last played date', () => {
  render(<SteamStatusGameItem game={game()} />)
  expect(screen.getByText(`${en.steam.playtime} · 484 h`)).toBeInTheDocument()
  expect(screen.getByText(`${en.steam.lastPlayed} ·`, { exact: false })).toBeInTheDocument()
  expect(screen.queryByText(en.steam.neverPlayed, { exact: false })).not.toBeInTheDocument()
})

test('says never played for an untouched game', () => {
  render(<SteamStatusGameItem game={game({ lastPlayed: null, playtimeForever: 0 })} />)
  expect(screen.getByText(`${en.steam.lastPlayed} · ${en.steam.neverPlayed}`)).toBeInTheDocument()
})

describe('a perfect game', () => {
  test('gets the Perfect chip, green counts and a green ring — not colour alone', () => {
    const { container } = render(<SteamStatusGameItem game={game(perfect)} />)
    expect(screen.getByText(`★ ${en.steam.perfect}`)).toBeInTheDocument()
    expect(screen.getByText(`84 / 84 ${en.steam.achievements}`).className).toContain('text-green-400')
    expect(container.querySelector('.ring-2')).not.toBeNull()
  })

  test('an unfinished game has neither', () => {
    render(<SteamStatusGameItem game={game(partial)} />)
    expect(screen.queryByText(`★ ${en.steam.perfect}`)).not.toBeInTheDocument()
  })
})

test('says progress is unknown, without a bar, when counts are not loaded', () => {
  render(<SteamStatusGameItem game={game()} />)
  expect(screen.getByText(en.steam.progressUnknown)).toBeInTheDocument()
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
})

test('says the game has no achievements when it has no stats', () => {
  render(<SteamStatusGameItem game={game({ hasStats: false })} />)
  expect(screen.getByText(en.steam.noAchievements)).toBeInTheDocument()
})

describe('links', () => {
  test('title and cover open the Steam game page, the cover out of the tab order', () => {
    const { container } = render(<SteamStatusGameItem game={game()} />)
    expect(screen.getByRole('link', { name: 'Fallout 4' }).getAttribute('href')).toBe('/steamGame/377160')

    const links = container.querySelectorAll('a[href="/steamGame/377160"]')
    expect(links).toHaveLength(2)
    expect(links[0].getAttribute('tabindex')).toBe('-1')
  })

  test('no link sits inside the expand button', () => {
    render(<SteamStatusGameItem game={game()} />)
    expect(screen.getByRole('button', { name: /achievements: / }).querySelector('a')).toBeNull()
  })
})

describe('expanding', () => {
  test('is a real button naming its action and the game', () => {
    render(<SteamStatusGameItem game={game(partial)} />)
    const button = screen.getByRole('button', { name: `${en.steam.showAchievements}: Fallout 4` })
    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByTestId('achievements')).not.toBeInTheDocument()
  })

  test('opens the 48px badge grid, sized to the known count, and closes again', () => {
    render(<SteamStatusGameItem game={game(partial)} />)
    fireEvent.click(screen.getByRole('button', { name: /achievements: / }))

    const button = screen.getByRole('button', { name: `${en.steam.hideAchievements}: Fallout 4` })
    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByTestId('achievements')).toHaveTextContent('377160:84:48')
    expect(document.getElementById(button.getAttribute('aria-controls')!)).not.toBeNull()

    fireEvent.click(button)
    expect(screen.queryByTestId('achievements')).not.toBeInTheDocument()
  })

  test('does not fetch achievements for a game without stats', () => {
    render(<SteamStatusGameItem game={game({ hasStats: false })} />)
    fireEvent.click(screen.getByRole('button', { name: /achievements: / }))
    expect(screen.queryByTestId('achievements')).not.toBeInTheDocument()
    expect(screen.getAllByText(en.steam.noAchievements)).toHaveLength(2)
  })
})

test('takes a ref and style so a masonry list can position it', () => {
  const ref = jest.fn()
  const { container } = render(
    <SteamStatusGameItem game={game()} itemRef={ref} style={{ position: 'absolute', top: 12 }} />,
  )
  expect(ref).toHaveBeenCalledWith(container.firstChild)
  expect((container.firstChild as HTMLElement).style.top).toBe('12px')
})

test('can be pinned as a Steam game, like RA cards', () => {
  render(<SteamStatusGameItem game={game()} />)
  expect(screen.getByRole('button', { name: en.pinnedGames.pinAria })).toBeInTheDocument()
})
