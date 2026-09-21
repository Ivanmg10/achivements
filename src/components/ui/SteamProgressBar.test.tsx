import { render, screen } from '@testing-library/react'
import { SteamProgressBar } from './SteamProgressBar'

function fill(container: HTMLElement) {
  return container.querySelector('[role="progressbar"] > div') as HTMLElement | null
}

test('exposes its value to assistive tech', () => {
  render(<SteamProgressBar pct={42.4} label="Portal 2" />)
  const bar = screen.getByRole('progressbar', { name: 'Portal 2' })
  expect(bar.getAttribute('aria-valuenow')).toBe('42')
  expect(bar.getAttribute('aria-valuemin')).toBe('0')
  expect(bar.getAttribute('aria-valuemax')).toBe('100')
})

test('fills to the given percentage in Steam blue', () => {
  const { container } = render(<SteamProgressBar pct={30} label="x" />)
  expect(fill(container)?.style.width).toBe('30%')
  expect(fill(container)?.style.background).toContain('#66c0f4')
})

test('turns Steam green at 100%', () => {
  const { container } = render(<SteamProgressBar pct={100} label="x" />)
  expect(fill(container)?.style.background).toContain('#a4d007')
})

test('renders no fill at 0%', () => {
  const { container } = render(<SteamProgressBar pct={0} label="x" />)
  expect(fill(container)).toBeNull()
})

test('clamps out-of-range values', () => {
  const { container, rerender } = render(<SteamProgressBar pct={150} label="x" />)
  expect(fill(container)?.style.width).toBe('100%')
  expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('100')

  rerender(<SteamProgressBar pct={-20} label="x" />)
  expect(fill(container)).toBeNull()
  expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0')
})

test('accepts custom sizing classes', () => {
  render(<SteamProgressBar pct={10} label="x" height="h-3" trackClass="bg-black" className="flex-1" />)
  expect(screen.getByRole('progressbar').className).toContain('h-3')
  expect(screen.getByRole('progressbar').className).toContain('bg-black')
  expect(screen.getByRole('progressbar').className).toContain('flex-1')
})
