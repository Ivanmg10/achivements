import { render, fireEvent } from '@testing-library/react'
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

test('the same tiles come back on every render, so the server and browser agree', () => {
  const first = render(<AuthCollagePanel />)
  const a = Array.from(first.container.querySelectorAll('img')).map((img) => img.getAttribute('src'))
  first.unmount()
  const second = render(<AuthCollagePanel />)
  const b = Array.from(second.container.querySelectorAll('img')).map((img) => img.getAttribute('src'))
  expect(b).toEqual(a)
})

test('a tile that fails to load hides itself instead of leaving a broken image', () => {
  const { container } = render(<AuthCollagePanel />)
  const img = container.querySelector('img') as HTMLImageElement
  fireEvent.error(img)
  expect(img.style.visibility).toBe('hidden')
})
