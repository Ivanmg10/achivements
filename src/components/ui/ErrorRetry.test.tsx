import { fireEvent, render, screen } from '@testing-library/react'
import ErrorRetry from './ErrorRetry'

test('says what failed as an alert, with a retry button that asks again', () => {
  const onRetry = jest.fn()
  render(<ErrorRetry message="Could not load the achievements" retryLabel="Retry" onRetry={onRetry} />)
  expect(screen.getByRole('alert')).toHaveTextContent('Could not load the achievements')
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(onRetry).toHaveBeenCalled()
})

test('with a hint, the failure is the bold line and the hint says how to fix it', () => {
  render(<ErrorRetry message="Could not load" hint="The profile is private" retryLabel="Retry" onRetry={() => {}} />)
  expect(screen.getByText('Could not load')).toHaveClass('font-semibold')
  expect(screen.getByText('The profile is private')).toBeInTheDocument()
})
