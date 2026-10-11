jest.mock('@/hooks/useRaScreenshot', () => ({ useRaScreenshot: jest.fn(() => undefined) }))

import { fireEvent, render, screen } from '@testing-library/react'
import { useRaScreenshot } from '@/hooks/useRaScreenshot'
import LibraryEntryCover, { entryBackdrop, entryIcon } from './library-entry-cover/LibraryEntryCover'
import LibraryPlatformBadge from './library-platform-badge/LibraryPlatformBadge'
import LibraryEntryProgress from './library-entry-progress/LibraryEntryProgress'
import LibraryShelfCard from './library-shelf-card/LibraryShelfCard'
import LibraryListRow from './library-list-row/LibraryListRow'
import LibraryShelfBanner from './library-shelf-banner/LibraryShelfBanner'
import { libraryEntry } from '@/test-utils/libraryFixtures'

const ra = libraryEntry('ra', 5, 'Sonic', { pct: 40, lastPlayed: '2024-03-02T10:00:00Z' })
const steam = libraryEntry('steam', 7, 'Hades', { pct: 100 })
const psn = libraryEntry('psn', 9, 'Astro', { pct: 15, game: { heroUrl: 'https://img/hero.png' } })

describe('art', () => {
  test('RA\'s icon is a path on its site, the others\' a full URL', () => {
    expect(entryIcon(ra)).toBe('https://retroachievements.org/Images/1.png')
    expect(entryIcon(steam)).toBe('https://img/s.png')
    expect(entryIcon(libraryEntry('ra', 1, 'x', { game: { ImageIcon: '' } }))).toBeNull()
  })
  test('the backdrop: Steam\'s header, PSN\'s hero, RA\'s icon', () => {
    expect(entryBackdrop(steam)).toContain('header')
    expect(entryBackdrop(psn)).toBe('https://img/hero.png')
    expect(entryBackdrop(ra)).toBe(entryIcon(ra))
  })
  test('the cover draws the icon at its size', () => {
    const { container } = render(<LibraryEntryCover entry={ra} size={52} className="extra" />)
    expect(container.firstElementChild).toHaveStyle({ width: '52px', height: '52px' })
    expect(container.firstElementChild).toHaveClass('extra')
  })
})

test('the platform badge says the platform in words', () => {
  const { rerender } = render(<LibraryPlatformBadge source="ra" />)
  expect(screen.getByText('RetroAchievements')).toBeInTheDocument()
  rerender(<LibraryPlatformBadge source="psn" />)
  expect(screen.getByText('PlayStation')).toBeInTheDocument()
})

describe('progress', () => {
  test('a bar with its percentage, kept between 0 and 100', () => {
    const { rerender } = render(<LibraryEntryProgress source="steam" pct={42.4} label="Hades" />)
    expect(screen.getByRole('progressbar', { name: 'Hades' })).toHaveAttribute('aria-valuenow', '42')
    expect(screen.getByText('42%')).toBeInTheDocument()
    rerender(<LibraryEntryProgress source="steam" pct={250} label="Hades" />)
    expect(screen.getByText('100%')).toBeInTheDocument()
  })
  test('nothing for a game with no progress to tell', () => {
    const { container } = render(<LibraryEntryProgress source="ra" pct={null} label="x" />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('shelf card', () => {
  test('title, platform, progress and last played; picking it reports the game', () => {
    const onPick = jest.fn()
    render(<LibraryShelfCard entry={ra} onPick={onPick} />)
    expect(screen.getByText('Sonic')).toBeInTheDocument()
    expect(screen.getByText('RetroAchievements')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '40')
    expect(screen.getByText('3/10')).toBeInTheDocument()
    expect(screen.getByText(/ago/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button'))
    expect(onPick).toHaveBeenCalledWith(ra)
  })
  test('only what it knows: nothing about when for a game never played', () => {
    render(<LibraryShelfCard entry={steam} size="feature" onPick={jest.fn()} />)
    expect(screen.getByText('5/20')).toBeInTheDocument()
    expect(screen.queryByText(/ago|today|yesterday/)).not.toBeInTheDocument()
  })
  test('a game not started shows no counts', () => {
    render(<LibraryShelfCard entry={libraryEntry('ra', 6, 'Zelda', { pct: null, game: { NumAwarded: undefined, MaxPossible: undefined, ID: 6, AchievementsPublished: 40 } })} onPick={jest.fn()} />)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.queryByText(/\d+\/\d+/)).not.toBeInTheDocument()
    // It says how many achievements there are to get instead.
    expect(screen.getByText('40 achievements')).toBeInTheDocument()
  })
})

describe('list row', () => {
  test('the current row is outlined and named by aria-current; picking reports the game', () => {
    const onSelect = jest.fn()
    const { rerender } = render(<LibraryListRow entry={psn} current={false} onSelect={onSelect} />)
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-current')
    fireEvent.click(screen.getByRole('button'))
    expect(onSelect).toHaveBeenCalledWith(psn)
    rerender(<LibraryListRow entry={psn} current onSelect={onSelect} />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-current', 'true')
  })
})

describe('shelf banner', () => {
  test('Steam gets its header, a PSN game with a hero its hero, the rest their icon blown up', () => {
    const { container, rerender } = render(<LibraryShelfBanner entry={steam} />)
    expect(container.querySelector('img')?.getAttribute('src')).toContain('7')
    rerender(<LibraryShelfBanner entry={psn} />)
    expect(container.querySelector('img')?.getAttribute('src')).toContain('hero.png')
    rerender(<LibraryShelfBanner entry={ra} />)
    expect(container.querySelector('img')?.getAttribute('class')).toContain('blur-2xl')
    rerender(<LibraryShelfBanner entry={libraryEntry('psn', 4, 'NoHero')} />)
    expect(container.querySelector('img')?.getAttribute('class')).toContain('blur-2xl')
  })
  test('RA fills the banner with its screenshot, sharp, once it arrives', () => {
    ;(useRaScreenshot as jest.Mock).mockReturnValue('https://retroachievements.org/Images/title.png')
    const { container } = render(<LibraryShelfBanner entry={ra} />)
    const imgs = container.querySelectorAll('img')
    expect(imgs).toHaveLength(1)
    expect(imgs[0].getAttribute('src')).toBe('https://retroachievements.org/Images/title.png')
    expect(imgs[0].getAttribute('class')).not.toContain('blur')
    ;(useRaScreenshot as jest.Mock).mockReturnValue(undefined)
  })
  test('RA asks only for its own games', () => {
    ;(useRaScreenshot as jest.Mock).mockClear()
    render(<LibraryShelfBanner entry={steam} />)
    expect(useRaScreenshot).toHaveBeenLastCalledWith(null)
    render(<LibraryShelfBanner entry={ra} />)
    expect(useRaScreenshot).toHaveBeenLastCalledWith(5)
  })
  test('hidden from assistive technology: the card names the game', () => {
    const { container } = render(<LibraryShelfBanner entry={ra} />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })
})
