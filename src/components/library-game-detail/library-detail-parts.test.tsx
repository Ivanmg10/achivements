import { render, screen } from '@testing-library/react'
import LibraryDetailList from './library-detail-list/LibraryDetailList'
import LibraryDetailDifficulty from './library-detail-difficulty/LibraryDetailDifficulty'
import LibraryDetailFacts from './library-detail-facts/LibraryDetailFacts'
import { en } from '@/translations/en'
import type { InsightAchievement } from '@/utils/gameInsights'

const a = (id: string, o: Partial<InsightAchievement> = {}): InsightAchievement => ({
  id, title: `T${id}`, description: `D${id}`, earned: false, earnedAt: null, rarity: 50, points: null, kind: null, iconUrl: null, href: `/g#${id}`, ...o,
})

describe('LibraryDetailList', () => {
  test('lists each achievement as a link, with its rarity and points', () => {
    render(<LibraryDetailList title="Next" empty="none" items={[a('1', { rarity: 12.34, points: 25 }), a('2', { rarity: null })]} />)
    const [first, second] = screen.getAllByRole('link')
    expect(first).toHaveAttribute('href', '/g#1')
    expect(first).toHaveTextContent('T1')
    expect(first).toHaveTextContent(en.libraryDetail.rarityOf.replace('{n}', '12.3'))
    expect(first).toHaveTextContent(`25 ${en.libraryDetail.pointsShort}`)
    // No rarity known, none claimed.
    expect(second).not.toHaveTextContent('%')
  })
  test('says what to when empty, and shows placeholders while loading', () => {
    const { rerender, container } = render(<LibraryDetailList title="Next" empty="Nothing here" items={[]} />)
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
    rerender(<LibraryDetailList title="Next" empty="Nothing here" items={[]} isLoading />)
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(screen.queryByText('Nothing here')).not.toBeInTheDocument()
  })
})

describe('LibraryDetailDifficulty', () => {
  test('counts earned out of total in each band, with the share it covers', () => {
    render(<LibraryDetailDifficulty items={[a('1', { rarity: 80, earned: true }), a('2', { rarity: 80 }), a('3', { rarity: 1 })]} />)
    const common = screen.getByText(en.libraryDetail.bandCommon).closest('li')!
    expect(common).toHaveTextContent('1 / 2')
    expect(common).toHaveTextContent('25%+')
    expect(screen.getByText(en.libraryDetail.bandUltra).closest('li')).toHaveTextContent('0 / 1')
    expect(screen.getByText(en.libraryDetail.bandUltra).closest('li')).toHaveTextContent('<3%')
    expect(screen.getByText(en.libraryDetail.bandRare).closest('li')).toHaveTextContent('0 / 0')
  })
  test('says so when the platform gave no rarity at all', () => {
    render(<LibraryDetailDifficulty items={[a('1', { rarity: null })]} />)
    expect(screen.getByText(en.libraryDetail.noRarity)).toBeInTheDocument()
  })
})

describe('LibraryDetailFacts', () => {
  test('a term and its value for each figure', () => {
    render(<LibraryDetailFacts facts={[{ label: 'Left', value: '4' }, { label: 'Pace', value: '2 / week' }]} />)
    expect(screen.getByText('Left').nextSibling).toHaveTextContent('4')
    expect(screen.getByText('Pace').nextSibling).toHaveTextContent('2 / week')
  })
  test('draws nothing without figures', () => {
    const { container } = render(<LibraryDetailFacts facts={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
