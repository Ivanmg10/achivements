/**
 * The four account cards against one contract (#125, family 8; audit B-06): who the account is,
 * disconnecting with its toast, and, for the platforms linked by name, the one link form.
 * What each card shows of its own (its numbers, its errors, Steam's sign-in link, Xbox for admins)
 * stays in its own test.
 */
jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))
jest.mock('@/utils/apiCallsUtils', () => ({ unlinkRaUser: jest.fn() }))
jest.mock('@/hooks/useUserRank', () => ({ useUserRank: () => ({ rank: null, isLoading: false }) }))
jest.mock('@/hooks/useUserAwards', () => ({ useUserAwards: () => ({ awards: null, isLoading: false }) }))
jest.mock('@/context/GamesDataContext', () => ({ useGamesData: () => ({ all: [], inProgress: [] }) }))
jest.mock('@/hooks/useSteamLink', () => ({ useSteamLink: jest.fn() }))
jest.mock('@/hooks/useSteamProfile', () => ({ useSteamProfile: () => ({ profile: null }) }))
jest.mock('@/context/SteamGamesDataContext', () => ({ useSteamGamesData: () => ({ library: [], libraryLoading: false }) }))
jest.mock('@/hooks/usePsnLink', () => ({ usePsnLink: jest.fn() }))
jest.mock('@/hooks/usePsnSummary', () => ({ usePsnSummary: () => ({ summary: null, isLoading: false, error: null }) }))
jest.mock('@/hooks/useXboxLink', () => ({ useXboxLink: jest.fn() }))
jest.mock('@/hooks/useXboxSummary', () => ({ useXboxSummary: () => ({ summary: null, isLoading: false, error: null }) }))
jest.mock('@/context/XboxGamesDataContext', () => ({ useXboxGamesData: () => ({ library: [], libraryLoading: false }) }))

import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { notify } from '@/lib/notify'
import { unlinkRaUser } from '@/utils/apiCallsUtils'
import { useSteamLink } from '@/hooks/useSteamLink'
import { usePsnLink } from '@/hooks/usePsnLink'
import { useXboxLink } from '@/hooks/useXboxLink'
import { en } from '@/translations/en'
import UserRaCard from '@/components/user-page/user-ra-card/UserRaCard'
import UserSteamCard from '@/components/user-page/user-steam-card/UserSteamCard'
import UserPsnCard from '@/components/user-page/user-psn-card/UserPsnCard'
import UserXboxCard from '@/components/user-page/user-xbox-card/UserXboxCard'

const unlink = jest.fn()
const link = jest.fn()

/** Each card at its hook's boundary: linked as `name` / `id`, or not linked. */
const PLATFORMS = [
  {
    platform: 'ra',
    region: 'RetroAchievements',
    Card: UserRaCard,
    hint: en.userPage.raConnectHint,
    disconnect: en.userConfig.disconnectRA,
    // RA has no progress word of its own: the dialog's button keeps its short one (and a spinner).
    busy: en.userData.disconnect,
    unlinked: en.toast.raUnlinked,
    set: (linked: boolean) => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: { user: linked ? { id: '7', rausername: 'Ana', raUser: { User: 'Ana', ULID: 'ID-1' } } : { id: '7' } },
        update: jest.fn(),
      })
      ;(unlinkRaUser as jest.Mock).mockImplementation(() => unlink())
    },
  },
  {
    platform: 'steam',
    region: 'Steam',
    Card: UserSteamCard,
    hint: en.userPage.steamConnectHint,
    disconnect: en.userData.steamDisconnect,
    busy: en.userData.steamDisconnecting,
    unlinked: en.toast.steamUnlinked,
    set: (linked: boolean) =>
      (useSteamLink as jest.Mock).mockReturnValue({
        steamId: linked ? 'ID-1' : null, steamUsername: linked ? 'Ana' : null, isLinked: linked, linkHref: '/api/auth/steam', unlink,
      }),
  },
  {
    platform: 'psn',
    region: 'PlayStation Network',
    Card: UserPsnCard,
    hint: en.psn.connectHint,
    disconnect: en.psn.disconnect,
    busy: en.psn.disconnecting,
    unlinked: en.toast.psnUnlinked,
    set: (linked: boolean, error: string | null = null, isLinking = false) =>
      (usePsnLink as jest.Mock).mockReturnValue({
        accountId: linked ? 'ID-1' : null, username: linked ? 'Ana' : null, isLinked: linked, link, isLinking, error, unlink,
      }),
    form: { label: en.psn.usernameLabel, connect: en.psn.connect, connecting: en.psn.connecting, linked: en.toast.psnLinked, error: 'not-found', errorText: en.psn.errors['not-found'], max: '16' },
  },
  {
    platform: 'xbox',
    region: 'Xbox',
    Card: UserXboxCard,
    hint: en.xbox.connectHint,
    disconnect: en.xbox.disconnect,
    busy: en.xbox.disconnecting,
    unlinked: en.toast.xboxUnlinked,
    set: (linked: boolean, error: string | null = null, isLinking = false) =>
      (useXboxLink as jest.Mock).mockReturnValue({
        enabled: true, xuid: linked ? 'ID-1' : null, gamertag: linked ? 'Ana' : null, isLinked: linked, link, isLinking, error, unlink,
      }),
    form: { label: en.xbox.gamertagLabel, connect: en.xbox.connect, connecting: en.xbox.connecting, linked: en.toast.xboxLinked, error: 'private', errorText: en.xbox.errors.private, max: '20' },
  },
]

beforeEach(() => jest.clearAllMocks())

describe.each(PLATFORMS)('$platform account card', ({ region, Card, hint, disconnect, busy, unlinked, set }) => {
  test('linked: the account it is linked as, by name and id', () => {
    set(true)
    render(<Card />)
    const card = screen.getByRole('region', { name: region })
    expect(card).toHaveTextContent(en.userData.connected)
    expect(card).toHaveTextContent('Ana')
    expect(card).toHaveTextContent('ID-1')
  })

  test('linked: disconnect is a small quiet button, never red; the red is in its dialog', async () => {
    set(true)
    render(<Card />)
    const small = screen.getByRole('button', { name: disconnect })
    expect(small).toHaveTextContent(en.userData.disconnect)
    expect(small.className).not.toContain('danger')
    fireEvent.click(small)
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
  })

  test('not linked: what linking is for, and no disconnect', () => {
    set(false)
    render(<Card />)
    expect(screen.getByText(hint)).toBeInTheDocument()
    expect(screen.getByText(en.userData.notConnected)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: disconnect })).not.toBeInTheDocument()
  })

  test('disconnecting is held while it runs, and says how it went', async () => {
    set(true)
    let finish: (ok: boolean) => void = () => {}
    unlink.mockImplementationOnce(() => new Promise<boolean>((resolve) => (finish = resolve))).mockResolvedValueOnce(false)
    render(<Card />)

    // The button on the card only asks; the red one in the dialog does it.
    fireEvent.click(screen.getByRole('button', { name: disconnect }))
    expect(unlink).not.toHaveBeenCalled()
    fireEvent.click(await screen.findByRole('button', { name: en.userData.disconnect }))
    expect(within(await screen.findByRole('alertdialog')).getByRole('button', { name: busy })).toBeDisabled()
    await act(async () => finish(true))
    expect(notify.success).toHaveBeenCalledWith(unlinked)
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: disconnect }))
    fireEvent.click(await screen.findByRole('button', { name: en.userData.disconnect }))
    await waitFor(() => expect(notify.error).toHaveBeenCalledWith(en.toast.unlinkFailed))
    expect(notify.success).toHaveBeenCalledTimes(1)
  })
})

describe.each(PLATFORMS.filter((p) => p.form))('$platform link form', ({ set, form, Card }) => {
  const f = form!

  test('sends the trimmed name and announces a link with a toast', async () => {
    set(false)
    link.mockResolvedValue(true)
    render(<Card />)
    const box = screen.getByLabelText(f.label)
    expect(box).toHaveAttribute('maxLength', f.max)
    const button = screen.getByRole('button', { name: f.connect })
    expect(button).toBeDisabled()

    fireEvent.change(box, { target: { value: '  Ana ' } })
    fireEvent.click(button)
    await waitFor(() => expect(notify.success).toHaveBeenCalledWith(f.linked))
    expect(link).toHaveBeenCalledWith('Ana')
  })

  test('a failed link is shown under the box, not as a toast', () => {
    set(false, f.error)
    render(<Card />)
    expect(screen.getByRole('alert')).toHaveTextContent(f.errorText)
    expect(screen.getByLabelText(f.label)).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText(f.label)).toHaveAccessibleDescription(f.errorText)
    expect(notify.error).not.toHaveBeenCalled()
  })

  test('cannot be sent twice while linking', () => {
    set(false, null, true)
    render(<Card />)
    fireEvent.change(screen.getByLabelText(f.label), { target: { value: 'Ana' } })
    expect(screen.getByRole('button', { name: f.connecting })).toBeDisabled()
  })
})

