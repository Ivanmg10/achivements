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

test('positioned for its touch area, unless the caller places it: a badge corner star stays out of the flow (#164)', () => {
  const { rerender } = render(<ToggleButton pressed={false} onToggle={() => {}} label="Pin it" icon={IconStar} />)
  expect(screen.getByRole('button').className.split(' ')).toContain('relative')
  rerender(<ToggleButton pressed={false} onToggle={() => {}} label="Pin it" icon={IconStar} className="absolute -top-1 -right-1" />)
  expect(screen.getByRole('button').className.split(' ')).not.toContain('relative')
  expect(screen.getByRole('button')).toHaveClass('absolute', 'tap-target')
})
