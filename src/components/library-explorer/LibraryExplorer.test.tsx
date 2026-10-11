jest.mock('@/components/library-shelves/LibraryShelves', () => ({
  __esModule: true,
  default: ({ entries, flyKey, onPick, onSeeShelf, onSeeAll }: { entries: { key: string; title: string }[]; flyKey?: string | null; onPick: (e: unknown) => void; onSeeShelf: (q: string) => void; onSeeAll: () => void }) => (
    <div data-testid="shelves" data-flykey={flyKey ?? ''}>
      {entries.map((e) => <button key={e.key} onClick={() => onPick(e)}>{`pick ${e.title}`}</button>)}
      <button onClick={() => onSeeShelf('stalled')}>see-shelf</button>
      <button onClick={onSeeAll}>see-all</button>
    </div>
  ),
}))
jest.mock('@/components/library-list/LibraryList', () => ({
  __esModule: true,
  default: ({ entries, selected, wide, flyKey, onSelect }: { entries: { key: string }[]; selected?: { key: string }; wide: boolean; flyKey?: string | null; onSelect: (e: { key: string }) => void }) => (
    <div data-testid="list" data-selected={selected?.key} data-wide={String(wide)} data-flykey={flyKey ?? ''}>
      {entries.map((e) => e.key).join(',')}
      <button onClick={() => onSelect(entries[entries.length - 1])}>select-last</button>
    </div>
  ),
}))
jest.mock('@/hooks/useMediaQuery', () => ({ useMediaQuery: jest.fn(() => true) }))

import { fireEvent, render, screen } from '@testing-library/react'
import LibraryExplorer from './LibraryExplorer'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { libraryEntry } from '@/test-utils/libraryFixtures'

const days = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()
const entries = [
  libraryEntry('steam', 1, 'Beta', { pct: 90, lastPlayed: days(1) }),
  libraryEntry('ra', 2, 'Alpha', { pct: 40, lastPlayed: days(300) }),
  libraryEntry('psn', 3, 'Gamma', { pct: 60, lastPlayed: days(10) }),
]
const sort = { key: 'name' as const, dir: 'asc' as const }
const make = (over: Record<string, unknown> = {}) => ({
  category: 'playing', entries, platform: 'all' as const, layout: 'list' as const, onLayout: jest.fn(), query: '', onQuery: jest.fn(), quick: 'all' as const, onQuick: jest.fn(),
  sort, onSort: jest.fn(), selectedKey: null, onSelectKey: jest.fn(), ...over,
})
const rows = () => screen.getByTestId('list').textContent!.replace('select-last', '')

beforeEach(() => jest.clearAllMocks())

describe('shelves', () => {
  test('a picked card opens the list on that game', () => {
    const p = make({ layout: 'shelves' })
    render(<LibraryExplorer {...p} />)
    fireEvent.click(screen.getByRole('button', { name: 'pick Alpha' }))
    expect(p.onSelectKey).toHaveBeenCalledWith('ra:2')
    expect(p.onLayout).toHaveBeenCalledWith('list')
    // Whatever filter was left over is cleared, so the game picked is the one shown.
    expect(p.onQuick).toHaveBeenCalledWith('all')
  })
  test('"see N" of a shelf opens the list with its filter, "see all" the cards', () => {
    const p = make({ layout: 'shelves' })
    render(<LibraryExplorer {...p} />)
    fireEvent.click(screen.getByText('see-shelf'))
    expect(p.onQuick).toHaveBeenCalledWith('stalled')
    expect(p.onLayout).toHaveBeenCalledWith('list')
    fireEvent.click(screen.getByText('see-all'))
    expect(p.onLayout).toHaveBeenLastCalledWith('cards')
  })
  test('no filters on the shelves', () => {
    render(<LibraryExplorer {...make({ layout: 'shelves' })} />)
    expect(screen.queryByRole('group', { name: 'Quick filters' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Back to shelves' })).not.toBeInTheDocument()
  })
})

describe('changing platform', () => {
  test('the entries given are what is shown, and the view is keyed by the platform so it is swapped as a whole', () => {
    const { rerender } = render(<LibraryExplorer {...make({ layout: 'shelves' })} />)
    expect(screen.getByTestId('shelves')).toHaveTextContent('pick Beta')
    rerender(<LibraryExplorer {...make({ layout: 'shelves', platform: 'ra', entries: [entries[1]] })} />)
    expect(screen.getByTestId('shelves')).toHaveTextContent('pick Alpha')
    expect(screen.getByTestId('shelves')).not.toHaveTextContent('pick Beta')
  })
})

describe('list', () => {
  test('every game, in the chosen order', () => {
    render(<LibraryExplorer {...make()} />)
    expect(rows()).toBe('ra:2,steam:1,psn:3')
    render(<LibraryExplorer {...make({ sort: { key: 'percent', dir: 'desc' } })} />)
  })

  test('the first game is shown on a wide screen, none on a narrow one', () => {
    const { unmount } = render(<LibraryExplorer {...make()} />)
    expect(screen.getByTestId('list')).toHaveAttribute('data-selected', 'ra:2')
    unmount()
    ;(useMediaQuery as jest.Mock).mockReturnValueOnce(false)
    render(<LibraryExplorer {...make()} />)
    expect(screen.getByTestId('list')).not.toHaveAttribute('data-selected')
  })

  test('the game picked stays the one shown', () => {
    render(<LibraryExplorer {...make({ selectedKey: 'psn:3' })} />)
    expect(screen.getByTestId('list')).toHaveAttribute('data-selected', 'psn:3')
  })

  test('the search narrows the list', () => {
    render(<LibraryExplorer {...make({ query: 'gam' })} />)
    expect(rows()).toBe('psn:3')
  })

  test('the quick filters count what is left of the search and platform, only for games in progress', () => {
    const p = make()
    render(<LibraryExplorer {...p} />)
    expect(screen.getByRole('button', { name: /Almost done 1/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Stalled 1/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Stalled/ }))
    expect(p.onQuick).toHaveBeenCalledWith('stalled')
  })

  test('the quick filters are for games in progress only', () => {
    render(<LibraryExplorer {...make({ category: 'completed' })} />)
    expect(screen.queryByRole('group', { name: 'Quick filters' })).not.toBeInTheDocument()
  })

  test('back goes to the shelves, where the page was', () => {
    const p = make()
    window.scrollTo = jest.fn()
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => (cb(0), 0))
    render(<LibraryExplorer {...p} />)
    fireEvent.click(screen.getByRole('button', { name: 'Back to shelves' }))
    expect(p.onLayout).toHaveBeenCalledWith('shelves')
    expect(p.onQuick).toHaveBeenCalledWith('all')
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
  })

  test('selecting a row reports its key', () => {
    const p = make()
    render(<LibraryExplorer {...p} />)
    fireEvent.click(screen.getByText('select-last'))
    expect(p.onSelectKey).toHaveBeenCalledWith('psn:3')
  })

  test('the arrows move the selection, stopping at the ends', () => {
    const p = make({ selectedKey: 'steam:1' })
    render(<LibraryExplorer {...p} />)
    fireEvent.keyDown(document, { key: 'ArrowDown' })
    expect(p.onSelectKey).toHaveBeenLastCalledWith('psn:3')
    fireEvent.keyDown(document, { key: 'ArrowUp' })
    expect(p.onSelectKey).toHaveBeenLastCalledWith('ra:2')
  })

  test('Escape clears the search, and with none goes back', () => {
    const p = make({ query: 'x' })
    const { unmount } = render(<LibraryExplorer {...p} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(p.onQuery).toHaveBeenCalledWith('')
    unmount()
    const q = make()
    render(<LibraryExplorer {...q} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(q.onLayout).toHaveBeenCalledWith('shelves')
  })
})
