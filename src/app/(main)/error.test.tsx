import { fireEvent, render, screen } from '@testing-library/react'
import { en } from '@/translations/en'
import MainError from './error'

beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => {}))
afterEach(() => (console.error as jest.Mock).mockRestore())

test('renders a friendly message instead of crashing the whole app shell', () => {
  const error = Object.assign(new Error('boom'), { digest: 'abc123' })
  render(<MainError error={error} retry={jest.fn()} />)

  expect(screen.getByRole('alert')).toHaveTextContent(en.errorBoundary.title)
  expect(screen.getByText(en.errorBoundary.eyebrow)).toBeInTheDocument()
  expect(screen.getByText('abc123')).toBeInTheDocument()
  expect(screen.queryByText('boom')).toBeNull()
})

test('calls retry when the retry button is clicked, and links home', () => {
  const retry = jest.fn()
  render(<MainError error={new Error('boom')} retry={retry} />)

  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(retry).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('link', { name: en.errorBoundary.home })).toHaveAttribute('href', '/')
})

test('logs the error for diagnostics', () => {
  const error = new Error('boom')
  render(<MainError error={error} retry={jest.fn()} />)

  expect(console.error).toHaveBeenCalledWith(error)
})

test('sits in the layout\'s <main>, not a second one', () => {
  render(<MainError error={new Error('boom')} retry={jest.fn()} />)
  expect(screen.queryByRole('main')).toBeNull()
})
