import { fireEvent, render, screen } from '@testing-library/react'
import GamePickerTile from './GamePickerTile'
import type { GameCandidate } from '@/utils/gameCandidates'

jest.mock('next/image', () => ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />)

const c: GameCandidate = {
  key: 'ra:1', source: 'ra', id: 1, title: 'Zelda', subtitle: 'SNES', imageRef: '/Images/1.png',
  pctWon: 0.5, numAwarded: 5, maxPossible: 10, status: 'in-progress',
}

test('a toggle with the game, its platform and progress', () => {
  const onToggle = jest.fn()
  const { container } = render(<GamePickerTile candidate={c} selected={false} onToggle={onToggle} />)
  const button = screen.getByRole('button', { name: /Zelda/ })
  expect(button).toHaveAttribute('aria-pressed', 'false')
  expect(button).toHaveTextContent('SNES')
  expect(container.querySelector('img')).toHaveAttribute('src', 'https://retroachievements.org/Images/1.png')
  expect(screen.getByRole('progressbar')).toBeInTheDocument()
  fireEvent.click(button)
  expect(onToggle).toHaveBeenCalled()
})

test('picked is announced', () => {
  render(<GamePickerTile candidate={c} selected onToggle={jest.fn()} />)
  expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
})
