import { renderHook } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useProfileLibrary } from './useProfileLibrary'
import { useGamesData } from '@/context/GamesDataContext'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import { useSubject } from '@/context/SubjectContext'
import { xboxGameFixture } from '@/test-utils/xboxFixtures'

jest.mock('@/context/GamesDataContext', () => ({ useGamesData: jest.fn() }))
jest.mock('@/context/SteamGamesDataContext', () => ({ useSteamGamesData: jest.fn() }))
jest.mock('@/context/PsnGamesDataContext', () => ({ usePsnGamesData: jest.fn() }))
jest.mock('@/context/XboxGamesDataContext', () => ({ useXboxGamesData: jest.fn() }))
jest.mock('@/context/SubjectContext', () => ({ useSubject: jest.fn() }))

const raGame = { GameID: 1, Title: 'Zelda', ImageIcon: '', ConsoleID: 3, ConsoleName: 'SNES', MaxPossible: 10, NumAwarded: 10, PctWon: '1', HardcoreMode: '1' }

function setup({ raLoading = false, steamLinked = false, steamLoading = false, xboxLinked = false, xboxLoading = false, xbox = [] as unknown[], rausername = 'ivanra' as string | null } = {}) {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { rausername } } })
  ;(useGamesData as jest.Mock).mockReturnValue({ all: [raGame], isLoading: raLoading })
  ;(useSteamGamesData as jest.Mock).mockReturnValue({ isLinked: steamLinked, library: [], libraryLoading: steamLoading })
  ;(usePsnGamesData as jest.Mock).mockReturnValue({ isLinked: false, library: [], libraryLoading: false })
  ;(useXboxGamesData as jest.Mock).mockReturnValue({ isLinked: xboxLinked, library: xbox, libraryLoading: xboxLoading })
  ;(useSubject as jest.Mock).mockReturnValue('ivan')
}

test("their games, opening their progress, less the hidden ones", () => {
  setup()
  const { result } = renderHook(() => useProfileLibrary())
  expect(result.current.games).toEqual([expect.objectContaining({ key: 'ra:1', href: '/user/ivan/ra/1', status: 'completed' })])
  expect(result.current.isLoading).toBe(false)
  const hidden = ['ra:1']
  expect(renderHook(() => useProfileLibrary(hidden)).result.current.games).toEqual([])
})

test('loading while a linked platform has not answered; an unlinked one is not waited for', () => {
  setup({ steamLinked: true, steamLoading: true })
  expect(renderHook(() => useProfileLibrary()).result.current.isLoading).toBe(true)
  setup({ steamLinked: false, steamLoading: true })
  expect(renderHook(() => useProfileLibrary()).result.current.isLoading).toBe(false)
  setup({ raLoading: true, rausername: null })
  expect(renderHook(() => useProfileLibrary()).result.current.isLoading).toBe(false)
  setup({ xboxLinked: true, xboxLoading: true })
  expect(renderHook(() => useProfileLibrary()).result.current.isLoading).toBe(true)
})

test('their Xbox games with achievements are in it, opening their progress; ones with no achievements are not', () => {
  setup({ xboxLinked: true, xbox: [xboxGameFixture({ id: 77, titleId: '77', title: 'Halo' }), xboxGameFixture({ id: 78, titleId: '78', title: 'Just owned', maxPossible: 0, totalGamerscore: 0, earnedGamerscore: 0 })] })
  const { games } = renderHook(() => useProfileLibrary()).result.current
  expect(games).toContainEqual(expect.objectContaining({ key: 'xbox:77', href: '/user/ivan/xbox/77' }))
  expect(games.some((g) => g.key === 'xbox:78')).toBe(false)
})
