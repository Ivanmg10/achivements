jest.mock('@/components/main-page/MainPage', () => ({
  __esModule: true,
  default: () => <div data-testid="main-page">MainPage</div>,
}))

import { render, screen } from '@testing-library/react'
import Home from './page'

test('renders main page', () => {
  render(<Home />)
  expect(screen.getByTestId('main-page')).toBeInTheDocument()
})
