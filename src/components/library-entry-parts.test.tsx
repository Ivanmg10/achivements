jest.mock('@/hooks/useRaScreenshot', () => ({ useRaScreenshot: jest.fn(() => undefined) }))

import { fireEvent, render, screen } from '@testing-library/react'
import { useRaScreenshot } from '@/hooks/useRaScreenshot'
import LibraryEntryCover, { entryBackdrop, entryIcon } from './library-entry-cover/LibraryEntryCover'
import LibraryPlatformBadge from './library-platform-badge/LibraryPlatformBadge'
import LibraryListRow from './library-list-row/LibraryListRow'
import LibraryEntryBanner from './library-entry-banner/LibraryEntryBanner'
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

describe('entry banner', () => {
  test('Steam gets its header, a PSN game with a hero its hero, the rest their icon blown up', () => {
    const { container, rerender } = render(<LibraryEntryBanner entry={steam} />)
    expect(container.querySelector('img')?.getAttribute('src')).toContain('7')
    rerender(<LibraryEntryBanner entry={psn} />)
    expect(container.querySelector('img')?.getAttribute('src')).toContain('hero.png')
    rerender(<LibraryEntryBanner entry={ra} />)
    expect(container.querySelector('img')?.getAttribute('class')).toContain('blur-2xl')
    rerender(<LibraryEntryBanner entry={libraryEntry('psn', 4, 'NoHero')} />)
    expect(container.querySelector('img')?.getAttribute('class')).toContain('blur-2xl')
  })
  test('RA fills the banner with its screenshot, sharp, once it arrives', () => {
    ;(useRaScreenshot as jest.Mock).mockReturnValue('https://retroachievements.org/Images/title.png')
    const { container } = render(<LibraryEntryBanner entry={ra} />)
    const imgs = container.querySelectorAll('img')
    expect(imgs).toHaveLength(1)
    expect(imgs[0].getAttribute('src')).toBe('https://retroachievements.org/Images/title.png')
    expect(imgs[0].getAttribute('class')).not.toContain('blur')
    ;(useRaScreenshot as jest.Mock).mockReturnValue(undefined)
  })
  test('RA asks only for its own games', () => {
    ;(useRaScreenshot as jest.Mock).mockClear()
    render(<LibraryEntryBanner entry={steam} />)
    expect(useRaScreenshot).toHaveBeenLastCalledWith(null)
    render(<LibraryEntryBanner entry={ra} />)
    expect(useRaScreenshot).toHaveBeenLastCalledWith(5)
  })
  test('hidden from assistive technology: the card names the game', () => {
    const { container } = render(<LibraryEntryBanner entry={ra} />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })
})
