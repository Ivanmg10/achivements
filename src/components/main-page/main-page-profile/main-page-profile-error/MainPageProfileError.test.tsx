import { fireEvent, render, screen } from '@testing-library/react'
import MainPageProfileError from './MainPageProfileError'

test('says what failed and why, with the platform on the badge, and asks again', () => {
  const onRetry = jest.fn()
  render(<MainPageProfileError logo={<span data-testid="logo" />} title="Could not load" detail="Try later" retryLabel="Retry" onRetry={onRetry} />)
  expect(screen.getByRole('alert')).toHaveTextContent('Could not load')
  expect(screen.getByRole('alert')).toHaveTextContent('Try later')
  expect(screen.getByTestId('logo')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(onRetry).toHaveBeenCalledTimes(1)
})

test('no reason line when the platform gives none', () => {
  render(<MainPageProfileError logo={null} title="Could not load" retryLabel="Retry" onRetry={jest.fn()} />)
  expect(screen.getByRole('alert').querySelectorAll('p')).toHaveLength(1)
})
