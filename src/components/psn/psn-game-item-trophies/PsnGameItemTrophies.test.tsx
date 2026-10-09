jest.mock('@/hooks/usePsnTrophies', () => ({ usePsnTrophies: jest.fn() }))
jest.mock('@/components/psn/psn-trophy-grid/PsnTrophyGrid', () => ({
  PsnTrophyGrid: ({ trophies }: { trophies: unknown[] }) => <div data-testid="grid">{trophies.length}</div>,
}))

import { render, screen, fireEvent } from '@testing-library/react'
import PsnGameItemTrophies from './PsnGameItemTrophies'
import { usePsnTrophies } from '@/hooks/usePsnTrophies'
import { en } from '@/translations/en'

const retry = jest.fn()
const set = (overrides: Record<string, unknown>) =>
  (usePsnTrophies as jest.Mock).mockReturnValue({ trophies: [], isLoading: false, error: null, retry, ...overrides })

test('shows the grid once loaded', () => {
  set({ trophies: [{ id: 0 }, { id: 1 }] })
  render(<PsnGameItemTrophies gameId={100} titleId="NPWR00001_00" />)
  expect(usePsnTrophies).toHaveBeenCalledWith('NPWR00001_00')
  expect(screen.getByTestId('grid')).toHaveTextContent('2')
})

test('a skeleton the size of the set while loading', () => {
  set({ isLoading: true })
  const { container } = render(<PsnGameItemTrophies gameId={100} titleId="NPWR00001_00" expectedCount={5} />)
  expect(container.querySelectorAll('li')).toHaveLength(5)
})

test('an error says why and retries', () => {
  set({ error: 'private' })
  render(<PsnGameItemTrophies gameId={100} titleId="NPWR00001_00" />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.psn.trophiesError)
  expect(screen.getByText(en.psn.errors.private)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: en.psn.retry }))
  expect(retry).toHaveBeenCalled()
})

test('says so when the game has none', () => {
  set({})
  render(<PsnGameItemTrophies gameId={100} titleId="NPWR00001_00" />)
  expect(screen.getByText(en.psn.noTrophies)).toBeInTheDocument()
})
