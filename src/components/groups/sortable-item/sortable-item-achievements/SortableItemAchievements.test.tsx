jest.mock('@/hooks/useGameProgression', () => ({ useGameProgression: jest.fn() }))
jest.mock('@/components/achievement-grid/AchievementGrid', () => ({
  AchievementGrid: ({ achievements }: { achievements: { Title: string }[] }) => (
    <ul data-testid="grid">{achievements.map((a) => <li key={a.Title}>{a.Title}</li>)}</ul>
  ),
}))

import { render, screen, fireEvent } from '@testing-library/react'
import { en } from '@/translations/en'
import { useGameProgression } from '@/hooks/useGameProgression'
import SortableItemAchievements from './SortableItemAchievements'

const mocked = useGameProgression as jest.Mock
const GAME = {
  NumDistinctPlayers: 10,
  Achievements: {
    2: { ID: 2, Title: 'Second', DisplayOrder: 2 },
    1: { ID: 1, Title: 'First', DisplayOrder: 1 },
  },
}

function show(open = true) {
  return render(<SortableItemAchievements gameId={100} title="Test Game" total={2} open={open} />)
}

beforeEach(() => mocked.mockReset())

test('asks for the game only while it is open, and lists its achievements in the game order', () => {
  mocked.mockReturnValue({ game: GAME, isLoading: false, error: null, refetch: jest.fn() })
  show()
  expect(mocked).toHaveBeenCalledWith('100')
  expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['First', 'Second'])
  mocked.mockClear()
  show(false)
  expect(mocked).toHaveBeenCalledWith(null)
})

test('a failed read offers to try again', () => {
  const refetch = jest.fn()
  mocked.mockReturnValue({ game: null, isLoading: false, error: new Error('x'), refetch })
  show()
  fireEvent.click(screen.getByRole('button'))
  expect(refetch).toHaveBeenCalled()
})

test('a game with no published achievements says so', () => {
  mocked.mockReturnValue({ game: { NumDistinctPlayers: 1, Achievements: {} }, isLoading: false, error: null, refetch: jest.fn() })
  show()
  expect(screen.getByText(en.statusGameItem.noPublishedAchievements)).toBeInTheDocument()
})

test('while it loads it holds the room of the grid', () => {
  mocked.mockReturnValue({ game: null, isLoading: true, error: null, refetch: jest.fn() })
  const { container } = show()
  expect(screen.queryByTestId('grid')).not.toBeInTheDocument()
  expect(container.children[0].children).toHaveLength(2)
})
