import { act, renderHook, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { fetchWithRetry } from '@/lib/fetchWithRetry'
import { useSteamRecentAchievements } from '@/hooks/useSteamRecentAchievements'
import { usePsnRecentTrophies } from '@/hooks/usePsnRecentTrophies'
import { useXboxRecentAchievements } from '@/hooks/useXboxRecentAchievements'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import { useHiddenGames } from '@/context/HiddenGamesContext'
import { ActivityHeatmapYearProvider } from '@/context/ActivityHeatmapYearContext'
import { utcDay } from '@/utils/dates'
import { useStreakData } from './useStreakData'

jest.mock('next-auth/react', () => ({ useSession: jest.fn() }))
jest.mock('@/lib/fetchWithRetry', () => ({ ...jest.requireActual('@/lib/fetchWithRetry'), fetchWithRetry: jest.fn() }))
jest.mock('@/hooks/useSteamRecentAchievements', () => ({ useSteamRecentAchievements: jest.fn() }))
jest.mock('@/hooks/usePsnRecentTrophies', () => ({ usePsnRecentTrophies: jest.fn() }))
jest.mock('@/hooks/useXboxRecentAchievements', () => ({ useXboxRecentAchievements: jest.fn() }))
jest.mock('@/context/PsnGamesDataContext', () => ({ usePsnGamesData: jest.fn() }))
jest.mock('@/context/XboxGamesDataContext', () => ({ useXboxGamesData: jest.fn() }))
jest.mock('@/context/HiddenGamesContext', () => ({ useHiddenGames: jest.fn() }))

const DAY = 86_400_000
const day = (back: number) => utcDay(new Date(Date.now() - back * DAY))
const PS3_GAME = 50

/** What each platform has answered so far; a test moves it on and re-renders. */
let steam: { achievements: unknown[]; isLoading: boolean }
let psnYear: { trophies: unknown[]; isLoading: boolean }
let psnLibrary: { fullLibrary: unknown[]; libraryLoading: boolean }

beforeEach(() => {
  jest.clearAllMocks()
  window.localStorage.clear()
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { rausername: 'ivan', steamid: '765', psnaccountid: 'p1' } } })
  ;(useHiddenGames as jest.Mock).mockReturnValue({ isHidden: () => false })
  steam = { achievements: [], isLoading: true }
  psnYear = { trophies: [], isLoading: true }
  psnLibrary = { fullLibrary: [], libraryLoading: true }
  ;(useSteamRecentAchievements as jest.Mock).mockImplementation((scope) => (scope ? { ...steam, error: null, retry: jest.fn() } : { achievements: [], isLoading: false, error: null, retry: jest.fn() }))
  ;(usePsnRecentTrophies as jest.Mock).mockImplementation((scope) => (scope ? { ...psnYear, error: null, retry: jest.fn() } : { trophies: [], isLoading: false, error: null, retry: jest.fn() }))
  ;(useXboxRecentAchievements as jest.Mock).mockReturnValue({ achievements: [], isLoading: false, error: null, retry: jest.fn() })
  ;(usePsnGamesData as jest.Mock).mockImplementation(() => psnLibrary)
  ;(useXboxGamesData as jest.Mock).mockReturnValue({ fullLibrary: [], libraryLoading: false })
})

/** Every render's streak as the home would draw it: nothing while loading, else its days. */
function renderStreak() {
  const drawn: (number | 'loading')[] = []
  const view = renderHook(
    () => {
      const data = useStreakData()
      drawn.push(data.isLoading ? 'loading' : (data.activeStreak?.days ?? 0))
      return data
    },
    { wrapper: ActivityHeatmapYearProvider },
  )
  const land = (change: () => void) => act(() => {
    change()
    view.rerender()
  })
  return { ...view, drawn, land }
}

test('the streak is drawn once, whole: not from part of the year, nor before the unticked consoles are known', async () => {
  // PS3 unticked in preferences: its trophy two days ago must not stretch the streak.
  window.localStorage.setItem('hidden-consoles:psn', '["PS3"]')
  ;(fetchWithRetry as jest.Mock).mockResolvedValue([{ AchievementID: 1, GameID: 1, ConsoleName: 'SNES', Date: `${day(0)} 10:00:00` }])
  const { result, drawn, land } = renderStreak()

  // RA lands first, then Steam, then PlayStation's year; the library that says which game is on PS3, last.
  await waitFor(() => expect(fetchWithRetry).toHaveBeenCalled())
  await act(async () => {})
  land(() => { steam = { achievements: [{ appId: 620, gameTitle: 'Portal 2', apiname: 'W', title: 'W', badgeUrl: '', unlockedAt: `${day(1)}T10:00:00`, globalPct: 1 }], isLoading: false } })
  land(() => { psnYear = { trophies: [{ gameId: PS3_GAME, titleId: 'NPWR1', gameTitle: 'Old', gameIconUrl: '', trophyId: 1, name: 'T', iconUrl: null, type: 'bronze', earnedAt: `${day(2)}T10:00:00Z`, rarity: null }], isLoading: false } })
  land(() => { psnLibrary = { fullLibrary: [{ id: PS3_GAME, consoleName: 'PS3' }], libraryLoading: false } })

  expect(result.current.activeStreak?.days).toBe(2)
  // Every streak drawn is the final one: no 1 (RA alone), no 3 (the PS3 day counted).
  expect(new Set(drawn.filter((d) => d !== 'loading'))).toEqual(new Set([2]))
})

test('a Steam-only account is loading before its year is even asked for, not a streak of 0', () => {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { steamid: '765' } } })
  const { drawn } = renderStreak()
  expect(drawn[0]).toBe('loading')
})
