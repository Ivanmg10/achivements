jest.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({ attributes: {}, listeners: {}, setNodeRef: () => {}, transform: null, transition: undefined, isDragging: false }),
}))
jest.mock('@dnd-kit/utilities', () => ({ CSS: { Transform: { toString: () => '' } } }))
jest.mock('./sortable-item-achievements/SortableItemAchievements', () => ({
  __esModule: true,
  default: ({ gameId, total, open }: { gameId: number; total: number; open: boolean }) => (
    <div data-testid="panel">{gameId}:{total}:{String(open)}</div>
  ),
}))

import { fireEvent, render, screen } from '@testing-library/react'
import { en } from '@/translations/en'
import type { GameGroupItem } from '@/types/types'
import SortableItem from './SortableItem'

const ITEM: GameGroupItem = {
  id: 1, source: 'ra', game_id: 100, title: 'Test Game', image_icon: '/image/icon.png', console_name: 'NES', pct_won: '0.5',
  num_awarded: 50, max_possible: 100, points_won: 50, max_points: 500, position: 0, added_at: '2026-01-01',
}

function card(props: Partial<React.ComponentProps<typeof SortableItem>> = {}) {
  return render(<SortableItem item={ITEM} onRemove={jest.fn()} draggable={false} {...props} />)
}

test('the console chip, the counts stored with the game and its points', () => {
  card()
  expect(screen.getByText('NES')).toBeInTheDocument()
  expect(screen.getByText(`50 / 100 ${en.statusGameItem.achievements}`)).toBeInTheDocument()
  expect(screen.getByText('50%')).toBeInTheDocument()
  expect(screen.getByText(`50 / 500 ${en.statusGameItem.pointsEarned}`)).toBeInTheDocument()
})

test('a game without a console shows no chip, and one without a picture still has its link', () => {
  card({ item: { ...ITEM, console_name: '', image_icon: '' } })
  expect(screen.queryByText('NES')).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Test Game' })).toHaveAttribute('href', '/gameInfo/100')
})

test("the page's counts win over the stored ones, and hardcore leads the percentage", () => {
  card({ achStats: { scEarned: 40, hcEarned: 25, total: 50 }, ptsStats: { earned: 90, total: 120 }, lastPlayed: new Date().toISOString() })
  expect(screen.getByText(`40 / 50 ${en.statusGameItem.achievements}`)).toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: 'Test Game' })).toHaveAttribute('aria-valuenow', '80')
  expect(screen.getByText(`90 / 120 ${en.statusGameItem.pointsEarned}`)).toBeInTheDocument()
  expect(screen.queryByText(en.groups.neverPlayed, { exact: false })).not.toBeInTheDocument()
})

test('with no counts anywhere it writes the total alone and draws no bar', () => {
  card({ item: { ...ITEM, num_awarded: 0, max_possible: 0, pct_won: '0', max_points: 0 } })
  expect(screen.getByText(`0 ${en.statusGameItem.achievements}`)).toBeInTheDocument()
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
})

test('hands its panel the game, its total and whether it is open', () => {
  card()
  fireEvent.click(screen.getByRole('button', { name: `${en.steam.showAchievements}: Test Game` }))
  expect(screen.getByTestId('panel')).toHaveTextContent('100:100:true')
})
