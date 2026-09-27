import { render, screen, fireEvent } from '@testing-library/react'
import MainPageProfileStAchievements from './MainPageProfileStAchievements'
import { en } from '@/translations/en'
import type { SteamRecentAchievement } from '@/types/steam'

function ach(i: number, overrides: Partial<SteamRecentAchievement> = {}): SteamRecentAchievement {
  return {
    appId: 377160,
    gameTitle: 'Fallout 4',
    apiname: `A${i}`,
    title: `Achievement ${i}`,
    badgeUrl: `a${i}.jpg`,
    unlockedAt: '2026-09-13T12:00:00.000Z',
    ...overrides,
  }
}

const retry = jest.fn()

function renderIt(props: Partial<React.ComponentProps<typeof MainPageProfileStAchievements>> = {}) {
  return render(
    <MainPageProfileStAchievements achievements={[ach(1)]} isLoading={false} error={null} onRetry={retry} {...props} />,
  )
}

beforeEach(() => jest.clearAllMocks())

test('is headed like the RA list', () => {
  renderIt()
  expect(screen.getByText(en.profileAchievements.recentAchievements)).toBeInTheDocument()
})

test('shows badge, title, game and unlock date, linking to the achievement', () => {
  const { container } = renderIt()
  expect(screen.getByText('Achievement 1')).toBeInTheDocument()
  expect(screen.getByText('Fallout 4')).toBeInTheDocument()
  expect(container.querySelector('img')?.getAttribute('src')).toBe('a1.jpg')

  const time = container.querySelector('time')!
  expect(time.getAttribute('dateTime')).toBe('2026-09-13T12:00:00.000Z')
  expect(time.textContent).toMatch(/13/)

  expect(screen.getByRole('link').getAttribute('href')).toBe('/steamGame/377160#ach-A1')
})

test('lists at most five', () => {
  renderIt({ achievements: Array.from({ length: 8 }, (_, i) => ach(i)) })
  expect(screen.getAllByRole('link')).toHaveLength(5)
})

test('shows a skeleton while loading', () => {
  const { container } = renderIt({ achievements: [], isLoading: true })
  expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
})

test('keeps showing a loaded list during a refresh', () => {
  const { container } = renderIt({ isLoading: true })
  expect(container.querySelector('[aria-busy="true"]')).toBeNull()
  expect(screen.getByText('Achievement 1')).toBeInTheDocument()
})

test('announces an error with a retry', () => {
  renderIt({ achievements: [], error: 'boom' })
  expect(screen.getByRole('alert')).toHaveTextContent(en.steam.achievementsError)
  fireEvent.click(screen.getByRole('button', { name: en.steam.retry }))
  expect(retry).toHaveBeenCalledTimes(1)
})

test('shows an empty state with nothing unlocked', () => {
  renderIt({ achievements: [] })
  expect(screen.getByText(en.cards.noEarned)).toBeInTheDocument()
})

test('falls back to a placeholder badge', () => {
  const { container } = renderIt({ achievements: [ach(1, { badgeUrl: '' })] })
  expect(container.querySelector('img')).toBeNull()
})
