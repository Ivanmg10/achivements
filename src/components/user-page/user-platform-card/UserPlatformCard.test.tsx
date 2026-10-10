import { render, screen } from '@testing-library/react'
import UserPlatformCard from './UserPlatformCard'
import { en } from '@/translations/en'

const STATS = [
  { label: 'Games', value: '120' },
  { label: 'Perfect', value: '8' },
]

test('connected: the account, its numbers and the disconnect button', () => {
  render(
    <UserPlatformCard
      name="Steam"
      logo={null}
      gradient="bg-blue-500"
      connected
      identity={<p>ivanxmarine</p>}
      stats={STATS}
      action={<button>Disconnect</button>}
    />,
  )

  expect(screen.getByRole('region', { name: 'Steam' })).toBeInTheDocument()
  expect(screen.getByText(en.userData.connected)).toBeInTheDocument()
  expect(screen.getByText('ivanxmarine')).toBeInTheDocument()
  expect(screen.getByText('Games')).toBeInTheDocument()
  expect(screen.getByText('120')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Disconnect' })).toBeInTheDocument()
})

test('disconnected: says so, and shows no numbers', () => {
  render(
    <UserPlatformCard
      name="Steam"
      logo={null}
      gradient=""
      connected={false}
      identity={<p>Connect Steam to…</p>}
      action={<button>Connect</button>}
    />,
  )
  expect(screen.getByText(en.userData.notConnected)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Connect' })).toBeInTheDocument()
  expect(document.querySelector('dl')).toBeNull()
})

test('shows a link status message', () => {
  render(
    <UserPlatformCard name="Steam" logo={null} gradient="" connected={false} status={<p role="alert">failed</p>} />,
  )
  expect(screen.getByRole('alert')).toHaveTextContent('failed')
})

test('connected with an href: the name links to the account on the platform', () => {
  render(<UserPlatformCard name="Steam" href="https://steamcommunity.com/profiles/1" logo={null} gradient="" connected />)
  const link = screen.getByRole('link', { name: new RegExp(en.userData.openProfile) })
  expect(link).toHaveAttribute('href', 'https://steamcommunity.com/profiles/1')
  expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
})

test('not connected: no link even with an href', () => {
  render(<UserPlatformCard name="Steam" href="https://steamcommunity.com/profiles/1" logo={null} gradient="" connected={false} />)
  expect(screen.queryByRole('link')).not.toBeInTheDocument()
})
