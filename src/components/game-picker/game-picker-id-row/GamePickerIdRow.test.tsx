import { render, screen, fireEvent } from '@testing-library/react'
import GamePickerIdRow from './GamePickerIdRow'
import { en } from '@/translations/en'

test('names the id, toggles, and says whether it is picked', () => {
  const onToggle = jest.fn()
  const { rerender } = render(<GamePickerIdRow id={1234} selected={false} onToggle={onToggle} />)
  const row = screen.getByRole('button', { name: `${en.search.openById} #1234` })
  expect(row).toHaveAttribute('aria-pressed', 'false')
  fireEvent.click(row)
  expect(onToggle).toHaveBeenCalled()
  rerender(<GamePickerIdRow id={1234} selected onToggle={onToggle} />)
  expect(screen.getByRole('button', { name: /#1234/ })).toHaveAttribute('aria-pressed', 'true')
})
