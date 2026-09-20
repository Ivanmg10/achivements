import { render, screen } from '@testing-library/react'
import RARecentlyPlayed from './RARecentlyPlayed'
import { useRecentlyPlayedGames } from '@/hooks/useRecentlyPlayedGames'
import { MainViewProvider } from '@/context/MainViewContext'

jest.mock('@/hooks/useRecentlyPlayedGames', () => ({
  useRecentlyPlayedGames: jest.fn(),
}))

function renderWithProviders() {
  return render(
    <MainViewProvider>
      <RARecentlyPlayed />
    </MainViewProvider>
  )
}

test('shows a loading skeleton while fetching, not the empty state', () => {
  ;(useRecentlyPlayedGames as jest.Mock).mockReturnValue({ games: [], isLoading: true })
  const { container } = renderWithProviders()
  expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  expect(screen.queryByText('No games')).not.toBeInTheDocument()
})

test('shows an empty state once loading finishes with no recently played games, instead of an empty skeleton list', () => {
  ;(useRecentlyPlayedGames as jest.Mock).mockReturnValue({ games: [], isLoading: false })
  const { container } = renderWithProviders()
  expect(screen.getByText('No games')).toBeInTheDocument()
  expect(container.querySelectorAll('.animate-pulse').length).toBe(0)
})
