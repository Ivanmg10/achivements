import { render } from '@testing-library/react'
import GameCover from './GameCover'

const mockBoxArt = jest.fn()
jest.mock('@/hooks/useRaBoxArt', () => ({ useRaBoxArt: (ids: number[]) => mockBoxArt(ids) }))

beforeEach(() => mockBoxArt.mockReset())

test('RA: the box art when it has come back', () => {
  mockBoxArt.mockReturnValue({ 5: 'https://retroachievements.org/Images/box5.png' })
  const { container } = render(<GameCover source="ra" id={5} iconUrl="https://retroachievements.org/Images/icon5.png" />)
  expect(container.querySelector('img')).toHaveAttribute('src', 'https://retroachievements.org/Images/box5.png')
  expect(mockBoxArt).toHaveBeenCalledWith([5])
})

test('RA: the icon until then', () => {
  mockBoxArt.mockReturnValue({})
  const { container } = render(<GameCover source="ra" id={5} iconUrl="https://retroachievements.org/Images/icon5.png" />)
  expect(container.querySelector('img')).toHaveAttribute('src', 'https://retroachievements.org/Images/icon5.png')
})

test('Steam: its portrait cover, and no RA lookup', () => {
  mockBoxArt.mockReturnValue({})
  const { container } = render(<GameCover source="steam" id={620} />)
  expect(container.querySelector('img')?.getAttribute('src')).toContain('/620/library_600x900')
  expect(mockBoxArt).toHaveBeenCalledWith([])
})

test('the caller sets the height', () => {
  mockBoxArt.mockReturnValue({})
  const { container } = render(<GameCover source="steam" id={620} className="h-48" />)
  expect(container.firstElementChild).toHaveClass('h-48')
})
