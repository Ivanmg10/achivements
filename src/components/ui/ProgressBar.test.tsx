import { render, screen } from '@testing-library/react'
import { ProgressBar } from './ProgressBar'

const fill = (container: HTMLElement, which: 'main' | 'soft') =>
  container.querySelector(`[data-fill="${which}"]`) as HTMLElement | null

test('exposes its value to assistive tech', () => {
  render(<ProgressBar pct={42.4} label="Portal 2" />)
  const bar = screen.getByRole('progressbar', { name: 'Portal 2' })
  expect(bar.getAttribute('aria-valuenow')).toBe('42')
  expect(bar.getAttribute('aria-valuemin')).toBe('0')
  expect(bar.getAttribute('aria-valuemax')).toBe('100')
})

test('fills to the given percentage in the theme colour', () => {
  const { container } = render(<ProgressBar pct={30} label="x" />)
  expect(fill(container, 'main')?.style.width).toBe('30%')
  expect(fill(container, 'main')?.className).toContain('bg-progress')
  expect(fill(container, 'soft')).toBeNull()
})

test('draws the softcore share darker behind the hardcore one', () => {
  const { container } = render(<ProgressBar pct={20} softPct={60} label="x" />)
  expect(fill(container, 'main')?.style.width).toBe('20%')
  expect(fill(container, 'soft')?.style.width).toBe('60%')
  expect(fill(container, 'soft')?.className).toContain('bg-progress-soft')
  // The overall value is the larger share.
  expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('60')
})

test('skips the soft bar when the bright one covers it', () => {
  const { container } = render(<ProgressBar pct={80} softPct={80} label="x" />)
  expect(fill(container, 'soft')).toBeNull()
})

test('a finished bar glows in the theme colour, by either share; no other colour on it', () => {
  const { container, rerender } = render(<ProgressBar pct={99} label="x" />)
  expect(screen.getByRole('progressbar')).not.toHaveAttribute('data-complete')
  expect(fill(container, 'main')?.style.background).toBe('')

  rerender(<ProgressBar pct={100} label="x" />)
  expect(screen.getByRole('progressbar')).toHaveAttribute('data-complete', 'true')
  expect(screen.getByRole('progressbar').style.filter).toContain('var(--progress)')
  expect(fill(container, 'main')?.style.background).toContain('var(--progress)')
  expect(fill(container, 'main')?.style.background).not.toContain('success')

  rerender(<ProgressBar pct={0} softPct={100} label="x" />)
  expect(screen.getByRole('progressbar')).toHaveAttribute('data-complete', 'true')
})

test('renders no fill at 0%', () => {
  const { container } = render(<ProgressBar pct={0} label="x" />)
  expect(fill(container, 'main')).toBeNull()
  expect(fill(container, 'soft')).toBeNull()
})

test('clamps out-of-range values', () => {
  const { container, rerender } = render(<ProgressBar pct={150} label="x" />)
  expect(fill(container, 'main')?.style.width).toBe('100%')
  expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('100')

  rerender(<ProgressBar pct={-20} label="x" />)
  expect(fill(container, 'main')).toBeNull()
  expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0')
})

test('accepts custom sizing classes', () => {
  render(<ProgressBar pct={10} label="x" height="h-3" trackClass="bg-black" className="flex-1" />)
  const bar = screen.getByRole('progressbar')
  expect(bar.className).toContain('h-3')
  expect(bar.querySelector('[data-track]')!.className).toContain('bg-black')
  expect(bar.className).toContain('flex-1')
})

test('only a finished bar glows, and its ends are cut on the slant', () => {
  const { rerender } = render(<ProgressBar pct={40} label="x" />)
  expect(screen.getByRole('progressbar').style.filter).toBe('')
  expect((screen.getByRole('progressbar').querySelector('[data-track]') as HTMLElement).style.clipPath).toContain('polygon')
  rerender(<ProgressBar pct={100} label="x" />)
  expect(screen.getByRole('progressbar').style.filter).toContain('drop-shadow')
})
