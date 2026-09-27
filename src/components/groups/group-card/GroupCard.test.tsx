import { render, screen } from '@testing-library/react'
import GroupCard from './GroupCard'
import { GameGroup } from '@/types/types'

const mockT = { groups: { games: 'games', mixedPlatforms: 'Includes RetroAchievements and Steam games' } }
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
  steam_count: 0,
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

  it('shows a mixed-platform badge when the group has both RA and Steam games', () => {
    render(<GroupCard group={{ ...baseGroup, game_count: 5, steam_count: 2 }} />)
    expect(screen.getByLabelText('Includes RetroAchievements and Steam games')).toBeInTheDocument()
  })

  it('omits the mixed-platform badge for a single-platform group', () => {
    render(<GroupCard group={{ ...baseGroup, game_count: 3, steam_count: 0 }} />)
    expect(screen.queryByLabelText('Includes RetroAchievements and Steam games')).not.toBeInTheDocument()
  })

  it('omits the mixed-platform badge when every game is Steam', () => {
    render(<GroupCard group={{ ...baseGroup, game_count: 3, steam_count: 3 }} />)
    expect(screen.queryByLabelText('Includes RetroAchievements and Steam games')).not.toBeInTheDocument()
  })
})
