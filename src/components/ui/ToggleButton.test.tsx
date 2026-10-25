import { render, screen, fireEvent } from '@testing-library/react'
import { IconStar, IconStarFilled } from '@tabler/icons-react'
import ToggleButton from './ToggleButton'

test('reports its state, and the icon changes shape when on', () => {
  const onToggle = jest.fn()
  const { rerender } = render(<ToggleButton pressed={false} onToggle={onToggle} label="Pin it" icon={IconStar} pressedIcon={IconStarFilled} />)
  const button = screen.getByRole('button', { name: 'Pin it' })
  expect(button).toHaveAttribute('aria-pressed', 'false')
  expect(screen.getByTestId('IconStar')).toBeInTheDocument()
  fireEvent.click(button)
  expect(onToggle).toHaveBeenCalled()
  rerender(<ToggleButton pressed onToggle={onToggle} label="Pin it" icon={IconStar} pressedIcon={IconStarFilled} />)
  expect(screen.getByRole('button', { name: 'Pin it' })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByTestId('IconStarFilled')).toBeInTheDocument()
})
