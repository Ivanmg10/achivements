import { fireEvent, render, screen } from '@testing-library/react'
import AuthError from './error'

test('a page of the auth group that throws shows a message and a retry, not a blank app', () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  const reset = jest.fn()
  render(<AuthError error={new Error('boom')} reset={reset} />)
  expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong')
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(reset).toHaveBeenCalledTimes(1)
  ;(console.error as jest.Mock).mockRestore()
})
