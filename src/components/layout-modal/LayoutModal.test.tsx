import { render, screen, fireEvent } from '@testing-library/react'
import LayoutModal from './LayoutModal'
import { en } from '@/translations/en'

beforeEach(() => localStorage.clear())

test('names itself Layout, and opens on the Page tab with the shape', () => {
  render(<LayoutModal isOpen onClose={jest.fn()} />)
  expect(screen.getByRole('dialog', { name: en.homeLayout.layoutLabel })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: en.homeLayout.tabPage })).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByRole('group', { name: en.homeLayout.shapeLabel })).toBeInTheDocument()
  expect(screen.queryByRole('group', { name: en.homeLayout.cardsLabel })).not.toBeInTheDocument()
})

test('the Home tab holds the home layout and the game cards', () => {
  render(<LayoutModal isOpen onClose={jest.fn()} />)
  fireEvent.click(screen.getByRole('tab', { name: en.homeLayout.tabHome }))
  expect(screen.getByRole('group', { name: en.homeLayout.label })).toBeInTheDocument()
  expect(screen.getByRole('group', { name: en.homeLayout.cardsLabel })).toBeInTheDocument()
  expect(screen.queryByRole('group', { name: en.homeLayout.shapeLabel })).not.toBeInTheDocument()
})

test('closed, it draws nothing', () => {
  const { baseElement } = render(<LayoutModal isOpen={false} onClose={jest.fn()} />)
  expect(baseElement.querySelector('[role="dialog"]')).toBeNull()
})
