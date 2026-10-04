import { render, screen } from '@testing-library/react'
import GroupGameGrid from './GroupGameGrid'
import type { GameGroupItem } from '@/types/types'

jest.mock('@/components/groups/sortable-item/SortableItem', () => ({
  __esModule: true,
  default: ({ item, draggable }: { item: GameGroupItem; draggable: boolean }) => <p>ra {item.title} {String(draggable)}</p>,
}))
jest.mock('@/components/groups/steam-sortable-item/SteamSortableItem', () => ({
  __esModule: true,
  default: ({ item }: { item: GameGroupItem }) => <p>steam {item.title}</p>,
}))

const items = [{ id: 1, game_id: 620, title: 'Zelda' }, { id: 2, game_id: 620, source: 'steam', title: 'Portal 2' }] as GameGroupItem[]
const maps = { ach: new Map(), pts: new Map(), lastPlayed: new Map() }

test('each game gets its platform’s card', () => {
  render(<GroupGameGrid items={items} draggable gridCols={1} {...maps} onRemove={jest.fn()} onReorder={jest.fn()} />)
  expect(screen.getByText('ra Zelda true')).toBeInTheDocument()
  expect(screen.getByText('steam Portal 2')).toBeInTheDocument()
})

test('a filtered view cannot be reordered', () => {
  render(<GroupGameGrid items={items} draggable={false} gridCols={2} {...maps} onRemove={jest.fn()} onReorder={jest.fn()} />)
  expect(screen.getByText('ra Zelda false')).toBeInTheDocument()
})
