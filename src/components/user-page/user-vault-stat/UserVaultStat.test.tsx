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

test('a value that is not a whole count is shown as given, with a line under it', () => {
  render(
    <dl>
      <UserVaultStat icon={null} label="Per day" value={1.53} display="1.5" sub="last 30 days" accent="text-info" />
    </dl>,
  )
  expect(screen.getAllByRole('definition')[0]).toHaveTextContent('1.5')
  expect(screen.getByText('last 30 days')).toBeInTheDocument()
})
