import { fireEvent, render, screen } from '@testing-library/react'
import MissableNotice from './MissableNotice'

test('nothing when there are none', () => {
  const { container } = render(<MissableNotice names={[]} only={false} onToggleOnly={jest.fn()} />)
  expect(container).toBeEmptyDOMElement()
})

test('how many, the first three by name and how many more', () => {
  render(<MissableNotice names={['A', 'B', 'C', 'D', 'E']} only={false} onToggleOnly={jest.fn()} />)
  const line = screen.getByRole('status')
  expect(line).toHaveTextContent('5 achievements can be missed')
  expect(line).toHaveTextContent('«A», «B», «C» and 2 more')
})

test('the button keeps only them, and gives the rest back', () => {
  const toggle = jest.fn()
  const { rerender } = render(<MissableNotice names={['A']} only={false} onToggleOnly={toggle} />)
  fireEvent.click(screen.getByRole('button', { name: 'Show only those' }))
  expect(toggle).toHaveBeenCalled()
  rerender(<MissableNotice names={['A']} only onToggleOnly={toggle} />)
  expect(screen.getByRole('button', { name: 'Show all' })).toHaveAttribute('aria-pressed', 'true')
})
