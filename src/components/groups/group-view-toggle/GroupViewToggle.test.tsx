import { fireEvent, render, screen } from '@testing-library/react'
import GroupViewToggle from './GroupViewToggle'

test('marks the current view and asks for the other', () => {
  const onChange = jest.fn()
  render(<GroupViewToggle value="covers" onChange={onChange} />)
  expect(screen.getByRole('button', { name: 'Covers' })).toHaveAttribute('aria-pressed', 'true')
  const shelves = screen.getByRole('button', { name: 'Shelves' })
  expect(shelves).toHaveAttribute('aria-pressed', 'false')
  fireEvent.click(shelves)
  expect(onChange).toHaveBeenCalledWith('shelves')
})
