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
  default: () => <div data-testid="trophies" />,
}))

import { render, screen, fireEvent } from '@testing-library/react'
import MainPageProfilePsnLinked from './MainPageProfilePsnLinked'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { usePsnRecentTrophies } from '@/hooks/usePsnRecentTrophies'
import { en } from '@/translations/en'
import { SubjectContext } from '@/context/SubjectContext'
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

test('a skeleton while loading', () => {
  const { container } = render(<MainPageProfilePsnLinked summary={null} isLoading error={null} onRetry={jest.fn()} />)
  expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
})

test('a failure says why and retries', () => {
  const onRetry = jest.fn()
  render(<MainPageProfilePsnLinked summary={null} isLoading={false} error="private" onRetry={onRetry} />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.psn.profileError)
  expect(screen.getByText(en.psn.errors.private)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: en.psn.retry }))
  expect(onRetry).toHaveBeenCalled()
})

test('while the library loads, the last-game block keeps its place with a skeleton', () => {
  ;(usePsnGamesData as jest.Mock).mockReturnValue({ library: [], libraryLoading: true })
  const { container } = render(<MainPageProfilePsnLinked summary={SUMMARY} isLoading={false} error={null} onRetry={jest.fn()} />)
  expect(screen.queryByTestId('game')).not.toBeInTheDocument()
  expect(container.querySelector('.animate-pulse [class*="w-12.5"]')).toBeInTheDocument()
})

describe('the refresh button', () => {
  const refreshName = en.profileRa.refreshData

  test('on the own page it refetches the profile, the latest trophies and the library together', () => {
    const retry = jest.fn()
    const refetch = jest.fn()
    const onRetry = jest.fn()
    ;(usePsnRecentTrophies as jest.Mock).mockReturnValue({ trophies: [], isLoading: false, error: null, retry })
    ;(usePsnGamesData as jest.Mock).mockReturnValue({ library: [], libraryLoading: false, refetch })
    render(<MainPageProfilePsnLinked summary={SUMMARY} isLoading={false} error={null} onRetry={onRetry} />)
    fireEvent.click(screen.getByRole('button', { name: refreshName }))
    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(retry).toHaveBeenCalledTimes(1)
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  test('on someone else page there is nothing of the viewer to refresh', () => {
    render(
      <SubjectContext.Provider value="someone">
        <MainPageProfilePsnLinked summary={SUMMARY} isLoading={false} error={null} onRetry={jest.fn()} />
      </SubjectContext.Provider>,
    )
    expect(screen.queryByRole('button', { name: refreshName })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: en.psn.viewOnPsn })).toBeInTheDocument()
  })
})
