import { render, screen, fireEvent } from '@testing-library/react'
import UserPlatformCard from './UserPlatformCard'
import { en } from '@/translations/en'

test('connected: shows the account, the data toggle and disconnect', () => {
  const onToggleData = jest.fn()
  render(
    <UserPlatformCard
      name="Steam"
      logo={null}
      accent="bg-blue-500"
      connected
      identity={<p>ivanxmarine</p>}
      connectAction={<button>Connect</button>}
      disconnectAction={<button>Disconnect</button>}
      dataOpen={false}
      onToggleData={onToggleData}
      dataPanelId="panel"
    />,
  )

  expect(screen.getByRole('region', { name: 'Steam' })).toBeInTheDocument()
  expect(screen.getByText(en.userData.connected)).toBeInTheDocument()
  expect(screen.getByText('ivanxmarine')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Disconnect' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Connect' })).not.toBeInTheDocument()

  const toggle = screen.getByRole('button', { name: en.userPage.viewData })
  expect(toggle.getAttribute('aria-expanded')).toBe('false')
  expect(toggle.getAttribute('aria-controls')).toBe('panel')
  fireEvent.click(toggle)
  expect(onToggleData).toHaveBeenCalled()
})

test('open: the toggle offers to hide the data', () => {
  render(
    <UserPlatformCard name="Steam" logo={null} accent="" connected dataOpen onToggleData={jest.fn()} />,
  )
  expect(screen.getByRole('button', { name: en.userPage.hideData }).getAttribute('aria-expanded')).toBe('true')
})

test('disconnected: only connect, no data toggle', () => {
  render(
    <UserPlatformCard
      name="Steam"
      logo={null}
      accent=""
      connected={false}
      connectAction={<button>Connect</button>}
      disconnectAction={<button>Disconnect</button>}
      onToggleData={jest.fn()}
    />,
  )
  expect(screen.getByText(en.userData.notConnected)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Connect' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: en.userPage.viewData })).not.toBeInTheDocument()
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
