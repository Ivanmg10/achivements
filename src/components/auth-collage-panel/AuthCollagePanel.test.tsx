import { render, fireEvent, act } from '@testing-library/react'
import AuthCollagePanel from './AuthCollagePanel'

test('fills every position in the scatter with a game tile', () => {
  const { container } = render(<AuthCollagePanel />)
  expect(container.querySelectorAll('img').length).toBe(24)
})

test('mixes both platforms', () => {
  const { container } = render(<AuthCollagePanel />)
  const sources = Array.from(container.querySelectorAll('img')).map((img) => img.getAttribute('src') ?? '')
  expect(sources.some((src) => src.includes('retroachievements.org'))).toBe(true)
  expect(sources.some((src) => src.includes('steamstatic.com'))).toBe(true)
})

test('every tile is decorative: empty alt text, hidden from assistive tech', () => {
  const { container } = render(<AuthCollagePanel />)
  for (const img of Array.from(container.querySelectorAll('img'))) {
    expect(img.getAttribute('alt')).toBe('')
    expect(img.getAttribute('aria-hidden')).toBe('true')
  }
})

test('every tile comes from the pool, never a made-up id', () => {
  const { container } = render(<AuthCollagePanel />)
  const sources = Array.from(container.querySelectorAll('img')).map((img) => img.getAttribute('src') ?? '')
  const ids = sources.filter((src) => src.includes('retroachievements')).map((src) => src.split('/').pop())
  expect(new Set(ids).size).toBe(ids.length)
  for (const src of sources) {
    expect(src.startsWith('https://media.retroachievements.org/') || src.startsWith('https://cdn.akamai.steamstatic.com/')).toBe(true)
  }
})

test('a tile that fails to load hides itself instead of leaving a broken image', () => {
  const { container } = render(<AuthCollagePanel />)
  const img = container.querySelector('img') as HTMLImageElement
  fireEvent.error(img)
  expect(img.style.visibility).toBe('hidden')
})

test('deals a different hand once mounted, so a refresh changes the wall', () => {
  const random = jest.spyOn(Math, 'random')
  random.mockReturnValue(0.9)
  const first = render(<AuthCollagePanel />)
  const a = Array.from(first.container.querySelectorAll('img')).map((img) => img.getAttribute('src'))
  first.unmount()

  random.mockReturnValue(0.1)
  const second = render(<AuthCollagePanel />)
  const b = Array.from(second.container.querySelectorAll('img')).map((img) => img.getAttribute('src'))
  expect(b).not.toEqual(a)
  random.mockRestore()
})

test('turns a tile over every few seconds and swaps its game', () => {
  jest.useFakeTimers()
  const { container } = render(<AuthCollagePanel />)
  const before = Array.from(container.querySelectorAll('img')).map((img) => img.getAttribute('src'))

  act(() => { jest.advanceTimersByTime(3200) })
  expect(container.querySelector('[data-flipping]')).not.toBeNull()

  act(() => { jest.advanceTimersByTime(700) })
  const after = Array.from(container.querySelectorAll('img')).map((img) => img.getAttribute('src'))
  expect(after).not.toEqual(before)
  expect(container.querySelector('[data-flipping]')).toBeNull()
  jest.useRealTimers()
})
