import { render, screen } from '@testing-library/react'
import PublicUserSkeleton from './PublicUserSkeleton'

test('announces loading once, in the profile page shape', () => {
  render(<PublicUserSkeleton />)

  expect(screen.getAllByRole('status')).toHaveLength(1)
})
