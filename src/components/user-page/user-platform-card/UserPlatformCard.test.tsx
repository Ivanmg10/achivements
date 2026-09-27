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
      accent="bg-blue-500"
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
      accent=""
      connected={false}
      identity={<p>Connect Steam to…</p>}
      action={<button>Connect</button>}
    />,
  )
  expect(screen.getByText(en.userData.notConnected)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Connect' })).toBeInTheDocument()
  expect(document.querySelector('dl')).toBeNull()
})

test('a platform that is not ready yet says so', () => {
  render(<UserPlatformCard name="PlayStation Network" logo={null} accent="" connected={false} soon />)
  expect(screen.getByText(en.userData.comingSoon)).toBeInTheDocument()
})

test('shows a link status message', () => {
  render(
    <UserPlatformCard name="Steam" logo={null} accent="" connected={false} status={<p role="alert">failed</p>} />,
  )
  expect(screen.getByRole('alert')).toHaveTextContent('failed')
})
