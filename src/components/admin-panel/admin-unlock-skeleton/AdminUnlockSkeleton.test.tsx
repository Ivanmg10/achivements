import { render, screen } from '@testing-library/react'
import AdminUnlockSkeleton from './AdminUnlockSkeleton'

test('says it is loading and draws no button or field to use', () => {
  const { container } = render(<AdminUnlockSkeleton />)
  expect(screen.getByRole('status')).toHaveTextContent('Loading')
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
  expect(container.querySelectorAll('.bg-skeleton').length).toBeGreaterThan(3)
})
