jest.mock('@/hooks/useXboxAchievements', () => ({ useXboxAchievements: jest.fn() }))
jest.mock('@/components/xbox/xbox-achievement-grid/XboxAchievementGrid', () => ({
  XboxAchievementGrid: ({ achievements }: { achievements: unknown[] }) => <div data-testid="grid">{achievements.length}</div>,
}))

import { render, screen, fireEvent } from '@testing-library/react'
import XboxGameItemAchievements from './XboxGameItemAchievements'
import { useXboxAchievements } from '@/hooks/useXboxAchievements'
import { en } from '@/translations/en'

const retry = jest.fn()
const set = (overrides: Record<string, unknown>) =>
  (useXboxAchievements as jest.Mock).mockReturnValue({ achievements: [], isLoading: false, error: null, retry, ...overrides })

beforeEach(() => jest.clearAllMocks())

test('shows the grid once loaded', () => {
  set({ achievements: [{ id: '0' }, { id: '1' }] })
  render(<XboxGameItemAchievements gameTitle="Game" gameId={100} titleId="1738914043" />)
  expect(useXboxAchievements).toHaveBeenCalledWith('1738914043')
  expect(screen.getByTestId('grid')).toHaveTextContent('2')
})

test('a skeleton the size of the set while loading, capped', () => {
  set({ isLoading: true })
  const { container, rerender } = render(<XboxGameItemAchievements gameTitle="Game" gameId={100} titleId="1" expectedCount={5} />)
  expect(container.querySelectorAll('li')).toHaveLength(5)
  rerender(<XboxGameItemAchievements gameTitle="Game" gameId={100} titleId="1" expectedCount={500} />)
  expect(container.querySelectorAll('li')).toHaveLength(60)
})

test('an error says why and retries', () => {
  set({ error: 'private' })
  render(<XboxGameItemAchievements gameTitle="Game" gameId={100} titleId="1" />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.xbox.achievementsError)
  expect(screen.getByText(en.xbox.errors.private)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: en.xbox.retry }))
  expect(retry).toHaveBeenCalled()
})

test('says so when the game has none', () => {
  set({})
  render(<XboxGameItemAchievements gameTitle="Game" gameId={100} titleId="1" />)
  expect(screen.getByText(en.xbox.noAchievements)).toBeInTheDocument()
})
