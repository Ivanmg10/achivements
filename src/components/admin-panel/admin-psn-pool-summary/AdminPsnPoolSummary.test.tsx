import { render, screen } from '@testing-library/react'
import AdminPsnPoolSummary from './AdminPsnPoolSummary'
import { DAY_MS, NOW, psnAccount, psnStatus } from '@/test-utils/psnPoolFixtures'

test('the pool at a glance, and the next renewal', () => {
  render(<AdminPsnPoolSummary pool={psnStatus([psnAccount({ callsLastHour: 50, rateLimitedLastHour: 1 })]).pool} />)
  expect(screen.getByText(/1 of 1 usable/)).toHaveTextContent('50 calls last hour')
  expect(screen.getByText(/1 of 1 usable/)).toHaveTextContent('2 % refused as too many')
  expect(screen.getByRole('status')).toHaveTextContent('Next renewal: PSN-1')
})

test('sign-ins dying together ask for one to be renewed early', () => {
  const at = NOW + 20 * DAY_MS
  const pool = psnStatus([psnAccount({ npssoExpiresAt: at }), psnAccount({ id: 2, label: 'PSN-2', npssoExpiresAt: at + DAY_MS, status: 'quarantined' })]).pool
  render(<AdminPsnPoolSummary pool={pool} />)
  expect(screen.getByText(/1 quarantined/)).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('renew one early')
})

test('no account yet says what that means', () => {
  render(<AdminPsnPoolSummary pool={psnStatus([]).pool} />)
  expect(screen.getByText(/No account yet/)).toBeInTheDocument()
})
