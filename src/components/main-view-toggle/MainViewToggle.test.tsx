import { render, screen, fireEvent } from '@testing-library/react'
import { MainViewToggle } from './MainViewToggle'
import { useMainView } from '@/context/MainViewContext'

jest.mock('@/context/MainViewContext', () => ({
  useMainView: jest.fn(),
}))

const setView = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
})

test('marks the pinned tab as selected when view is "pinned"', () => {
  ;(useMainView as jest.Mock).mockReturnValue({ view: 'pinned', setView })
  render(<MainViewToggle />)
  expect(screen.getByRole('tab', { name: 'View pinned games' })).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByRole('tab', { name: 'View recently played' })).toHaveAttribute('aria-selected', 'false')
})

test('marks the recent tab as selected when view is "recent"', () => {
  ;(useMainView as jest.Mock).mockReturnValue({ view: 'recent', setView })
  render(<MainViewToggle />)
  expect(screen.getByRole('tab', { name: 'View recently played' })).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByRole('tab', { name: 'View pinned games' })).toHaveAttribute('aria-selected', 'false')
})

test('switches to pinned when the pinned tab is clicked', () => {
  ;(useMainView as jest.Mock).mockReturnValue({ view: 'recent', setView })
  render(<MainViewToggle />)
  fireEvent.click(screen.getByRole('tab', { name: 'View pinned games' }))
  expect(setView).toHaveBeenCalledWith('pinned')
})

test('switches to recent when the recent tab is clicked', () => {
  ;(useMainView as jest.Mock).mockReturnValue({ view: 'pinned', setView })
  render(<MainViewToggle />)
  fireEvent.click(screen.getByRole('tab', { name: 'View recently played' }))
  expect(setView).toHaveBeenCalledWith('recent')
})
