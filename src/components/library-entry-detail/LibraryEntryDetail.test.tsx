jest.mock('@/components/library-detail-backdrop/LibraryDetailBackdrop', () => ({
  __esModule: true,
  default: ({ entry }: { entry: { key: string } }) => <div data-testid="backdrop">{entry.key}</div>,
}))
jest.mock('@/hooks/useGameProgression', () => ({ useGameProgression: jest.fn() }))
jest.mock('@/components/pin-toggle-button/PinToggleButton', () => ({ PinToggleButton: ({ gameId, source }: { gameId: number; source: string }) => <span data-testid="pin">{source}:{gameId}</span> }))
jest.mock('@/components/hide-game-button/HideGameButton', () => ({ __esModule: true, default: ({ gameId, source }: { gameId: number; source: string }) => <span data-testid="hide">{source}:{gameId}</span> }))
jest.mock('@/components/ra-library-detail/RaLibraryDetail', () => ({
  __esModule: true,
  default: ({ gameId, category, loading, error }: { gameId: number; category: string; loading: boolean; error: boolean }) => (
    <div data-testid="ra-detail">{gameId}:{category}:{String(loading)}:{String(error)}</div>
  ),
}))
jest.mock('@/components/steam/steam-library-detail/SteamLibraryDetail', () => ({ __esModule: true, default: () => <div data-testid="steam-detail" /> }))
jest.mock('@/components/psn/psn-library-detail/PsnLibraryDetail', () => ({ __esModule: true, default: () => <div data-testid="psn-detail" /> }))

import { render, screen } from '@testing-library/react'
import LibraryEntryDetail from './LibraryEntryDetail'
import { useGameProgression } from '@/hooks/useGameProgression'
import { libraryEntry } from '@/test-utils/libraryFixtures'
import { en } from '@/translations/en'

const progression = (o: object) => (useGameProgression as jest.Mock).mockReturnValue({ game: null, isLoading: false, error: undefined, refetch: jest.fn(), ...o })

test('the name links to the game, with pin and hide for that game', () => {
  progression({})
  render(<LibraryEntryDetail entry={libraryEntry('steam', 7, 'Hades')} category="playing" />)
  expect(screen.getByRole('link', { name: 'Hades' })).toHaveAttribute('href', '/steamGame/7')
  expect(screen.getByRole('link', { name: 'Hades' })).toHaveAttribute('title', en.libraryLayout.openGame)
  expect(screen.getByTestId('pin')).toHaveTextContent('steam:7')
  expect(screen.getByTestId('hide')).toHaveTextContent('steam:7')
  expect(screen.getByRole('region', { name: 'Hades' })).toBeInTheDocument()
})

test('the card has the art of its game, blurred, behind it, and is a box of its own for it', () => {
  progression({})
  render(<LibraryEntryDetail entry={libraryEntry('steam', 7, 'Hades')} category="playing" />)
  expect(screen.getByTestId('backdrop')).toHaveTextContent('steam:7')
  const card = screen.getByRole('region', { name: 'Hades' })
  expect(card).toContainElement(screen.getByTestId('backdrop'))
  expect(card).toHaveClass('relative', 'isolate', 'overflow-hidden', 'flex-1')
})

describe('RA', () => {
  test('asks for the game and shows it loading until the answer comes', () => {
    progression({ isLoading: true })
    render(<LibraryEntryDetail entry={libraryEntry('ra', 5, 'Sonic')} category="completed" />)
    expect(useGameProgression).toHaveBeenCalledWith('5')
    expect(screen.getByTestId('ra-detail')).toHaveTextContent('5:completed:true:false')
  })
  test('no answer and no failure yet is still loading', () => {
    progression({})
    render(<LibraryEntryDetail entry={libraryEntry('ra', 5, 'Sonic')} category="playing" />)
    expect(screen.getByTestId('ra-detail')).toHaveTextContent('5:playing:true:false')
  })
  test('a failure is passed on', () => {
    progression({ error: 'boom' })
    render(<LibraryEntryDetail entry={libraryEntry('ra', 5, 'Sonic')} category="playing" />)
    expect(screen.getByTestId('ra-detail')).toHaveTextContent('5:playing:false:true')
  })
})

describe('Steam and PSN', () => {
  test('Steam shows its detail, or says there are no achievements', () => {
    const { rerender } = render(<LibraryEntryDetail entry={libraryEntry('steam', 7, 'Hades')} category="playing" />)
    expect(screen.getByTestId('steam-detail')).toBeInTheDocument()
    rerender(<LibraryEntryDetail entry={libraryEntry('steam', 7, 'Hades', { game: { hasStats: false } })} category="playing" />)
    expect(screen.queryByTestId('steam-detail')).not.toBeInTheDocument()
    expect(screen.getByText(en.steam.noAchievements)).toBeInTheDocument()
  })
  test('PSN shows its detail', () => {
    render(<LibraryEntryDetail entry={libraryEntry('psn', 9, 'Astro')} category="playing" />)
    expect(screen.getByTestId('psn-detail')).toBeInTheDocument()
  })
})
