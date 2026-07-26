import { fireEvent, render, screen } from '@testing-library/react'
import StatusGridControl, { StatusGridCols } from './StatusGridControl'

function setup(cols: StatusGridCols) {
  const onChange = jest.fn()
  render(<StatusGridControl cols={cols} onChange={onChange} />)
  return { onChange }
}

test('marks the active column count as pressed', () => {
  setup(2)
  expect(screen.getByRole('button', { name: '2 per row' })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('button', { name: '1 per row' })).toHaveAttribute('aria-pressed', 'false')
  expect(screen.getByRole('button', { name: '3 per row' })).toHaveAttribute('aria-pressed', 'false')
})

test('clicking an option reports the new column count', () => {
  const { onChange } = setup(2)
  fireEvent.click(screen.getByRole('button', { name: '3 per row' }))
  expect(onChange).toHaveBeenCalledWith(3)
})

test('renders one button per layout option', () => {
  setup(1)
  expect(screen.getAllByRole('button')).toHaveLength(3)
})
