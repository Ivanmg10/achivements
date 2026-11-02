import { fireEvent, render, screen } from '@testing-library/react'
import GroupList from './GroupList'
import { GameGroup } from '@/types/types'

jest.mock('@/components/groups/group-album-card/GroupAlbumCard', () => ({
  __esModule: true,
  default: ({ group }: { group: { title: string } }) => <div>album {group.title}</div>,
}))
jest.mock('@/components/groups/group-shelf-row/GroupShelfRow', () => ({
  __esModule: true,
  default: ({ group }: { group: { title: string } }) => <div>shelf {group.title}</div>,
}))

const mockGroups = [
  { id: 1, title: 'Speedruns' },
  { id: 2, title: 'Backlog' },
] as GameGroup[]

test('cover cards by default, shelves when asked', () => {
  const { rerender } = render(<GroupList groups={mockGroups} />)
  expect(screen.getByText('album Speedruns')).toBeInTheDocument()
  expect(screen.getByText('album Backlog')).toBeInTheDocument()
  rerender(<GroupList groups={mockGroups} view="shelves" />)
  expect(screen.getByText('shelf Speedruns')).toBeInTheDocument()
})

test('renders without crashing with empty list', () => {
  const { container } = render(<GroupList groups={[]} />)
  expect(container.firstChild).toBeInTheDocument()
})

test('a new-group tile while any fit', () => {
  const onCreate = jest.fn()
  const { rerender } = render(<GroupList groups={mockGroups} remaining={8} onCreate={onCreate} />)
  fireEvent.click(screen.getByRole('button', { name: /New group/ }))
  expect(onCreate).toHaveBeenCalled()
  rerender(<GroupList groups={mockGroups} remaining={0} onCreate={onCreate} />)
  expect(screen.queryByRole('button', { name: /New group/ })).not.toBeInTheDocument()
})
