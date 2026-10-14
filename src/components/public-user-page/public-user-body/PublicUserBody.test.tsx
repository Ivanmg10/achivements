import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PublicUserBody from './PublicUserBody'
import { useProfileLibrary } from '@/hooks/useProfileLibrary'
import { en } from '@/translations/en'

jest.mock('@/hooks/useProfileLibrary', () => ({ useProfileLibrary: jest.fn(() => ({ games: [], isLoading: false })) }))
jest.mock('../public-user-hero/PublicUserHero', () => ({
  __esModule: true,
  default: ({ onCompare }: { onCompare: () => void }) => <button onClick={onCompare}>hero compare</button>,
}))
const stub = (id: string) => ({ __esModule: true, default: () => <div data-testid={id} /> })
jest.mock('../public-user-overview/PublicUserOverview', () => stub('overview'))
jest.mock('../public-user-games/PublicUserGames', () => stub('games'))
jest.mock('../public-user-activity/PublicUserActivity', () => stub('activity'))
jest.mock('../public-user-compare/PublicUserCompare', () => stub('compare'))

const USER = { username: 'ivan', avatar: null, description: null, location: null, ra: 'IvanRA', steam: false, psn: false, hiddenGames: ['ra:9'] }
const VIEWER = { name: 'me', avatar: null, games: [], year: [], activeStreak: null, bestStreak: null, isLoading: false }

afterEach(() => {
  window.location.hash = ''
})

test('opens on the overview, reading their games less the hidden ones', () => {
  render(<PublicUserBody user={USER} viewer={VIEWER} />)
  expect(screen.getByRole('tab', { name: en.userProfile.tabOverview })).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByRole('tabpanel')).toContainElement(screen.getByTestId('overview'))
  expect(useProfileLibrary).toHaveBeenCalledWith(['ra:9'])
})

test('a tab is kept in the address, so it can be linked', async () => {
  render(<PublicUserBody user={USER} viewer={VIEWER} />)
  fireEvent.click(screen.getByRole('tab', { name: en.userProfile.tabGames }))
  await waitFor(() => expect(screen.getByTestId('games')).toBeInTheDocument())
  expect(window.location.hash).toBe('#games')
})

test("the hero's compare button opens the comparison", async () => {
  render(<PublicUserBody user={USER} viewer={VIEWER} />)
  fireEvent.click(screen.getByRole('button', { name: 'hero compare' }))
  await waitFor(() => expect(screen.getByTestId('compare')).toBeInTheDocument())
})

test('your own page has nothing to compare', async () => {
  window.location.hash = '#compare'
  render(<PublicUserBody user={{ ...USER, isSelf: true }} viewer={VIEWER} />)
  expect(screen.queryByRole('tab', { name: en.userProfile.tabCompare })).not.toBeInTheDocument()
  await waitFor(() => expect(screen.getByTestId('overview')).toBeInTheDocument())
})
