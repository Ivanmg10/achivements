import { render, screen, fireEvent } from '@testing-library/react'
import PsnTrophyGridGroup from './PsnTrophyGridGroup'

test('a fold with the group name and progress, closed until asked', () => {
  const { container } = render(
    <PsnTrophyGridGroup name="Winter Wonder" earned={1} total={4}>
      <p>badges</p>
    </PsnTrophyGridGroup>,
  )
  expect(container.querySelector('summary')).toHaveTextContent('Winter Wonder1/4')
  const fold = container.querySelector('details')!
  expect(fold).not.toHaveAttribute('open')
  fireEvent.click(container.querySelector('summary')!)
  expect(fold).toHaveAttribute('open')
  expect(screen.getByText('badges')).toBeInTheDocument()
})

test('a finished group says so in green, not only by its numbers', () => {
  render(<PsnTrophyGridGroup name="Base" earned={4} total={4}>x</PsnTrophyGridGroup>)
  expect(screen.getByText('4/4')).toHaveClass('text-green-400')
})
