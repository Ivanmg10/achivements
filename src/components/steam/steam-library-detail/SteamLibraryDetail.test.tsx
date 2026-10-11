const mockDetail = jest.fn()
jest.mock('@/components/library-game-detail/LibraryGameDetail', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    mockDetail(props)
    return <div data-testid="detail">{props.grid as never}{props.errorNode as never}</div>
  },
}))
jest.mock('@/components/steam/steam-achievement-grid/SteamAchievementGrid', () => ({
  achievementAnchor: (n: string) => n,
  SteamAchievementGrid: () => <div data-testid="grid" />,
}))
jest.mock('@/hooks/useSteamAchievements', () => ({ useSteamAchievements: jest.fn() }))

import { fireEvent, render, screen } from '@testing-library/react'
import SteamLibraryDetail from './SteamLibraryDetail'
import { useSteamAchievements } from '@/hooks/useSteamAchievements'
import { en } from '@/translations/en'
import type { SteamGameProgress } from '@/types/steam'

const GAME = { id: 7, title: 'Hades', maxPossible: 49, numAwarded: 10, playtimeForever: 600, playtime2Weeks: 0 } as SteamGameProgress
const ach = (apiname: string, earned: boolean) => ({ apiname, title: apiname, description: '', earned, dateEarned: null, globalPct: 10, badgeUrl: '' })
const hook = (o: Record<string, unknown>) => (useSteamAchievements as jest.Mock).mockReturnValue({ achievements: [], isLoading: false, error: undefined, retry: jest.fn(), ...o })
const last = () => mockDetail.mock.calls.at(-1)![0]

beforeEach(() => mockDetail.mockClear())

test('before the answer, the ring goes by the list\'s counts and the state is loading', () => {
  hook({ isLoading: true })
  render(<SteamLibraryDetail game={GAME} category="completed" />)
  expect(last()).toMatchObject({ category: 'completed', state: 'loading', ring: { earned: 10, total: 49 } })
})

test('once loaded, the ring counts the achievements and the playtime is a figure', () => {
  hook({ achievements: [ach('a', true), ach('b', false), ach('c', true)] })
  render(<SteamLibraryDetail game={GAME} category="playing" />)
  expect(last()).toMatchObject({ state: 'ready', ring: { earned: 2, total: 3 } })
  expect(last().items).toHaveLength(3)
  expect(last().facts).toEqual([expect.objectContaining({ label: en.steam.playtime, value: expect.stringContaining('10') })])
  expect(screen.getByTestId('grid')).toBeInTheDocument()
})

test('the last two weeks only show when there was play', () => {
  hook({ achievements: [ach('a', true)] })
  render(<SteamLibraryDetail game={{ ...GAME, playtime2Weeks: 120 }} category="playing" />)
  expect((last().facts as { label: string }[]).map((f) => f.label)).toEqual([en.steam.playtime, en.steam.last2Weeks])
})

test('an unknown list is shown as in progress', () => {
  hook({ achievements: [ach('a', true)] })
  render(<SteamLibraryDetail game={GAME} category="nonsense" />)
  expect(last().category).toBe('playing')
})

test('on error it says so, with the hint and a retry that asks again', () => {
  const retry = jest.fn()
  hook({ error: 'boom', retry })
  render(<SteamLibraryDetail game={GAME} />)
  expect(last().state).toBe('error')
  expect(screen.getByRole('alert')).toHaveTextContent(en.steam.achievementsError)
  expect(screen.getByText(en.steam.privateProfileHint)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: en.steam.retry }))
  expect(retry).toHaveBeenCalled()
})
