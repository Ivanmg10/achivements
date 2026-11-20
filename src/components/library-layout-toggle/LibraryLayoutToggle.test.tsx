import { fireEvent, render, screen } from '@testing-library/react'
import LibraryLayoutToggle from './LibraryLayoutToggle'

test('a labelled group, the current view marked and the others reported when chosen', () => {
  const onChange = jest.fn()
  render(<LibraryLayoutToggle value="list" onChange={onChange} />)
  expect(screen.getByRole('group', { name: 'Layout' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'List' })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('button', { name: 'Cards' })).toHaveAttribute('aria-pressed', 'false')
  expect(screen.queryByRole('button', { name: 'Shelves' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Cards' }))
  expect(onChange).toHaveBeenCalledWith('cards')
})
