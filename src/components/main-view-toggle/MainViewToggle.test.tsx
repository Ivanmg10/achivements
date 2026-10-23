import { render, screen, fireEvent } from '@testing-library/react'
import { MainViewToggle } from './MainViewToggle'
import { useMainView } from '@/context/MainViewContext'
import { usePinnedGames } from '@/context/PinnedGamesContext'

jest.mock('@/context/MainViewContext', () => ({
  useMainView: jest.fn(),
}))

jest.mock('@/context/PinnedGamesContext', () => ({
  usePinnedGames: jest.fn(),
}))

const setView = jest.fn()

function setup(view: 'recent' | 'pinned', pins: unknown[] = []) {
  ;(useMainView as jest.Mock).mockReturnValue({ view, setView })
  ;(usePinnedGames as jest.Mock).mockReturnValue({ pins })
  return render(<MainViewToggle />)
}

beforeEach(() => {
  jest.clearAllMocks()
})

test('marks the pinned tab as selected when view is "pinned"', () => {
  setup('pinned')
  expect(screen.getByRole('tab', { name: 'Pinned games' })).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByRole('tab', { name: 'Recently played' })).toHaveAttribute('aria-selected', 'false')
})

test('marks the recent tab as selected when view is "recent"', () => {
  setup('recent')
  expect(screen.getByRole('tab', { name: 'Recently played' })).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByRole('tab', { name: 'Pinned games' })).toHaveAttribute('aria-selected', 'false')
})

test('only the selected tab is in the tab order', () => {
  setup('recent')
  expect(screen.getByRole('tab', { name: 'Recently played' })).toHaveAttribute('tabindex', '0')
  expect(screen.getByRole('tab', { name: 'Pinned games' })).toHaveAttribute('tabindex', '-1')
})

test('shows how many games are pinned', () => {
  setup('recent', [{}, {}, {}])
  expect(screen.getByRole('tab', { name: 'Pinned games 3' })).toBeInTheDocument()
})

test('switches to pinned when the pinned tab is clicked', () => {
  setup('recent')
  fireEvent.click(screen.getByRole('tab', { name: 'Pinned games' }))
  expect(setView).toHaveBeenCalledWith('pinned')
})

test('switches to recent when the recent tab is clicked', () => {
  setup('pinned')
  fireEvent.click(screen.getByRole('tab', { name: 'Recently played' }))
  expect(setView).toHaveBeenCalledWith('recent')
})

test('the arrow keys switch to the other tab', () => {
  setup('recent')
  fireEvent.keyDown(screen.getByRole('tab', { name: 'Recently played' }), { key: 'ArrowRight' })
  expect(setView).toHaveBeenCalledWith('pinned')
})
