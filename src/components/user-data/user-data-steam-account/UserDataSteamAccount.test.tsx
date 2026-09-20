import { render, screen, fireEvent } from '@testing-library/react'
import UserDataSteamAccount from './UserDataSteamAccount'
import { useSteamLink } from '@/hooks/useSteamLink'
import { en } from '@/translations/en'

jest.mock('@/hooks/useSteamLink', () => ({
  ...jest.requireActual('@/hooks/useSteamLink'),
  useSteamLink: jest.fn(),
}))

const STEAM_ID = '76561198000000000'
const mockDisconnect = jest.fn()

function setHook(overrides: Record<string, unknown> = {}) {
  ;(useSteamLink as jest.Mock).mockReturnValue({
    steamId: null,
    steamUsername: null,
    isLinked: false,
    status: null,
    isUnlinking: false,
    disconnect: mockDisconnect,
    dismiss: jest.fn(),
    ...overrides,
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  setHook()
})

describe('when not linked', () => {
  test('offers a link to the OpenID route rather than a JS button', () => {
    render(<UserDataSteamAccount />)
    const connect = screen.getByRole('link', { name: en.userData.steamConnect })
    expect(connect.getAttribute('href')).toBe('/api/steam/link')
    expect(screen.getByText(en.userData.notConnected)).toBeInTheDocument()
  })

  test('does not offer a disconnect button', () => {
    render(<UserDataSteamAccount />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('when linked', () => {
  test('shows the persona name and SteamID, and marks the state in text not just colour', () => {
    setHook({ isLinked: true, steamId: STEAM_ID, steamUsername: 'Ivan' })
    render(<UserDataSteamAccount />)

    expect(screen.getByText('Ivan')).toBeInTheDocument()
    expect(screen.getByText(STEAM_ID)).toBeInTheDocument()
    expect(screen.getByText(en.userData.connected)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: en.userData.steamConnect })).not.toBeInTheDocument()
  })

  test('falls back to a dash when Steam gave no persona name', () => {
    setHook({ isLinked: true, steamId: STEAM_ID, steamUsername: null })
    render(<UserDataSteamAccount />)
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByText(STEAM_ID)).toBeInTheDocument()
  })

  test('disconnects on click', () => {
    setHook({ isLinked: true, steamId: STEAM_ID, steamUsername: 'Ivan' })
    render(<UserDataSteamAccount />)

    fireEvent.click(screen.getByRole('button', { name: en.userData.steamDisconnect }))
    expect(mockDisconnect).toHaveBeenCalledTimes(1)
  })

  test('disables the button and says so while unlinking', () => {
    setHook({ isLinked: true, steamId: STEAM_ID, isUnlinking: true })
    render(<UserDataSteamAccount />)

    const button = screen.getByRole('button', { name: en.userData.steamDisconnecting })
    expect(button).toBeDisabled()
  })
})

describe('status messages', () => {
  test('announces success politely with role=status', () => {
    setHook({ isLinked: true, steamId: STEAM_ID, status: 'linked' })
    render(<UserDataSteamAccount />)

    const message = screen.getByRole('status')
    expect(message).toHaveTextContent(en.userData.steamLinked)
  })

  test.each([
    ['alreadyLinked', en.userData.steamAlreadyLinked],
    ['cancelled', en.userData.steamCancelled],
    ['failed', en.userData.steamFailed],
  ])('announces %s as an alert', (status, text) => {
    setHook({ status })
    render(<UserDataSteamAccount />)

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent(text)
  })

  test('renders no message region when there is nothing to report', () => {
    render(<UserDataSteamAccount />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
