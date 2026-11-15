import { fireEvent, render, screen } from '@testing-library/react'
import AdminPsnAccountRow from './AdminPsnAccountRow'
import { DAY_MS, NOW, psnAccount } from '@/test-utils/psnPoolFixtures'

const renderRow = (over = {}, props = {}) => {
  const onAction = jest.fn()
  render(
    <ul>
      <AdminPsnAccountRow account={psnAccount(over)} crowded={false} busy={false} now={NOW} onAction={onAction} {...props} />
    </ul>,
  )
  return onAction
}

test('shows the label, state, who it signs in as, days left and until when, renewal, weight, calls and canary', () => {
  renderRow({ hint: 'the blue one', callsLastHour: 12, weight: 2 })
  expect(screen.getByText('PSN-1')).toBeInTheDocument()
  expect(screen.getByText('Active')).toBeInTheDocument()
  expect(screen.getByText('signs in as ServiceOne')).toBeInTheDocument()
  expect(screen.getByText('the blue one')).toBeInTheDocument()
  expect(screen.getByText('40 days left')).toBeInTheDocument()
  const row = screen.getByRole('listitem')
  expect(row).toHaveTextContent(/renewed .* by ivan/)
  expect(row).toHaveTextContent('weight 2')
  expect(row).toHaveTextContent('12 calls last hour')
  expect(row).toHaveTextContent(/Canary ok/)
})

test('a sign-in close to its end, gone, or unknown says so', () => {
  renderRow({ npssoExpiresAt: NOW + 3 * DAY_MS + 1000 })
  expect(screen.getByText('3 days left')).toHaveClass('text-warning')
})

test('expired, quarantined, resting and crowded are all in words', () => {
  renderRow({ npssoExpiresAt: NOW - DAY_MS, status: 'quarantined', canaryOk: false }, { crowded: true })
  expect(screen.getByText('Expired')).toBeInTheDocument()
  expect(screen.getByText('Quarantined')).toBeInTheDocument()
  expect(screen.getByText('Expires near another')).toBeInTheDocument()
  expect(screen.getByRole('listitem')).toHaveTextContent(/Canary failed/)
  expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument()
})

test('a resting active account and one never checked', () => {
  renderRow({ cooldownUntil: NOW + 60_000, npssoExpiresAt: null, canaryAt: null, onlineId: null, renewedAt: null })
  expect(screen.getByText('Resting after 429s')).toBeInTheDocument()
  expect(screen.getByText('Expiry unknown')).toBeInTheDocument()
  expect(screen.getByRole('listitem')).toHaveTextContent('No canary yet')
  expect(screen.getByText('online ID not read yet')).toBeInTheDocument()
})

test('every action is a button that says what it does', () => {
  const onAction = renderRow()
  for (const [name, action] of [['Renew', 'renew'], ['Test', 'test'], ['Drain', 'drain'], ['Pause', 'pause'], ['Remove', 'remove']]) {
    fireEvent.click(screen.getByRole('button', { name }))
    expect(onAction).toHaveBeenLastCalledWith(action)
  }
})

test('busy: the actions wait', () => {
  renderRow({}, { busy: true })
  expect(screen.getByRole('button', { name: 'Test' })).toBeDisabled()
})
