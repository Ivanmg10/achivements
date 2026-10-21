import { fireEvent, render, screen } from '@testing-library/react'
import { IconLayoutGrid, IconLayoutRows } from '@tabler/icons-react'
import GroupViewToggle from './GroupViewToggle'

const OPTIONS = [
  { value: 'covers', label: 'Covers', icon: IconLayoutGrid },
  { value: 'shelves', label: 'Shelves', icon: IconLayoutRows },
] as const

test('marks the current view and asks for the other', () => {
  const onChange = jest.fn()
  render(<GroupViewToggle options={[...OPTIONS]} value="covers" onChange={onChange} />)
  expect(screen.getByRole('group', { name: 'View' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Covers' })).toHaveAttribute('aria-pressed', 'true')
  const shelves = screen.getByRole('button', { name: 'Shelves' })
  expect(shelves).toHaveAttribute('aria-pressed', 'false')
  fireEvent.click(shelves)
  expect(onChange).toHaveBeenCalledWith('shelves')
})
