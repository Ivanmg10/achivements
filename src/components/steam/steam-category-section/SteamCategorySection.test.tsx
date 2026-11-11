jest.mock('@/hooks/useSteamGamesByCategory', () => ({ useSteamGamesByCategory: jest.fn() }))
jest.mock('@/components/steam/steam-status-game-item/SteamStatusGameItem', () => ({
  __esModule: true,
  default: ({ game }: { game: { title: string } }) => <div data-testid="game">{game.title}</div>,
}))

import { render, screen } from '@testing-library/react'
import SteamCategorySection from './SteamCategorySection'
import { useSteamGamesByCategory } from '@/hooks/useSteamGamesByCategory'
import { en } from '@/translations/en'

const GAMES = [{ id: 1, title: 'Portal 2' }, { id: 2, title: 'Hades' }]

function setHook(overrides: Record<string, unknown> = {}) {
  ;(useSteamGamesByCategory as jest.Mock).mockReturnValue({
    games: GAMES, isLinked: true, loading: false, error: null, progressTruncated: false, refetch: jest.fn(), ...overrides,
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  window.sessionStorage.clear()
  // The tests look at the unfolded section; folding is the contract's.
  for (const c of ['playing', 'completed', 'wantToPlay']) window.sessionStorage.setItem(`steam-section-open:${c}`, 'open')
  setHook()
})

describe('partial progress note', () => {
  test('warns that playing/completed may be incomplete while counts are missing', () => {
    setHook({ progressTruncated: true })
    render(<SteamCategorySection category="completed" />)
    expect(screen.getByText(en.steam.partialProgressNote)).toBeInTheDocument()
  })

  test('is not shown for want to play, which does not depend on counts', () => {
    setHook({ progressTruncated: true })
    render(<SteamCategorySection category="wantToPlay" />)
    expect(screen.queryByText(en.steam.partialProgressNote)).not.toBeInTheDocument()
  })

  test('is not shown when every game was counted', () => {
    render(<SteamCategorySection category="playing" />)
    expect(screen.queryByText(en.steam.partialProgressNote)).not.toBeInTheDocument()
  })

  test('is not shown while loading, or when the load failed', () => {
    setHook({ progressTruncated: true, loading: true, games: [] })
    const { unmount } = render(<SteamCategorySection category="playing" />)
    expect(screen.queryByText(en.steam.partialProgressNote)).not.toBeInTheDocument()
    unmount()
    setHook({ progressTruncated: true, error: 'boom', games: [] })
    render(<SteamCategorySection category="playing" />)
    expect(screen.queryByText(en.steam.partialProgressNote)).not.toBeInTheDocument()
  })
})

test('a failed load points at the profile being private', () => {
  setHook({ error: 'boom', games: [] })
  render(<SteamCategorySection category="playing" />)
  expect(screen.getByText(en.steam.privateProfileHint)).toBeInTheDocument()
})

test('takes a heading override for pages showing several categories', () => {
  render(<SteamCategorySection category="playing" title="Steam · Playing" />)
  expect(screen.getByRole('region', { name: 'Steam · Playing' })).toBeInTheDocument()
})

test('applies root classes, and renders no wrapper at all when unlinked', () => {
  const { container, rerender } = render(<SteamCategorySection category="playing" className="bg-bg-card" />)
  expect((container.firstChild as HTMLElement).className).toContain('bg-bg-card')

  setHook({ isLinked: false })
  rerender(<SteamCategorySection category="playing" className="bg-bg-card" />)
  expect(container).toBeEmptyDOMElement()
})
