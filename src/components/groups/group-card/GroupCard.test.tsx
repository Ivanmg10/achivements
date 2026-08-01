import { render, screen } from '@testing-library/react'
import GroupCard from './GroupCard'
import { GameGroup } from '@/types/types'

const mockT = { groups: { games: 'games' } }
jest.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({ T: mockT }),
}))

jest.mock('next/link', () => ({ children, ...props }: any) => (
  <a {...props}>{children}</a>
))

const baseGroup: GameGroup = {
  id: 1,
  title: 'Speedruns',
  description: null,
  icon: null,
  is_public: true,
  position: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  game_count: 3,
  total_awarded: 10,
  total_possible: 40,
} as GameGroup

describe('GroupCard', () => {
  it('renders group title, game count and link', () => {
    render(<GroupCard group={baseGroup} />)
    expect(screen.getByText('Speedruns')).toBeInTheDocument()
    expect(screen.getByText('3 games')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/groups/1')
  })

  it('shows public icon for public groups', () => {
    render(<GroupCard group={baseGroup} />)
    expect(screen.getByLabelText('Public')).toBeInTheDocument()
  })

  it('shows private icon for private groups', () => {
    render(<GroupCard group={{ ...baseGroup, is_public: false }} />)
    expect(screen.getByLabelText('Private')).toBeInTheDocument()
  })

  it('omits achievement totals when total_possible is 0', () => {
    render(<GroupCard group={{ ...baseGroup, total_possible: 0 }} />)
    expect(screen.queryByText(/logros/)).not.toBeInTheDocument()
  })
})
