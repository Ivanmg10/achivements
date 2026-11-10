jest.mock('@/hooks/useSteamGamesByCategory', () => ({ useSteamGamesByCategory: jest.fn() }))
jest.mock('@/hooks/usePsnGamesByCategory', () => ({ usePsnGamesByCategory: jest.fn() }))
jest.mock('@/hooks/useXboxGamesByCategory', () => ({ useXboxGamesByCategory: jest.fn() }))
jest.mock('@/components/steam/steam-status-game-item/SteamStatusGameItem', () => ({ __esModule: true, default: ({ game, category }: { game: { title: string }; category?: string }) => <div data-testid="game">{game.title}:{category}</div> }))
jest.mock('@/components/psn/psn-status-game-item/PsnStatusGameItem', () => ({ __esModule: true, default: ({ game, category }: { game: { title: string }; category?: string }) => <div data-testid="game">{game.title}:{category}</div> }))
jest.mock('@/components/xbox/xbox-status-game-item/XboxStatusGameItem', () => ({ __esModule: true, default: ({ game, category }: { game: { title: string }; category?: string }) => <div data-testid="game">{game.title}:{category}</div> }))
jest.mock('@/components/collapsible-section/collapsible-section-preview/CollapsibleSectionPreview', () => ({
  __esModule: true,
  default: ({ games }: { games: { title: string }[] }) => <div data-testid="preview">{games.map((g) => g.title).join(',')}</div>,
}))

import { fireEvent, render, screen } from '@testing-library/react'
import type { ComponentType } from 'react'
import { en } from '@/translations/en'
import { psnGameFixture } from '@/test-utils/psnFixtures'
import { xboxGameFixture } from '@/test-utils/xboxFixtures'
import { toSteamGameProgress } from '@/utils/steamMappers'
import { useSteamGamesByCategory } from '@/hooks/useSteamGamesByCategory'
import { usePsnGamesByCategory } from '@/hooks/usePsnGamesByCategory'
import { useXboxGamesByCategory } from '@/hooks/useXboxGamesByCategory'
import SteamCategorySection from '@/components/steam/steam-category-section/SteamCategorySection'
import PsnCategorySection from '@/components/psn/psn-category-section/PsnCategorySection'
import XboxCategorySection from '@/components/xbox/xbox-category-section/XboxCategorySection'

/**
 * What every platform's category section promises (the shell, `PlatformCategorySection`), tested through
 * each adapter as a person uses it. Steam's heading override and partial-progress note, and which platform
 * says why a load failed, are in each adapter's own test.
 */

type Props = { category: string; query?: string; gridCols?: 1 | 2 | 3 }
type Platform = {
  name: string
  source: string
  Section: ComponentType<Props>
  hook: jest.Mock
  /** Two games, by title and how far along. */
  games: (specs: { id: number; title: string; pct: number }[]) => unknown[]
  texts: { section: string; error: string; retry: string; empty: string }
}

const PLATFORMS: Platform[] = [
  {
    name: 'Steam',
    source: 'steam',
    Section: SteamCategorySection,
    hook: useSteamGamesByCategory as jest.Mock,
    games: (specs) => specs.map((s) => ({ ...toSteamGameProgress({ appid: s.id, name: s.title, playtime_forever: 0, has_community_visible_stats: true, img_icon_url: 'h', rtime_last_played: 0 }), achievementsLoaded: true, maxPossible: 100, pctWon: s.pct })),
    texts: { section: en.steam.gamesSection, error: en.steam.gamesError, retry: en.steam.retry, empty: en.steam.noGamesInCategory },
  },
  {
    name: 'PlayStation',
    source: 'psn',
    Section: PsnCategorySection,
    hook: usePsnGamesByCategory as jest.Mock,
    games: (specs) => specs.map((s) => psnGameFixture({ id: s.id, title: s.title, pctWon: s.pct })),
    texts: { section: en.psn.gamesSection, error: en.psn.gamesError, retry: en.psn.retry, empty: en.psn.noGamesInCategory },
  },
  {
    name: 'Xbox',
    source: 'xbox',
    Section: XboxCategorySection,
    hook: useXboxGamesByCategory as jest.Mock,
    games: (specs) => specs.map((s) => xboxGameFixture({ id: s.id, title: s.title, pctWon: s.pct })),
    texts: { section: en.xbox.gamesSection, error: en.xbox.gamesError, retry: en.xbox.retry, empty: en.xbox.noGamesInCategory },
  },
]

const SPECS = [{ id: 1, title: 'Bloodborne', pct: 40 }, { id: 2, title: 'Astro Bot', pct: 60 }]
const refetch = jest.fn()

describe.each(PLATFORMS)('$name category section', (p) => {
  const set = (overrides: Record<string, unknown> = {}) =>
    p.hook.mockReturnValue({ games: p.games(SPECS), isLinked: true, loading: false, error: null, progressTruncated: false, refetch, ...overrides })
  const openIt = () => fireEvent.click(screen.getByRole('button', { name: new RegExp(p.texts.section) }))

  beforeEach(() => {
    jest.clearAllMocks()
    window.sessionStorage.clear()
    set()
  })

  test('renders nothing when the platform is not linked', () => {
    set({ isLinked: false })
    const { container } = render(<p.Section category="playing" />)
    expect(container).toBeEmptyDOMElement()
  })

  test('asks for its category and hands it to each card', () => {
    render(<p.Section category="completed" />)
    expect(p.hook).toHaveBeenCalledWith('completed')
    openIt()
    expect(screen.getAllByTestId('game')[0]).toHaveTextContent(':completed')
  })

  test('folded, it previews its games, furthest along first, and counts them', () => {
    render(<p.Section category="playing" />)
    expect(screen.getByRole('region', { name: p.texts.section })).toBeInTheDocument()
    expect(screen.getByTestId('preview')).toHaveTextContent('Astro Bot,Bloodborne')
    expect(screen.getByRole('button', { name: new RegExp(p.texts.section) })).toHaveTextContent('2')
  })

  test('open, it lists every game of its category in order, and remembers it for the session', () => {
    render(<p.Section category="playing" />)
    openIt()
    expect(screen.getAllByTestId('game').map((g) => g.textContent)).toEqual(['Bloodborne:playing', 'Astro Bot:playing'])
    expect(window.sessionStorage.getItem(`${p.source}-section-open:playing`)).toBe('open')
  })

  test('keeps only the games matching the page search, and says none match rather than that it is empty', () => {
    const { unmount } = render(<p.Section category="playing" query="astro" />)
    openIt()
    expect(screen.getAllByTestId('game').map((g) => g.textContent)).toEqual(['Astro Bot:playing'])
    unmount()
    render(<p.Section category="playing" query="zelda" />)
    expect(screen.getByText(en.search.noResults)).toBeInTheDocument()
    expect(screen.queryByText(p.texts.empty)).not.toBeInTheDocument()
  })

  test('says when the category has no games', () => {
    set({ games: [] })
    render(<p.Section category="playing" />)
    openIt()
    expect(screen.getByText(p.texts.empty)).toBeInTheDocument()
  })

  test('while loading, it is a busy skeleton with no count and no cards', () => {
    set({ loading: true, games: [] })
    const { container } = render(<p.Section category="playing" />)
    openIt()
    expect(container.querySelector('[aria-busy="true"]')!.children.length).toBeGreaterThan(0)
    expect(screen.queryByTestId('game')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: new RegExp(p.texts.section) })).not.toHaveTextContent('0')
  })

  test('a failed load says so and can be retried', () => {
    set({ games: [], error: 'boom' })
    render(<p.Section category="playing" />)
    openIt()
    expect(screen.getByRole('alert')).toHaveTextContent(p.texts.error)
    fireEvent.click(screen.getByRole('button', { name: p.texts.retry }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })
})
