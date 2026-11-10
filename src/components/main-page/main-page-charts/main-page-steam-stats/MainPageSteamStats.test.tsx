jest.mock('@/hooks/useSteamProfile', () => ({ useSteamProfile: jest.fn() }))

import { render, screen } from '@testing-library/react'
import MainPageSteamStats from './MainPageSteamStats'
import { useSteamProfile } from '@/hooks/useSteamProfile'
import { en } from '@/translations/en'
import type { SteamGameProgress } from '@/types/steam'

// The shared row (counts, modals, streak, loading) is in MainPagePeriodStats.contract.test.tsx.
const GAMES = [{ playtime2Weeks: 90 }, { playtime2Weeks: 90 }] as SteamGameProgress[]

test('shows the Steam level and the hours of the last two weeks', () => {
  ;(useSteamProfile as jest.Mock).mockReturnValue({ profile: { level: 42 } })
  render(<MainPageSteamStats streak={1} achievements={[]} games={GAMES} />)
  expect(screen.getByText(en.steam.level).parentElement).toHaveTextContent('42')
  expect(screen.getByText(en.steam.last2Weeks).parentElement).toHaveTextContent(`3${en.steam.hoursShort}`)
})
