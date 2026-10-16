jest.mock('@/context/ActivityHeatmapYearContext', () => ({ useActivityHeatmapYear: jest.fn() }))
jest.mock('@/hooks/useConsoleVisibility', () => ({ useConsoleVisibility: jest.fn() }))

import { renderHook } from '@testing-library/react'
import { useActivityHeatmapYear } from './useActivityHeatmapYear'
import { useActivityHeatmapYear as useYearFeed } from '@/context/ActivityHeatmapYearContext'
import { useConsoleVisibility } from '@/hooks/useConsoleVisibility'

const FEED = [{ GameID: 1 }, { GameID: 2 }]
const refetch = jest.fn()

beforeEach(() => {
  ;(useYearFeed as jest.Mock).mockReturnValue({ achievements: FEED, isLoading: false, error: false, refetch })
})

test('the feed as it is when nothing is unticked', () => {
  ;(useConsoleVisibility as jest.Mock).mockReturnValue({ filtering: false, isShown: () => false })
  const { result } = renderHook(() => useActivityHeatmapYear())
  expect(result.current.achievements).toBe(FEED)
})

test('without what the visibility says is out, and the rest of the feed passes through', () => {
  ;(useConsoleVisibility as jest.Mock).mockReturnValue({ filtering: true, isShown: (a: { GameID: number }) => a.GameID === 2 })
  const { result } = renderHook(() => useActivityHeatmapYear())
  expect(result.current.achievements).toEqual([{ GameID: 2 }])
  expect(result.current).toMatchObject({ isLoading: false, error: false, refetch })
})
