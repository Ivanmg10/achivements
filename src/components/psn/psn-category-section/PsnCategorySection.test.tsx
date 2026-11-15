jest.mock('@/hooks/usePsnGamesByCategory', () => ({ usePsnGamesByCategory: jest.fn() }))
jest.mock('@/components/psn/psn-status-game-item/PsnStatusGameItem', () => ({ __esModule: true, default: () => <div data-testid="game" /> }))

import { render, screen, fireEvent } from '@testing-library/react'
import PsnCategorySection from './PsnCategorySection'
import { usePsnGamesByCategory } from '@/hooks/usePsnGamesByCategory'
import { en } from '@/translations/en'

function fail(error: string) {
  ;(usePsnGamesByCategory as jest.Mock).mockReturnValue({ isLinked: true, games: [], loading: false, error, refetch: jest.fn() })
  render(<PsnCategorySection category="playing" />)
  fireEvent.click(screen.getByRole('button', { name: /PlayStation/ }))
}

beforeEach(() => window.sessionStorage.clear())

test('a private trophy list says so under the failure', () => {
  fail('private')
  expect(screen.getByRole('alert')).toHaveTextContent(en.psn.gamesError)
  expect(screen.getByText(en.psn.errors.private)).toBeInTheDocument()
})

test('any other failure gives no reason', () => {
  fail('boom')
  expect(screen.getByRole('alert')).toHaveTextContent(en.psn.gamesError)
  expect(screen.queryByText(en.psn.errors.private)).not.toBeInTheDocument()
})
