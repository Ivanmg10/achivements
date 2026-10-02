import { render, screen } from '@testing-library/react'
import UserVaultStat from './UserVaultStat'

test('shows the count and what it counts, as a term and its value', () => {
  render(
    <dl>
      <UserVaultStat icon={<svg />} label="Games" value={329} accent="text-text-main" />
    </dl>,
  )
  expect(screen.getByRole('term')).toHaveTextContent('Games')
  expect(screen.getByRole('definition')).toHaveTextContent('329')
})
