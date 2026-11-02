import { fireEvent, render, screen } from '@testing-library/react'
import DropSlot from './DropSlot'

test('a drop slot is a named action with the shared striped surface', () => {
  const onClick = jest.fn()
  render(<DropSlot label="Add games" onClick={onClick}><span>+</span></DropSlot>)
  const button = screen.getByRole('button', { name: 'Add games' })
  expect(button).toHaveClass('rounded-card', 'bg-[repeating-linear-gradient(-60deg,rgb(var(--accent)/0.05)_0_10px,transparent_10px_20px)]')
  fireEvent.click(button)
  expect(onClick).toHaveBeenCalled()
})
