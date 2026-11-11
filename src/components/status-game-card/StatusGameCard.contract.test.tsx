// The opened details fetch; the card only decides when they appear.
jest.mock('@/components/statusGameList/status-game-item-detail/StatusGameItemDetail', () => ({
  __esModule: true,
  default: ({ category }: { category?: string }) => <div data-testid="detail">{category}</div>,
}))
jest.mock('@/components/steam/steam-library-detail/SteamLibraryDetail', () => ({
  __esModule: true,
  default: ({ category }: { category?: string }) => <div data-testid="detail">{category}</div>,
}))
jest.mock('@/components/psn/psn-library-detail/PsnLibraryDetail', () => ({
  __esModule: true,
  default: ({ category }: { category?: string }) => <div data-testid="detail">{category}</div>,
}))
jest.mock('@/components/xbox/xbox-library-detail/XboxLibraryDetail', () => ({
  __esModule: true,
  default: ({ category }: { category?: string }) => <div data-testid="detail">{category}</div>,
}))
jest.mock('@/components/pin-toggle-button/PinToggleButton', () => ({
  PinToggleButton: ({ gameId, source = 'ra' }: { gameId: number; source?: string }) => <span data-testid="pin">{source}:{gameId}</span>,
}))
jest.mock('@/components/hide-game-button/HideGameButton', () => ({
  __esModule: true,
  default: ({ gameId, source }: { gameId: number; source: string }) => <span data-testid="hide">{source}:{gameId}</span>,
}))

import type { ReactElement } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { en } from '@/translations/en'
import { OpenCardProvider } from '@/context/OpenCardContext'
import { toSteamGameProgress } from '@/utils/steamMappers'
import { psnGameFixture } from '@/test-utils/psnFixtures'
import { xboxGameFixture } from '@/test-utils/xboxFixtures'
import type { CategoryGame } from '@/hooks/useGamesByCategory'
import StatusGameItem from '@/components/statusGameList/StatusGameItem'
import SteamStatusGameItem from '@/components/steam/steam-status-game-item/SteamStatusGameItem'
import PsnStatusGameItem from '@/components/psn/psn-status-game-item/PsnStatusGameItem'
import XboxStatusGameItem from '@/components/xbox/xbox-status-game-item/XboxStatusGameItem'

/** What a test asks of a card; each platform builds its own game from it. */
type Want = { category?: string; id?: number; done?: boolean; minutes?: number | null; lastPlayed?: string | null; finishedAt?: string | null }

type Platform = {
  name: string
  card: (want?: Want) => ReactElement
  id: number
  href: string
  source: string
  /** Halfway through: 5 of 10 (RA), 50 of 100 (the rest). */
  progress: string
  expand: { show: string; hide: string }
  /** The chip that says a game is finished, where the platform has one. */
  mark?: string
  /** Whether the card shows the play time and a completion date (RA's lines are its own). */
  lines?: boolean
}

const ra = (want: Want): CategoryGame =>
  ({ GameID: want.id ?? 1, ID: String(want.id ?? 1), Title: 'Sly Cooper', ConsoleID: 21, ConsoleName: 'PS2', ImageIcon: '/icon.png', MaxPossible: 10, NumAwarded: 5, PctWon: '0.5', HardcoreMode: '0'}) as unknown as CategoryGame

const PLATFORMS: Platform[] = [
  {
    name: 'RetroAchievements',
    card: (w = {}) => <StatusGameItem game={ra(w)} extra={{ awards: [] }} category={w.category} />,
    id: 1,
    href: '/gameInfo/1',
    source: 'ra',
    progress: `5 / 10 ${en.statusGameItem.achievements}`,
    expand: { show: en.cards.showAchievements, hide: en.cards.hideAchievements },
  },
  {
    name: 'Steam',
    card: (w = {}) => {
      const game = {
        ...toSteamGameProgress({ appid: w.id ?? 620, name: 'Portal 2', playtime_forever: w.minutes ?? 0, has_community_visible_stats: true, rtime_last_played: w.lastPlayed === null ? 0 : 1788802145 }),
        achievementsLoaded: true, maxPossible: 100, numAwarded: w.done ? 100 : 50, pctWon: w.done ? 100 : 50, lastUnlock: w.finishedAt ?? null,
      }
      return <SteamStatusGameItem game={game} category={w.category} />
    },
    id: 620,
    href: '/steamGame/620',
    source: 'steam',
    progress: `50 / 100 ${en.steam.achievements}`,
    expand: { show: en.cards.showAchievements, hide: en.cards.hideAchievements },
    mark: en.steam.perfect,
    lines: true,
  },
  {
    name: 'PlayStation',
    card: (w = {}) => (
      <PsnStatusGameItem
        game={psnGameFixture({
          id: w.id ?? 100, title: 'Portal 2', maxPossible: 100, numAwarded: w.done ? 100 : 50, pctWon: w.done ? 100 : 50, earned: { bronze: 0, silver: 0, gold: 0, platinum: w.done ? 1 : 0 },
          playtimeMinutes: w.minutes ?? null, lastPlayed: w.lastPlayed === undefined ? '2026-01-02T00:00:00Z' : w.lastPlayed, completedAt: w.finishedAt ?? null,
        })}
        category={w.category}
      />
    ),
    id: 100,
    href: '/psnGame/NPWR00001_00',
    source: 'psn',
    progress: '50 / 100 trophies',
    expand: { show: en.psn.showTrophies, hide: en.psn.hideTrophies },
    mark: en.psn.platinum,
    lines: true,
  },
  {
    name: 'Xbox',
    card: (w = {}) => (
      <XboxStatusGameItem
        game={xboxGameFixture({
          id: w.id ?? 1738914043, title: 'Portal 2', maxPossible: 100, numAwarded: w.done ? 100 : 50, totalKnown: true, pctWon: w.done ? 100 : 50,
          playtimeMinutes: w.minutes ?? null, lastPlayed: w.lastPlayed === undefined ? '2026-01-02T00:00:00Z' : w.lastPlayed, completedAt: w.finishedAt ?? null,
        })}
        category={w.category}
      />
    ),
    id: 1738914043,
    href: '/xboxGame/1738914043',
    source: 'xbox',
    progress: '50 / 100 achievements',
    expand: { show: en.xbox.showAchievements, hide: en.xbox.hideAchievements },
    mark: en.steam.perfect,
    lines: true,
  },
]

const title = (p: Platform) => (p.name === 'RetroAchievements' ? 'Sly Cooper' : 'Portal 2')

describe.each(PLATFORMS)('a status card: $name', (p) => {
  test("the title and the cover open the game's page, the cover not a second tab stop", () => {
    render(p.card())
    const links = screen.getAllByRole('link', { name: title(p) })
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveAttribute('href', p.href)
  })

  test('says its progress in words and in a bar', () => {
    render(p.card())
    expect(screen.getByText(p.progress)).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: title(p) })).toHaveAttribute('aria-valuenow', '50')
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  test('can be hidden and pinned, as this platform', () => {
    render(p.card())
    expect(screen.getByTestId('hide')).toHaveTextContent(`${p.source}:${p.id}`)
    expect(screen.getByTestId('pin')).toHaveTextContent(`${p.source}:${p.id}`)
  })

  test('opens its detail for the list it is in, in its own row, and shuts it again', () => {
    const { container } = render(p.card({ category: 'completed' }))
    const open = screen.getByRole('button', { name: `${p.expand.show}: ${title(p)}` })
    expect(open).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByTestId('detail')).not.toBeInTheDocument()

    fireEvent.click(open)
    const hide = screen.getByRole('button', { name: `${p.expand.hide}: ${title(p)}` })
    expect(hide).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('detail')).toHaveTextContent('completed')
    const row = document.getElementById(hide.getAttribute('aria-controls')!)!
    expect(row).toContainElement(screen.getByTestId('detail'))
    expect(container.firstElementChild).not.toContainElement(row)

    fireEvent.click(hide)
    expect(screen.getByRole('button', { name: `${p.expand.show}: ${title(p)}` })).toHaveAttribute('aria-expanded', 'false')
  })

  test('no link sits inside the expand button, which is stretched over the card', () => {
    render(p.card())
    expect(screen.getByRole('button', { name: `${p.expand.show}: ${title(p)}` }).querySelector('a')).toBeNull()
  })

  test('opening a card closes the one that was open', () => {
    render(
      <OpenCardProvider>
        {p.card()}
        {p.card({ id: 99 })}
      </OpenCardProvider>,
    )
    const [first] = screen.getAllByRole('button', { name: new RegExp(`^${p.expand.show}: `) })
    fireEvent.click(first)
    expect(screen.getAllByRole('button', { expanded: true })).toHaveLength(1)
    fireEvent.click(screen.getAllByRole('button', { name: new RegExp(`^${p.expand.show}: `) })[0])
    expect(screen.getAllByRole('button', { expanded: true })).toHaveLength(1)
    expect(screen.getAllByTestId('detail')).toHaveLength(1)
  })
})

describe.each(PLATFORMS.filter((p) => p.mark))('a finished game: $name', (p) => {
  test('is marked in words, and an unfinished one is not', () => {
    const { unmount } = render(p.card({ done: true }))
    expect(screen.getByText(p.mark!, { exact: false })).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
    unmount()
    render(p.card())
    expect(screen.queryByText(p.mark!, { exact: false })).not.toBeInTheDocument()
  })
})

describe.each(PLATFORMS.filter((p) => p.lines))('the lines under the bar: $name', (p) => {
  test('the play time, when there is some', () => {
    const { unmount } = render(p.card({ minutes: 600 }))
    expect(screen.getByText(`${en.steam.playtime} · 10 ${en.steam.hoursShort}`)).toBeInTheDocument()
    unmount()
    render(p.card({ minutes: null }))
    if (p.name !== 'Steam') expect(screen.queryByText(new RegExp(`${en.steam.playtime} ·`))).not.toBeInTheDocument()
  })

  test('on Completed it says when the game was finished, not when it was last played', () => {
    render(p.card({ category: 'completed', finishedAt: '2021-12-23T00:26:33Z', lastPlayed: '2026-10-25T14:18:57Z' }))
    expect(screen.getByText(new RegExp(en.libraryDetail.finished))).toHaveTextContent('Dec 23, 2021')
    expect(screen.queryByText(new RegExp(en.steam.lastPlayed))).not.toBeInTheDocument()
  })

  test('with no finish date, or in another list, it keeps the last session', () => {
    const { unmount } = render(p.card({ category: 'completed', finishedAt: null }))
    expect(screen.getByText(new RegExp(en.steam.lastPlayed))).toBeInTheDocument()
    unmount()
    render(p.card({ category: 'playing', finishedAt: '2021-12-23T00:26:33Z' }))
    expect(screen.getByText(new RegExp(en.steam.lastPlayed))).toBeInTheDocument()
    expect(screen.queryByText(new RegExp(en.libraryDetail.finished))).not.toBeInTheDocument()
  })
})
