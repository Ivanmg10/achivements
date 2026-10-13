import { render, screen, fireEvent } from '@testing-library/react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import UserGamePage from './UserGamePage'
import { useCheevoUser } from '@/hooks/useCheevoUser'
import { useViewerGameList } from '@/hooks/useViewerGameList'
import { en } from '@/translations/en'

jest.mock('@/hooks/useCheevoUser', () => ({ useCheevoUser: jest.fn() }))
jest.mock('@/hooks/useViewerGameList', () => ({ useViewerGameList: jest.fn() }))
jest.mock('@/components/subject-providers/SubjectProviders', () => ({
  __esModule: true,
  default: ({ user, children }: { user: { username: string }; children: React.ReactNode }) => (
    <div data-testid="subject" data-user={user.username}>{children}</div>
  ),
}))
jest.mock('@/components/game-info-skeleton/GameInfoSkeleton', () => ({ __esModule: true, default: () => <div data-testid="skeleton" /> }))
const body = (id: string) => ({
  __esModule: true,
  default: ({ banner, comparing, mine, notice }: { banner: React.ReactNode; comparing: boolean; mine: unknown[] | null; notice?: React.ReactNode }) => (
    <div data-testid={id} data-comparing={String(comparing)} data-mine={mine === null ? 'none' : mine.length}>
      {banner}
      {notice}
    </div>
  ),
})
jest.mock('./user-game-page-ra/UserGamePageRa', () => body('ra'))
jest.mock('./user-game-page-steam/UserGamePageSteam', () => body('steam'))
jest.mock('./user-game-page-psn/UserGamePagePsn', () => body('psn'))

const USER = { username: 'ivan', avatar: null, description: null, location: null, ra: 'IvanRA', steam: true, psn: false }
const replace = jest.fn()
const retry = jest.fn()

function setup({ user = USER as Record<string, unknown> | null, error = null as string | null, compare = false, mine = { list: [], linked: true, isLoading: false, error: false } } = {}) {
  ;(useCheevoUser as jest.Mock).mockReturnValue({ user, isLoading: false, error, retry })
  ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(compare ? 'compare=1' : ''))
  ;(usePathname as jest.Mock).mockReturnValue('/user/ivan/ra/1')
  ;(useRouter as jest.Mock).mockReturnValue({ replace, push: jest.fn() })
  ;(useViewerGameList as jest.Mock).mockReturnValue({ retry: jest.fn(), ...mine })
}

beforeEach(() => jest.clearAllMocks())

test('their progress, read as them, on the right platform', () => {
  setup()
  render(<UserGamePage username="ivan" source="ra" id="1" />)
  expect(screen.getByTestId('subject')).toHaveAttribute('data-user', 'ivan')
  expect(screen.getByTestId('ra')).toHaveAttribute('data-comparing', 'false')
  expect(useViewerGameList).toHaveBeenCalledWith('ra', '1', false)
})

test('?compare=1 compares, and the switch turns it on and off in the address', () => {
  setup({ compare: true })
  render(<UserGamePage username="ivan" source="ra" id="1" />)
  expect(screen.getByTestId('ra')).toHaveAttribute('data-comparing', 'true')
  expect(useViewerGameList).toHaveBeenCalledWith('ra', '1', true)
  fireEvent.click(screen.getByRole('button', { name: en.userProfile.compareWithMe }))
  expect(replace).toHaveBeenCalledWith('/user/ivan/ra/1', { scroll: false })

  setup()
  render(<UserGamePage username="ivan" source="ra" id="1" />)
  fireEvent.click(screen.getAllByRole('button', { name: en.userProfile.compareWithMe })[1])
  expect(replace).toHaveBeenLastCalledWith('/user/ivan/ra/1?compare=1', { scroll: false })
})

test('your own page never compares', () => {
  setup({ user: { ...USER, isSelf: true }, compare: true })
  render(<UserGamePage username="ivan" source="ra" id="1" />)
  expect(screen.getByTestId('ra')).toHaveAttribute('data-comparing', 'false')
  expect(screen.queryByRole('button', { name: en.userProfile.compareWithMe })).not.toBeInTheDocument()
})

test('says why your side is empty when it is', () => {
  setup({ compare: true, mine: { list: null as never, linked: false, isLoading: false, error: false } })
  render(<UserGamePage username="ivan" source="steam" id="730" />)
  expect(screen.getByText(en.userGame.linkToCompare.replace('{platform}', 'Steam'))).toBeInTheDocument()
})

test('links the game page of each platform', () => {
  setup()
  const { unmount } = render(<UserGamePage username="ivan" source="steam" id="730" />)
  expect(screen.getByRole('link', { name: en.userGame.openGamePage })).toHaveAttribute('href', '/steamGame/730')
  unmount()
  setup({ user: { ...USER, psn: true } })
  render(<UserGamePage username="ivan" source="psn" id="NPWR20188_00" />)
  expect(screen.getByRole('link', { name: en.userGame.openGamePage })).toHaveAttribute('href', '/psnGame/NPWR20188_00')
})

test('a platform they have not linked says so', () => {
  setup()
  render(<UserGamePage username="ivan" source="psn" id="NPWR20188_00" />)
  expect(screen.getByText(en.userGame.platformNotLinked.replace('{u}', 'ivan').replace('{platform}', 'PlayStation'))).toBeInTheDocument()
  expect(screen.queryByTestId('psn')).not.toBeInTheDocument()
})

test('an unknown user, or one still loading', () => {
  setup({ user: null, error: 'missing' })
  const { unmount } = render(<UserGamePage username="nobody" source="ra" id="1" />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.publicProfile.userNotFound.replace('{u}', 'nobody'))
  unmount()
  setup({ user: null })
  render(<UserGamePage username="ivan" source="ra" id="1" />)
  expect(screen.getByTestId('skeleton')).toBeInTheDocument()
})
