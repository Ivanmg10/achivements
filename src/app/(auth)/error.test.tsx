import { fireEvent, render, screen } from '@testing-library/react'
import AuthError from './error'

test('a page of the auth group that throws shows a message and a retry, not a blank app', () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  const retry = jest.fn()
  render(<AuthError error={new Error('boom')} retry={retry} />)
  expect(screen.getByRole('alert')).toHaveTextContent('This screen could not load')
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(retry).toHaveBeenCalledTimes(1)
  ;(console.error as jest.Mock).mockRestore()
})

test('with no layout around the sign-in pages, the error is the page\'s <main>', () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  render(<AuthError error={new Error('boom')} retry={jest.fn()} />)
  expect(screen.getByRole('main')).toHaveClass('min-h-screen')
  ;(console.error as jest.Mock).mockRestore()
})
