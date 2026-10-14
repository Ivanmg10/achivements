import { render, screen } from '@testing-library/react'
import GameInfoHeaderScreenshots from './GameInfoHeaderScreenshots'
import { en } from '@/translations/en'

const SHOTS = [
  { thumb: 't1.jpg', full: 'f1.jpg' },
  { thumb: 't2.jpg', full: 'f2.jpg' },
  { thumb: 't3.jpg', full: 'f3.jpg' },
]

describe('GameInfoHeaderScreenshots', () => {
  test('shows the first two, each opening the full image', () => {
    render(<GameInfoHeaderScreenshots screenshots={SHOTS} title="Fallout 4" />)
    const imgs = screen.getAllByRole('img')
    expect(imgs).toHaveLength(2)
    expect(imgs[0].getAttribute('alt')).toBe(`Fallout 4 — ${en.steam.screenshot} 1`)

    const links = screen.getAllByRole('link')
    expect(links[1].getAttribute('href')).toBe('f2.jpg')
    expect(links[1].getAttribute('target')).toBe('_blank')
  })

  test('renders nothing without screenshots', () => {
    const { container } = render(<GameInfoHeaderScreenshots screenshots={[]} title="x" />)
    expect(container).toBeEmptyDOMElement()
  })
})
