jest.mock('@/hooks/useGameProgression', () => ({ useGameProgression: jest.fn() }))
jest.mock('@/context/SteamGamesDataContext', () => ({ useSteamGamesData: jest.fn() }))
jest.mock('@/context/PsnGamesDataContext', () => ({ usePsnGamesData: jest.fn() }))
jest.mock('@/context/XboxGamesDataContext', () => ({ useXboxGamesData: jest.fn() }))
jest.mock('@/context/PinnedGamesContext', () => ({
  usePinnedGames: () => ({ isPinned: () => true, pinGame: jest.fn(), unpinGame: jest.fn() }),
}))
jest.mock('@dnd-kit/sortable', () => ({
  useSortable: jest.fn(() => ({ attributes: {}, listeners: {}, setNodeRef: () => {}, transform: null, transition: undefined, isDragging: false })),
}))
jest.mock('@dnd-kit/utilities', () => ({ CSS: { Transform: { toString: () => '' } } }))
jest.mock('@/components/steam/steam-game-image/SteamGameImage', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@/components/recently-played-feed/ra-recently-played-expanded/RaRecentlyPlayedExpanded', () => ({
  __esModule: true,
  default: () => <div data-testid="panel" />,
}))
jest.mock('@/components/steam/steam-recently-played-expanded/SteamRecentlyPlayedExpanded', () => ({ __esModule: true, default: () => <div data-testid="panel" /> }))
jest.mock('@/components/psn/psn-recently-played-expanded/PsnRecentlyPlayedExpanded', () => ({ __esModule: true, default: () => <div data-testid="panel" /> }))
jest.mock('@/components/xbox/xbox-recently-played-expanded/XboxRecentlyPlayedExpanded', () => ({ __esModule: true, default: () => <div data-testid="panel" /> }))

import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import PinnedGameRow from '../pinned-game-row/PinnedGameRow'
import SteamPinnedGameRow from '../steam-pinned-game-row/SteamPinnedGameRow'
import PsnPinnedGameRow from '../psn-pinned-game-row/PsnPinnedGameRow'
import XboxPinnedGameRow from '../xbox-pinned-game-row/XboxPinnedGameRow'
import { useGameProgression } from '@/hooks/useGameProgression'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import { toSteamGameProgress } from '@/utils/steamMappers'
import { xboxGameFixture } from '@/test-utils/xboxFixtures'
import { en } from '@/translations/en'

type Row = { isOpen: boolean; onToggle: () => void }
type Platform = {
  name: string
  /** The key the row sorts under, and where its title leads. */
  sortKey: string
  href: string
  /** The platform line before the bar. */
  label: string
  /** The line under the bar: 4 of 10 earned. */
  counts: RegExp
  show: string
  hide: string
  /** The game is in the platform's list (`ready`), still loading, or the list has no such game. */
  data: (state: 'ready' | 'loading' | 'gone') => void
  row: (p: Row) => ReactElement
}

const ID = 100
const PLATFORMS: Platform[] = [
  {
    name: 'RetroAchievements',
    sortKey: `ra:${ID}`,
    href: `/gameInfo/${ID}`,
    label: 'SNES',
    counts: /4\/10/,
    show: `${en.cards.showAchievements}: Zelda`,
    hide: `${en.cards.hideAchievements}: Zelda`,
    data: (s) =>
      (useGameProgression as jest.Mock).mockReturnValue({
        game: s === 'ready' ? { ID, Title: 'Zelda', ImageIcon: '/i.png', ConsoleName: 'SNES', NumAchievements: 10, NumAwardedToUser: 4, NumAwardedToUserHardcore: 2, NumDistinctPlayers: 9, Achievements: {} } : null,
        isLoading: s === 'loading',
        error: s === 'gone' ? 'failed' : null,
        refetch: jest.fn(),
      }),
    row: (p) => <PinnedGameRow gameId={ID} {...p} />,
  },
  {
    name: 'Steam',
    sortKey: `steam:${ID}`,
    href: `/steamGame/${ID}`,
    label: 'Steam',
    counts: /4\/10/,
    show: `${en.cards.showAchievements}: Zelda`,
    hide: `${en.cards.hideAchievements}: Zelda`,
    data: (s) =>
      (useSteamGamesData as jest.Mock).mockReturnValue({
        library: s === 'ready' ? [{ ...toSteamGameProgress({ appid: ID, name: 'Zelda', playtime_forever: 60, has_community_visible_stats: true }), achievementsLoaded: true, maxPossible: 10, numAwarded: 4, pctWon: 40 }] : [],
        recent: [],
        libraryLoading: s === 'loading',
      }),
    row: (p) => <SteamPinnedGameRow appId={ID} {...p} />,
  },
  {
    name: 'PlayStation',
    sortKey: `psn:${ID}`,
    href: '/psnGame/NPWR00001_00',
    label: 'PS5',
    counts: /4\/10 trophies/,
    show: `${en.psn.showTrophies}: Zelda`,
    hide: `${en.psn.hideTrophies}: Zelda`,
    data: (s) =>
      (usePsnGamesData as jest.Mock).mockReturnValue({
        fullLibrary: s === 'ready' ? [{ _source: 'psn', id: ID, titleId: 'NPWR00001_00', title: 'Zelda', imageIcon: '', consoleName: 'PS5', maxPossible: 10, numAwarded: 4, pctWon: 40 }] : [],
        libraryLoading: s === 'loading',
      }),
    row: (p) => <PsnPinnedGameRow gameId={ID} {...p} />,
  },
  {
    name: 'Xbox',
    sortKey: `xbox:${ID}`,
    href: `/xboxGame/${ID}`,
    label: 'Xbox Series',
    counts: /4\/10 achievements/,
    show: `${en.xbox.showAchievements}: Zelda`,
    hide: `${en.xbox.hideAchievements}: Zelda`,
    data: (s) =>
      (useXboxGamesData as jest.Mock).mockReturnValue({
        fullLibrary: s === 'ready' ? [xboxGameFixture({ id: ID, titleId: String(ID), title: 'Zelda', consoleName: 'Xbox Series', maxPossible: 10, numAwarded: 4, totalKnown: true, pctWon: 40 })] : [],
        libraryLoading: s === 'loading',
      }),
    row: (p) => <XboxPinnedGameRow gameId={ID} {...p} />,
  },
]

describe.each(PLATFORMS)('a pinned game on the home: $name', (p) => {
  const onToggle = jest.fn()
  beforeEach(() => {
    jest.clearAllMocks()
    p.data('ready')
  })

  test('shows the title as a link to the game, the platform, the bar and how many are earned', () => {
    render(p.row({ isOpen: false, onToggle }))
    expect(screen.getByRole('link', { name: 'Zelda' })).toHaveAttribute('href', p.href)
    expect(screen.getByText(p.label)).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Zelda' })).toBeInTheDocument()
    expect(screen.getByText(p.counts)).toBeInTheDocument()
  })

  test('sorts under its platform and game, a labelled handle, and an unpin button', () => {
    render(p.row({ isOpen: false, onToggle }))
    expect(useSortable).toHaveBeenCalledWith({ id: p.sortKey })
    expect(screen.getByRole('button', { name: en.cards.dragToReorder })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: en.pinnedGames.unpinAria })).toBeInTheDocument()
  })

  test('opens and closes its achievements from a button that says what it does', () => {
    const { rerender } = render(p.row({ isOpen: false, onToggle }))
    const expand = screen.getByRole('button', { name: p.show })
    expect(expand).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByTestId('panel')).not.toBeInTheDocument()
    fireEvent.click(expand)
    expect(onToggle).toHaveBeenCalledTimes(1)
    rerender(p.row({ isOpen: true, onToggle }))
    expect(screen.getByRole('button', { name: p.hide })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('panel')).toBeInTheDocument()
  })

  test('unpinning does not open the row', () => {
    render(p.row({ isOpen: false, onToggle }))
    fireEvent.click(screen.getByRole('button', { name: en.pinnedGames.unpinAria }))
    expect(onToggle).not.toHaveBeenCalled()
  })

  test('holds its place in the list while the library loads', () => {
    p.data('loading')
    const { container } = render(p.row({ isOpen: false, onToggle }))
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Zelda' })).not.toBeInTheDocument()
    expect(useSortable).toHaveBeenCalledWith({ id: p.sortKey })
  })
})

describe.each(PLATFORMS.filter((p) => p.name === 'PlayStation' || p.name === 'Xbox'))('a pin whose game is gone: $name', (p) => {
  test('stays in the list and can still be unpinned', () => {
    p.data('gone')
    render(p.row({ isOpen: false, onToggle: jest.fn() }))
    expect(screen.queryByRole('link', { name: 'Zelda' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: en.pinnedGames.unpinAria })).toBeInTheDocument()
  })
})
