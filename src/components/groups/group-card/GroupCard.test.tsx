import { render, screen } from '@testing-library/react'
import GroupCard from './GroupCard'
import { GameGroup } from '@/types/types'

jest.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({ T: jest.requireActual('@/translations/en').en, lang: 'en' }),
}))

jest.mock('next/link', () => ({ children, ...props }: React.ComponentProps<'a'>) => (
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
  psn_count: 0,
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
    expect(screen.getByText('Public')).toBeInTheDocument()
  })

  it('shows private icon for private groups', () => {
    render(<GroupCard group={{ ...baseGroup, is_public: false }} />)
    expect(screen.getByText('Private')).toBeInTheDocument()
  })

  it('omits achievement totals when total_possible is 0', () => {
    render(<GroupCard group={{ ...baseGroup, total_possible: 0 }} />)
    expect(screen.queryByText(/10\/40/)).not.toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('shows a mixed-platform badge when the group has both RA and Steam games', () => {
    render(<GroupCard group={{ ...baseGroup, game_count: 5, steam_count: 2 }} />)
    expect(screen.getByLabelText('Includes games from several platforms')).toBeInTheDocument()
  })

  it('omits the mixed-platform badge for a single-platform group', () => {
    render(<GroupCard group={{ ...baseGroup, game_count: 3, steam_count: 0 }} />)
    expect(screen.queryByLabelText('Includes games from several platforms')).not.toBeInTheDocument()
  })

  it('omits the mixed-platform badge when every game is Steam', () => {
    render(<GroupCard group={{ ...baseGroup, game_count: 3, steam_count: 3 }} />)
    expect(screen.queryByLabelText('Includes games from several platforms')).not.toBeInTheDocument()
  })

  it('counts PSN as a platform of its own', () => {
    render(<GroupCard group={{ ...baseGroup, game_count: 3, steam_count: 0, psn_count: 3 }} />)
    expect(screen.queryByLabelText('Includes games from several platforms')).not.toBeInTheDocument()
  })

  it('a group of Steam and PSN games is mixed', () => {
    render(<GroupCard group={{ ...baseGroup, game_count: 4, steam_count: 2, psn_count: 2 }} />)
    expect(screen.getByLabelText('Includes games from several platforms')).toBeInTheDocument()
  })
})
