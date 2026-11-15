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
import { psnGameFixture } from '@/test-utils/psnFixtures'
import type { GameGroupItem } from '@/types/types'

const ITEM: GameGroupItem = {
  id: 7, source: 'psn', game_id: 2018800, title: 'Astro Bot', image_icon: 'https://psn/a.png', console_name: 'PlayStation',
  pct_won: '0.2', num_awarded: 2, max_possible: 10, points_won: 0, max_points: 0, position: 0, added_at: '2026-01-01',
}

function setLibrary(...games: ReturnType<typeof psnGameFixture>[]) {
  ;(usePsnGamesData as jest.Mock).mockReturnValue({ fullLibrary: games })
}

test('live numbers, console and play time from the PSN list', () => {
  setLibrary(psnGameFixture({ id: 2018800, title: 'Astro Bot', consoleName: 'PS5', numAwarded: 8, maxPossible: 10, pctWon: 75, playtimeMinutes: 600 }))
  render(<PsnSortableItem item={ITEM} onRemove={jest.fn()} draggable />)
  expect(screen.getByText('PS5')).toBeInTheDocument()
  expect(screen.getByText('8 / 10 trophies')).toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: 'Astro Bot' })).toHaveAttribute('aria-valuenow', '75')
  expect(screen.getByText(`${en.steam.playtime} · 10 ${en.steam.hoursShort}`)).toBeInTheDocument()
})

test('the stored counts and a plain PlayStation chip when the list does not have it', () => {
  setLibrary()
  render(<PsnSortableItem item={ITEM} onRemove={jest.fn()} draggable />)
  expect(screen.getByText('PlayStation')).toBeInTheDocument()
  expect(screen.getByText('2 / 10 trophies')).toBeInTheDocument()
})

test('a platinum earned gets its chip, none without', () => {
  setLibrary(psnGameFixture({ id: 2018800, earned: { bronze: 0, silver: 0, gold: 0, platinum: 1 } }))
  const { unmount } = render(<PsnSortableItem item={ITEM} onRemove={jest.fn()} draggable />)
  expect(screen.getByText(en.psn.platinum, { exact: false })).toBeInTheDocument()
  unmount()
  setLibrary(psnGameFixture({ id: 2018800 }))
  render(<PsnSortableItem item={ITEM} onRemove={jest.fn()} draggable />)
  expect(screen.queryByText(en.psn.platinum, { exact: false })).not.toBeInTheDocument()
})

test('opens into its trophies', () => {
  setLibrary()
  render(<PsnSortableItem item={ITEM} onRemove={jest.fn()} draggable />)
  fireEvent.click(screen.getByRole('button', { name: `${en.psn.showTrophies}: Astro Bot` }))
  expect(screen.getByTestId('trophies')).toHaveTextContent('NPWR20188_00')
})
