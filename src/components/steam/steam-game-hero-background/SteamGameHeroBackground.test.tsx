import { render, fireEvent } from '@testing-library/react'
import SteamGameHeroBackground from './SteamGameHeroBackground'

const CDN = 'https://cdn.akamai.steamstatic.com/steam/apps/620'

test('blurs the 1920×620 library banner behind the page, hidden from assistive tech', () => {
  const { container } = render(<SteamGameHeroBackground appId={620} />)
  const img = container.querySelector('img')!
  expect(img.getAttribute('src')).toBe(`${CDN}/library_hero.jpg`)
  expect(img.getAttribute('alt')).toBe('')
  expect(img.style.filter).toBe('blur(16px)')
  expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true')
})

test('falls back to the store header, then drops out entirely', () => {
  const { container } = render(<SteamGameHeroBackground appId={620} />)

  fireEvent.error(container.querySelector('img')!)
  expect(container.querySelector('img')!.getAttribute('src')).toBe(`${CDN}/header.jpg`)

  fireEvent.error(container.querySelector('img')!)
  expect(container).toBeEmptyDOMElement()
})
