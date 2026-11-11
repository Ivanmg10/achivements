jest.mock('@/components/library-page/LibraryPage', () => ({
  __esModule: true,
  default: ({ category }: { category: string }) => <div data-testid="library" data-category={category} />,
}))

import { render, screen } from '@testing-library/react'
import AllGamesPage from './page'

test('is the library page, with every status at once', () => {
  render(<AllGamesPage />)
  expect(screen.getByTestId('library')).toHaveAttribute('data-category', 'all')
})
