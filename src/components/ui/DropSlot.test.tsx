import { fireEvent, render, screen } from '@testing-library/react'
import DropSlot from './DropSlot'

test('a drop slot is a named action with the shared dashed border', () => {
  const onClick = jest.fn()
  render(<DropSlot label="Add games" onClick={onClick}><span>+</span></DropSlot>)
  const button = screen.getByRole('button', { name: 'Add games' })
  expect(button).toHaveClass('rounded-card', 'border-dashed')
  expect(button.className).not.toMatch(/repeating-linear-gradient/)
  fireEvent.click(button)
  expect(onClick).toHaveBeenCalled()
})
