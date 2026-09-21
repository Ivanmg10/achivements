import { render, screen, fireEvent } from '@testing-library/react'
import SteamGameItemAchievements from './SteamGameItemAchievements'
import { useSteamAchievements } from '@/hooks/useSteamAchievements'
import { en } from '@/translations/en'

jest.mock('@/hooks/useSteamAchievements', () => ({ useSteamAchievements: jest.fn() }))
jest.mock('@/components/steam/steam-achievement-grid/SteamAchievementGrid', () => ({
  SteamAchievementGrid: ({ appId, achievements, badgeSize }: { appId: number; achievements: unknown[]; badgeSize: number }) => (
    <div data-testid="grid">
      {appId}:{achievements.length}:{badgeSize}
    </div>
  ),
}))

const retry = jest.fn()

function setHook(overrides: Record<string, unknown> = {}) {
  ;(useSteamAchievements as jest.Mock).mockReturnValue({
    achievements: [],
    isLoading: false,
    error: null,
    retry,
    ...overrides,
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  setHook()
})

test('asks the hook for this game', () => {
  render(<SteamGameItemAchievements appId={730} />)
  expect(useSteamAchievements).toHaveBeenCalledWith(730)
})

test('shows a badge-shaped skeleton sized to the known count while loading', () => {
  setHook({ isLoading: true })
  const { container } = render(<SteamGameItemAchievements appId={730} expectedCount={5} />)
  const skeleton = container.querySelector('[aria-busy="true"]')!
  expect(skeleton.children).toHaveLength(5)
  expect(skeleton.children[0].className).toContain('w-12')
})

test('caps a huge skeleton and uses a default when the count is unknown', () => {
  setHook({ isLoading: true })
  const { container, rerender } = render(<SteamGameItemAchievements appId={730} expectedCount={500} />)
  expect(container.querySelector('[aria-busy="true"]')!.children).toHaveLength(60)

  rerender(<SteamGameItemAchievements appId={730} badgeSize={40} />)
  const skeleton = container.querySelector('[aria-busy="true"]')!
  expect(skeleton.children).toHaveLength(12)
  expect(skeleton.children[0].className).toContain('w-10')
})

test('announces an error with the privacy hint and a retry', () => {
  setHook({ error: 'Failed' })
  render(<SteamGameItemAchievements appId={730} />)

  expect(screen.getByRole('alert')).toHaveTextContent(en.steam.achievementsError)
  expect(screen.getByText(en.steam.privateProfileHint)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: en.steam.retry }))
  expect(retry).toHaveBeenCalledTimes(1)
})

test('says so when the game has no achievements', () => {
  render(<SteamGameItemAchievements appId={730} />)
  expect(screen.getByText(en.steam.noAchievements)).toBeInTheDocument()
})

test('renders the badge grid once loaded', () => {
  setHook({ achievements: [{}, {}, {}] })
  render(<SteamGameItemAchievements appId={730} badgeSize={40} />)
  expect(screen.getByTestId('grid')).toHaveTextContent('730:3:40')
})
