import { fireEvent, render, screen } from '@testing-library/react'
import { en } from '@/translations/en'
import ConsoleFilter from './ConsoleFilter'

const pills = [{ id: 1, name: 'Mega Drive' }, { id: 21, name: 'PlayStation 2' }]

test('each console says whether it is selected, and selecting it is a button press', () => {
  const onToggle = jest.fn()
  render(<ConsoleFilter pills={pills} selected={new Set([21])} onToggle={onToggle} onClear={jest.fn()} />)
  expect(screen.getByRole('button', { name: 'PlayStation 2' })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('button', { name: 'Mega Drive' })).toHaveAttribute('aria-pressed', 'false')
  fireEvent.click(screen.getByRole('button', { name: 'Mega Drive' }))
  expect(onToggle).toHaveBeenCalledWith(1)
})

test('the clear button is translated and only there with a selection', () => {
  const { rerender } = render(<ConsoleFilter pills={pills} selected={new Set()} onToggle={jest.fn()} onClear={jest.fn()} />)
  expect(screen.queryByRole('button', { name: en.categoryPage.clearConsoles })).not.toBeInTheDocument()
  rerender(<ConsoleFilter pills={pills} selected={new Set([1])} onToggle={jest.fn()} onClear={jest.fn()} />)
  expect(screen.getByRole('button', { name: en.categoryPage.clearConsoles })).toBeInTheDocument()
})
