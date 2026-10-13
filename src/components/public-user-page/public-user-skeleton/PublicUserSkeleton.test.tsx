import { render, screen } from '@testing-library/react'
import PublicUserSkeleton from './PublicUserSkeleton'

test('announces loading once, for the main page layout under the header card', () => {
  render(<PublicUserSkeleton />)

  expect(screen.getAllByRole('status')).toHaveLength(1)
})
