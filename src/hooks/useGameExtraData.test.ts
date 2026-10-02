import { renderHook } from '@testing-library/react'
import { useGameExtraData } from './useGameExtraData'
import { useRecentlyPlayedGames } from './useRecentlyPlayedGames'
import { useUserAwards } from './useUserAwards'

jest.mock('./useRecentlyPlayedGames', () => ({ useRecentlyPlayedGames: jest.fn() }))
jest.mock('./useUserAwards', () => ({ useUserAwards: jest.fn() }))

beforeEach(() => {
  ;(useRecentlyPlayedGames as jest.Mock).mockReturnValue({ games: [] })
  ;(useUserAwards as jest.Mock).mockReturnValue({ awards: null })
})

test('nothing to merge, an empty map', () => {
  expect(renderHook(() => useGameExtraData()).result.current.size).toBe(0)
})

test('joins recent play and awards per game', () => {
  ;(useRecentlyPlayedGames as jest.Mock).mockReturnValue({
    games: [{ GameID: 1, LastPlayed: '2024-01-01', PossibleScore: 100, ScoreAchieved: 40, ScoreAchievedHardcore: 20 }],
  })
  ;(useUserAwards as jest.Mock).mockReturnValue({
    awards: { VisibleUserAwards: [{ AwardData: 1, AwardType: 'Mastery' }, { AwardData: 2, AwardType: 'Beaten' }] },
  })

  const map = renderHook(() => useGameExtraData()).result.current
  expect(map.get(1)).toEqual({
    awards: [{ AwardData: 1, AwardType: 'Mastery' }],
    lastPlayed: '2024-01-01',
    possibleScore: 100,
    scoreAchieved: 40,
    scoreAchievedHardcore: 20,
  })
  // A game with an award but no recent play still gets its awards.
  expect(map.get(2)).toEqual({ awards: [{ AwardData: 2, AwardType: 'Beaten' }] })
})

test('several awards for one game are all kept', () => {
  ;(useUserAwards as jest.Mock).mockReturnValue({
    awards: { VisibleUserAwards: [{ AwardData: 3, AwardType: 'Beaten' }, { AwardData: 3, AwardType: 'Mastery' }] },
  })
  expect(renderHook(() => useGameExtraData()).result.current.get(3)?.awards).toHaveLength(2)
})
