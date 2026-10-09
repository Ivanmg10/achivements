jest.mock('@/context/PsnGamesDataContext', () => ({ usePsnGamesData: jest.fn() }))
jest.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({ attributes: {}, listeners: {}, setNodeRef: () => {}, transform: null, transition: undefined, isDragging: false }),
}))
jest.mock('@/components/psn/psn-game-item-trophies/PsnGameItemTrophies', () => ({
  __esModule: true,
  default: ({ titleId }: { titleId: string }) => <div data-testid="trophies">{titleId}</div>,
}))

import { render, screen, fireEvent } from '@testing-library/react'
import PsnSortableItem from './PsnSortableItem'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { en } from '@/translations/en'
import type { GameGroupItem } from '@/types/types'

const ITEM: GameGroupItem = {
  id: 7, source: 'psn', game_id: 2018800, title: 'Astro Bot', image_icon: 'https://psn/a.png', console_name: 'PlayStation',
  pct_won: '0.2', num_awarded: 2, max_possible: 10, points_won: 0, max_points: 0, position: 0, added_at: '2026-01-01',
}

test('live numbers from the PSN list, linking to the PSN page', () => {
  ;(usePsnGamesData as jest.Mock).mockReturnValue({
    library: [{ id: 2018800, title: 'Astro Bot', imageIcon: 'https://psn/a.png', consoleName: 'PS5', numAwarded: 8, maxPossible: 10,
      pctWon: 75, earned: { platinum: 0 }, playtimeMinutes: 600, lastPlayed: '2026-01-02T00:00:00Z', heroUrl: null, coverUrl: null }],
  })
  render(<PsnSortableItem item={ITEM} onRemove={jest.fn()} draggable />)
  expect(screen.getByRole('link', { name: 'Astro Bot' })).toHaveAttribute('href', '/psnGame/NPWR20188_00')
  expect(screen.getByText('PS5')).toBeInTheDocument()
  expect(screen.getByText('8 / 10 trophies')).toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: 'Astro Bot' })).toHaveAttribute('aria-valuenow', '75')
  expect(screen.getByText(`${en.steam.playtime} · 10 ${en.steam.hoursShort}`)).toBeInTheDocument()
})

test('the stored counts when the list does not have it', () => {
  ;(usePsnGamesData as jest.Mock).mockReturnValue({ library: [] })
  render(<PsnSortableItem item={ITEM} onRemove={jest.fn()} draggable={false} />)
  expect(screen.getByText('2 / 10 trophies')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: en.cards.dragToReorder })).not.toBeInTheDocument()
})

test('removes and expands to its trophies', () => {
  ;(usePsnGamesData as jest.Mock).mockReturnValue({ library: [] })
  const onRemove = jest.fn()
  render(<PsnSortableItem item={ITEM} onRemove={onRemove} draggable />)
  fireEvent.click(screen.getByRole('button', { name: `${en.groups.removeGame}: Astro Bot` }))
  expect(onRemove).toHaveBeenCalledWith(7)
  fireEvent.click(screen.getByRole('button', { name: `${en.psn.showTrophies}: Astro Bot` }))
  expect(screen.getByTestId('trophies')).toHaveTextContent('NPWR20188_00')
})
