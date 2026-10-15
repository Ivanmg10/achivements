import { render, screen, fireEvent } from '@testing-library/react'
import PublicUserError from './PublicUserError'
import { en } from '@/translations/en'

test('an unknown user says so, with nothing to retry', () => {
  render(<PublicUserError username="nobody" error="missing" onRetry={jest.fn()} />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.publicProfile.userNotFound.replace('{u}', 'nobody'))
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})

test('a failure offers a retry', () => {
  const onRetry = jest.fn()
  render(<PublicUserError username="ivan" error="failed" onRetry={onRetry} />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.publicProfile.userLoadError)
  fireEvent.click(screen.getByRole('button', { name: en.publicProfile.retry }))
  expect(onRetry).toHaveBeenCalled()
})
