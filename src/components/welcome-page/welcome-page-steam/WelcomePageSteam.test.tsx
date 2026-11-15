import { render, screen, fireEvent } from '@testing-library/react'
import { en } from '@/translations/en'
import { useSteamLink } from '@/hooks/useSteamLink'
import { useSteamProfile } from '@/hooks/useSteamProfile'
import { useVaultFillState } from '@/context/VaultFillContext'
import WelcomePageSteam from './WelcomePageSteam'

jest.mock('@/hooks/useSteamLink', () => ({ useSteamLink: jest.fn() }))
jest.mock('@/hooks/useSteamProfile', () => ({ useSteamProfile: jest.fn() }))
jest.mock('@/context/VaultFillContext', () => ({ useVaultFillState: jest.fn() }))

const T = en.welcome
const LINK = '/api/auth/steam?intent=link&next=%2Fwelcome'

function renderStep({ linked = false, profile = null as Record<string, string> | null, fill = null as unknown } = {}) {
  ;(useSteamLink as jest.Mock).mockReturnValue({ isLinked: linked, steamUsername: linked ? 'PapuCarrot' : null, linkHref: LINK })
  ;(useSteamProfile as jest.Mock).mockReturnValue({ profile })
  ;(useVaultFillState as jest.Mock).mockReturnValue(fill)
  const props = { onNext: jest.fn(), onSkip: jest.fn(), onBack: jest.fn() }
  const view = render(<WelcomePageSteam {...props} direction="forward" focusTitle={false} />)
  return { ...props, ...view }
}

beforeEach(() => jest.clearAllMocks())

test('not linked: off to Steam to link it, or not now', () => {
  const { onSkip } = renderStep()
  expect(screen.getByRole('link', { name: T.steam.connect })).toHaveAttribute('href', LINK)
  fireEvent.click(screen.getByRole('button', { name: T.notNow }))
  expect(onSkip).toHaveBeenCalled()
})

test('came linked (signed up with Steam): the account with its Steam picture, and on', () => {
  const { onNext, container } = renderStep({
    linked: true,
    profile: { personaname: 'PapuCarrot', avatarfull: 'https://avatars.steamstatic.com/a_full.jpg' },
  })
  expect(screen.getByText(T.steam.linked)).toBeInTheDocument()
  expect(screen.getByText('PapuCarrot')).toBeInTheDocument()
  expect(container.querySelector('img[src*="avatars.steamstatic.com"]')).not.toBeNull()
  expect(screen.queryByRole('link', { name: T.steam.connect })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: T.next }))
  expect(onNext).toHaveBeenCalled()
})

test('before the Steam profile loads, the stored name and the Steam mark', () => {
  const { container } = renderStep({ linked: true })
  expect(screen.getByText('PapuCarrot')).toBeInTheDocument()
  expect(container.querySelector('img')).toBeNull()
})

test('says how its games are being read, and why they cannot be', () => {
  const { unmount } = renderStep({ linked: true, fill: { status: { platforms: { steam: { state: 'done', read: 21, total: 21 } } } } })
  expect(screen.getByText(en.rankings.fillCounted.replace('{n}', '21'))).toBeInTheDocument()
  unmount()

  renderStep({ linked: true, fill: { status: { platforms: { steam: { state: 'error', error: 'private', read: 0, total: 0 } } } } })
  expect(screen.getByRole('alert')).toHaveTextContent(en.rankings.fillPrivateSteam)
})
