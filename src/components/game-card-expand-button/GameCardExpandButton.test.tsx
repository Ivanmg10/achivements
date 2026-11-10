import { fireEvent, render, screen } from '@testing-library/react'
import GameCardExpandButton from './GameCardExpandButton'

test('a named button that says whether it is open and what it controls', () => {
  const onToggle = jest.fn()
  const { rerender } = render(<GameCardExpandButton open={false} panelId="p1" label="Show: Halo" onToggle={onToggle} />)
  const button = screen.getByRole('button', { name: 'Show: Halo' })
  expect(button).toHaveAttribute('aria-expanded', 'false')
  expect(button).toHaveAttribute('aria-controls', 'p1')
  fireEvent.click(button)
  expect(onToggle).toHaveBeenCalledTimes(1)
  rerender(<GameCardExpandButton open label="Hide: Halo" panelId="p1" onToggle={onToggle} />)
  expect(screen.getByRole('button', { name: 'Hide: Halo' })).toHaveAttribute('aria-expanded', 'true')
})
