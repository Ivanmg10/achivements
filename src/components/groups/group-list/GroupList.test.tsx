import { render, screen } from '@testing-library/react'
import GroupList from './GroupList'
import { GameGroup } from '@/types/types'

jest.mock('@/components/groups/group-card/GroupCard', () => ({
  __esModule: true,
  default: ({ group }: { group: { title: string } }) => <div>{group.title}</div>,
}))

const mockGroups = [
  { id: 1, title: 'Speedruns' },
  { id: 2, title: 'Backlog' },
] as GameGroup[]

test('renders list of groups', () => {
  render(<GroupList groups={mockGroups} />)
  expect(screen.getByText('Speedruns')).toBeInTheDocument()
  expect(screen.getByText('Backlog')).toBeInTheDocument()
})

test('renders without crashing with empty list', () => {
  const { container } = render(<GroupList groups={[]} />)
  expect(container.firstChild).toBeInTheDocument()
})

test('one per row in list mode, as many as fit otherwise', () => {
  const { container, rerender } = render(<GroupList groups={mockGroups} gridCols={1} />)
  expect(container.firstChild).toHaveClass('grid-cols-1')
  rerender(<GroupList groups={mockGroups} gridCols={3} />)
  expect((container.firstChild as HTMLElement).className).toMatch(/auto-fill/)
})
