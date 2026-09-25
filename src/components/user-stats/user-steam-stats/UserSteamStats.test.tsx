jest.mock('@/hooks/useSteamProfile', () => ({ useSteamProfile: jest.fn() }))
jest.mock('@/context/SteamGamesDataContext', () => ({ useSteamGamesData: jest.fn() }))

import { render, screen, fireEvent } from '@testing-library/react'
import UserSteamStats from './UserSteamStats'
import { useSteamProfile } from '@/hooks/useSteamProfile'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { en } from '@/translations/en'
import type { SteamGameProgress } from '@/types/steam'

function game(id: number, over: Partial<SteamGameProgress> = {}): SteamGameProgress {
  return {
    _source: 'steam', id, title: `Game ${id}`, imageIcon: '', consoleName: 'Steam',
    maxPossible: 10, numAwarded: 5, pctWon: 50, lastPlayed: null,
    playtimeForever: 120, playtime2Weeks: 0, imgLogoUrl: '', hasStats: true, achievementsLoaded: true, ...over,
  } as SteamGameProgress
}

function steamState(over: Record<string, unknown> = {}) {
  ;(useSteamGamesData as jest.Mock).mockReturnValue({ isLinked: true, library: [], libraryLoading: false, ...over })
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useSteamProfile as jest.Mock).mockReturnValue({ profile: null, isLoading: false, error: null, retry: jest.fn() })
  steamState()
})

test('renders nothing without a linked Steam account', () => {
  steamState({ isLinked: false })
  const { container } = render(<UserSteamStats />)
  expect(container).toBeEmptyDOMElement()
})

test('shows library totals rolled up from the shared context', () => {
  steamState({ library: [game(1, { numAwarded: 10, maxPossible: 10, pctWon: 100 }), game(2)] })
  render(<UserSteamStats />)
  expect(screen.getByText('2')).toBeInTheDocument() // games
  expect(screen.getByText('1')).toBeInTheDocument() // perfect
  expect(screen.getByText('15')).toBeInTheDocument() // unlocked (10 + 5)
})

test('shows the Steam level once the profile loads', () => {
  ;(useSteamProfile as jest.Mock).mockReturnValue({ profile: { level: 42 }, isLoading: false, error: null, retry: jest.fn() })
  render(<UserSteamStats />)
  expect(screen.getByText(en.steam.level)).toBeInTheDocument()
  expect(screen.getByText('42')).toBeInTheDocument()
})

test('shows what the player is doing right now: playing, online, or offline', () => {
  const { rerender } = render(<UserSteamStats />)
  expect(screen.queryByText(en.steam.online)).not.toBeInTheDocument()

  ;(useSteamProfile as jest.Mock).mockReturnValue({ profile: { personastate: 1 }, isLoading: false, error: null, retry: jest.fn() })
  rerender(<UserSteamStats />)
  expect(screen.getByText(en.steam.online)).toBeInTheDocument()

  ;(useSteamProfile as jest.Mock).mockReturnValue({ profile: { gameextrainfo: 'Portal 2', personastate: 1 }, isLoading: false, error: null, retry: jest.fn() })
  rerender(<UserSteamStats />)
  expect(screen.getByText(`${en.steam.nowPlaying}: Portal 2`)).toBeInTheDocument()
})

test('shows an error with a retry button when the profile fails to load', () => {
  const retry = jest.fn()
  ;(useSteamProfile as jest.Mock).mockReturnValue({ profile: null, isLoading: false, error: 'boom', retry })
  render(<UserSteamStats />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.steam.profileError)
  fireEvent.click(screen.getByRole('button', { name: en.steam.retry }))
  expect(retry).toHaveBeenCalled()
})
