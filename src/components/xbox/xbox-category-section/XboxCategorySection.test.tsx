jest.mock('@/hooks/useXboxGamesByCategory', () => ({ useXboxGamesByCategory: jest.fn() }))
jest.mock('@/components/xbox/xbox-status-game-item/XboxStatusGameItem', () => ({ __esModule: true, default: () => <div data-testid="game" /> }))

import { render, screen, fireEvent } from '@testing-library/react'
import XboxCategorySection from './XboxCategorySection'
import { useXboxGamesByCategory } from '@/hooks/useXboxGamesByCategory'
import { en } from '@/translations/en'

function fail(error: string) {
  ;(useXboxGamesByCategory as jest.Mock).mockReturnValue({ isLinked: true, games: [], loading: false, error, refetch: jest.fn() })
  render(<XboxCategorySection category="playing" />)
  fireEvent.click(screen.getByRole('button', { name: /Xbox/ }))
}

beforeEach(() => window.sessionStorage.clear())

test('a private library says so under the failure', () => {
  fail('private')
  expect(screen.getByRole('alert')).toHaveTextContent(en.xbox.gamesError)
  expect(screen.getByText(en.xbox.errors.private)).toBeInTheDocument()
})

test('any other failure gives no reason', () => {
  fail('boom')
  expect(screen.getByRole('alert')).toHaveTextContent(en.xbox.gamesError)
  expect(screen.queryByText(en.xbox.errors.private)).not.toBeInTheDocument()
})
