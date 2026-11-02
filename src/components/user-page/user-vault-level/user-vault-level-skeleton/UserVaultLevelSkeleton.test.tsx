import { render } from '@testing-library/react'
import UserVaultLevelSkeleton from './UserVaultLevelSkeleton'

test('is hidden from screen readers and draws the same box as the level', () => {
  const { container } = render(<UserVaultLevelSkeleton />)
  const box = container.firstElementChild
  expect(box).toHaveAttribute('aria-hidden', 'true')
  expect(box).toHaveClass('rounded-pane', 'bg-bg-main', 'p-4', 'gap-2')
})
