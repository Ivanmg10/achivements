import { render, screen } from '@testing-library/react'
import GroupCoverGrid from './GroupCoverGrid'
import type { GameGroupItem } from '@/types/types'

jest.mock('@/components/groups/group-cover-tile/GroupCoverTile', () => ({
  __esModule: true,
  default: ({ item, progress, draggable }: { item: GameGroupItem; progress: { pct: number }; draggable: boolean }) => (
    <li>{`${item.title} ${progress.pct} ${draggable ? 'drag' : 'fixed'}`}</li>
  ),
}))

const items = [{ id: 1, title: 'A' }, { id: 2, title: 'B' }] as GameGroupItem[]
const progress = (i: GameGroupItem) => ({ earned: 0, total: 0, pct: i.id / 10 })

test('one tile per game, each with its progress', () => {
  render(<GroupCoverGrid items={items} progress={progress} draggable onRemove={jest.fn()} onReorder={jest.fn()} />)
  expect(screen.getByText('A 0.1 drag')).toBeInTheDocument()
  expect(screen.getByText('B 0.2 drag')).toBeInTheDocument()
})

test('a filtered view cannot be reordered', () => {
  render(<GroupCoverGrid items={items} progress={progress} draggable={false} onRemove={jest.fn()} onReorder={jest.fn()} />)
  expect(screen.getByText('A 0.1 fixed')).toBeInTheDocument()
})
