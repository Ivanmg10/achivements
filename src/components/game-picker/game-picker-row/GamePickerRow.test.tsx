import { render, screen, fireEvent } from '@testing-library/react'
import GamePickerRow from './GamePickerRow'
import type { GameCandidate } from '@/utils/gameCandidates'

const RA: GameCandidate = {
  key: 'ra:1', source: 'ra', id: 1, title: 'Super Mario 64', subtitle: 'Nintendo 64', imageRef: '/Images/1.png',
  pctWon: 0, numAwarded: 0, maxPossible: 0, status: null,
}
const STEAM: GameCandidate = { ...RA, key: 'steam:620', source: 'steam', id: 620, title: 'Portal 2', subtitle: 'Steam', imageRef: 'https://x/620.jpg' }

test('shows title, platform line and icon', () => {
  const { container } = render(<GamePickerRow candidate={RA} selected={false} onToggle={jest.fn()} />)
  expect(screen.getByText('Super Mario 64')).toBeInTheDocument()
  expect(screen.getByText('Nintendo 64')).toBeInTheDocument()
  expect(container.querySelector('img')?.getAttribute('src')).toBe('https://retroachievements.org/Images/1.png')
})

test('marks a Steam game with the Steam logo', () => {
  render(<GamePickerRow candidate={STEAM} selected={false} onToggle={jest.fn()} />)
  expect(screen.getByTestId('IconBrandSteam')).toBeInTheDocument()
  expect(screen.getByText('Steam')).toBeInTheDocument()
})

test('is a toggle that announces its state', () => {
  const onToggle = jest.fn()
  const { rerender } = render(<GamePickerRow candidate={RA} selected={false} onToggle={onToggle} />)
  const button = screen.getByRole('button', { name: /Super Mario 64/ })
  expect(button.getAttribute('aria-pressed')).toBe('false')

  fireEvent.click(button)
  expect(onToggle).toHaveBeenCalledTimes(1)

  rerender(<GamePickerRow candidate={RA} selected onToggle={onToggle} />)
  expect(button.getAttribute('aria-pressed')).toBe('true')
  expect(screen.getByTestId('IconCheck')).toBeInTheDocument()
})

test('falls back to a placeholder icon', () => {
  const { container } = render(<GamePickerRow candidate={{ ...RA, imageRef: '' }} selected={false} onToggle={jest.fn()} />)
  expect(container.querySelector('img')).toBeNull()
})
