import { render, screen } from '@testing-library/react'
import LibraryDetailMilestones from './library-detail-milestones/LibraryDetailMilestones'
import LibraryDetailInfo from './library-detail-info/LibraryDetailInfo'
import LibraryDetailList from './library-detail-list/LibraryDetailList'
import { en } from '@/translations/en'
import type { InsightAchievement } from '@/utils/gameInsights'

const a = (id: string, o: Partial<InsightAchievement> = {}): InsightAchievement => ({
  id, title: `T${id}`, description: '', earned: false, earnedAt: null, rarity: 50, points: null, kind: null, iconUrl: null, href: `/g#${id}`, ...o,
})

describe('LibraryDetailMilestones', () => {
  const steps = [
    { pct: 0, at: '2024-03-02T10:00:00Z', left: 0 },
    { pct: 50, at: null, left: 4 },
  ]
  test('each step with its day, or how many are left, the reached ones ticked', () => {
    const { container } = render(<LibraryDetailMilestones steps={steps} />)
    expect(screen.getByText(en.libraryDetail.milestonesTitle)).toBeInTheDocument()
    expect(screen.getByText(en.libraryDetail.milestoneFirst)).toBeInTheDocument()
    expect(screen.getByText(new Date('2024-03-02T10:00:00Z').toLocaleDateString('en'))).toBeInTheDocument()
    expect(screen.getByText('50% completed')).toBeInTheDocument()
    expect(screen.getByText('4 to go')).toBeInTheDocument()
    expect(container.querySelectorAll('svg')).toHaveLength(1)
  })
})

describe('LibraryDetailInfo', () => {
  test('a term and its value for each row', () => {
    render(<LibraryDetailInfo rows={[{ label: 'Developer', value: 'Capcom' }, { label: 'Genre', value: 'Platformer' }]} />)
    expect(screen.getByText('Developer').nextSibling).toHaveTextContent('Capcom')
    expect(screen.getByText(en.libraryDetail.infoTitle)).toBeInTheDocument()
  })
  test('nothing without rows', () => {
    const { container } = render(<LibraryDetailInfo rows={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('LibraryDetailList extras', () => {
  test('meta replaces the rarity at the end of each row', () => {
    render(<LibraryDetailList title="Latest" empty="none" items={[a('1', { rarity: 12 })]} meta={() => <span>on Monday</span>} />)
    expect(screen.getByText('on Monday')).toBeInTheDocument()
    expect(screen.queryByText(/of players/)).not.toBeInTheDocument()
  })
  test('two columns where there is room', () => {
    render(<LibraryDetailList title="Hard" empty="none" items={[a('1'), a('2')]} columns={2} />)
    expect(screen.getByRole('list')).toHaveClass('grid')
  })
})
