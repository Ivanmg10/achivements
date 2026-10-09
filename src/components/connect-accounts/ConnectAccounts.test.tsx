import { render, screen, fireEvent } from '@testing-library/react'
import ConnectAccounts from './ConnectAccounts'
import { useSession } from 'next-auth/react'
import { en } from '@/translations/en'

jest.mock('@/components/user-page/user-psn-card/UserPsnCard', () => ({
  __esModule: true,
  default: () => <section aria-label="PlayStation Network" />,
}))
jest.mock('@/components/ra-login-modal/RaLoginModal', () => ({
  __esModule: true,
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div data-testid="ra-modal" /> : null),
}))

function setUser(user: Record<string, unknown> = {}) {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user }, update: jest.fn() })
}

beforeEach(() => {
  jest.clearAllMocks()
  setUser()
})

test('says what to do and what each platform costs to connect', () => {
  render(<ConnectAccounts />)
  expect(screen.getByRole('heading', { level: 1, name: en.connect.title })).toBeInTheDocument()
  expect(screen.getByText(en.connect.raPitch)).toBeInTheDocument()
  expect(screen.getByText(en.connect.steamPitch)).toBeInTheDocument()
})

test('never shows made-up games in place of a library', () => {
  const { container } = render(<ConnectAccounts />)
  expect(container.textContent).not.toMatch(/Super Mario 64|Pokémon FireRed|Crash Bandicoot/)
})

test('connects RetroAchievements without leaving the page', () => {
  render(<ConnectAccounts />)
  expect(screen.queryByTestId('ra-modal')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: new RegExp(en.userData.signInRA) }))
  expect(screen.getByTestId('ra-modal')).toBeInTheDocument()
})

test('sends to Steam’s own sign-in for the one-click path', () => {
  render(<ConnectAccounts />)
  expect(
    screen.getByRole('link', { name: new RegExp(en.userData.steamConnect) }).getAttribute('href'),
  ).toContain('/api/steam/link')
})

test('PlayStation connects right there, with its own card', () => {
  render(<ConnectAccounts />)
  expect(screen.getByRole('region', { name: 'PlayStation Network' })).toBeInTheDocument()
})

test('a linked PlayStation is not offered again', () => {
  setUser({ psnaccountid: '42' })
  render(<ConnectAccounts />)
  expect(screen.queryByRole('region', { name: 'PlayStation Network' })).not.toBeInTheDocument()
})

test('a platform already linked is not offered again', () => {
  setUser({ steamid: '765' })
  render(<ConnectAccounts />)
  expect(screen.queryByRole('region', { name: 'Steam' })).not.toBeInTheDocument()
  expect(screen.getByRole('region', { name: 'RetroAchievements' })).toBeInTheDocument()
})

test('lists what appears once connected', () => {
  render(<ConnectAccounts />)
  expect(screen.getByText(en.connect.whatYouGet)).toBeInTheDocument()
  expect(screen.getByText(en.landing.libraryTitle)).toBeInTheDocument()
})
