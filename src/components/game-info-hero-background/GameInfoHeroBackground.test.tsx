import { render } from '@testing-library/react'
import GameInfoHeroBackground from './GameInfoHeroBackground'

test('blurs the title/in-game screenshot behind the page, hidden from assistive tech', () => {
  const { container } = render(<GameInfoHeroBackground imagePath="/Images/1.png" />)
  const img = container.querySelector('img')!
  expect(img.getAttribute('src')).toBe('https://retroachievements.org/Images/1.png')
  expect(img.getAttribute('alt')).toBe('')
  expect(img.style.filter).toBe('blur(16px)')
  expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true')
})

test('renders nothing without an image', () => {
  const { container } = render(<GameInfoHeroBackground imagePath={null} />)
  expect(container).toBeEmptyDOMElement()
})
