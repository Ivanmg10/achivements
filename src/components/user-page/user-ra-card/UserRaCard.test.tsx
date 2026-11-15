jest.mock('@/utils/apiCallsUtils', () => ({ unlinkRaUser: jest.fn() }))
jest.mock('@/hooks/useUserRank', () => ({ useUserRank: () => ({ rank: { Rank: 16520 }, isLoading: false }) }))
jest.mock('@/hooks/useUserAwards', () => ({ useUserAwards: () => ({ awards: { MasteryAwardsCount: 12 }, isLoading: false }) }))
jest.mock('@/context/GamesDataContext', () => ({ useGamesData: () => ({ all: [{}, {}], inProgress: [{}] }) }))
jest.mock('@/components/ra-login-modal/RaLoginModal', () => ({
  __esModule: true,
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div data-testid="ra-modal" /> : null),
}))

import { fireEvent, render, screen } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { unlinkRaUser } from '@/utils/apiCallsUtils'
import { en } from '@/translations/en'
import UserRaCard from './UserRaCard'

const update = jest.fn()

function setRa(connected: boolean) {
  ;(useSession as jest.Mock).mockReturnValue({
    data: connected ? { user: { rausername: 'Ivan', raUser: { User: 'Ivan', ULID: 'ABC', TotalPoints: 4200, UserPic: '/p.png' } } } : { user: {} },
    update,
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  setRa(true)
})

test('linked: its own numbers and its picture', () => {
  const { container } = render(<UserRaCard />)
  const card = screen.getByRole('region', { name: 'RetroAchievements' })
  expect(card).toHaveTextContent(en.userStats.globalRank)
  expect(card).toHaveTextContent(/16.?520/)
  expect(card).toHaveTextContent(/4.?200/)
  expect(container.querySelector('img[src*="p.png"]')).not.toBeNull()
})

test('disconnecting asks first, then unlinks with the session to read again', async () => {
  ;(unlinkRaUser as jest.Mock).mockResolvedValue(true)
  render(<UserRaCard />)
  fireEvent.click(screen.getByRole('button', { name: en.userConfig.disconnectRA }))
  expect(unlinkRaUser).not.toHaveBeenCalled()
  fireEvent.click(await screen.findByRole('button', { name: en.userData.disconnect, hidden: false }))
  expect(unlinkRaUser).toHaveBeenCalledWith(update)
})

test('not linked: connecting opens its modal, without leaving the page', async () => {
  setRa(false)
  render(<UserRaCard />)
  expect(screen.queryByTestId('ra-modal')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: en.userData.connectRA }))
  expect(await screen.findByTestId('ra-modal')).toBeInTheDocument()
})

test('the connect screen gives its own pitch', () => {
  setRa(false)
  render(<UserRaCard hint={en.connect.raPitch} />)
  expect(screen.getByText(en.connect.raPitch)).toBeInTheDocument()
  expect(screen.queryByText(en.userPage.raConnectHint)).not.toBeInTheDocument()
})
