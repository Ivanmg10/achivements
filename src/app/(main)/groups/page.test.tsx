const mockT = {
  groups: {
    title: 'Groups',
    newGroup: 'New group',
    noGroups: 'No groups yet',
    noGroupsSub: 'Create a group to organise your games',
  },
}

jest.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({ T: mockT }),
}))

jest.mock('@/hooks/useGroups', () => ({
  useGroups: jest.fn(),
}))

jest.mock('@/components/groups/GroupModal', () => ({
  __esModule: true,
  default: () => <div data-testid="group-modal" />,
}))

jest.mock('@/components/groups/group-list/GroupList', () => ({
  __esModule: true,
  default: ({ groups }: { groups: { title: string }[] }) => (
    <div data-testid="group-list">{groups.map((g) => g.title).join(',')}</div>
  ),
}))

jest.mock('@/components/status-grid-control/StatusGridControl', () => ({
  __esModule: true,
  default: () => <div data-testid="grid-control" />,
}))

jest.mock('@/components/empty-state/EmptyState', () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <div data-testid="empty-state">{title}</div>,
}))

import { render, screen } from '@testing-library/react'
import GroupsPage from './page'
import { useGroups } from '@/hooks/useGroups'

const mockGroups = [
  { id: 1, title: 'Speedruns', game_count: 2, total_awarded: 5, total_possible: 20, is_public: true, updated_at: new Date().toISOString() },
]

test('renders loading skeleton', () => {
  ;(useGroups as jest.Mock).mockReturnValue({ groups: [], isLoading: true, error: null, createGroup: jest.fn() })
  const { container } = render(<GroupsPage />)
  expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
})

test('renders group list and grid control when groups exist', () => {
  ;(useGroups as jest.Mock).mockReturnValue({ groups: mockGroups, isLoading: false, error: null, createGroup: jest.fn() })
  render(<GroupsPage />)
  expect(screen.getByTestId('group-list')).toBeInTheDocument()
  expect(screen.getByText('Speedruns')).toBeInTheDocument()
  expect(screen.getByTestId('grid-control')).toBeInTheDocument()
})

test('renders empty state when no groups', () => {
  ;(useGroups as jest.Mock).mockReturnValue({ groups: [], isLoading: false, error: null, createGroup: jest.fn() })
  render(<GroupsPage />)
  expect(screen.getByTestId('empty-state')).toBeInTheDocument()
  expect(screen.queryByTestId('grid-control')).not.toBeInTheDocument()
})

test('renders error message on fetch error', () => {
  ;(useGroups as jest.Mock).mockReturnValue({ groups: [], isLoading: false, error: 'Error loading groups', createGroup: jest.fn() })
  render(<GroupsPage />)
  expect(screen.getByText('Error loading groups')).toBeInTheDocument()
})
