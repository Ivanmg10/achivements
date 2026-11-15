import { render, screen, fireEvent } from '@testing-library/react'
import ShowMore from './ShowMore'

test('says what it will do, and what it does once open', () => {
  const onToggle = jest.fn()
  const { rerender } = render(<ShowMore expanded={false} onToggle={onToggle} more="Show the other 31" less="Show fewer" />)
  const button = screen.getByRole('button', { name: 'Show the other 31' })
  expect(button).toHaveAttribute('aria-expanded', 'false')
  fireEvent.click(button)
  expect(onToggle).toHaveBeenCalled()
  rerender(<ShowMore expanded onToggle={onToggle} more="Show the other 31" less="Show fewer" />)
  expect(screen.getByRole('button', { name: 'Show fewer' })).toHaveAttribute('aria-expanded', 'true')
})
