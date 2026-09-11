import { fireEvent, render, screen } from '@testing-library/react'
import MainError from './error'

test('renders a friendly message instead of crashing the whole app shell', () => {
  const error = Object.assign(new Error('boom'), { digest: 'abc123' })
  render(<MainError error={error} reset={jest.fn()} />)

  expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong')
  expect(screen.getByText(/unexpected error/i)).toBeInTheDocument()
})

test('calls reset when the retry button is clicked', () => {
  const reset = jest.fn()
  render(<MainError error={new Error('boom')} reset={reset} />)

  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(reset).toHaveBeenCalledTimes(1)
})

test('logs the error for diagnostics', () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  const error = new Error('boom')
  render(<MainError error={error} reset={jest.fn()} />)

  expect(consoleSpy).toHaveBeenCalledWith(error)
  consoleSpy.mockRestore()
})
