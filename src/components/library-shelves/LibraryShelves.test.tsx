jest.mock('@/hooks/useRaScreenshot', () => ({ useRaScreenshot: jest.fn(() => undefined) }))
jest.mock('@/components/library-entry-cover/LibraryEntryCover', () => ({
  __esModule: true,
  default: ({ entry, shared }: { entry: { key: string }; shared?: boolean }) => <span data-testid="cover" data-shared={String(!!shared)}>{entry.key}</span>,
  entryBackdrop: () => null,
}))

import { fireEvent, render, screen, within } from '@testing-library/react'
import LibraryShelves from './LibraryShelves'
import { libraryEntry } from '@/test-utils/libraryFixtures'
import { bentoCells, seededRandom } from '@/utils/bentoLayout'
import { en } from '@/translations/en'

const days = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()
const entries = [
  libraryEntry('steam', 1, 'Today', { pct: 20, lastPlayed: days(0) }),
  libraryEntry('ra', 2, 'Nearly', { pct: 90, lastPlayed: days(30) }),
  libraryEntry('psn', 3, 'Dusty', { pct: 10, lastPlayed: days(200) }),
  libraryEntry('steam', 4, 'Plain', { pct: 40, lastPlayed: days(20) }),
]
const SEED = 12345
const props = { entries, category: 'playing', seed: SEED, onPick: jest.fn(), onSeeShelf: jest.fn(), onSeeAll: jest.fn() }
const shelf = (name: string) => screen.getByRole('region', { name })

beforeEach(() => jest.clearAllMocks())

test('a shelf for what needs each thing, every platform together', () => {
  render(<LibraryShelves {...props} />)
  const s = en.libraryLayout.shelves
  expect(within(shelf(s.continue.title)).getByText('Today')).toBeInTheDocument()
  expect(within(shelf(s.almost.title)).getByText('Nearly')).toBeInTheDocument()
  expect(within(shelf(s.stalled.title)).getByText('Dusty')).toBeInTheDocument()
  expect(within(shelf(s.rest.title)).getByText('Plain')).toBeInTheDocument()
})

test('picking a card reports that game', () => {
  render(<LibraryShelves {...props} />)
  fireEvent.click(screen.getByRole('button', { name: /Nearly/ }))
  expect(props.onPick).toHaveBeenCalledWith(entries[1])
})

test('a shelf with more than it shows says how many, and opens them', () => {
  const many = Array.from({ length: 12 }, (_, i) => libraryEntry('steam', 100 + i, `Game ${i}`, { pct: 40, lastPlayed: days(20 + i) }))
  render(<LibraryShelves {...props} entries={many} />)
  expect(screen.getAllByRole('button', { name: /Game \d/ })).toHaveLength(9)
  fireEvent.click(screen.getByRole('button', { name: 'See 12' }))
  expect(props.onSeeShelf).toHaveBeenCalledWith('all')
})

test('a completed list opens on the latest finished', () => {
  const done = [libraryEntry('ra', 9, 'Old', { pct: 100, lastPlayed: days(400) }), libraryEntry('ra', 8, 'New', { pct: 100, lastPlayed: days(2) })]
  render(<LibraryShelves {...props} entries={done} category="completed" />)
  expect(within(shelf(en.libraryLayout.shelves.recent.title)).getByText('New')).toBeInTheDocument()
})

describe('the bento', () => {
  // Games played this week make one shelf, in the order they were played.
  const games = (n: number, name = 'Hot', from = 300) => Array.from({ length: n }, (_, i) => libraryEntry('steam', from + i, `${name} ${i}`, { pct: 20, lastPlayed: days(i / 10) }))
  // The button is stretched over its card: the card is the box it sits in, and that box's parent is its place in the grid.
  const cards = (name = 'Hot') => screen.getAllByRole('button', { name: new RegExp(`${name} \\d`) }).map((b) => b.parentElement!)
  const sizeOf = (b: HTMLElement) => b.querySelector('.line-clamp-2')!.className.match(/text-(xl|lg|sm)/)![1]
  const expected = (n: number, seed: number) => bentoCells(n, seededRandom(seed)).map((c) => ({ compact: 'sm', wide: 'lg', feature: 'xl' })[c.size])

  test('is the layout its seed draws, and the same seed always draws the same', () => {
    const { unmount } = render(<LibraryShelves {...props} entries={games(9)} />)
    expect(cards().map(sizeOf)).toEqual(expected(9, SEED))
    unmount()
    render(<LibraryShelves {...props} entries={games(9)} />)
    expect(cards().map(sizeOf)).toEqual(expected(9, SEED))
  })

  test('a different seed can arrange the same games another way, but always with four small ones on top', () => {
    const seen = new Set<string>()
    for (let seed = 1; seed <= 25; seed++) {
      const { unmount } = render(<LibraryShelves {...props} seed={seed} entries={games(9)} />)
      const sizes = cards().map(sizeOf)
      expect(sizes.slice(0, 4)).toEqual(['sm', 'sm', 'sm', 'sm'])
      seen.add(sizes.join())
      unmount()
    }
    expect(seen.size).toBeGreaterThan(1)
  })

  test('every shelf is drawn from its own seed, so two shelves need not look alike', () => {
    // "Warm" games are almost done: the second shelf, a different seed from the first.
    const warm = Array.from({ length: 9 }, (_, i) => libraryEntry('ra', 500 + i, `Warm ${i}`, { pct: 85, lastPlayed: days(30) }))
    render(<LibraryShelves {...props} entries={[...games(9), ...warm]} />)
    expect(cards('Hot').map(sizeOf)).toEqual(expected(9, SEED))
    expect(cards('Warm').map(sizeOf)).toEqual(expected(9, SEED + 7919))
  })

  test('a big card is two columns wide, a featured one two rows tall, and one on the right says so', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const { unmount } = render(<LibraryShelves {...props} seed={seed} entries={games(9)} />)
      const drawn = bentoCells(9, seededRandom(seed))
      cards().forEach((b, i) => {
        const slot = b.parentElement!
        if (drawn[i].size !== 'compact') expect(slot).toHaveClass('sm:col-span-2')
        if (drawn[i].size === 'feature') expect(slot).toHaveClass('lg:row-span-2')
        if (drawn[i].right) expect(slot).toHaveClass('lg:col-start-2', 'xl:col-start-3')
        else expect(slot).not.toHaveClass('xl:col-start-3')
      })
      unmount()
    }
  })

  test('a phone gets the first six of a shelf, the rest is a click away', () => {
    render(<LibraryShelves {...props} entries={games(9)} />)
    expect(cards().map((b) => b.parentElement!.classList.contains('max-sm:hidden'))).toEqual([false, false, false, false, false, false, true, true, true])
  })

  test('four or fewer games are all small', () => {
    render(<LibraryShelves {...props} entries={games(3)} />)
    expect(cards().map(sizeOf)).toEqual(['sm', 'sm', 'sm'])
  })
})

describe('the "see all" button', () => {
  test('is one button, kept at the bottom edge of the screen while the shelves are in view', () => {
    render(<LibraryShelves {...props} />)
    const button = screen.getByRole('button', { name: 'See all 4 games' })
    expect(screen.getAllByRole('button', { name: 'See all 4 games' })).toHaveLength(1)
    expect(button.parentElement).toHaveClass('sticky', 'bottom-5')
    fireEvent.click(button)
    expect(props.onSeeAll).toHaveBeenCalled()
  })
  test('counts every game of the list, shelf or not', () => {
    render(<LibraryShelves {...props} entries={[entries[0]]} />)
    expect(screen.getByRole('button', { name: 'See all 1 games' })).toBeInTheDocument()
  })
})
