jest.mock('@/components/library-page/LibraryPage', () => ({
  __esModule: true,
  default: ({ category, initialPlatform }: { category: string; initialPlatform: string }) => (
    <div data-testid="library" data-category={category} data-platform={initialPlatform} />
  ),
}))

import { render, screen } from '@testing-library/react'
import AllGamesPage from './page'

const page = async (platform?: string | string[]) => render(await AllGamesPage({ searchParams: Promise.resolve({ platform }) }))

test('is the library page, with every status at once, on every platform', async () => {
  await page()
  expect(screen.getByTestId('library')).toHaveAttribute('data-category', 'all')
  expect(screen.getByTestId('library')).toHaveAttribute('data-platform', 'all')
})

test('?platform opens it on that platform; anything else is every platform', async () => {
  const { unmount } = await page('psn')
  expect(screen.getByTestId('library')).toHaveAttribute('data-platform', 'psn')
  unmount()
  await page('nope')
  expect(screen.getByTestId('library')).toHaveAttribute('data-platform', 'all')
})
