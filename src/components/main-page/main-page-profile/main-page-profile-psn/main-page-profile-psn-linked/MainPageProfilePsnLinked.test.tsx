jest.mock('@/context/PsnGamesDataContext', () => ({ usePsnGamesData: jest.fn() }))
jest.mock('@/hooks/usePsnRecentTrophies', () => ({
  usePsnRecentTrophies: jest.fn(() => ({ trophies: [], isLoading: false, error: null, retry: jest.fn() })),
}))
jest.mock('../main-page-profile-psn-game/MainPageProfilePsnGame', () => ({
  __esModule: true,
  default: ({ game }: { game: { title: string } }) => <div data-testid="game">{game.title}</div>,
}))
jest.mock('../main-page-profile-psn-trophies/MainPageProfilePsnTrophies', () => ({
  __esModule: true,
  default: ({ trophies }: { trophies: { gameId: number }[] }) => <div data-testid="trophies">{trophies.map((t) => t.gameId).join(',')}</div>,
}))

import { render, screen, fireEvent } from '@testing-library/react'
import MainPageProfilePsnLinked from './MainPageProfilePsnLinked'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { usePsnRecentTrophies } from '@/hooks/usePsnRecentTrophies'
import { en } from '@/translations/en'
import type { PsnSummary } from '@/lib/psnClient'

const SUMMARY: PsnSummary = {
  onlineId: 'PalmeraMiami', avatarUrl: 'https://a.png', aboutMe: 'Hello', isPlus: true,
  trophyLevel: 209, tier: 3, levelProgress: 0, earned: { bronze: 552, silver: 169, gold: 36, platinum: 8 }, games: 23,
}

beforeEach(() => {
  ;(usePsnGamesData as jest.Mock).mockReturnValue({ library: [{ id: 1, title: 'Astro Bot', pctWon: 100, playtimeMinutes: 90, playedAs: ['CUSA1'] }], libraryLoading: false })
})

test('the profile: name, level, PS Plus, about me, link out, stats, last game, latest trophies', () => {
  render(<MainPageProfilePsnLinked summary={SUMMARY} isLoading={false} error={null} onRetry={jest.fn()} />)
  expect(screen.getByText('PalmeraMiami')).toBeInTheDocument()
  expect(screen.getByText('209')).toBeInTheDocument()
  expect(screen.getByText('PS Plus')).toBeInTheDocument()
  expect(screen.getByText('Hello')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: en.psn.viewOnPsn })).toHaveAttribute('href', 'https://profile.playstation.com/PalmeraMiami')
  expect(screen.getByText('765')).toBeInTheDocument()
  expect(screen.getByTestId('game')).toHaveTextContent('Astro Bot')
  expect(screen.getByTestId('trophies')).toBeInTheDocument()
  expect(usePsnRecentTrophies).toHaveBeenCalledWith('recent')
})

test('a failure says why and retries', () => {
  const onRetry = jest.fn()
  render(<MainPageProfilePsnLinked summary={null} isLoading={false} error="private" onRetry={onRetry} />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.psn.profileError)
  expect(screen.getByText(en.psn.errors.private)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: en.psn.retry }))
  expect(onRetry).toHaveBeenCalled()
})

test('the latest trophies leave out the games on the consoles unticked in preferences', () => {
  window.localStorage.setItem('hidden-consoles:psn', '["PS3"]')
  ;(usePsnGamesData as jest.Mock).mockReturnValue({
    library: [], fullLibrary: [{ id: 1, consoleName: 'PS3' }, { id: 2, consoleName: 'PS5' }], libraryLoading: false,
  })
  ;(usePsnRecentTrophies as jest.Mock).mockReturnValue({ trophies: [{ gameId: 1 }, { gameId: 2 }], isLoading: false, error: null, retry: jest.fn() })
  render(<MainPageProfilePsnLinked summary={SUMMARY} isLoading={false} error={null} onRetry={jest.fn()} />)
  expect(screen.getByTestId('trophies')).toHaveTextContent(/^2$/)
  window.localStorage.clear()
})
