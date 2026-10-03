import { fireEvent, render, screen } from '@testing-library/react'
import ShowAllButton from './ShowAllButton'

test('says how many there are, reports its state and toggles', () => {
  const onToggle = jest.fn()
  const { rerender } = render(<ShowAllButton total={153} expanded={false} onToggle={onToggle} />)
  const button = screen.getByRole('button', { name: /153/ })
  expect(button).toHaveAttribute('aria-expanded', 'false')
  fireEvent.click(button)
  expect(onToggle).toHaveBeenCalled()
  rerender(<ShowAllButton total={153} expanded onToggle={onToggle} />)
  expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument()
})
