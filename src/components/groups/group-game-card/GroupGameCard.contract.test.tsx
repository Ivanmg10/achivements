jest.mock('@/context/SteamGamesDataContext', () => ({ useSteamGamesData: jest.fn() }))
jest.mock('@/context/PsnGamesDataContext', () => ({ usePsnGamesData: jest.fn() }))
jest.mock('@/context/XboxGamesDataContext', () => ({ useXboxGamesData: jest.fn() }))
jest.mock('@dnd-kit/sortable', () => ({
  useSortable: jest.fn(() => ({ attributes: {}, listeners: {}, setNodeRef: jest.fn(), transform: null, transition: undefined, isDragging: false })),
}))
jest.mock('@dnd-kit/utilities', () => ({ CSS: { Transform: { toString: () => '' } } }))
// The panels fetch; the card only decides when they appear.
jest.mock('../sortable-item/sortable-item-achievements/SortableItemAchievements', () => ({ __esModule: true, default: () => <div data-testid="panel" /> }))
jest.mock('@/components/steam/steam-game-item-achievements/SteamGameItemAchievements', () => ({ __esModule: true, default: () => <div data-testid="panel" /> }))
jest.mock('@/components/psn/psn-game-item-trophies/PsnGameItemTrophies', () => ({ __esModule: true, default: () => <div data-testid="panel" /> }))
jest.mock('@/components/xbox/xbox-game-item-achievements/XboxGameItemAchievements', () => ({ __esModule: true, default: () => <div data-testid="panel" /> }))

import type { ComponentType } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { useSortable } from '@dnd-kit/sortable'
import { en } from '@/translations/en'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import { toSteamGameProgress } from '@/utils/steamMappers'
import { xboxGameFixture } from '@/test-utils/xboxFixtures'
import { psnGameFixture } from '@/test-utils/psnFixtures'
import type { GameGroupItem } from '@/types/types'
import SortableItem from '../sortable-item/SortableItem'
import SteamSortableItem from '../steam-sortable-item/SteamSortableItem'
import PsnSortableItem from '../psn-sortable-item/PsnSortableItem'
import XboxSortableItem from '../xbox-sortable-item/XboxSortableItem'

type Props = { item: GameGroupItem; onRemove: (id: number) => void; draggable: boolean }

type Platform = {
  name: string
  Card: ComponentType<Props>
  item: GameGroupItem
  href: string
  /** What the stored counts (2 of 10) are written as. */
  stored: string
  expand: { show: string; hide: string }
  /** The platform's context answering with the game at 100 %, or with nothing. */
  finished(): void
  nothing(): void
  /** The chip that says a game is finished, where the platform has one. */
  mark?: string
}

const base = { id: 7, title: 'Halo', image_icon: '/a.png', console_name: 'NES', pct_won: '0.2', num_awarded: 2, max_possible: 10, points_won: 0, max_points: 0, position: 0, added_at: '2026-01-01' }

const PLATFORMS: Platform[] = [
  {
    name: 'RetroAchievements',
    Card: SortableItem,
    item: { ...base, source: 'ra', game_id: 100 },
    href: '/gameInfo/100',
    stored: `2 / 10 ${en.statusGameItem.achievements}`,
    expand: { show: en.cards.showAchievements, hide: en.cards.hideAchievements },
    finished: () => {},
    nothing: () => {},
  },
  {
    name: 'Steam',
    Card: SteamSortableItem,
    item: { ...base, source: 'steam', game_id: 620, console_name: 'Steam' },
    href: '/steamGame/620',
    stored: `2 / 10 ${en.steam.achievements}`,
    expand: { show: en.cards.showAchievements, hide: en.cards.hideAchievements },
    finished: () => {
      const game = { ...toSteamGameProgress({ appid: 620, name: 'Halo', playtime_forever: 120, has_community_visible_stats: true }), achievementsLoaded: true, maxPossible: 10, numAwarded: 10, pctWon: 100 }
      ;(useSteamGamesData as jest.Mock).mockReturnValue({ library: [game], recent: [] })
    },
    nothing: () => (useSteamGamesData as jest.Mock).mockReturnValue({ library: [], recent: [] }),
    mark: en.steam.perfect,
  },
  {
    name: 'PlayStation',
    Card: PsnSortableItem,
    item: { ...base, source: 'psn', game_id: 2018800, console_name: 'PlayStation' },
    href: '/psnGame/NPWR20188_00',
    stored: '2 / 10 trophies',
    expand: { show: en.psn.showTrophies, hide: en.psn.hideTrophies },
    finished: () =>
      (usePsnGamesData as jest.Mock).mockReturnValue({ fullLibrary: [psnGameFixture({ id: 2018800, title: 'Halo', maxPossible: 10, numAwarded: 10, pctWon: 100, earned: { bronze: 9, silver: 0, gold: 0, platinum: 1 } })] }),
    nothing: () => (usePsnGamesData as jest.Mock).mockReturnValue({ fullLibrary: [] }),
    mark: en.psn.platinum,
  },
  {
    name: 'Xbox',
    Card: XboxSortableItem,
    item: { ...base, source: 'xbox', game_id: 1738914043, console_name: 'Xbox' },
    href: '/xboxGame/1738914043',
    stored: '2 / 10 achievements',
    expand: { show: en.xbox.showAchievements, hide: en.xbox.hideAchievements },
    finished: () =>
      (useXboxGamesData as jest.Mock).mockReturnValue({ fullLibrary: [xboxGameFixture({ id: 1738914043, title: 'Halo', maxPossible: 10, numAwarded: 10, totalKnown: true, pctWon: 100 })] }),
    nothing: () => (useXboxGamesData as jest.Mock).mockReturnValue({ fullLibrary: [] }),
    mark: en.steam.perfect,
  },
]

function renderCard(p: Platform, over: Partial<Props> = {}) {
  p.nothing()
  return render(<p.Card item={p.item} onRemove={jest.fn()} draggable {...over} />)
}

beforeEach(() => jest.clearAllMocks())

describe.each(PLATFORMS)('a group game card: $name', (p) => {
  test('is sortable by its row id, and only while the group can be reordered', () => {
    renderCard(p)
    expect(useSortable).toHaveBeenCalledWith({ id: 7, disabled: false })
    expect(screen.getByRole('button', { name: en.cards.dragToReorder })).toBeInTheDocument()
  })

  test('has no drag handle when the group cannot be reordered', () => {
    renderCard(p, { draggable: false })
    expect(useSortable).toHaveBeenCalledWith({ id: 7, disabled: true })
    expect(screen.queryByRole('button', { name: en.cards.dragToReorder })).not.toBeInTheDocument()
  })

  test("opens the game's own page from one link, not two tab stops", () => {
    renderCard(p)
    const links = screen.getAllByRole('link', { name: 'Halo' })
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveAttribute('href', p.href)
  })

  test('says its progress from the counts stored with it, in words and in a bar', () => {
    renderCard(p)
    expect(screen.getByText(p.stored)).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Halo' })).toHaveAttribute('aria-valuenow', '20')
    expect(screen.getByText('20%')).toBeInTheDocument()
  })

  test('says when it was played and when it joined the group', () => {
    renderCard(p)
    expect(screen.getByText(en.groups.neverPlayed, { exact: false })).toBeInTheDocument()
    expect(screen.getByText(/added /, { exact: false })).toBeInTheDocument()
  })

  test('removes by row id, saying which game', () => {
    const onRemove = jest.fn()
    renderCard(p, { onRemove })
    fireEvent.click(screen.getByRole('button', { name: `${en.groups.removeGame}: Halo` }))
    expect(onRemove).toHaveBeenCalledWith(7)
  })

  test('opens its achievements, slides them shut again and keeps them out of reach while shut', () => {
    renderCard(p)
    const open = screen.getByRole('button', { name: `${p.expand.show}: Halo` })
    expect(open).toHaveAttribute('aria-expanded', 'false')
    const panel = document.getElementById(open.getAttribute('aria-controls')!)!
    expect(panel).toHaveAttribute('inert')
    expect(screen.queryByTestId('panel')).not.toBeInTheDocument()

    fireEvent.click(open)
    expect(screen.getByRole('button', { name: `${p.expand.hide}: Halo` })).toHaveAttribute('aria-expanded', 'true')
    expect(panel).not.toHaveAttribute('inert')
    expect(screen.getByTestId('panel')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: `${p.expand.hide}: Halo` }))
    expect(screen.getByRole('button', { name: `${p.expand.show}: Halo` })).toHaveAttribute('aria-expanded', 'false')
    expect(panel).toHaveAttribute('inert')
  })

  test('keeps the room of its detail line, so every card is as tall', () => {
    const { container } = renderCard(p)
    expect(container.textContent).toContain(' ')
  })
})

describe.each(PLATFORMS.filter((p) => p.mark))('a finished game: $name', (p) => {
  test('is marked with a word, not only a colour', () => {
    renderCard(p)
    expect(screen.queryByText(p.mark!, { exact: false })).not.toBeInTheDocument()
    p.finished()
    render(<p.Card item={p.item} onRemove={jest.fn()} draggable />)
    expect(screen.getByText(p.mark!, { exact: false })).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
  })
})
