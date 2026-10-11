import { fireEvent, render, screen } from '@testing-library/react'
import LibraryViewToggle from './LibraryViewToggle'

test('marks the current view and reports the other one', () => {
  const onChange = jest.fn()
  render(<LibraryViewToggle value="platform" onChange={onChange} />)
  expect(screen.getByRole('group', { name: 'View' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'By platform' })).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(screen.getByRole('button', { name: 'All together' }))
  expect(onChange).toHaveBeenCalledWith('all')
})
