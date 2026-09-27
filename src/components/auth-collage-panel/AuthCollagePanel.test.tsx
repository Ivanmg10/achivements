import { render, fireEvent } from '@testing-library/react'
import AuthCollagePanel from './AuthCollagePanel'

test('four columns, alternating up and down at their own speeds', () => {
  const { container } = render(<AuthCollagePanel />)
  const columns = Array.from(container.querySelectorAll('.marquee-column')) as HTMLElement[]

  expect(columns).toHaveLength(4)
  expect(columns.map((c) => c.style.animationName)).toEqual([
    'marquee-up',
    'marquee-down',
    'marquee-up',
    'marquee-down',
  ])
  const speeds = columns.map((c) => c.style.animationDuration)
  expect(new Set(speeds).size).toBe(speeds.length)
})

test('each column repeats its games once, so the loop has no seam', () => {
  const { container } = render(<AuthCollagePanel />)
  for (const column of Array.from(container.querySelectorAll('.marquee-column'))) {
    const sources = Array.from(column.querySelectorAll('img')).map((img) => img.getAttribute('src'))
    const half = sources.length / 2
    expect(sources.slice(0, half)).toEqual(sources.slice(half))
  }
})

const platform = (src: string | null) => (src?.includes('retroachievements') ? 'ra' : 'steam')

test('shows a slice of the pool, spread across the columns', () => {
  const { container } = render(<AuthCollagePanel />)
  const sources = new Set(Array.from(container.querySelectorAll('img')).map((img) => img.getAttribute('src')))
  expect(sources.size).toBe(32)
})

test('every column carries both platforms, alternating as it scrolls', () => {
  const { container } = render(<AuthCollagePanel />)
  for (const column of Array.from(container.querySelectorAll('.marquee-column'))) {
    const platforms = Array.from(column.querySelectorAll('img'))
      .slice(0, 5)
      .map((img) => platform(img.getAttribute('src')))
    expect(new Set(platforms).size).toBe(2)
    // …and never the same platform twice in a row.
    for (let i = 1; i < platforms.length; i++) expect(platforms[i]).not.toBe(platforms[i - 1])
  }
})

test('every tile comes from the pool, never a made-up id', () => {
  const { container } = render(<AuthCollagePanel />)
  for (const img of Array.from(container.querySelectorAll('img'))) {
    const src = img.getAttribute('src') ?? ''
    expect(
      src.startsWith('https://media.retroachievements.org/') ||
        src.startsWith('https://cdn.akamai.steamstatic.com/'),
    ).toBe(true)
  }
})

test('every tile is decorative: empty alt text, hidden from assistive tech', () => {
  const { container } = render(<AuthCollagePanel />)
  for (const img of Array.from(container.querySelectorAll('img'))) {
    expect(img.getAttribute('alt')).toBe('')
    expect(img.getAttribute('aria-hidden')).toBe('true')
  }
})

test('deals a different hand once mounted, so a refresh changes the wall', () => {
  const random = jest.spyOn(Math, 'random').mockReturnValue(0.9)
  const first = render(<AuthCollagePanel />)
  const a = Array.from(first.container.querySelectorAll('img')).map((img) => img.getAttribute('src'))
  first.unmount()

  random.mockReturnValue(0.1)
  const second = render(<AuthCollagePanel />)
  const b = Array.from(second.container.querySelectorAll('img')).map((img) => img.getAttribute('src'))
  expect(b).not.toEqual(a)
  random.mockRestore()
})

test('only a game stops its column, not the gaps between them', () => {
  const { container } = render(<AuthCollagePanel />)
  const column = container.querySelector('.marquee-column') as HTMLElement

  // The column itself never pauses on hover…
  expect(column.className).not.toContain('animation-play-state')
  // …the rule keys off a tile under the pointer instead (see globals.css).
  expect(column.querySelectorAll('[data-tile]').length).toBeGreaterThan(0)
})

test('a dead image hides itself instead of leaving a broken icon', () => {
  const { container } = render(<AuthCollagePanel />)
  const img = container.querySelector('img') as HTMLImageElement
  fireEvent.error(img)
  expect(img.style.visibility).toBe('hidden')
})
