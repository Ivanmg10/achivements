import { render, screen, fireEvent } from '@testing-library/react'
import UserGamePageNotice from './UserGamePageNotice'
import { en } from '@/translations/en'

test('without the platform, the way to link it', () => {
  render(<UserGamePageNotice source="steam" linked={false} onRetry={jest.fn()} />)
  expect(screen.getByText(en.userGame.linkToCompare.replace('{platform}', 'Steam'))).toBeInTheDocument()
  expect(screen.getByRole('link', { name: en.userGame.linkAccount })).toHaveAttribute('href', '/user')
})

test('with it, why it may be empty and a retry', () => {
  const onRetry = jest.fn()
  render(<UserGamePageNotice source="psn" linked onRetry={onRetry} />)
  expect(screen.getByText(en.userGame.mineMissing)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: en.publicProfile.retry }))
  expect(onRetry).toHaveBeenCalled()
})
